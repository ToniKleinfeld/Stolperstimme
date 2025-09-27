import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

/**
 * TypeScript Interfaces für Web Speech API
 */
interface CustomSpeechRecognitionResult {
  readonly [index: number]: CustomSpeechRecognitionAlternative;
  readonly length: number;
  readonly isFinal: boolean;
}

interface CustomSpeechRecognitionAlternative {
  readonly transcript: string;
  readonly confidence: number;
}

interface CustomSpeechRecognitionEvent extends Event {
  readonly results: CustomSpeechRecognitionResult[];
  readonly resultIndex: number;
}

interface CustomSpeechRecognition extends EventTarget {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  maxAlternatives: number;
  start(): void;
  stop(): void;
  abort(): void;
  onstart: (() => void) | null;
  onresult: ((event: CustomSpeechRecognitionEvent) => void) | null;
  onend: (() => void) | null;
  onerror: ((event: any) => void) | null;
  onaudiostart: (() => void) | null;
  onaudioend: (() => void) | null;
  onspeechstart: (() => void) | null;
  onspeechend: (() => void) | null;
}

declare global {
  interface Window {
    SpeechRecognition: new () => CustomSpeechRecognition;
    webkitSpeechRecognition: new () => CustomSpeechRecognition;
  }
}

/**
 * Speech Recognition States
 */
export enum SpeechState {
  IDLE = 'idle',
  LISTENING = 'listening',
  PROCESSING = 'processing',
  ERROR = 'error'
}

/**
 * Speech Recognition Errors
 */
export enum SpeechError {
  NOT_SUPPORTED = 'not_supported',
  PERMISSION_DENIED = 'permission_denied',
  NETWORK_ERROR = 'network_error',
  NO_SPEECH = 'no_speech',
  AUDIO_CAPTURE = 'audio_capture',
  UNKNOWN = 'unknown'
}

/**
 * Speech Recognition Result
 */
export interface SpeechResult {
  transcript: string;
  confidence: number;
  isFinal: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class SpeechService {
  private recognition: CustomSpeechRecognition | null = null;
  private isSupported: boolean = false;

  // State Management
  private state$ = new BehaviorSubject<SpeechState>(SpeechState.IDLE);
  private transcript$ = new BehaviorSubject<string>('');
  private error$ = new BehaviorSubject<string | null>(null);

  // Zwischenspeicher für finale Textteile
  private finalTranscriptParts: string[] = [];
  private currentInterimTranscript: string = '';
  private manualStop: boolean = false;  // Public Observables
  public readonly state: Observable<SpeechState> = this.state$.asObservable();
  public readonly transcript: Observable<string> = this.transcript$.asObservable();
  public readonly error: Observable<string | null> = this.error$.asObservable();

  constructor() {
    this.initSpeechRecognition();
  }

  /**
   * Prüft ob Speech Recognition unterstützt wird
   */
  get isAvailable(): boolean {
    return this.isSupported;
  }

  /**
   * Aktueller State
   */
  get currentState(): SpeechState {
    return this.state$.value;
  }

  /**
   * Aktueller Transcript
   */
  get currentTranscript(): string {
    return this.transcript$.value;
  }

  /**
   * Prüft ob gerade eine Aufnahme läuft
   */
  get isListening(): boolean {
    return this.currentState === SpeechState.LISTENING;
  }

  /**
   * Initialisiert die Speech Recognition API
   */
  private initSpeechRecognition(): void {
    // Browser-Unterstützung prüfen
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      console.warn('Web Speech API wird von diesem Browser nicht unterstützt.');
      this.isSupported = false;
      this.setError('Spracherkennung wird von diesem Browser nicht unterstützt.');
      return;
    }

    this.isSupported = true;

    try {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      this.recognition = new SpeechRecognition() as CustomSpeechRecognition;
      this.configureSpeechRecognition();
      this.attachEventListeners();
    } catch (error) {
      console.error('Fehler beim Initialisieren der Spracherkennung:', error);
      this.isSupported = false;
      this.setError('Spracherkennung konnte nicht initialisiert werden.');
    }
  }

  /**
   * Konfiguriert die Speech Recognition Einstellungen
   */
  private configureSpeechRecognition(): void {
    if (!this.recognition) return;

    // Sprache auf Deutsch setzen
    this.recognition.lang = 'de-DE';

    // Interim Results aktivieren für Live-Feedback
    this.recognition.interimResults = true;

    // Kontinuierliche Aufnahme aktivieren für längere Texte
    this.recognition.continuous = true;

    // Maximale Anzahl Alternativen
    this.recognition.maxAlternatives = 1;
  }  /**
   * Event Listener für Speech Recognition anhängen
   */
  private attachEventListeners(): void {
    if (!this.recognition) return;

    this.recognition.onstart = () => {
      console.log('Spracherkennung gestartet');
      this.setState(SpeechState.LISTENING);
      this.clearError();
    };

    this.recognition.onresult = (event: CustomSpeechRecognitionEvent) => {
      let interimTranscript = '';
      let finalTranscript = '';

      // Alle Ergebnisse verarbeiten
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        const transcript = result[0].transcript;

        if (result.isFinal) {
          finalTranscript += transcript;
        } else {
          interimTranscript += transcript;
        }
      }

      // Finale Ergebnisse zum Zwischenspeicher hinzufügen
      if (finalTranscript.trim()) {
        this.finalTranscriptParts.push(finalTranscript.trim());
        console.log('Finaler Teil hinzugefügt:', finalTranscript.trim());
      }

      // Aktuellen interim Transcript speichern
      this.currentInterimTranscript = interimTranscript;

      // Kombinierten Text zusammenstellen
      const combinedTranscript = [...this.finalTranscriptParts, this.currentInterimTranscript]
        .filter(part => part.trim())
        .join(' ');

      // Transcript aktualisieren
      this.transcript$.next(combinedTranscript);

      // State bleibt auf LISTENING für kontinuierliche Aufnahme
      if (this.currentState !== SpeechState.LISTENING) {
        this.setState(SpeechState.LISTENING);
      }
    };    this.recognition.onend = () => {
      console.log('Spracherkennung beendet, manualStop:', this.manualStop);

      // Bei manuellem Stop nicht neu starten
      if (this.manualStop) {
        this.manualStop = false; // Flag zurücksetzen
        this.setState(SpeechState.IDLE);
        return;
      }

      // Bei kontinuierlicher Aufnahme automatisch neu starten
      if (this.currentState === SpeechState.LISTENING && !this.manualStop) {
        setTimeout(() => {
          console.log('Automatischer Neustart der Spracherkennung...');
          this.recognition?.start();
        }, 100);
      } else if (this.currentState !== SpeechState.ERROR) {
        this.setState(SpeechState.IDLE);
      }
    };

    this.recognition.onerror = (event: any) => {
      // Bei manuellem Abbruch keinen Fehler loggen
      if (event.error === 'aborted' && this.manualStop) {
        console.log('Spracherkennung manuell beendet');
        return; // Kein Error State setzen
      }

      console.error('Spracherkennungs-Fehler:', event.error);
      this.setState(SpeechState.ERROR);
      this.handleSpeechError(event.error);
    };

    this.recognition.onaudiostart = () => {
      console.log('Audio-Aufnahme gestartet');
    };

    this.recognition.onspeechstart = () => {
      console.log('Sprache erkannt');
    };

    this.recognition.onspeechend = () => {
      console.log('Sprache beendet');
    };

    this.recognition.onaudioend = () => {
      console.log('Audio-Aufnahme beendet');
    };
  }

  /**
   * Spracherkennung starten
   */
  startListening(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.isSupported || !this.recognition) {
        const error = 'Spracherkennung ist nicht verfügbar.';
        this.setError(error);
        reject(new Error(error));
        return;
      }

      if (this.isListening) {
        const error = 'Spracherkennung läuft bereits.';
        console.warn(error);
        reject(new Error(error));
        return;
      }

      try {
        // Beim Start: Transcript und Cache komplett zurücksetzen
        this.transcript$.next('');
        this.finalTranscriptParts = [];
        this.currentInterimTranscript = '';
        this.manualStop = false; // Flag zurücksetzen
        this.clearError();

        // Aufnahme starten
        this.recognition.start();
        resolve();
      } catch (error) {
        console.error('Fehler beim Starten der Spracherkennung:', error);
        this.setError('Spracherkennung konnte nicht gestartet werden.');
        reject(error);
      }
    });
  }

  /**
   * Spracherkennung stoppen
   */
  stopListening(): void {
    if (this.recognition && (this.isListening || this.currentState === SpeechState.PROCESSING)) {
      console.log('Stoppe Spracherkennung...');

      // Flag setzen um automatischen Neustart zu verhindern
      this.manualStop = true;

      // State auf PROCESSING setzen während Stopp-Vorgang
      this.setState(SpeechState.PROCESSING);

      // Kurze Verzögerung um letzten Text im Zwischenspeicher zu erfassen
      setTimeout(() => {
        if (this.recognition) {
          // Aufnahme stoppen
          this.recognition.abort();

          // Finales Transcript aus gespeicherten Teilen + aktuellem Interim erstellen
          const allParts = [...this.finalTranscriptParts];
          if (this.currentInterimTranscript.trim()) {
            allParts.push(this.currentInterimTranscript.trim());
          }

          const finalText = allParts
            .filter(part => part.trim())
            .join(' ')
            .trim();

          if (finalText) {
            this.transcript$.next(finalText);
            console.log('Finale Aufnahme (mit Verzögerung):', finalText);
          }

          // Auf IDLE setzen - Text bleibt im transcript$ erhalten
          // Cache NICHT zurücksetzen - Text soll erhalten bleiben
          this.setState(SpeechState.IDLE);
        }
      }, 500); // 500ms Verzögerung für letzten Text
    }
  }

  /**
   * Spracherkennung abbrechen
   */
  cancelListening(): void {
    if (this.recognition && this.isListening) {
      this.recognition.abort();
      this.transcript$.next('');
      this.setState(SpeechState.IDLE);
    }
  }

  /**
   * Transcript zurücksetzen
   */
  clearTranscript(): void {
    this.transcript$.next('');
  }

  /**
   * Mikrofonberechtigung anfordern (über getUserMedia)
   */
  async requestMicrophonePermission(): Promise<boolean> {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        this.setError('Mikrofonzugriff wird nicht unterstützt.');
        return false;
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      // Stream sofort wieder stoppen (nur Permission-Check)
      stream.getTracks().forEach(track => track.stop());

      return true;
    } catch (error: any) {
      console.error('Mikrofon-Permission abgelehnt:', error);

      if (error.name === 'NotAllowedError') {
        this.setError('Mikrofonzugriff wurde verweigert. Bitte erlauben Sie den Zugriff in den Browser-Einstellungen.');
      } else if (error.name === 'NotFoundError') {
        this.setError('Kein Mikrofon gefunden. Bitte schließen Sie ein Mikrofon an.');
      } else {
        this.setError('Fehler beim Zugriff auf das Mikrofon.');
      }

      return false;
    }
  }

  /**
   * State setzen
   */
  private setState(state: SpeechState): void {
    this.state$.next(state);
  }

  /**
   * Fehler setzen
   */
  private setError(message: string): void {
    this.error$.next(message);
  }

  /**
   * Fehler löschen
   */
  private clearError(): void {
    this.error$.next(null);
  }

  /**
   * Speech Recognition Fehler behandeln
   */
  private handleSpeechError(errorCode: string): void {
    let errorMessage: string;

    switch (errorCode) {
      case 'not-allowed':
      case 'service-not-allowed':
        errorMessage = 'Mikrofonzugriff wurde verweigert. Bitte erlauben Sie den Zugriff in den Browser-Einstellungen.';
        break;
      case 'no-speech':
        errorMessage = 'Keine Sprache erkannt. Bitte versuchen Sie es erneut.';
        break;
      case 'audio-capture':
        errorMessage = 'Mikrofon konnte nicht verwendet werden. Überprüfen Sie Ihre Mikrofoneinstellungen.';
        break;
      case 'network':
        errorMessage = 'Netzwerkfehler bei der Spracherkennung. Überprüfen Sie Ihre Internetverbindung.';
        break;
      case 'aborted':
        // Kein Fehler anzeigen bei manuellem Abbruch
        if (this.manualStop) {
          return; // Keinen Fehler setzen
        }
        errorMessage = 'Spracherkennung wurde abgebrochen.';
        break;
      default:
        errorMessage = 'Unbekannter Fehler bei der Spracherkennung. Bitte versuchen Sie es erneut.';
    }

    this.setError(errorMessage);
  }

  /**
   * Service aufräumen
   */
  ngOnDestroy(): void {
    if (this.recognition) {
      this.recognition.stop();
    }
  }
}
