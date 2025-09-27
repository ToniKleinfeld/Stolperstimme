import { Component, OnInit, OnDestroy, ElementRef, ViewChild, AfterViewChecked, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { ChatService, ChatMessage } from '../../services/chat.service';
import { AudioPlayerService, AudioState } from '../../services/audio-player.service';

@Component({
  selector: 'app-chat-mode',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <section class="chat-mode" role="main" aria-labelledby="chat-mode-title">
      <div class="sr-only" id="chat-mode-title">
        Chat-Modus mit {{ messages.length }} Nachrichten
      </div>

      <!-- Chat Header mit Mode Switch -->
      <header class="chat-header">
        <h2 class="chat-title">Chat-Verlauf</h2>
        <button
          type="button"
          class="mode-switch-btn"
          (click)="switchToVoiceMode()"
          aria-label="Zum Sprach-Modus wechseln"
        >
          <span class="btn-icon" aria-hidden="true">🎤</span>
          <span class="btn-text">Sprache</span>
        </button>
      </header>

      <!-- Chat Content -->
      <div class="chat-content">

        <!-- Empty State -->
        @if (messages.length === 0 && !isLoading) {
          <div class="empty-state" role="status">
            <div class="empty-icon" aria-hidden="true">💬</div>
            <h3 class="empty-title">Noch keine Unterhaltung</h3>
            <p class="empty-description">
              Stellen Sie Ihre erste Frage zu einem Stolperstein.
            </p>
          </div>
        }

        <!-- Messages List -->
        <div class="messages-container" #messagesContainer (scroll)="onScroll()">
          @for (message of messages; track message.id) {
            <div
              class="message"
              [class.message--user]="message.role === 'user'"
              [class.message--assistant]="message.role === 'assistant'"
              [attr.aria-label]="getMessageAriaLabel(message)"
              role="article"
            >
              <!-- Message Header -->
              <div class="message-header">
                <div class="message-avatar" [attr.aria-label]="message.role === 'user' ? 'Ihre Nachricht' : 'Antwort von Stolperstimme'">
                  @if (message.role === 'user') {
                    <span class="avatar-icon">👤</span>
                  } @else {
                    <span class="avatar-icon">🎭</span>
                  }
                </div>
                <div class="message-meta">
                  <span class="message-sender">
                    {{ message.role === 'user' ? 'Sie' : 'Stolperstimme' }}
                  </span>
                  <time class="message-time" [attr.datetime]="message.timestamp.toISOString()">
                    {{ formatTime(message.timestamp) }}
                  </time>
                </div>
              </div>

              <!-- Message Content -->
              <div class="message-content">
                <p class="message-text">{{ message.text }}</p>

                <!-- Audio Player für Assistant Messages -->
                @if (message.role === 'assistant' && message.audio) {
                  <div class="message-audio">
                    @if (isAudioAvailable(message.audio)) {
                      <button
                        type="button"
                        class="audio-button"
                        [class.audio-button--playing]="isPlayingAudio(message.audio)"
                        [class.audio-button--loading]="audioState === 'loading'"
                        [disabled]="audioState === 'loading'"
                        (click)="toggleAudio(message.audio)"
                        [attr.aria-label]="getAudioButtonLabel(message.audio)"
                      >
                        <span class="audio-icon" aria-hidden="true">
                          @if (audioState === 'loading') {
                            ⏳
                          } @else if (isPlayingAudio(message.audio)) {
                            ⏸️
                          } @else {
                            ▶️
                          }
                        </span>
                        <span class="audio-text">
                          @if (audioState === 'loading') {
                            Lädt...
                          } @else if (isPlayingAudio(message.audio)) {
                            Pausieren
                          } @else {
                            Antwort anhören
                          }
                        </span>
                      </button>
                    } @else {
                      <div class="audio-unavailable" role="status">
                        <span class="audio-icon" aria-hidden="true">🔇</span>
                        <span class="audio-text">Audio nicht verfügbar</span>
                      </div>
                    }
                  </div>
                }
              </div>
            </div>
          }

          <!-- Loading Message -->
          @if (isLoading) {
            <div class="message message--assistant message--loading" role="status" aria-live="polite">
              <div class="message-header">
                <div class="message-avatar" aria-label="Stolperstimme antwortet">
                  <span class="avatar-icon">🎭</span>
                </div>
                <div class="message-meta">
                  <span class="message-sender">Stolperstimme</span>
                  <span class="message-time">antwortet...</span>
                </div>
              </div>
              <div class="message-content">
                <div class="typing-indicator">
                  <div class="typing-dots">
                    <span class="typing-dot"></span>
                    <span class="typing-dot"></span>
                    <span class="typing-dot"></span>
                  </div>
                  <span class="sr-only">Antwort wird erstellt...</span>
                </div>
              </div>
            </div>
          }
        </div>

        <!-- Auto-scroll indicator -->
        @if (shouldShowScrollIndicator) {
          <button
            type="button"
            class="scroll-to-bottom"
            (click)="scrollToBottom()"
            aria-label="Zu den neuesten Nachrichten scrollen"
          >
            <span class="scroll-icon" aria-hidden="true">⬇️</span>
            Neue Nachricht
          </button>
        }
      </div>

      <!-- Message Input -->
      <footer class="message-input-section">
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
                placeholder="Ihre Frage zum Stolperstein..."
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

            <!-- Send Button -->
            <button
              type="submit"
              class="send-btn"
              [class.send-btn--loading]="isLoading"
              [disabled]="!canSendMessage()"
              [attr.aria-label]="getSendButtonLabel()"
            >
              <span class="btn-icon" aria-hidden="true">
                @if (isLoading) {
                  ⏳
                } @else {
                  📤
                }
              </span>
              <span class="btn-text">
                @if (isLoading) {
                  Senden...
                } @else {
                  Senden
                }
              </span>
            </button>
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
      </footer>
    </section>
  `,
  styleUrl: './chat-mode.component.scss'
})
export class ChatModeComponent implements OnInit, OnDestroy, AfterViewChecked {
  @ViewChild('messagesContainer', { static: false }) messagesContainer!: ElementRef<HTMLDivElement>;
  @ViewChild('messageTextArea', { static: false }) messageTextArea!: ElementRef<HTMLTextAreaElement>;
  @Output() switchMode = new EventEmitter<'voice'>();

  messageForm: FormGroup;
  messages: ChatMessage[] = [];
  isLoading: boolean = false;
  audioState: AudioState = AudioState.IDLE;
  currentPlayingAudio: string | null = null;
  shouldShowScrollIndicator: boolean = false;
  isInputFocused: boolean = false;
  hasTriedToSubmit: boolean = false;

  private destroy$ = new Subject<void>();
  private shouldScrollToBottom = false;
  private lastMessageCount = 0;

  constructor(
    private formBuilder: FormBuilder,
    private chatService: ChatService,
    private audioPlayerService: AudioPlayerService
  ) {
    this.messageForm = this.createForm();
  }

  ngOnInit(): void {
    this.subscribeToChat();
    this.subscribeToAudio();
    this.setupFormSubscriptions();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  ngAfterViewChecked(): void {
    if (this.shouldScrollToBottom) {
      this.scrollToBottom();
      this.shouldScrollToBottom = false;
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
   * Chat Service subscriptions
   */
  private subscribeToChat(): void {
    // Messages abonnieren
    this.chatService.state$
      .pipe(takeUntil(this.destroy$))
      .subscribe((state) => {
        const newMessageCount = state.messages.length;

        // Auto-scroll wenn neue Nachricht hinzugefügt wurde
        if (newMessageCount > this.lastMessageCount) {
          this.shouldScrollToBottom = true;
        }

        this.messages = state.messages;
        this.isLoading = state.isLoading;
        this.lastMessageCount = newMessageCount;

        // Scroll-Indicator aktualisieren
        setTimeout(() => this.updateScrollIndicator(), 100);
      });
  }

  /**
   * Audio Player Service subscriptions
   */
  private subscribeToAudio(): void {
    this.audioPlayerService.state
      .pipe(takeUntil(this.destroy$))
      .subscribe((state) => {
        this.audioState = state;
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
      return;
    }

    const messageText = this.messageField?.value?.trim();
    if (messageText) {
      // Nachricht an Chat Service senden
      this.chatService.addUserMessage(messageText);

      // Form zurücksetzen
      this.messageForm.reset();
      this.messageForm.markAsUntouched();
      this.messageForm.markAsPristine();
      this.hasTriedToSubmit = false;
      this.adjustTextareaHeight();

      // Fokus zurück auf Eingabefeld
      setTimeout(() => {
        this.messageTextArea?.nativeElement.focus();
      }, 100);
    }
  }

  /**
   * Zum Voice-Modus wechseln
   */
  switchToVoiceMode(): void {
    // Audio-Wiedergabe stoppen beim Wechsel
    this.audioPlayerService.stopAudio();
    console.log('Chat Mode: Audio stopped due to mode switch');

    this.switchMode.emit('voice');
  }

  /**
   * Prüft ob Nachricht gesendet werden kann
   */
  canSendMessage(): boolean {
    return this.messageForm.valid && !this.isLoading && this.messageField?.value?.trim().length > 0;
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
    // Ctrl/Cmd + Enter zum Senden
    if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
      event.preventDefault();
      if (this.canSendMessage()) {
        this.sendMessage();
      }
    }
  }

  /**
   * Zeit formatieren für Anzeige
   */
  formatTime(timestamp: Date): string {
    const now = new Date();
    const diffMs = now.getTime() - timestamp.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);

    if (diffMins < 1) {
      return 'gerade eben';
    } else if (diffMins < 60) {
      return `vor ${diffMins} Min`;
    } else if (diffHours < 24) {
      return `vor ${diffHours} Std`;
    } else {
      return timestamp.toLocaleDateString('de-DE', {
        day: '2-digit',
        month: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
  }

  /**
   * Accessibility Label für Message generieren
   */
  getMessageAriaLabel(message: ChatMessage): string {
    const sender = message.role === 'user' ? 'Sie' : 'Stolperstimme';
    const time = this.formatTime(message.timestamp);
    const hasAudio = message.audio ? ', mit Audio verfügbar' : '';
    return `${sender}, ${time}${hasAudio}: ${message.text}`;
  }

  /**
   * Prüft ob Audio verfügbar ist
   */
  isAudioAvailable(audioPath: string | null | undefined): boolean {
    if (!audioPath) return false;
    // In einer echten App würde hier eine Prüfung stattfinden
    return audioPath.includes('.mp3') || audioPath.includes('.ogg');
  }

  /**
   * Prüft ob gerade Audio abgespielt wird
   */
  isPlayingAudio(audioPath: string): boolean {
    return this.currentPlayingAudio === audioPath && this.audioState === AudioState.PLAYING;
  }

  /**
   * Audio abspielen/pausieren
   */
  async toggleAudio(audioPath: string): Promise<void> {
    try {
      if (this.isPlayingAudio(audioPath)) {
        // Audio pausieren
        this.audioPlayerService.pause();
        this.currentPlayingAudio = null;
      } else {
        // Audio abspielen
        this.currentPlayingAudio = audioPath;
        await this.audioPlayerService.playAudio(audioPath);
      }
    } catch (error) {
      console.error('Fehler beim Audio-Abspielen:', error);
      this.currentPlayingAudio = null;
    }
  }

  /**
   * Accessibility Label für Audio-Button generieren
   */
  getAudioButtonLabel(audioPath: string): string {
    if (this.audioState === AudioState.LOADING) {
      return 'Audio wird geladen';
    } else if (this.isPlayingAudio(audioPath)) {
      return 'Audio pausieren';
    } else {
      return 'Antwort anhören';
    }
  }

  /**
   * Accessibility Label für Senden-Button
   */
  getSendButtonLabel(): string {
    if (this.isLoading) {
      return 'Nachricht wird gesendet';
    } else if (!this.canSendMessage()) {
      return 'Nachricht kann nicht gesendet werden';
    } else {
      return 'Nachricht senden';
    }
  }

  /**
   * Zu den neuesten Nachrichten scrollen
   */
  scrollToBottom(): void {
    if (this.messagesContainer) {
      const element = this.messagesContainer.nativeElement;
      element.scrollTop = element.scrollHeight;
      this.shouldShowScrollIndicator = false;
    }
  }

  /**
   * Scroll-Indicator aktualisieren
   */
  private updateScrollIndicator(): void {
    if (!this.messagesContainer) return;

    const element = this.messagesContainer.nativeElement;
    const threshold = 100; // Pixel von unten
    const isNearBottom = (element.scrollHeight - element.scrollTop - element.clientHeight) <= threshold;

    this.shouldShowScrollIndicator = !isNearBottom && this.messages.length > 0;
  }

  /**
   * Scroll Event Handler (für Scroll-Indicator)
   */
  onScroll(): void {
    this.updateScrollIndicator();
  }
}
