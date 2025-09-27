# 🗣️ Stolperstimme

Eine moderne, mobile-first Angular-Anwendung für interaktive Gespräche über Stolpersteine mit Text- und Audio-Ausgabe.

## 🎯 Projektübersicht

**Stolperstimme** ist eine barrierefreie Chat-Anwendung, die es Nutzern ermöglicht, Fragen zu Stolpersteinen zu stellen und sowohl textuelle als auch audio-basierte Antworten zu erhalten. Die App wurde mit Angular 19 entwickelt und folgt modernen Web-Standards.

### ✨ Hauptfeatures

- 📱 **Mobile-First Design** - Optimiert für Smartphones und Tablets
- 🎤 **Spracherkennung** - Fragen per Spracheingabe stellen (Web Speech API)
- 🔊 **Audio-Wiedergabe** - Antworten als lokale Audio-Dateien abspielen
- 💬 **Echtzeit-Chat** - Sofortige Anzeige von Fragen und Antworten
- 🎨 **Modernes Design** - Abgerundete UI mit durchdachter Farbpalette
- ♿ **Barrierefreiheit** - ARIA-Labels, Fokusmanagement, Screen Reader Support
- 💾 **Session-Persistierung** - Eingaben bleiben während der Sitzung erhalten

## 🚀 Schnellstart

### Voraussetzungen

- Node.js (Version 18 oder höher)
- Angular CLI (`npm install -g @angular/cli`)
- Ein moderner Web-Browser mit Web Speech API Support

### Installation & Start

```bash
# Repository klonen
git clone <repository-url>
cd stolperstimme

# Dependencies installieren
npm install

# Development Server starten
npm start
# oder
ng serve

# App öffnen: http://localhost:4200
```

### Build für Produktion

```bash
# Optimierten Build erstellen
npm run build
# oder
ng build --configuration production
```

## 📁 Projektstruktur

```
src/
├── app/
│   ├── components/           # UI-Komponenten
│   │   ├── header/          # App-Header mit Titel
│   │   ├── identity-form/   # Name & Jahrgang Eingabe
│   │   ├── chat-list/       # Nachrichtenverlauf
│   │   └── message-input/   # Text- & Spracheingabe
│   ├── services/            # Business Logic Services
│   │   ├── chat.service.ts          # Chat State Management
│   │   ├── speech.service.ts        # Spracherkennung
│   │   └── audio-player.service.ts  # Audio-Wiedergabe
│   └── main/                # Haupt-Layout-Komponente
├── assets/
│   ├── fonts/               # Custom Fonts (Open Sans)
│   └── audio/               # Audio-Dateien für Antworten
└── styles.scss              # Globale Styles & Design System
```

## 🎨 Design System

### Farbpalette
- **Primary**: `#3B82F6` (Modernes Blau)
- **Secondary**: `#F97316` (Warmes Orange) 
- **Neutrals**: Abgestufte Grau-Töne für Text und Hintergründe

### Komponenten-Architektur
- **Standalone Components** - Modulare, wiederverwendbare Bausteine
- **Reactive Forms** - Validierung und Zustandsmanagement
- **RxJS Observables** - Reaktive Datenflüsse
- **SCSS Variables** - Konsistente Styling-Tokens

## 🔧 Technische Details

### Core Technologies
- **Angular 19** - Framework mit Signals und Control Flow
- **TypeScript** - Typsichere Entwicklung
- **RxJS** - Reactive Programming für State Management
- **SCSS** - Advanced CSS mit Variablen und Mixins

### Browser APIs
- **Web Speech API** - Spracherkennung (`SpeechRecognition`)
- **HTMLAudioElement** - Audio-Wiedergabe lokaler Dateien
- **SessionStorage** - Persistierung der Chat-Session

### Accessibility Features
- **ARIA Labels** - Screen Reader Unterstützung
- **Fokusmanagement** - Keyboard Navigation
- **High Contrast Mode** - Anpassung für Sehbeeinträchtigungen
- **Reduced Motion** - Respektiert Benutzer-Präferenzen

## 🎤 Spracherkennung

Die App nutzt die native Web Speech API des Browsers:

```typescript
// Automatische Browser-Erkennung
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

// Deutsche Sprache, Live-Feedback
recognition.lang = 'de-DE';
recognition.interimResults = true;
```

**Unterstützte Browser:**
- Chrome (Desktop & Mobile)
- Edge (Desktop & Mobile)
- Safari (iOS 14.5+)

## 🔊 Audio-System

Lokale Audio-Dateien werden über einen Service-Layer abgespielt:

```typescript
// Audio-Datei abspielen
await audioPlayerService.playAudio('/assets/audio/response-1.mp3');

// Lautstärke kontrollieren
audioPlayerService.setVolume(0.7);

// Verfügbarkeit prüfen
const isAvailable = await audioPlayerService.isAudioAvailable(audioPath);
```

**Unterstützte Formate:** MP3, OGG, WAV

## 🧪 Testing

### Unit Tests ausführen

```bash
# Einmalige Testausführung
npm test
# oder
ng test --watch=false

# Tests mit Watch-Mode
npm run test:watch
# oder
ng test
```

### Test-Coverage

Die wichtigsten Services sind mit umfassenden Unit Tests abgedeckt:

- `ChatService` - State Management und Session-Persistierung
- `AudioPlayerService` - Audio-Wiedergabe und Lautstärke-Kontrolle  
- `SpeechService` - Spracherkennung und Error Handling

## 📱 Mobile Optimierung

### Responsive Breakpoints
- **Mobile**: < 768px (Single Column Layout)
- **Tablet**: 768px - 1199px (Erweiterte Navigation)  
- **Desktop**: ≥ 1200px (Two Column Layout mit Sidebar)

### Touch-Optimierung
- Mindest-Tap-Größe: 44px (iOS Guidelines)
- Großzügige Abstände zwischen interaktiven Elementen
- Wischgesten für Chat-Navigation

## 🚀 Deployment

### Build-Optimierung
```bash
# Production Build mit Optimierungen
ng build --configuration production

# Build-Analyse (Bundle Size)
npm run build:analyze
```

### Wichtige Build-Features
- **Tree Shaking** - Entfernung ungenutzten Codes
- **AOT Compilation** - Ahead-of-Time Template-Kompilierung
- **Service Worker** - Offline-Funktionalität (optional)
- **Code Splitting** - Lazy Loading für bessere Performance

## 🔒 Privacy & Sicherheit

### Datenschutz
- Spracherkennung erfolgt **lokal im Browser** (keine Server-Übertragung)
- Audio-Dateien werden **lokal gespeichert** (keine externen Anfragen)
- Session-Daten bleiben **nur im Browser** (SessionStorage)

### Mikrofon-Zugriff
- Explizite Berechtigung durch Nutzer-Interaktion
- Klare Anzeige des Aufnahme-Status
- Einfache Möglichkeit zum Stoppen/Abbrechen

## 🤝 Contributing

### Development Workflow
1. Feature Branch erstellen (`git checkout -b feature/amazing-feature`)
2. Änderungen committen (`git commit -m 'Add amazing feature'`)
3. Branch pushen (`git push origin feature/amazing-feature`)
4. Pull Request erstellen

### Code Standards
- **Prettier** für Code-Formatierung
- **ESLint** für Code-Qualität
- **Conventional Commits** für einheitliche Commit-Messages
- **Angular Style Guide** befolgen

## 📄 Lizenz

Dieses Projekt ist unter der MIT-Lizenz veröffentlicht. Siehe `LICENSE` Datei für Details.

## 🙏 Danksagung

- **Angular Team** - Für das großartige Framework
- **Open Sans** - Für die barrierefreie Schriftart
- **Web Speech API** - Für die Browser-native Spracherkennung

---

**Made with ❤️ for digital remembrance**
# simple-web-app
