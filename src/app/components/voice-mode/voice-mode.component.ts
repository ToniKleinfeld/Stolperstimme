import { Component, OnInit, OnDestroy, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject, takeUntil } from 'rxjs';
import { SpeechService, SpeechState } from '../../services/speech.service';
import { AudioPlayerService, AudioState } from '../../services/audio-player.service';
import { ChatService } from '../../services/chat.service';

@Component({
  selector: 'app-voice-mode',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="voice-mode" role="main" aria-labelledby="voice-mode-title">
      <div class="sr-only" id="voice-mode-title">
        Sprachmodus - Stellen Sie Ihre Frage per Sprache
      </div>

      <!-- Voice Interface -->
      <div class="voice-interface">

        <!-- Voice Status Display -->
        <div class="voice-status" [attr.aria-live]="getAriaLive()">

          <!-- Listening State - Pulsierendes Mikrofon -->
          @if (speechState === 'listening') {
            <div class="voice-animation voice-animation--listening" role="status">
              <div class="pulse-ring"></div>
              <div class="pulse-ring pulse-ring--delay1"></div>
              <div class="pulse-ring pulse-ring--delay2"></div>
              <div class="voice-icon mic-icon">🎤</div>
              <div class="voice-text">
                <h2>Hört zu...</h2>
                <p>Sprechen Sie Ihre Frage zum Stolperstein</p>
                @if (transcript) {
                  <div class="transcript-preview">{{ transcript }}</div>
                }
              </div>
            </div>
          }

          <!-- Processing State -->
          @else if (speechState === 'processing') {
            <div class="voice-animation voice-animation--processing" role="status">
              <div class="voice-icon processing-icon">⏳</div>
              <div class="voice-text">
                <h2>Verarbeite...</h2>
                <p>Ihre Frage wird verarbeitet</p>
              </div>
            </div>
          }

          <!-- Playing Audio Response -->
          @else if (audioState === 'playing') {
            <div class="voice-animation voice-animation--speaking" role="status">
              <div class="audio-wave"></div>
              <div class="audio-wave audio-wave--delay1"></div>
              <div class="audio-wave audio-wave--delay2"></div>
              <div class="voice-icon speaker-icon">🔊</div>
              <div class="voice-text">
                <h2>Antwort wird vorgelesen</h2>
                <p>Bitte hören Sie zu</p>
              </div>
            </div>
          }

          <!-- Idle State -->
          @else {
            <div class="voice-animation voice-animation--idle">
              <div class="voice-icon idle-icon">🎤</div>
              <div class="voice-text">
                <h2>Bereit für Ihre Frage</h2>
                <p>Drücken Sie das Mikrofon um zu beginnen</p>
              </div>
            </div>
          }

        </div>

        <!-- Action Buttons -->
        <div class="voice-actions">
          <!-- Start/Stop Recording Button -->
          <button
            type="button"
            class="voice-btn voice-btn--primary"
            [class.voice-btn--active]="recordingActive === 1"
            [class.voice-btn--disabled]="!speechService.isAvailable || isLoading"
            [disabled]="!speechService.isAvailable || isLoading"
            (click)="toggleRecording()"
            [attr.aria-label]="getRecordingButtonLabel()"
            [attr.data-state]="speechState"
          >
            <span class="btn-icon" aria-hidden="true">
              @if (recordingActive === 1) {
                🔴
              } @else if (!speechService.isAvailable) {
                🎤❌
              } @else {
                🎤
              }
            </span>
            <span class="btn-text">
              @if (!speechService.isAvailable) {
                Nicht verfügbar
              } @else if (recordingActive === 1) {
                Stopp
              } @else {
                Sprechen
              }
            </span>
          </button>

          <!-- Switch to Chat Mode Button -->
          <button
            type="button"
            class="voice-btn voice-btn--secondary"
            (click)="switchToChatMode()"
            aria-label="Zum Chat-Modus wechseln"
          >
            <span class="btn-icon" aria-hidden="true">💬</span>
            <span class="btn-text">Chat</span>
          </button>
        </div>

        <!-- Error Display -->
        @if (speechError) {
          <div class="voice-error" role="alert" aria-live="assertive">
            <div class="error-content">
              <span class="error-icon" aria-hidden="true">⚠️</span>
              <div class="error-text">
                <strong>Fehler:</strong> {{ speechError }}
              </div>
              <button
                type="button"
                class="error-dismiss"
                (click)="dismissError()"
                aria-label="Fehlermeldung schließen"
              >
                ✕
              </button>
            </div>
          </div>
        }

      </div>
    </section>
  `,
  styleUrl: './voice-mode.component.scss'
})
export class VoiceModeComponent implements OnInit, OnDestroy {
  @Output() switchMode = new EventEmitter<'chat'>();

  speechState: SpeechState = SpeechState.IDLE;
  audioState: AudioState = AudioState.IDLE;
  transcript: string = '';
  speechError: string | null = null;
  isLoading: boolean = false;

  // Globaler Recording-Flag: 1 = aktiv (rot/stop), 0 = inaktiv (normal/mic)
  recordingActive: number = 0;

  private destroy$ = new Subject<void>();

  constructor(
    public speechService: SpeechService,
    private audioPlayerService: AudioPlayerService,
    private chatService: ChatService
  ) {}

  ngOnInit(): void {
    this.setupSpeechSubscriptions();
    this.setupAudioSubscriptions();
    this.setupChatSubscriptions();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();

    // Cleanup speech recognition
    if (this.recordingActive === 1) {
      this.speechService.stopListening();
      this.recordingActive = 0;
    }
  }

  /**
   * Speech Service Subscriptions
   */
  private setupSpeechSubscriptions(): void {
    // Speech State
    this.speechService.state
      .pipe(takeUntil(this.destroy$))
      .subscribe((state) => {
        console.log('Voice Mode: Speech State changed to:', state);
        this.speechState = state;
      });

    // Transcript Updates
    this.speechService.transcript
      .pipe(takeUntil(this.destroy$))
      .subscribe((transcript) => {
        this.transcript = transcript;
      });

    // Speech Errors
    this.speechService.error
      .pipe(takeUntil(this.destroy$))
      .subscribe((error) => {
        this.speechError = error;
      });
  }

  /**
   * Audio Player Subscriptions
   */
  private setupAudioSubscriptions(): void {
    this.audioPlayerService.state
      .pipe(takeUntil(this.destroy$))
      .subscribe((state) => {
        this.audioState = state;
      });
  }

  /**
   * Chat Service Subscriptions
   */
  private setupChatSubscriptions(): void {
    // Loading State
    this.chatService.isLoading$
      .pipe(takeUntil(this.destroy$))
      .subscribe((loading) => {
        this.isLoading = loading;
      });

    // Neue Nachrichten überwachen für automatisches Audio-Abspielen
    // Nur neue Nachrichten abspielen, nicht bereits existierende beim Mode-Wechsel
    let lastMessageCount = 0;

    this.chatService.messages$
      .pipe(takeUntil(this.destroy$))
      .subscribe((messages) => {
        const currentMessageCount = messages.length;

        // Nur abspielen wenn tatsächlich eine neue Nachricht hinzugekommen ist
        if (currentMessageCount > lastMessageCount && lastMessageCount > 0) {
          const lastMessage = messages[messages.length - 1];
          if (lastMessage &&
              lastMessage.role === 'assistant' &&
              lastMessage.audio &&
              !this.isLoading) {
            // Automatisch Audio abspielen im Voice-Mode (nur bei neuen Nachrichten)
            this.playResponseAudio(lastMessage.audio);
          }
        }

        lastMessageCount = currentMessageCount;
      });
  }

  /**
   * Audio-Antwort automatisch abspielen (nur im Voice-Mode)
   */
  private async playResponseAudio(audioPath: string): Promise<void> {
    try {
      console.log('Voice Mode: Auto-playing response audio:', audioPath);
      await this.audioPlayerService.playAudio(audioPath);
    } catch (error) {
      console.error('Fehler beim Abspielen der Audio-Antwort:', error);
    }
  }

  /**
   * Aufnahme starten/stoppen
   */
  async toggleRecording(): Promise<void> {
    console.log('Toggle Recording clicked. recordingActive:', this.recordingActive, 'speechState:', this.speechState);
    if (!this.speechService.isAvailable) {
      console.log('Speech service not available');
      return;
    }

    try {
      if (this.recordingActive === 1) {
        console.log('Stopping recording...');
        // Stopp - sofort abschicken
        this.stopAndSubmit();
      } else {
        console.log('Starting recording...');
        // Flag SOFORT auf 1 setzen beim Klick
        this.recordingActive = 1;
        console.log('Recording flag set to 1 - button should be red now');
        // Start
        await this.startRecording();
      }
    } catch (error) {
      console.error('Fehler bei Sprachaufnahme:', error);
      // Bei Fehler Recording-State zurücksetzen
      this.recordingActive = 0;
    }
  }

  /**
   * Aufnahme starten
   */
  private async startRecording(): Promise<void> {
    try {
      // Mikrofonberechtigung prüfen
      const hasPermission = await this.speechService.requestMicrophonePermission();
      if (!hasPermission) {
        this.recordingActive = 0;
        return;
      }

      // Spracherkennung starten (kontinuierliche Aufnahme)
      await this.speechService.startListening();
      console.log('Kontinuierliche Aufnahme gestartet');
    } catch (error) {
      console.error('Fehler beim Starten der Aufnahme:', error);
      this.recordingActive = 0;
    }
  }

  /**
   * Aufnahme stoppen und abschicken
   */
  private stopAndSubmit(): void {
    // Recording State sofort zurücksetzen
    this.recordingActive = 0;
    console.log('Recording flag set to 0 - button should be normal now');

    // Aufnahme stoppen
    this.speechService.stopListening();

    // Kurz warten für letzte Transcript-Updates, dann abschicken
    setTimeout(() => {
      if (this.transcript.trim()) {
        this.submitTranscript();
      }
    }, 300);
  }

  /**
   * Transcript als Nachricht abschicken
   */
  private submitTranscript(): void {
    const messageText = this.transcript.trim();
    if (messageText) {
      // Nachricht an Chat Service senden
      this.chatService.addUserMessage(messageText);
    }
  }



  /**
   * Zum Chat-Modus wechseln
   */
  switchToChatMode(): void {
    // Aktive Aufnahme stoppen
    if (this.recordingActive === 1) {
      this.stopAndSubmit();
    }

    // Audio-Wiedergabe stoppen beim Wechsel
    this.audioPlayerService.stopAudio();
    console.log('Voice Mode: Audio stopped due to mode switch');

    this.switchMode.emit('chat');
  }

  /**
   * Fehler schließen
   */
  dismissError(): void {
    this.speechError = null;
  }

  /**
   * Aria-Live Attribut für Status Updates
   */
  getAriaLive(): string {
    if (this.speechState === SpeechState.LISTENING || this.audioState === AudioState.PLAYING) {
      return 'polite';
    }
    return 'off';
  }

  /**
   * Accessibility Label für Recording Button
   */
  getRecordingButtonLabel(): string {
    if (!this.speechService.isAvailable) {
      return 'Spracherkennung nicht verfügbar';
    } else if (this.recordingActive === 1) {
      return 'Aufnahme stoppen und Frage abschicken';
    } else {
      return 'Sprachaufnahme starten';
    }
  }
}
