# 🤖 Vorwort

Mein persönliches Ziel beim MSHack25 war es, das Frontend komplett nur mit AI-Agents zu generieren und funktionstüchtig zu machen. Dadurch wollte ich ein besseres Gespür dafür bekommen, wie diese interpretiert und verarbeitet werden, wo es Probleme geben kann und wie ich die KI zum richtigen bzw. gewünschten Ergebnis bringe. Dabei habe ich ausschließlich Code-Review und Prompting genutzt.

# 🗣️ Stolperstimme

Eine moderne, mobile-first Angular-Anwendung für interaktive Gespräche über Stolpersteine mit Text- und Audio-Ausgabe.

## 🎯 Projektübersicht

**Stolperstimme** ist eine barrierefreie Chat-Anwendung, die es Nutzern ermöglicht, Fragen zu Stolpersteinen zu stellen und sowohl textuelle als auch audio-basierte Antworten zu erhalten. Die App wurde mit Angular 19 entwickelt und folgt modernen Web-Standards.

### ✨ Hauptfeatures

- 📱 **Mobile-First Design** - Optimiert für Smartphones und Tablets
- 🎤 **Dual-Mode Interface** - Wechsel zwischen Voice- und Chat-Modus
- 🔊 **Audio-Wiedergabe** - Antworten als lokale Audio-Dateien abspielen
- 💬 **Echtzeit-Chat** - Sofortige Anzeige von Fragen und Antworten
- 🎨 **Modernes Design** - Abgerundete UI mit durchdachter Farbpalette
- ♿ **Barrierefreiheit** - ARIA-Labels, Fokusmanagement, Screen Reader Support
- � **GitHub Pages Deployment** - Automatisches Hosting via GitHub Actions

## 🚀 Schnellstart

### Voraussetzungen

- Node.js (Version 20 oder höher)
- Ein moderner Web-Browser

### Installation & Start

```bash
# Repository klonen
git clone https://github.com/stolperstimme/simple-web-app.git
cd simple-web-app

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

# Build für GitHub Pages
npm run build:github-pages
```

## 🌐 Live Demo

Die App ist live verfügbar unter: **https://stolperstimme.github.io/simple-web-app/**

Automatisches Deployment erfolgt bei jedem Push zum `main` Branch über GitHub Actions.

## 📁 Projektstruktur

```
src/
├── app/
│   ├── components/           # UI-Komponenten
│   │   ├── header/          # App-Header mit Navigation
│   │   ├── chat-mode/       # Chat-Interface-Komponente
│   │   ├── voice-mode/      # Voice-Interface-Komponente
│   │   ├── chat-list/       # Nachrichtenverlauf
│   │   └── message-input/   # Text-Eingabe-Komponente
│   ├── services/            # Business Logic Services
│   │   ├── chat.service.ts          # Chat State Management
│   │   ├── speech.service.ts        # Spracherkennung
│   │   └── audio-player.service.ts  # Audio-Wiedergabe
│   └── main/                # Haupt-Layout-Komponente
├── public/
│   ├── assets/
│   │   ├── fonts/           # Custom Fonts (Open Sans)
│   │   ├── img/             # Logo-Dateien
│   │   └── audio/           # Audio-Dateien für Antworten
│   └── 404.html             # GitHub Pages SPA Support
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
- **TypeScript 5.7** - Typsichere Entwicklung
- **RxJS** - Reactive Programming für State Management
- **SCSS** - Advanced CSS mit Variablen und Mixins

### Browser APIs
- **Web Speech API** - Spracherkennung (`SpeechRecognition`)
- **HTMLAudioElement** - Audio-Wiedergabe lokaler Dateien
- **LocalStorage** - Persistierung der App-Modi

### Deployment & CI/CD
- **GitHub Actions** - Automatisches Build und Deployment
- **GitHub Pages** - Kostenloses Hosting für statische Sites
- **Angular CLI** - Build-Optimierung und Bundle Management

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

### Automatisches Deployment
Das Projekt nutzt GitHub Actions für automatisches Deployment:

```yaml
# .github/workflows/deploy.yml
name: Deploy Angular App to GitHub Pages
on:
  push:
    branches: [ main ]
  workflow_dispatch:
```

### Build-Optimierung
```bash
# Production Build mit Optimierungen
npm run build

# Build für GitHub Pages (mit korrekter base-href)
npm run build:github-pages
```

### Wichtige Build-Features
- **Tree Shaking** - Entfernung ungenutzten Codes
- **AOT Compilation** - Ahead-of-Time Template-Kompilierung
- **Bundle Budgets** - Größenkontrolle für Components (15kB limit)
- **GitHub Pages SPA Support** - 404.html für Client-Side Routing

## 🔒 Privacy & Sicherheit

### Datenschutz
- Spracherkennung erfolgt **lokal im Browser** (keine Server-Übertragung)
- Audio-Dateien werden **lokal gespeichert** (keine externen Anfragen)
- Session-Daten bleiben **nur im Browser** (SessionStorage)

### Mikrofon-Zugriff
- Explizite Berechtigung durch Nutzer-Interaktion
- Klare Anzeige des Aufnahme-Status
- Einfache Möglichkeit zum Stoppen/Abbrechen

## 🛠️ Development

### Available Scripts
```bash
npm start              # Development server (http://localhost:4200)
npm run build          # Production build
npm run build:github-pages  # Build for GitHub Pages deployment
npm test              # Run unit tests
npm run watch         # Build with watch mode
```

### Environment Setup
1. Clone the repository
2. Install Node.js 20+
3. Run `npm install`
4. Start development with `npm start`

## 🤝 Contributing

### Development Workflow
1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

### Code Standards
- Angular Style Guide compliance
- TypeScript strict mode
- SCSS for styling
- Responsive design principles

## 📄 Lizenz

Dieses Projekt ist nicht mit der MIT-Lizenz veröffentlicht!

## 🙏 Danksagung

- **Angular Team** - Für das großartige Framework
- **Open Sans** - Für die barrierefreie Schriftart
- **GitHub** - Für das kostenlose Hosting via GitHub Pages

---

**Made with ❤️ for digital remembrance**
