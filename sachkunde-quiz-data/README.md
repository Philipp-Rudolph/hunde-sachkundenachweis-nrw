# Sachkundenachweis Hund NRW – Quiz-Daten

Quelle: Fragenkatalog und Lösungen „neu ab 01.01.2025“ (197 Fragen, 20 Kategorien).

## Struktur
- `questions.json` – alle Fragen, Antworten und Lösungen
- `images/frage-XXX.png` – Bilder der 7 Bildfragen (Kategorie 1), 300 dpi
- `build.py` – Skript, mit dem die Daten aus den PDFs erzeugt wurden (PyMuPDF)

## Schema (questions.json)
```jsonc
{
  "meta": { "title", "validFrom", "language", "questionCount", "note" },
  "categories": [ { "id": 1, "name": "Ausdrucksverhalten Bilder", "questionCount": 7 } ],
  "questions": [
    {
      "id": "q006",            // stabile ID
      "number": 6,             // Nummer im offiziellen Katalog
      "categoryId": 1,
      "question": "Welchen Ausdruck zeigt dieser Hund?",
      "image": { "src": "images/frage-006.png", "width": 774, "height": 432 },  // sonst null
      "options": [ { "id": "A", "text": "...", "correct": false } ],
      "correctAnswers": ["C"],
      "multipleCorrect": false
    }
  ]
}
```
Bildpfade sind relativ zur `questions.json`. Frage 118 hat nur zwei Optionen (A/B).
Wertung: Eine Frage zählt nur als richtig, wenn exakt alle richtigen Optionen gewählt sind.
