import { TestBed } from '@angular/core/testing';import { TestBed } from '@angular/core/testing';import { TestBed } from '@angular/core/testing';

import { ChatService } from './chat.service';

import { ChatService, ChatMessage } from './chat.service';import { ChatService, ChatMessage } from './chat.service';

describe('ChatService', () => {

  let service: ChatService;



  beforeEach(() => {describe('ChatService', () => {describe('ChatService', () => {

    TestBed.configureTestingModule({});

    service = TestBed.inject(ChatService);  let service: ChatService;

    sessionStorage.clear();

  });  let service: ChatService;



  it('should be created', () => {  beforeEach(() => {

    expect(service).toBeTruthy();

  });    TestBed.configureTestingModule({});



  it('should initialize with empty state', () => {    service = TestBed.inject(ChatService);

    expect(service.currentState).toEqual({

      messages: [],    sessionStorage.clear();  beforeEach(() => {describe('ChatService', () => {describe('ChatService', () => {

      isLoading: false

    });  });

  });

    TestBed.configureTestingModule({});

  it('should add user message', () => {

    const messageText = 'Test message';  it('should be created', () => {

    service.addUserMessage(messageText);

    expect(service).toBeTruthy();    service = TestBed.inject(ChatService);  let service: ChatService;  let service: ChatService;

    const state = service.currentState;

    expect(state.messages).toHaveLength(1);  });

    expect(state.messages[0].text).toBe(messageText);

    expect(state.messages[0].role).toBe('user');    sessionStorage.clear();

  });

  describe('State Management', () => {

  it('should reset state', () => {

    service.addUserMessage('Test');    it('should initialize with empty state', () => {  });

    expect(service.currentState.messages).toHaveLength(1);

      expect(service.currentState).toEqual({

    service.resetState();

    expect(service.currentState).toEqual({        messages: [],

      messages: [],

      isLoading: false        isLoading: false

    });

  });      });  afterEach(() => {  beforeEach(() => {  beforeEach(() => {

});
    });

    sessionStorage.clear();

    it('should add user message', () => {

      const messageText = 'Test message';  });    TestBed.configureTestingModule({});    TestBed.configureTestingModule({});

      service.addUserMessage(messageText);



      const state = service.currentState;

      expect(state.messages).toHaveLength(1);  it('should be created', () => {    service = TestBed.inject(ChatService);    service = TestBed.inject(ChatService);

      expect(state.messages[0].text).toBe(messageText);

      expect(state.messages[0].role).toBe('user');    expect(service).toBeTruthy();

    });

  });    sessionStorage.clear();

    it('should clear messages', () => {

      service.addUserMessage('Test');

      expect(service.currentState.messages).toHaveLength(1);

  it('should initialize with empty state', () => {  });    // Clear sessionStorage before each test

      service.clearMessages();

      expect(service.currentState.messages).toHaveLength(0);    expect(service.currentState).toEqual({

    });

      messages: [],    sessionStorage.clear();

    it('should reset state', () => {

      service.addUserMessage('Test');      isLoading: false

      expect(service.currentState.messages).toHaveLength(1);

    });  afterEach(() => {  });

      service.resetState();

      expect(service.currentState).toEqual({  });

        messages: [],

        isLoading: false    sessionStorage.clear();

      });

    });  it('should add user message correctly', () => {

  });

    const messageText = 'Test message';  });  afterEach(() => {

  describe('Session Storage', () => {

    it('should persist messages in sessionStorage', () => {    const messageId = service.addUserMessage(messageText);

      service.addUserMessage('Test message');

          sessionStorage.clear();

      const saved = sessionStorage.getItem('stolperstimme_chat_state');

      expect(saved).toBeTruthy();    expect(messageId).toBeTruthy();



      const parsedState = JSON.parse(saved!);    expect(service.currentMessages.length).toBe(1);  it('should be created', () => {  });

      expect(parsedState.messages).toHaveLength(1);

      expect(parsedState.messages[0].text).toBe('Test message');    expect(service.currentMessages[0].text).toBe(messageText);

    });

    expect(service.currentMessages[0].role).toBe('user');    expect(service).toBeTruthy();

    it('should load messages from sessionStorage on init', () => {

      // Set up sessionStorage data  });

      const testMessage: ChatMessage = {

        id: '1',  });  it('should be created', () => {

        text: 'Restored message',

        role: 'user',  it('should clear messages', () => {

        timestamp: new Date(),

        audio: null    service.addUserMessage('Test');    expect(service).toBeTruthy();

      };

    service.clearMessages();

      sessionStorage.setItem('stolperstimme_chat_state', JSON.stringify({

        messages: [testMessage],    expect(service.currentMessages.length).toBe(0);  it('should initialize with empty state', () => {  });

        isLoading: false

      }));  });



      // Create new service instance    expect(service.currentState).toEqual({

      const newService = TestBed.inject(ChatService);

        it('should reset state', () => {

      expect(newService.currentState.messages).toHaveLength(1);

      expect(newService.currentState.messages[0].text).toBe('Restored message');    service.addUserMessage('Test');      messages: [],  describe('Chat State Management', () => {

    });

  });    service.resetState();

});
    expect(service.currentState).toEqual({      isLoading: false    it('should initialize with empty state', () => {

      messages: [],

      isLoading: false    });      expect(service.currentState).toEqual({

    });

  });  });        messages: [],

});
        isLoading: false

  it('should add user message correctly', () => {      });

    const messageText = 'Test message';    });

    const messageId = service.addUserMessage(messageText);

    it('should add user message correctly', () => {

    expect(messageId).toBeTruthy();      const messageText = 'Test message';

    expect(service.currentMessages.length).toBe(1);

    expect(service.currentMessages[0].text).toBe(messageText);      const messageId = service.addUserMessage(messageText);

    expect(service.currentMessages[0].role).toBe('user');

  });      expect(messageId).toBeTruthy();

      expect(service.currentMessages.length).toBe(1);

  it('should clear messages', () => {      expect(service.currentMessages[0].text).toBe(messageText);

    service.addUserMessage('Test');      expect(service.currentMessages[0].role).toBe('user');

    service.clearMessages();    });

    expect(service.currentMessages.length).toBe(0);

  });    it('should persist messages in sessionStorage', () => {

      const messageText = 'Test message';

  it('should reset state', () => {

    service.addUserMessage('Test');      service.addUserMessage(messageText);

    service.resetState();

    expect(service.currentState).toEqual({      const saved = sessionStorage.getItem('stolperstimme_chat_state');

      messages: [],      expect(saved).toBeTruthy();

      isLoading: false

    });      const parsed = JSON.parse(saved!);

  });      expect(parsed.identity).toEqual(newIdentity);

});    });
  });

  describe('Message Management', () => {
    it('should start with empty messages', () => {
      expect(service.currentMessages).toEqual([]);
    });

    it('should add user message correctly', () => {
      const messageId = service.addUserMessage('Test question');

      expect(service.currentMessages).toHaveSize(1);
      expect(service.currentMessages[0]).toEqual(jasmine.objectContaining({
        id: messageId,
        role: 'user',
        text: 'Test question'
      }));
    });

    it('should trim whitespace from user messages', () => {
      service.addUserMessage('   Test question   ');

      expect(service.currentMessages[0].text).toBe('Test question');
    });

    it('should set loading state when adding user message', () => {
      let loadingState: boolean = false;

      service.state$.subscribe(state => {
        loadingState = state.isLoading;
      });

      service.addUserMessage('Test question');

      expect(loadingState).toBe(true);
    });

    it('should generate unique message IDs', () => {
      const id1 = service.addUserMessage('Message 1');
      const id2 = service.addUserMessage('Message 2');

      expect(id1).not.toBe(id2);
      expect(service.currentMessages).toHaveSize(2);
    });

    it('should clear all messages', () => {
      service.addUserMessage('Test message');
      expect(service.currentMessages).toHaveSize(1);

      service.clearMessages();

      expect(service.currentMessages).toEqual([]);
    });

    it('should reset complete state', () => {
      service.updateIdentity({ name: 'Test', year: 2000 });
      service.addUserMessage('Test message');

      service.resetState();

      expect(service.currentIdentity).toEqual({ name: '', year: null });
      expect(service.currentMessages).toEqual([]);
    });
  });

  describe('Session Persistence', () => {
    it('should save state to sessionStorage', () => {
      service.updateIdentity({ name: 'Test User', year: 1945 });
      service.addUserMessage('Test message');

      const saved = sessionStorage.getItem('stolperstimme_chat_state');
      expect(saved).toBeTruthy();

      const parsed = JSON.parse(saved!);
      expect(parsed.identity.name).toBe('Test User');
      expect(parsed.messages).toHaveSize(1);
    });

    it('should load state from sessionStorage on initialization', () => {
      // Prepare saved state
      const savedState = {
        identity: { name: 'Saved User', year: 1950 },
        messages: [{
          id: 'test-id',
          role: 'user',
          text: 'Saved message',
          timestamp: new Date().toISOString()
        }]
      };

      sessionStorage.setItem('stolperstimme_chat_state', JSON.stringify(savedState));

      // Create new service instance
      const newService = new ChatService();

      expect(newService.currentIdentity).toEqual({ name: 'Saved User', year: 1950 });
      expect(newService.currentMessages).toHaveSize(1);
      expect(newService.currentMessages[0].text).toBe('Saved message');
    });

    it('should handle corrupted sessionStorage gracefully', () => {
      sessionStorage.setItem('stolperstimme_chat_state', 'invalid-json');

      expect(() => new ChatService()).not.toThrow();

      const newService = new ChatService();
      expect(newService.currentIdentity).toEqual({ name: '', year: null });
      expect(newService.currentMessages).toEqual([]);
    });
  });

  describe('Observables', () => {
    it('should emit state changes via observables', (done) => {
      let emittedState: any;

      service.state$.subscribe(state => {
        emittedState = state;
      });

      service.updateIdentity({ name: 'Observable Test' });

      setTimeout(() => {
        expect(emittedState.identity.name).toBe('Observable Test');
        done();
      }, 0);
    });

    it('should emit identity changes', (done) => {
      service.identity$.subscribe(identity => {
        if (identity.name === 'Test Observer') {
          done();
        }
      });

      service.updateIdentity({ name: 'Test Observer' });
    });
  });
});
