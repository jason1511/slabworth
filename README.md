# SlabWorth

AI-assisted Pokémon card identification, condition estimation, and market research in one serverless web application.

[![CI](https://github.com/jason1511/slabworth/actions/workflows/ci.yml/badge.svg)](https://github.com/jason1511/slabworth/actions/workflows/ci.yml)
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)
![Cloudflare](https://img.shields.io/badge/Cloudflare-Pages%20%2B%20D1%20%2B%20R2-F38020?logo=cloudflare&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-ES%20Modules-F7DF1E?logo=javascript&logoColor=black)

SlabWorth turns front and optional back photos of a Pokémon card into a structured identification and visible-condition report. It combines AI image analysis with multiple card databases, explains uncertain matches instead of hiding them, and gives collectors practical links and price indicators for further research.

> SlabWorth is a portfolio and decision-support project. Its condition estimate is not an official PSA, CGC, or Beckett grade, and its market data is not a valuation guarantee.

## Highlights

- Identifies card name, number, set, language, and visible characteristics from uploaded photos.
- Searches Pokémon TCG API plus English and Japanese TCGdex data.
- Scores and ranks possible matches as strong, medium, or weak.
- Lets users manually search and correct uncertain matches.
- Persists analyses and later match corrections in Cloudflare D1.
- Stores uploaded card images in Cloudflare R2 and restores them through history.
- Estimates overall condition and separate centering, corner, edge, surface, and back scores.
- Reports photo-quality problems such as glare, blur, cropping, and missing views.
- Keeps USD and EUR market summaries separate and labels historical indicators honestly.
- Rejects invalid or oversized uploads before AI processing.
- Protects the paid identification endpoint with session and hashed-IP rate limits.
- Runs linting, five automated tests, and a production build in GitHub Actions.

## Why this project matters

The interesting problem is not simply calling an AI model. Card identification is uncertain: artwork can repeat, set numbers can be hard to read, regional variants differ, and a visually plausible answer can still be wrong.

SlabWorth handles that uncertainty as part of the product design:

1. AI extracts visible clues from the photos.
2. Independent card APIs provide candidate records.
3. Match scoring compares names, numbers, sets, and languages.
4. Only strong results are automatically treated as confirmed.
5. The user can inspect alternatives, search manually, and persist a correction.

This creates a more trustworthy workflow than presenting the first AI response as fact.

## Architecture

```text
React + Vite client
       |
       | multipart images / JSON
       v
Cloudflare Pages Functions
  |         |            |
  |         |            +--> D1: analysis history + rate-limit events
  |         +---------------> R2: uploaded card images
  +-------------------------> OpenAI + Pokémon TCG API + TCGdex
```

The browser receives a generated anonymous session ID. History queries and manual corrections are scoped to that session. Raw client IP addresses are never stored; the rate limiter stores SHA-256-derived keys with timestamps.

## Technology

| Layer | Technology |
| --- | --- |
| Frontend | React 19, Vite 8, CSS |
| Serverless API | Cloudflare Pages Functions |
| AI analysis | OpenAI API |
| Card data | Pokémon TCG API, TCGdex |
| Persistence | Cloudflare D1 |
| Image storage | Cloudflare R2 |
| Quality | Node test runner, ESLint, GitHub Actions |

## Main API routes

| Route | Method | Purpose |
| --- | --- | --- |
| `/api/identify` | `POST` | Validate photos, enforce limits, run AI analysis, search card APIs, and save the result |
| `/api/search-card` | `POST` | Search card databases manually by name and/or number |
| `/api/history` | `GET` | List a session's analyses or load one saved analysis |
| `/api/history` | `PATCH` | Persist a manually selected card match |
| `/api/image/:key` | `GET` | Return a stored R2 image used by saved history |

## Repository structure

```text
slabworth/
├── .github/workflows/ci.yml
├── functions/
│   ├── api/                 # Pages Function endpoints
│   └── utils/               # search, persistence, storage, cleanup, rate limiting
├── migrations/              # D1 schema migrations
├── public/
├── src/
│   ├── components/          # upload, results, market, matches, and history UI
│   ├── styles/
│   └── utils/
├── test/                    # Node-based unit tests
├── wrangler.toml
└── package.json
```

## Run locally

### Requirements

- Node.js 24
- npm
- A Cloudflare account for full D1/R2 integration
- An OpenAI API key for identification

Install dependencies:

```bash
npm install
```

Create `.dev.vars` in the repository root:

```env
OPENAI_API_KEY=your_openai_api_key
```

Never commit `.dev.vars` or API keys.

Apply the D1 migrations to the local database:

```bash
npx wrangler d1 migrations apply slabworth-history --local
```

Run the frontend alone for UI work:

```bash
npm run dev
```

Run the production build with local Pages Functions:

```bash
npm run pages:dev
```

The full identification flow needs the D1 and R2 bindings declared in `wrangler.toml`. Use separate development resources rather than production data when changing persistence behaviour.

## Test and build

```bash
npm test
npm run lint -- --max-warnings=0
npm run build
```

The current tests cover:

- currency-safe market summaries and invalid market-data filtering;
- saving and updating analysis history;
- session isolation when a correction is persisted;
- burst and daily identification limits; and
- hashing rate-limit identities instead of storing raw IP addresses.

GitHub Actions repeats all three checks on every push to `main` and every pull request.

## Deploy to Cloudflare Pages

Use these build settings:

```text
Build command: npm run build
Build output directory: dist
Root directory: /
```

Before deploying:

1. Create the D1 database and R2 bucket named in `wrangler.toml`, or update the bindings to your own resources.
2. Apply the D1 migrations remotely:

   ```bash
   npx wrangler d1 migrations apply slabworth-history --remote
   ```

3. Add `OPENAI_API_KEY` as an encrypted Cloudflare environment variable.
4. Deploy the `main` branch through Cloudflare Pages.

## Safety and limits

- Accepted formats: JPEG, PNG, WebP, and GIF.
- Maximum size: 10 MB per image and 20 MB combined.
- Identification limit: 5 requests per 10 minutes and 20 per 24 hours.
- Limits apply to both the anonymous browser session and a hashed client-IP key.
- Invalid uploads are rejected before R2 storage or OpenAI processing.
- History cleanup removes older saved analyses and their associated images.

## Known limitations

- A photograph cannot reliably prove authenticity or reveal every physical defect.
- Sleeve glare, blur, cropping, lighting, and a missing back photo reduce grading confidence.
- Market APIs may provide current prices or historical indicators, but not a complete sold-listing history.
- Uncommon, promotional, Japanese, or newly released variants may still need manual confirmation.
- The current database integrations focus on Pokémon cards.

## Roadmap

- Add one more trading card game through a reusable multi-TCG provider layer.
- Add Cloudflare Turnstile for stronger automated-abuse protection.
- Improve image cropping, rotation, and capture guidance.
- Expand tests around card-match scoring and API validation.
- Add shareable, privacy-conscious result summaries.

## Author

Jason Leonard<br>
Bachelor of Information and Communication Technology — Software Technology

## Disclaimer

SlabWorth is an independent educational and portfolio project. It is not affiliated with or endorsed by The Pokémon Company, PSA, CGC, Beckett, TCGplayer, Cardmarket, eBay, OpenAI, Cloudflare, Pokémon TCG API, or TCGdex. All trademarks and card images belong to their respective owners.
