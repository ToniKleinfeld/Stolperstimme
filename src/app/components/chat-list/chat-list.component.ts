import { Component, OnInit, OnDestroy, ElementRef, ViewChild, AfterViewChecked, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject, takeUntil } from 'rxjs';
import { ChatService, ChatMessage } from '../../services/chat.service';
import { AudioPlayerService, AudioState } from '../../services/audio-player.service';

@Component({
  selector: 'app-chat-list',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="chat-list" role="main" aria-labelledby="chat-list-title">
      <div class="sr-only" id="chat-list-title">
        Chat-Verlauf mit {{ messages.length }} Nachrichten
      </div>

      @if (messages.length === 0 && !isLoading) {
        <div class="empty-state" role="status">
          <div class="empty-icon" aria-hidden="true">💬</div>
          <h3 class="empty-title">Noch keine Unterhaltung</h3>
          <p class="empty-description">
            Stellen Sie Ihre erste Frage zu einem Stolperstein, um die Unterhaltung zu beginnen.
          </p>
        </div>
      }

      <div class="messages-container" #messagesContainer>
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
                          Antwort vorlesen
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
    </section>
  `,
  styleUrl: './chat-list.component.scss'
})
export class ChatListComponent implements OnInit, OnDestroy, AfterViewChecked {
  @ViewChild('messagesContainer', { static: false }) messagesContainer!: ElementRef<HTMLDivElement>;
  @Output() chatEmptyState = new EventEmitter<boolean>();

  messages: ChatMessage[] = [];
  isLoading: boolean = false;
  audioState: AudioState = AudioState.IDLE;
  currentPlayingAudio: string | null = null;
  shouldShowScrollIndicator: boolean = false;

  private destroy$ = new Subject<void>();
  private shouldScrollToBottom = false;
  private lastMessageCount = 0;

  constructor(
    private chatService: ChatService,
    private audioPlayerService: AudioPlayerService
  ) {}

  ngOnInit(): void {
    this.subscribeToChat();
    this.subscribeToAudio();
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

        // Empty State an Parent Component weiterleiten
        const isEmpty = state.messages.length === 0 && !state.isLoading;
        this.chatEmptyState.emit(isEmpty);

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
  isAudioAvailable(audioPath: string): boolean {
    // In einer echten App würde hier eine Prüfung stattfinden
    // Für Demo-Zwecke nehmen wir an, dass Audio verfügbar ist
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
      return 'Antwort vorlesen lassen';
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
