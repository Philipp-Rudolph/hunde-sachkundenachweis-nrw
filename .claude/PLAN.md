# Projektplan: Sachkunde-Quiz (Hundesachkundenachweis NRW)

> Dieses Dokument ist die Arbeitsgrundlage für Claude Code. Arbeite die Phasen der Reihe nach ab. Nach jeder Phase muss die App bauen (`npm run build`), alle Tests müssen grün sein, und du committest. Wenn eine Annahme unklar ist, frag nach, bevor du baust.

## 1. Ziel

Eine schlanke, offline-fähige Lern-App (PWA) für den Sachkundenachweis Hund in NRW. Nutzer üben die 197 offiziellen Fragen nach Kategorie, im Zufallsmodus oder in einer Prüfungssimulation. Der Lernfortschritt wird lokal im Browser gespeichert. Es gibt kein Backend und kein Login.

## 2. Ausgangslage

Die Daten liegen fertig aufbereitet vor (Ordner `sachkunde-quiz-data/` aus dem ZIP):

```
sachkunde-quiz-data/
  questions.json      # 197 Fragen, 20 Kategorien, Lösungen
  images/frage-XXX.png  # 7 Bilder (Kategorie 1, "Ausdrucksverhalten Bilder")
  build.py            # Extraktionsskript aus den PDFs (nicht Teil der App)
  README.md           # Schema-Beschreibung
```

`questions.json` wird **nicht** von Hand editiert. Sie ist die einzige Datenquelle.

### Datenschema (in TypeScript abbilden)

```ts
interface QuizData {
  meta: { title: string; validFrom: string; language: 'de'; questionCount: number; note: string };
  categories: Category[];
  questions: Question[];
}
interface Category { id: number; name: string; questionCount: number }
interface Question {
  id: string;            // "q006" – stabile ID, Schlüssel für Fortschritt
  number: number;        // offizielle Katalognummer
  categoryId: number;
  question: string;
  image: { src: string; width: number; height: number } | null; // src relativ zur JSON
  options: { id: 'A' | 'B' | 'C' | 'D'; text: string; correct: boolean }[];
  correctAnswers: string[];
  multipleCorrect: boolean;
}
```

Fakten über die Daten, die die Logik beachten muss:
- Bei 154 von 197 Fragen sind mehrere Antworten richtig, bei 11 Fragen alle vier.
- Frage 118 hat nur die zwei Optionen A und B.
- Nur die 7 Fragen in Kategorie 1 haben ein Bild.

## 3. Tech-Stack

- **Vue 3** (Composition API, `<script setup>`) mit **TypeScript** (strict) und **Vite**
- **Vue Router** für die Views und **Pinia** für den State
- **Vitest** für Unit-Tests und **@vue/test-utils** für Komponenten
- **vite-plugin-pwa** für den Offline-Betrieb (Phase 5)
- Styling: schlichtes CSS mit Custom Properties (Design-Tokens), kein UI-Framework. Mobile first, Dark Mode über `prefers-color-scheme`
- Persistenz: `localStorage` über eine kleine Storage-Schicht mit Versionierung und try/catch

## 4. Zielstruktur

```
src/
  data/                 # questions.json + images/ (kopiert aus sachkunde-quiz-data)
  types/quiz.ts         # Interfaces aus Abschnitt 2
  lib/
    scoring.ts          # Bewertungslogik (pure functions)
    shuffle.ts          # Fisher-Yates, optional mit Seed
    sessionBuilder.ts   # Fragenauswahl je Modus
    storage.ts          # localStorage-Wrapper, Schema-Version, Migration
  stores/
    quiz.ts             # laufende Session
    progress.ts         # Statistik pro Frage
    settings.ts         # Einstellungen
  views/
    HomeView.vue        # Modusauswahl, Gesamtfortschritt
    CategoriesView.vue  # Kategorien mit Fortschrittsbalken
    QuizView.vue        # Frage, Optionen, Auswertung
    ResultView.vue      # Session-Ergebnis, falsche Fragen
    StatsView.vue       # Statistik, Fortschritt zurücksetzen
  components/
    QuestionCard.vue
    OptionItem.vue
    ProgressBar.vue
    CategoryTile.vue
tests/
```

## 5. Fachliche Regeln

### Bewertung
- Antworten sind immer **Checkboxen** (Mehrfachauswahl), auch wenn nur eine Antwort richtig ist. Der Nutzer soll nicht an der UI ablesen können, wie viele Antworten richtig sind.
- Eine Frage gilt nur dann als **richtig**, wenn die Menge der gewählten Optionen **exakt** der Menge `correctAnswers` entspricht.
- Nach dem Prüfen zeigt die App pro Option an: richtig gewählt, fälschlich gewählt oder richtig, aber nicht gewählt.
- Ohne Auswahl ist das Prüfen nicht möglich (der Button ist deaktiviert).

### Modi
1. **Kategorie üben**: alle Fragen einer Kategorie, in Katalogreihenfolge oder gemischt (Einstellung).
2. **Zufallstraining**: N zufällige Fragen aus allen Kategorien (N ist wählbar: 10, 20, 50).
3. **Fehler wiederholen**: alle Fragen, die zuletzt falsch beantwortet wurden.
4. **Prüfungssimulation**: feste Anzahl zufälliger Fragen, Feedback erst am Ende, optional mit Timer. **Anzahl, Bestehensgrenze und Zeitlimit stehen als Konstanten in `src/config/exam.ts`.** Die offiziellen Werte für NRW sind noch nicht verifiziert. Setze Platzhalter, markiere sie mit `// TODO: verifizieren` und erfinde keine offiziellen Zahlen.

### Optionen mischen
- Eine Einstellung legt fest, ob die Antwortoptionen in zufälliger Reihenfolge erscheinen (Standard: aus). Die Option-IDs (A–D) bleiben dabei intern erhalten. Angezeigt werden die Buchstaben in der jeweils aktuellen Reihenfolge.

### Fortschritt (pro Frage, Schlüssel `question.id`)
```ts
interface QuestionStats { attempts: number; correct: number; lastResult: 'correct' | 'wrong' | null; lastSeen: string }
```
- Eine Frage gilt als „gelernt“, wenn die letzten 2 Versuche richtig waren. Speichere dafür eine kurze Historie, z. B. `history: boolean[]` (maximal 5 Einträge).
- Der Kategorie-Fortschritt ist der Anteil der gelernten Fragen.
- Ein Reset ist für eine einzelne Kategorie und für alles möglich, jeweils mit Bestätigungsdialog.

## 6. Phasen

### Phase 1 – Setup & Datenschicht
- Vite + Vue + TS + Router + Pinia + Vitest aufsetzen und ESLint/Prettier konfigurieren.
- Die Daten nach `src/data/` kopieren und die JSON typisiert importieren. Bilder über `new URL(..., import.meta.url)` oder aus `public/` auflösen; entscheide dich für eine Variante und begründe sie kurz im Commit.
- `scoring.ts`, `shuffle.ts` und `sessionBuilder.ts` als pure Functions umsetzen.
- **Tests:** Datenintegrität (197 Fragen, eindeutige IDs, jede `categoryId` existiert, `correctAnswers` ⊆ Option-IDs, `correct`-Flags passen zu `correctAnswers`, Bildpfade existieren), außerdem die Scoring-Fälle exakt / zu wenig / zu viel / falsch.
- **Fertig, wenn:** `npm test` grün ist und `npm run build` durchläuft.

### Phase 2 – Kern-Quiz
- Die Views `QuizView`, `QuestionCard` und `OptionItem` mit Prüfen → Feedback → Weiter bauen.
- Den Modus „Kategorie üben“ samt `CategoriesView` und `HomeView` umsetzen.
- Bildfragen zeigen das Bild über den Optionen an, mit `width`/`height` aus der JSON (verhindert Layout-Shift), Alt-Text „Zeichnung eines Hundes zur Frage X“ und Zoom per Tap.
- Ergebnisansicht mit Quote und Liste der falsch beantworteten Fragen.
- **Fertig, wenn:** man eine Kategorie komplett durchspielen kann und das Ergebnis stimmt.

### Phase 3 – Fortschritt & weitere Modi
- `progress`-Store mit localStorage-Persistenz (Key `sachkunde-quiz:v1`, Schema-Version im Objekt).
- Die Modi Zufallstraining und Fehler wiederholen umsetzen.
- Fortschrittsbalken auf den Kategorie-Kacheln und `StatsView` mit Reset.
- **Tests:** Store-Logik („gelernt“-Regel, Reset), Storage-Wrapper (korrupter oder fehlender Eintrag lädt die Defaults).

### Phase 4 – Prüfungssimulation
- Konfiguration in `src/config/exam.ts`, ohne Feedback während der Prüfung.
- Navigation zwischen den Fragen, eine Markierung „später ansehen“ und eine Übersicht vor der Abgabe.
- Optionaler Timer. Bei Ablauf wird automatisch abgegeben.
- Ergebnis „bestanden/nicht bestanden“ nach Konfiguration, dazu eine Auswertung pro Kategorie.
- Das Prüfungsergebnis fließt in die Fortschrittsstatistik ein.

### Phase 5 – PWA & Feinschliff
- `vite-plugin-pwa` einbinden: Precache der App, der JSON und der Bilder. Manifest mit Name, Icons und Theme-Color.
- Barrierefreiheit: Tastaturbedienung (Leertaste/Enter für Optionen, Enter zum Prüfen), Fokus-Management beim Fragenwechsel, `aria-live` für das Feedback, ausreichende Kontraste und keine Information, die nur über Farbe vermittelt wird (zusätzlich Icons ✓/✗).
- Leere Zustände, z. B. „Keine Fehler zum Wiederholen“.
- Lighthouse: PWA installierbar, Accessibility ≥ 95.

### Phase 6 (optional)
- Spaced Repetition (vereinfachtes Leitner-System) statt der einfachen „gelernt“-Regel
- Export/Import des Fortschritts als JSON-Datei
- Suchfunktion über Fragetexte
- Deployment (z. B. Azure Static Web Apps) mit GitHub-Action

## 7. Nicht-Ziele
- Kein Backend, keine Accounts, kein Tracking
- Keine Bearbeitung der Fragen in der App
- Keine eigenen Erklärtexte zu den Antworten. Sie würden fachliche Aussagen erfinden; falls gewünscht, kommen sie später als separates, geprüftes Datenfeld.

## 8. Arbeitsweise für Claude Code
- Kleine, thematisch saubere Commits mit konventionellen Commit-Messages (`feat:`, `test:`, `chore:` …).
- Bewertungs- und Auswahllogik bleibt ausschließlich in `src/lib/` und wird zuerst getestet.
- Die UI-Texte sind auf Deutsch, Code und Kommentare auf Englisch.
- Keine zusätzlichen Abhängigkeiten ohne kurze Begründung.
- Am Ende jeder Phase eine kurze Zusammenfassung: was erledigt ist, was offen ist und welche Annahmen getroffen wurden.