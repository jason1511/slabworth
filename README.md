# SlabWorth — AI Pokémon Card Identifier & Grade Estimator

SlabWorth is a web-based tool that helps users identify Pokémon cards from uploaded photos, estimate visible card condition, and research where to buy or sell the card online.

The app is designed as a portfolio project that combines AI image analysis, public trading card APIs, condition scoring logic, and marketplace research links into one practical workflow.

> This tool provides an AI-assisted estimate only. It is not an official PSA, CGC, or Beckett grade.

---

## Live Demo

Add your deployed Cloudflare Pages link here:

```text
https://your-slabworth-site.pages.dev
```

---

## Project Overview

Trading card collectors often need to answer a few questions quickly:

* What exact card do I have?
* Is this card in good condition?
* Is it worth grading?
* Where can I research the raw or graded value?
* What if the AI gets the card wrong?

SlabWorth addresses those questions by allowing users to upload a front image and optional back image of a Pokémon card. The app then uses AI vision to extract visible card details, searches multiple public card databases, estimates card condition, and generates marketplace research links.

---

## Key Features

### Card Photo Upload

Users can upload:

* Front card image
* Optional back card image

The app previews the uploaded images before analysis.

---

### AI Card Identification

The backend sends the uploaded image to an OpenAI vision-capable model to extract visible card details, including:

* Card name
* Card number
* Set hint
* Language
* Visible condition issues
* Identification confidence

---

### Multi-Source Card Database Search

SlabWorth uses multiple public Pokémon card data sources to reduce misidentification:

* Pokémon TCG API
* TCGdex English
* TCGdex Japanese

The backend combines results, removes duplicates, scores possible matches, and only auto-confirms strong database matches.

---

### Safer Match Confirmation Logic

Instead of blindly accepting the first database result, the app classifies matches as:

* Strong match
* Medium match
* Weak match

If no strong match is found, the app keeps the AI-detected card visible and asks the user to confirm manually.

This reduces the chance of showing the wrong card as a confirmed match.

---

### Possible Matches UI

If multiple possible card matches are found, the user can choose the correct one manually.

Each match can show:

* Card image
* Card name
* Set name
* Card number
* Rarity
* Match score
* Match strength
* Data source

---

### Manual Database Search

If the AI or automatic database matching is wrong, the user can manually search by:

* Card name
* Card number
* Both card name and number

This makes the app more reliable for:

* Japanese cards
* Older cards
* Blurry photos
* Cards with hard-to-read set numbers
* Cards not found by the first database query

---

### Condition Grade Estimate

SlabWorth estimates visible condition on a 1–10 scale.

Example:

```text
Condition Grade: 7 / 10
Label: Lightly Played
Confidence: Medium
```

The grading labels include:

* Gem Mint Candidate
* Mint Candidate
* Near Mint Candidate
* Lightly Played
* Moderately Played
* Heavily Played
* Damaged
* Unable to Estimate

---

### Condition Breakdown

The app gives a structured breakdown of visible condition areas:

* Centering
* Corners
* Edges
* Surface
* Back condition

Example:

```text
Centering: 7 / 10
Corners: 8 / 10
Edges: 7 / 10
Surface: 8 / 10
Back: N/A
```

The overall score is intended to be conservative and based on the weakest visible areas, not just a simple average.

---

### Photo Quality Check

The app also evaluates whether the uploaded image is good enough for reliable analysis.

Photo quality ratings include:

* Good
* Acceptable
* Poor
* Unable to Judge

The app can identify issues such as:

* Blur
* Glare
* Missing back image
* Cropped card edges
* Low resolution
* Bad lighting
* Sleeve reflection
* Tilted photo

It also provides recommendations for taking a better photo.

---

### Worth Grading Recommendation

SlabWorth provides a basic decision-support recommendation:

* Likely Worth Checking
* Maybe Worth Checking
* Maybe
* Probably Not
* Not Recommended
* Check Manually
* Unable to Decide

The recommendation considers:

* Estimated condition grade
* Rarity
* Whether the card was confidently matched to a database result

This is not a financial guarantee. It is meant to guide further research.

---

### Marketplace Research Links

The app generates market research links such as:

* eBay Raw
* eBay PSA 8
* eBay PSA 9
* eBay PSA 10
* TCGplayer, if available from the database
* Cardmarket, if available from the database

This helps users research both raw and graded versions of the card.

---

## Tech Stack

### Frontend

* React
* Vite
* JavaScript
* CSS

### Backend

* Cloudflare Pages Functions
* OpenAI API
* Pokémon TCG API
* TCGdex API

### Deployment

* Cloudflare Pages

---

## Project Structure

```text
slabworth/
├─ public/
├─ src/
│  ├─ App.jsx
│  ├─ App.css
│  ├─ index.css
│  └─ main.jsx
├─ functions/
│  ├─ api/
│  │  ├─ identify.js
│  │  └─ search-card.js
│  └─ utils/
│     └─ card-search.js
├─ index.html
├─ package.json
├─ vite.config.js
├─ wrangler.toml
└─ README.md
```

---

## How It Works

```text
User uploads card photo
↓
Frontend sends image to Cloudflare Pages Function
↓
OpenAI extracts visible card details
↓
Backend searches Pokémon TCG API and TCGdex
↓
Results are scored and ranked
↓
Strong matches are auto-confirmed
↓
Medium/weak matches require user confirmation
↓
Condition score, photo quality, and worth-grading recommendation are shown
↓
Marketplace research links are generated
```

---

## API Flow

### `/api/identify`

Receives uploaded front and optional back images.

Responsibilities:

* Validate uploaded image files
* Convert images to base64 data URLs
* Send image data to OpenAI
* Parse AI-generated JSON
* Search public card databases
* Score possible matches
* Return final card result

---

### `/api/search-card`

Receives manual card search input.

Responsibilities:

* Accept card name and/or card number
* Search Pokémon TCG API and TCGdex
* Score possible matches
* Return selectable database results

---

## Environment Variables

Create a `.dev.vars` file for local development:

```env
OPENAI_API_KEY=your_openai_api_key_here
```

Do not commit `.dev.vars`.

Recommended `.gitignore` entries:

```gitignore
node_modules
dist
.dev.vars
.env
.env.local
.wrangler
```

For Cloudflare Pages deployment, add the same environment variable in the Cloudflare dashboard:

```text
OPENAI_API_KEY
```

---

## Local Development

Install dependencies:

```bash
npm install
```

Run the Vite frontend only:

```bash
npm run dev
```

Run Cloudflare Pages locally with Functions:

```bash
npm run pages:dev
```

Build the project:

```bash
npm run build
```

Preview the production build locally:

```bash
npm run preview
```

---

## Example `package.json` Scripts

```json
{
  "scripts": {
    "dev": "vite",
    "pages:dev": "vite build && wrangler pages dev dist --compatibility-date=2026-06-05",
    "build": "vite build",
    "lint": "eslint .",
    "preview": "vite preview"
  }
}
```

---

## Deployment

This project is designed for Cloudflare Pages.

Recommended settings:

```text
Framework preset: Vite
Build command: npm run build
Build output directory: dist
Root directory: /
```

Cloudflare Pages Functions are automatically deployed from the `functions` directory.

After adding environment variables, redeploy the project from Cloudflare Pages.

---

## Limitations

SlabWorth is not an official grading service.

The app cannot guarantee:

* Official PSA, CGC, or Beckett grade
* Card authenticity
* Exact market value
* Perfect identification from blurry or partial photos
* Accurate grading if the back image is missing
* Correct match for every Japanese or uncommon card variant

The app should be treated as a research and decision-support tool, not a final authority.

---

## Privacy Notes

Uploaded images are processed through the backend for AI analysis.

Users should avoid uploading sensitive personal images or unrelated photos.

---

## Future Improvements

Planned or possible improvements:

* Upload size validation and cost protection
* Cloudflare Turnstile or rate limiting
* Better TCGdex language coverage
* Copy result summary button
* Shareable result card
* Better pricing estimate
* Sold-listing comparison
* Card authenticity warning system
* Cropping and auto-rotation
* Support for other TCGs such as Yu-Gi-Oh!, Magic: The Gathering, One Piece, and Lorcana

---

## Why I Built This

I built SlabWorth as a portfolio project to demonstrate:

* AI-assisted product development
* Image input handling
* Serverless API architecture
* Public API integration
* Multi-source search and match scoring
* Practical UX for uncertain AI results
* Frontend state management
* Cloudflare deployment workflow

The project focuses on building a realistic tool where AI is helpful but not blindly trusted. Instead of forcing one answer, the app gives confidence levels, possible matches, manual correction, and clear limitations.

---

## Author

Jason Leonard

Bachelor of Information and Communication Technology
Software Technology

---

## Disclaimer

SlabWorth is an independent educational and portfolio project.

It is not affiliated with, endorsed by, or sponsored by The Pokémon Company, PSA, CGC, Beckett, TCGplayer, Cardmarket, eBay, OpenAI, Cloudflare, Pokémon TCG API, or TCGdex.

All trademarks and card images belong to their respective owners.

The condition grade shown by this app is an AI-assisted estimate only and should not be treated as an official card grade.
