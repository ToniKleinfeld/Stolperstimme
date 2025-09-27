import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject, takeUntil } from 'rxjs';
import { VoiceModeComponent } from '../components/voice-mode/voice-mode.component';
import { ChatModeComponent } from '../components/chat-mode/chat-mode.component';
import { ChatService } from '../services/chat.service';

export type AppMode = 'voice' | 'chat';

@Component({
  selector: 'app-main',
  standalone: true,
  imports: [
    CommonModule,
    VoiceModeComponent,
    ChatModeComponent
  ],
  templateUrl: './main.component.html',
  styleUrl: './main.component.scss'
})
export class MainComponent implements OnInit, OnDestroy {
  currentMode: AppMode = 'voice';
  isInitialized = false;
  private destroy$ = new Subject<void>();

  constructor(private chatService: ChatService) {}

  ngOnInit(): void {
    // Load saved mode from localStorage or default to voice
    const savedMode = localStorage.getItem('stolperstimme-mode') as AppMode;
    if (savedMode && (savedMode === 'voice' || savedMode === 'chat')) {
      this.currentMode = savedMode;
    }

    // Subscribe to chat state to determine if there are existing messages
    this.chatService.state$
      .pipe(takeUntil(this.destroy$))
      .subscribe((state: { messages: any[]; isLoading: boolean }) => {
        // If there are existing messages and we're in voice mode,
        // we might want to suggest switching to chat mode for better history viewing
        if (state.messages.length > 0 && this.currentMode === 'voice') {
          // Could add a subtle notification here in the future
        }
      });

    this.isInitialized = true;
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Switch between voice and chat modes
   */
  switchToMode(mode: AppMode): void {
    if (mode === this.currentMode) return;

    this.currentMode = mode;
    localStorage.setItem('stolperstimme-mode', mode);

    // Emit an event to let services know about mode change if needed
    // For now, just update the UI state
  }

  /**
   * Toggle between voice and chat modes
   */
  toggleMode(): void {
    const newMode: AppMode = this.currentMode === 'voice' ? 'chat' : 'voice';
    this.switchToMode(newMode);
  }

  /**
   * Clear chat history when logo is clicked
   */
  clearChat(): void {
    // Reset entire chat state including messages and session data
    this.chatService.resetState();

    // Optional: Show a brief feedback (could be extended with toast notification)
    console.log('Chat wurde geleert - Neue Unterhaltung gestartet');

    // Optional: Switch to voice mode after clearing
    // this.switchToMode('voice');
  }




}
