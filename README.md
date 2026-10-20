# Sachkunde-Quiz (Hundesachkundenachweis NRW)

Offline-fähige Lern-App für die 197 offiziellen Fragen des Sachkundenachweises Hund in NRW.
Vue 3 + TypeScript + Vite, kein Backend. Projektplan: [.claude/PLAN.md](.claude/PLAN.md).

## Entwicklung

Paketmanager ist **pnpm**.

```sh
pnpm install
pnpm dev          # Dev-Server
pnpm test         # Unit-Tests (Vitest)
pnpm build        # Type-Check + Produktionsbuild
pnpm lint         # oxlint + ESLint
pnpm format       # Prettier
pnpm generate-pwa-assets  # PWA-Icons aus public/icon.svg erzeugen
```

## Daten

- `sachkunde-quiz-data/` – Rohdaten und Extraktionsskript (Quelle, nicht Teil der App)
- `src/data/questions.json` + `src/data/images/` – Kopie für die App. Nicht von Hand editieren.

## Bedienung per Tastatur

- Leertaste oder Enter: fokussierte Antwort an-/abwählen
- A–D bzw. 1–4: Antwort mit diesem Buchstaben an-/abwählen
- Enter (außerhalb von Bedienelementen): Prüfen bzw. Weiter
