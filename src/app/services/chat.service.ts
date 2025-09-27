import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { map } from 'rxjs/operators';

/**
 * Interface für Chat-Nachrichten
 */
export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  timestamp: Date;
  audio?: string | null; // Path zu lokaler Audio-Datei oder null
}

/**
 * Chat-Zustand
 */
export interface ChatState {
  messages: ChatMessage[];
  isLoading: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class ChatService {
  private readonly initialState: ChatState = {
    messages: [],
    isLoading: false
  };

  private chatState$ = new BehaviorSubject<ChatState>(this.initialState);

  /**
   * Observable für den gesamten Chat-State
   */
  public readonly state$ = this.chatState$.asObservable();

  /**
   * Observable nur für die Nachrichten
   */
  public readonly messages$: Observable<ChatMessage[]> = this.state$.pipe(
    map(state => state.messages)
  );

  /**
   * Observable für Loading State
   */
  public readonly isLoading$: Observable<boolean> = this.state$.pipe(
    map(state => state.isLoading)
  );

  constructor() {
    // Versuche gespeicherte Session-Daten zu laden
    this.loadSessionData();
  }

  /**
   * Aktueller State-Wert
   */
  get currentState(): ChatState {
    return this.chatState$.value;
  }

  /**
   * Aktuelle Nachrichten
   */
  get currentMessages(): ChatMessage[] {
    return this.chatState$.value.messages;
  }



  /**
   * Benutzer-Nachricht hinzufügen
   */
  addUserMessage(text: string): string {
    const messageId = this.generateMessageId();
    const message: ChatMessage = {
      id: messageId,
      role: 'user',
      text: text.trim(),
      timestamp: new Date()
    };

    const currentState = this.currentState;
    const newState: ChatState = {
      ...currentState,
      messages: [...currentState.messages, message],
      isLoading: true // Loading state für Assistant-Antwort
    };

    this.chatState$.next(newState);
    this.saveSessionData();

    // Simuliere Assistant-Antwort (hier würde später eine echte API kommen)
    setTimeout(() => {
      this.addAssistantResponse(messageId, text);
    }, 1000);

    return messageId;
  }

  /**
   * Assistant-Antwort hinzufügen (Demo-System mit festen Antworten)
   */
  private addAssistantResponse(userMessageId: string, userText: string): void {
    const currentState = this.currentState;
    const userMessages = currentState.messages.filter(msg => msg.role === 'user');
    const questionNumber = userMessages.length;

    let response: { text: string; audio?: string };

    if (questionNumber === 1) {
      // Erste Frage - Anna Lübke
      response = {
        text: 'Anna Lübke war Teil einer Familie, die aufgrund ihrer Zugehörigkeit zur so genannten "Zigeuner"-Gemeinschaft verfolgt wurde. Am 9. März 1943 wurde sie mit ihren Kindern ins so genannte "Zigeunerlager" des KZ Auschwitz deportiert, wo sie am 18. Oktober 1943 ums Leben kam. Ihre Kinder Franz, Karola und Theresia wurden ebenfalls 1943/44 in Auschwitz ermordet, während ihr Sohn Karl-Heinz mehrere Konzentrationslager überlebte und 1945 zurückkehrte.\nWenn du mehr über die Schicksale der einzelnen Familienmitglieder erfahren möchtest, frag gerne nach!',
        audio: 'assets/audio/answer_1.mp3'
      };
    } else if (questionNumber === 2) {
      // Zweite Frage - Karl-Heinz Lübke
      response = {
        text: 'Nach dem KZ wurde Karl-Heinz Lübke am 8. März 1945 als Zwangsarbeiter des KZ Dora-Mittelbau verzeichnet. Nach der Räumung dieses Lagers gelangte er in das KZ Sachsenhausen, wo er Anfang Mai 1945 durch die sowjetische Armee befreit wurde. Am 7. Juli 1945 kehrte er nach Münster zurück, arbeitete als Schrotthändler und heiratete.\nWas möchtest du außerdem wissen?',
        audio: 'assets/audio/answer_2.mp3'
      };
    } else {
      // Dritte Frage - Fehler und Reset
      response = {
        text: 'Entschuldigung, Ihre Anfrage konnte gerade nicht bearbeitet werden. Das System wird für eine neue Unterhaltung zurückgesetzt.',

      };
    }

    const assistantMessage: ChatMessage = {
      id: this.generateMessageId(),
      role: 'assistant',
      text: response.text,
      timestamp: new Date(),
      audio: response.audio
    };

    const newState: ChatState = {
      ...currentState,
      messages: [...currentState.messages, assistantMessage],
      isLoading: false
    };

    this.chatState$.next(newState);
    this.saveSessionData();

    // Bei der dritten Frage: automatisch zurücksetzen nach kurzer Verzögerung
    if (questionNumber === 3) {
      setTimeout(() => {
        this.resetState();
      }, 3000);
    }
  }

  /**
   * Alle Nachrichten löschen
   */
  clearMessages(): void {
    const currentState = this.currentState;
    const newState: ChatState = {
      ...currentState,
      messages: [],
      isLoading: false
    };

    this.chatState$.next(newState);
    this.saveSessionData();
  }

  /**
   * Kompletten State zurücksetzen
   */
  resetState(): void {
    this.chatState$.next(this.initialState);
    this.clearSessionData();
  }

  /**
   * Eindeutige Message-ID generieren
   */
  private generateMessageId(): string {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Session-Daten in localStorage speichern
   */
  private saveSessionData(): void {
    try {
      const dataToSave = {
        messages: this.currentMessages
      };
      sessionStorage.setItem('stolperstimme_chat_state', JSON.stringify(dataToSave));
    } catch (error) {
      console.warn('Konnte Session-Daten nicht speichern:', error);
    }
  }

  /**
   * Session-Daten aus localStorage laden
   */
  private loadSessionData(): void {
    try {
      const saved = sessionStorage.getItem('stolperstimme_chat_state');
      if (saved) {
        const data = JSON.parse(saved);
        const restoredState: ChatState = {
          messages: (data.messages || []).map((msg: any) => ({
            ...msg,
            timestamp: new Date(msg.timestamp) // String zu Date konvertieren
          })),
          isLoading: false
        };
        this.chatState$.next(restoredState);
      }
    } catch (error) {
      console.warn('Konnte Session-Daten nicht laden:', error);
    }
  }

  /**
   * Session-Daten löschen
   */
  private clearSessionData(): void {
    try {
      sessionStorage.removeItem('stolperstimme_chat_state');
    } catch (error) {
      console.warn('Konnte Session-Daten nicht löschen:', error);
    }
  }
}
