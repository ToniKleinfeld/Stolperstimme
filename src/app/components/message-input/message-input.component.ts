import { Component, OnInit, OnDestroy, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subject, takeUntil, combineLatest } from 'rxjs';
import { ChatService } from '../../services/chat.service';
import { SpeechService, SpeechState } from '../../services/speech.service';

@Component({
  selector: 'app-message-input',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <section class="message-input" role="form" aria-labelledby="message-input-title">
      <div class="sr-only" id="message-input-title">
        Neue Nachricht eingeben
      </div>

      <!-- Speech Recognition Error Display -->
      @if (speechError) {
        <div class="speech-error" role="alert" aria-live="assertive">
          <div class="error-content">
            <span class="error-icon" aria-hidden="true">⚠️</span>
            <div class="error-text">
              <strong>Mikrofon-Problem:</strong>
              {{ speechError }}
            </div>
            <button
              type="button"
              class="error-dismiss"
              (click)="dismissSpeechError()"
              aria-label="Fehlermeldung schließen"
            >
              ✕
            </button>
          </div>
        </div>
      }

      <!-- Speech Recognition Active Indicator -->
      @if (speechState === 'listening' || speechState === 'processing') {
        <div class="speech-active" role="status" aria-live="polite">
          <div class="speech-content">
            <div class="speech-animation" aria-hidden="true">
              <div class="pulse-ring"></div>
              <div class="pulse-ring pulse-ring--delay1"></div>
              <div class="pulse-ring pulse-ring--delay2"></div>
              <span class="mic-icon">🎤</span>
            </div>
            <div class="speech-text">
              @if (speechState === 'listening') {
                <strong>Hörend...</strong>
                <p class="speech-hint">Sprechen Sie jetzt Ihre Frage</p>
              } @else {
                <strong>Verarbeite...</strong>
                <p class="speech-hint">Sprache wird verarbeitet</p>
              }
            </div>
          </div>
        </div>
      }



      <!-- Main Input Form -->
      <form [formGroup]="messageForm" (ngSubmit)="sendMessage()" class="input-form" novalidate>
        <div class="input-group" [class.input-group--focused]="isInputFocused">
          <!-- Text Input Field -->
          <div class="text-input-container">
            <label for="message-text" class="sr-only">
              Ihre Frage zum Stolperstein
            </label>
            <textarea
              #messageTextArea
              id="message-text"
              formControlName="message"
              class="message-textarea"
              [class.message-textarea--error]="messageField?.invalid && messageField?.touched"
              placeholder="Stellen Sie Ihre Frage zum Stolperstein..."
              aria-describedby="message-error"
              rows="1"
              maxlength="1000"
              (focus)="onInputFocus()"
              (blur)="onInputBlur()"
              (input)="adjustTextareaHeight()"
              (keydown)="onKeyDown($event)"
            ></textarea>

            <!-- Character Counter -->
            <div class="character-counter" [class.character-counter--warning]="getCharacterCount() > 900">
              {{ getCharacterCount() }}/1000
            </div>
          </div>

          <!-- Action Buttons -->
          <div class="action-buttons">
            <!-- Microphone Button -->
            <button
              type="button"
              class="action-btn mic-btn"
              [class.mic-btn--active]="speechState === 'listening' || speechState === 'processing'"
              [class.mic-btn--disabled]="!speechService.isAvailable"
              [disabled]="!speechService.isAvailable || isSubmitting"
              (click)="toggleSpeechRecognition()"
              [attr.aria-label]="getMicButtonLabel()"
              [attr.aria-pressed]="speechState === 'listening' || speechState === 'processing'"
            >
              <span class="btn-icon" aria-hidden="true">
                @if (speechState === 'listening') {
                  🔴
                } @else if (speechState === 'processing') {
                  ⏹️
                } @else if (!speechService.isAvailable) {
                  🎤❌
                } @else {
                  🎤
                }
              </span>
              <span class="btn-text">
                @if (!speechService.isAvailable) {
                  Nicht verfügbar
                } @else if (speechState === 'listening') {
                  Stopp
                } @else if (speechState === 'processing') {
                  Stopp
                } @else {
                  Sprechen
                }
              </span>
            </button>

            <!-- Send Button -->
            <button
              type="submit"
              class="action-btn send-btn"
              [class.send-btn--loading]="isSubmitting"
              [disabled]="!canSendMessage()"
              [attr.aria-label]="getSendButtonLabel()"
            >
              <span class="btn-icon" aria-hidden="true">
                @if (isSubmitting) {
                  ⏳
                } @else {
                  📤
                }
              </span>
              <span class="btn-text">
                @if (isSubmitting) {
                  Senden...
                } @else {
                  Senden
                }
              </span>
            </button>
          </div>
        </div>

        <!-- Form Validation Errors -->
        @if (messageField?.invalid && hasTriedToSubmit) {
          <div id="message-error" class="form-error" role="alert" aria-live="polite">
            @if (messageField?.errors?.['required']) {
              Bitte geben Sie eine Frage ein.
            } @else if (messageField?.errors?.['maxlength']) {
              Die Nachricht ist zu lang (maximal 1000 Zeichen).
            } @else if (messageField?.errors?.['minlength']) {
              Die Nachricht ist zu kurz (mindestens 3 Zeichen).
            }
          </div>
        }


      </form>
    </section>
  `,
  styleUrl: './message-input.component.scss'
})
export class MessageInputComponent implements OnInit, OnDestroy {
  @ViewChild('messageTextArea', { static: false }) messageTextArea!: ElementRef<HTMLTextAreaElement>;

  messageForm: FormGroup;
  isInputFocused: boolean = false;
  isSubmitting: boolean = false;
  speechState: SpeechState = SpeechState.IDLE;
  transcript: string = '';
  speechError: string | null = null;
  hasTriedToSubmit: boolean = false;

  private destroy$ = new Subject<void>();

  constructor(
    private formBuilder: FormBuilder,
    private chatService: ChatService,
    public speechService: SpeechService
  ) {
    this.messageForm = this.createForm();
  }

  ngOnInit(): void {
    this.setupFormSubscriptions();
    this.setupSpeechSubscriptions();
    this.setupKeyboardShortcuts();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();

    // Spracherkennung stoppen falls aktiv
    if (this.speechState === SpeechState.LISTENING) {
      this.speechService.stopListening();
    }
  }

  /**
   * Getter für Form Control
   */
  get messageField() {
    return this.messageForm.get('message');
  }

  /**
   * Reactive Form erstellen
   */
  private createForm(): FormGroup {
    return this.formBuilder.group({
      message: [
        '',
        [
          Validators.required,
          Validators.minLength(3),
          Validators.maxLength(1000)
        ]
      ]
    });
  }

  /**
   * Form Subscriptions einrichten
   */
  private setupFormSubscriptions(): void {
    // Chat Service State für Loading abonnieren
    this.chatService.state$
      .pipe(takeUntil(this.destroy$))
      .subscribe((state) => {
        this.isSubmitting = state.isLoading;
      });

    // Form-Wertänderungen abonnieren um Fehler zu verstecken wenn User tippt
    this.messageField?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((value) => {
        if (value && value.trim().length > 0) {
          this.hasTriedToSubmit = false; // Fehler verstecken wenn User tippt
        }
      });


  }

  /**
   * Speech Service Subscriptions einrichten
   */
  private setupSpeechSubscriptions(): void {
    // Speech State abonnieren
    this.speechService.state
      .pipe(takeUntil(this.destroy$))
      .subscribe((state) => {
        const previousState = this.speechState;
        this.speechState = state;

        // Wenn von PROCESSING/LISTENING zu IDLE wechselt und Transcript vorhanden ist
        if ((previousState === SpeechState.PROCESSING || previousState === SpeechState.LISTENING) &&
            state === SpeechState.IDLE && this.transcript) {
          // Final transcript ins Eingabefeld übernehmen
          this.messageField?.setValue(this.transcript);
          this.adjustTextareaHeight();
        }
      });

    // Transcript abonnieren und direkt ins Input-Feld einfügen
    this.speechService.transcript
      .pipe(takeUntil(this.destroy$))
      .subscribe((transcript) => {
        this.transcript = transcript;

        // Transcript immer direkt in Textfeld einfügen
        if (transcript) {
          this.messageField?.setValue(transcript);
          this.adjustTextareaHeight();
        }
      });    // Speech Errors abonnieren
    this.speechService.error
      .pipe(takeUntil(this.destroy$))
      .subscribe((error) => {
        this.speechError = error;
      });
  }

  /**
   * Keyboard Shortcuts einrichten
   */
  private setupKeyboardShortcuts(): void {
    document.addEventListener('keydown', (event) => {
      // Ctrl/Cmd + Enter zum Senden
      if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
        event.preventDefault();
        if (this.canSendMessage()) {
          this.sendMessage();
        }
      }

      // Ctrl/Cmd + M für Mikrofon
      if ((event.ctrlKey || event.metaKey) && event.key === 'm') {
        event.preventDefault();
        this.toggleSpeechRecognition();
      }
    });
  }

  /**
   * Nachricht senden
   */
  sendMessage(): void {
    // Markieren dass ein Sendeversuch stattgefunden hat
    this.hasTriedToSubmit = true;

    // Prüfen ob die Nachricht gültig ist
    if (!this.canSendMessage()) {
      // Fehler wird jetzt durch hasTriedToSubmit angezeigt
      return;
    }

    const messageText = this.messageField?.value?.trim();
    if (messageText) {
      // Spracherkennung stoppen falls aktiv
      if (this.speechState === SpeechState.LISTENING) {
        this.speechService.stopListening();
      }

      // Nachricht an Chat Service senden
      this.chatService.addUserMessage(messageText);

      // Form zurücksetzen und Validierung löschen
      this.messageForm.reset();
      this.messageForm.markAsUntouched();
      this.messageForm.markAsPristine();
      this.hasTriedToSubmit = false; // Flag zurücksetzen nach erfolgreichem Senden
      this.adjustTextareaHeight();

      // Speech Error löschen falls vorhanden
      this.speechError = null;

      // Fokus zurück auf Eingabefeld
      setTimeout(() => {
        this.messageTextArea?.nativeElement.focus();
      }, 100);
    }
  }

  /**
   * Spracherkennung ein/ausschalten
   */
  async toggleSpeechRecognition(): Promise<void> {
    if (!this.speechService.isAvailable) return;

    try {
      if (this.speechState === SpeechState.LISTENING || this.speechState === SpeechState.PROCESSING) {
        // Stoppen wenn aktiv (egal ob LISTENING oder PROCESSING)
        this.stopListening();
      } else if (this.speechState === SpeechState.IDLE) {
        // Nur starten wenn IDLE
        await this.startListening();
      }
    } catch (error) {
      console.error('Fehler bei Spracherkennung:', error);
    }
  }

  /**
   * Spracherkennung starten
   */
  private async startListening(): Promise<void> {
    try {
      // Mikrofonberechtigung prüfen
      const hasPermission = await this.speechService.requestMicrophonePermission();
      if (!hasPermission) {
        return;
      }

      // Spracherkennung starten (löscht automatisch den alten Text)
      await this.speechService.startListening();
    } catch (error) {
      console.error('Fehler beim Starten der Spracherkennung:', error);
    }
  }

  /**
   * Spracherkennung stoppen
   */
  stopListening(): void {
    this.speechService.stopListening();
  }

  /**
   * Speech Error dismissen
   */
  dismissSpeechError(): void {
    this.speechError = null;
  }

  /**
   * Prüft ob Nachricht gesendet werden kann
   */
  canSendMessage(): boolean {
    return this.messageForm.valid && !this.isSubmitting && this.messageField?.value?.trim().length > 0;
  }

  /**
   * Zeichen-Anzahl abrufen
   */
  getCharacterCount(): number {
    return this.messageField?.value?.length || 0;
  }

  /**
   * Textarea Höhe anpassen
   */
  adjustTextareaHeight(): void {
    if (this.messageTextArea) {
      const textarea = this.messageTextArea.nativeElement;
      textarea.style.height = 'auto';
      const newHeight = Math.min(Math.max(textarea.scrollHeight, 44), 120); // Min 44px, Max 120px
      textarea.style.height = `${newHeight}px`;
    }
  }

  /**
   * Input Focus Handler
   */
  onInputFocus(): void {
    this.isInputFocused = true;
  }

  /**
   * Input Blur Handler
   */
  onInputBlur(): void {
    this.isInputFocused = false;
  }

  /**
   * Keydown Handler für Textarea
   */
  onKeyDown(event: KeyboardEvent): void {
    // Enter ohne Modifikatoren für neue Zeile
    if (event.key === 'Enter' && !event.shiftKey && !event.ctrlKey && !event.metaKey) {
      // Normales Enter-Verhalten beibehalten (neue Zeile)
      return;
    }
  }

  /**
   * Accessibility Label für Mikrofon-Button
   */
  getMicButtonLabel(): string {
    if (!this.speechService.isAvailable) {
      return 'Spracherkennung nicht verfügbar';
    } else if (this.speechState === SpeechState.LISTENING) {
      return 'Sprachaufnahme stoppen';
    } else if (this.speechState === SpeechState.PROCESSING) {
      return 'Sprachverarbeitung stoppen';
    } else {
      return 'Spracherkennung starten - Mikrofon aktivieren';
    }
  }

  /**
   * Accessibility Label für Senden-Button
   */
  getSendButtonLabel(): string {
    if (this.isSubmitting) {
      return 'Nachricht wird gesendet';
    } else if (!this.canSendMessage()) {
      return 'Nachricht kann nicht gesendet werden';
    } else {
      return 'Nachricht senden';
    }
  }
}
