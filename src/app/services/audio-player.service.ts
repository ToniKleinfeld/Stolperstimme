import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

/**
 * Audio Player States
 */
export enum AudioState {
  IDLE = 'idle',
  LOADING = 'loading',
  PLAYING = 'playing',
  PAUSED = 'paused',
  ERROR = 'error'
}

/**
 * Audio Playback Information
 */
export interface AudioInfo {
  duration: number;
  currentTime: number;
  progress: number; // 0-100 Prozent
  volume: number; // 0-1
}

/**
 * Audio Player Error Types
 */
export enum AudioError {
  FILE_NOT_FOUND = 'file_not_found',
  NETWORK_ERROR = 'network_error',
  DECODE_ERROR = 'decode_error',
  NOT_SUPPORTED = 'not_supported',
  UNKNOWN = 'unknown'
}

@Injectable({
  providedIn: 'root'
})
export class AudioPlayerService {
  private audio: HTMLAudioElement | null = null;
  private currentAudioPath: string | null = null;

  // State Management
  private state$ = new BehaviorSubject<AudioState>(AudioState.IDLE);
  private audioInfo$ = new BehaviorSubject<AudioInfo>({
    duration: 0,
    currentTime: 0,
    progress: 0,
    volume: 1
  });
  private error$ = new BehaviorSubject<string | null>(null);

  // Public Observables
  public readonly state: Observable<AudioState> = this.state$.asObservable();
  public readonly audioInfo: Observable<AudioInfo> = this.audioInfo$.asObservable();
  public readonly error: Observable<string | null> = this.error$.asObservable();

  constructor() {
    // Initial volume aus localStorage laden
    const savedVolume = this.getSavedVolume();
    this.updateAudioInfo({ volume: savedVolume });
  }

  /**
   * Aktueller State
   */
  get currentState(): AudioState {
    return this.state$.value;
  }

  /**
   * Aktuelle Audio-Info
   */
  get currentAudioInfo(): AudioInfo {
    return this.audioInfo$.value;
  }

  /**
   * Prüft ob gerade Audio abgespielt wird
   */
  get isPlaying(): boolean {
    return this.currentState === AudioState.PLAYING;
  }

  /**
   * Prüft ob Audio pausiert ist
   */
  get isPaused(): boolean {
    return this.currentState === AudioState.PAUSED;
  }

  /**
   * Audio-Datei laden und abspielen
   */
  async playAudio(audioPath: string): Promise<void> {
    try {
      // Wenn bereits dieselbe Datei geladen ist und pausiert, einfach fortsetzen
      if (this.currentAudioPath === audioPath && this.isPaused && this.audio) {
        await this.resume();
        return;
      }

      // Vorherige Audio stoppen falls vorhanden
      this.stopAudio();

      this.setState(AudioState.LOADING);
      this.clearError();
      this.currentAudioPath = audioPath;

      // Neues Audio Element erstellen
      this.audio = new Audio();
      this.setupAudioEventListeners();

      // Audio-Datei laden
      this.audio.src = audioPath;
      this.audio.volume = this.currentAudioInfo.volume;

      // Preload aktivieren für bessere Performance
      this.audio.preload = 'auto';

      // Audio laden
      await new Promise<void>((resolve, reject) => {
        if (!this.audio) {
          reject(new Error('Audio element not available'));
          return;
        }

        const handleCanPlay = () => {
          this.audio?.removeEventListener('canplay', handleCanPlay);
          this.audio?.removeEventListener('error', handleError);
          resolve();
        };

        const handleError = () => {
          this.audio?.removeEventListener('canplay', handleCanPlay);
          this.audio?.removeEventListener('error', handleError);
          reject(new Error('Failed to load audio'));
        };

        this.audio.addEventListener('canplay', handleCanPlay);
        this.audio.addEventListener('error', handleError);

        this.audio.load();
      });

      // Audio abspielen
      await this.audio.play();

    } catch (error) {
      console.error('Fehler beim Abspielen der Audio-Datei:', error);
      this.handleAudioError(error);
    }
  }

  /**
   * Audio pausieren
   */
  pause(): void {
    if (this.audio && this.isPlaying) {
      this.audio.pause();
      this.setState(AudioState.PAUSED);
    }
  }

  /**
   * Audio fortsetzen
   */
  async resume(): Promise<void> {
    if (this.audio && this.isPaused) {
      try {
        await this.audio.play();
      } catch (error) {
        console.error('Fehler beim Fortsetzen der Wiedergabe:', error);
        this.handleAudioError(error);
      }
    }
  }

  /**
   * Audio stoppen
   */
  stopAudio(): void {
    if (this.audio) {
      this.audio.pause();
      this.audio.currentTime = 0;
      this.removeAudioEventListeners();
      this.audio = null;
    }

    this.currentAudioPath = null;
    this.setState(AudioState.IDLE);
    this.updateAudioInfo({
      duration: 0,
      currentTime: 0,
      progress: 0
    });
  }

  /**
   * Zu bestimmter Position springen (in Sekunden)
   */
  seekTo(seconds: number): void {
    if (this.audio && this.audio.duration) {
      const clampedTime = Math.max(0, Math.min(seconds, this.audio.duration));
      this.audio.currentTime = clampedTime;
      this.updateProgress();
    }
  }

  /**
   * Zu bestimmtem Prozentsatz springen (0-100)
   */
  seekToPercentage(percentage: number): void {
    if (this.audio && this.audio.duration) {
      const clampedPercentage = Math.max(0, Math.min(percentage, 100));
      const targetTime = (this.audio.duration * clampedPercentage) / 100;
      this.seekTo(targetTime);
    }
  }

  /**
   * Lautstärke setzen (0-1)
   */
  setVolume(volume: number): void {
    const clampedVolume = Math.max(0, Math.min(volume, 1));

    if (this.audio) {
      this.audio.volume = clampedVolume;
    }

    this.updateAudioInfo({ volume: clampedVolume });
    this.saveVolume(clampedVolume);
  }

  /**
   * Lautstärke um bestimmten Wert ändern
   */
  adjustVolume(delta: number): void {
    const newVolume = this.currentAudioInfo.volume + delta;
    this.setVolume(newVolume);
  }

  /**
   * Stummschalten/Ton aktivieren
   */
  toggleMute(): void {
    if (this.currentAudioInfo.volume > 0) {
      // Stummschalten - aktuelle Lautstärke speichern
      sessionStorage.setItem('stolperstimme_volume_before_mute', this.currentAudioInfo.volume.toString());
      this.setVolume(0);
    } else {
      // Ton aktivieren - gespeicherte Lautstärke wiederherstellen
      const savedVolume = sessionStorage.getItem('stolperstimme_volume_before_mute');
      const volumeToRestore = savedVolume ? parseFloat(savedVolume) : 1;
      this.setVolume(volumeToRestore);
    }
  }

  /**
   * Prüft ob Audio-Datei verfügbar ist
   */
  async isAudioAvailable(audioPath: string): Promise<boolean> {
    try {
      const response = await fetch(audioPath, { method: 'HEAD' });
      return response.ok;
    } catch (error) {
      console.warn(`Audio-Datei nicht verfügbar: ${audioPath}`, error);
      return false;
    }
  }

  /**
   * Event Listener für Audio Element einrichten
   */
  private setupAudioEventListeners(): void {
    if (!this.audio) return;

    this.audio.addEventListener('loadstart', () => {
      this.setState(AudioState.LOADING);
    });

    this.audio.addEventListener('canplay', () => {
      if (this.currentState === AudioState.LOADING) {
        this.updateDuration();
      }
    });

    this.audio.addEventListener('play', () => {
      this.setState(AudioState.PLAYING);
    });

    this.audio.addEventListener('pause', () => {
      if (this.currentState === AudioState.PLAYING) {
        this.setState(AudioState.PAUSED);
      }
    });

    this.audio.addEventListener('ended', () => {
      this.setState(AudioState.IDLE);
      this.updateAudioInfo({
        currentTime: 0,
        progress: 0
      });
    });

    this.audio.addEventListener('timeupdate', () => {
      this.updateProgress();
    });

    this.audio.addEventListener('error', (error) => {
      this.handleAudioError(error);
    });

    this.audio.addEventListener('volumechange', () => {
      if (this.audio) {
        this.updateAudioInfo({ volume: this.audio.volume });
      }
    });
  }

  /**
   * Event Listener entfernen
   */
  private removeAudioEventListeners(): void {
    if (!this.audio) return;

    // Alle Event Listener werden automatisch entfernt wenn das Audio Element null gesetzt wird
  }

  /**
   * Audio-Fortschritt aktualisieren
   */
  private updateProgress(): void {
    if (!this.audio) return;

    const currentTime = this.audio.currentTime || 0;
    const duration = this.audio.duration || 0;
    const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

    this.updateAudioInfo({
      currentTime,
      progress
    });
  }

  /**
   * Audio-Dauer aktualisieren
   */
  private updateDuration(): void {
    if (!this.audio) return;

    const duration = this.audio.duration || 0;
    this.updateAudioInfo({ duration });
  }

  /**
   * Audio-Informationen aktualisieren
   */
  private updateAudioInfo(updates: Partial<AudioInfo>): void {
    const current = this.currentAudioInfo;
    const updated = { ...current, ...updates };
    this.audioInfo$.next(updated);
  }

  /**
   * State setzen
   */
  private setState(state: AudioState): void {
    this.state$.next(state);
  }

  /**
   * Fehler setzen
   */
  private setError(message: string): void {
    this.error$.next(message);
    this.setState(AudioState.ERROR);
  }

  /**
   * Fehler löschen
   */
  private clearError(): void {
    this.error$.next(null);
  }

  /**
   * Audio-Fehler behandeln
   */
  private handleAudioError(error: any): void {
    console.error('Audio-Fehler:', error);

    let errorMessage: string;

    if (error?.target?.error) {
      switch (error.target.error.code) {
        case MediaError.MEDIA_ERR_ABORTED:
          errorMessage = 'Audio-Wiedergabe wurde abgebrochen.';
          break;
        case MediaError.MEDIA_ERR_NETWORK:
          errorMessage = 'Netzwerkfehler beim Laden der Audio-Datei.';
          break;
        case MediaError.MEDIA_ERR_DECODE:
          errorMessage = 'Audio-Datei konnte nicht dekodiert werden.';
          break;
        case MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED:
          errorMessage = 'Audio-Format wird nicht unterstützt.';
          break;
        default:
          errorMessage = 'Unbekannter Audio-Fehler.';
      }
    } else if (error?.message?.includes('404')) {
      errorMessage = 'Audio-Datei wurde nicht gefunden.';
    } else {
      errorMessage = 'Audio konnte nicht abgespielt werden.';
    }

    this.setError(errorMessage);
  }

  /**
   * Lautstärke aus localStorage laden
   */
  private getSavedVolume(): number {
    try {
      const saved = localStorage.getItem('stolperstimme_audio_volume');
      if (saved) {
        const volume = parseFloat(saved);
        return Math.max(0, Math.min(volume, 1)); // Clamp zwischen 0 und 1
      }
    } catch (error) {
      console.warn('Konnte gespeicherte Lautstärke nicht laden:', error);
    }
    return 1; // Standard-Lautstärke
  }

  /**
   * Lautstärke in localStorage speichern
   */
  private saveVolume(volume: number): void {
    try {
      localStorage.setItem('stolperstimme_audio_volume', volume.toString());
    } catch (error) {
      console.warn('Konnte Lautstärke nicht speichern:', error);
    }
  }

  /**
   * Service aufräumen
   */
  ngOnDestroy(): void {
    this.stopAudio();
  }
}
