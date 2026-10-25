# LetterSaathi

LetterSaathi helps people understand official letters. Upload a photo, scan, or PDF to get a plain-language explanation in English, Telugu, or Hindi, a checklist, deadline warnings, and (when configured) audio.

## Run locally

Requirements: Python 3.11+ and Node.js 20+.

1. In `backend`, create a virtual environment, install requirements, and copy `.env.example` to `.env`:

   ```powershell
   cd backend
   py -3 -m venv .venv
   .\.venv\Scripts\Activate.ps1
   pip install -r requirements.txt
   Copy-Item .env.example .env
   # Add GEMINI_API_KEY to .env to enable document analysis.
   uvicorn app.main:app --reload
   ```

2. In a second terminal:

   ```powershell
   cd frontend
   npm install
   npm run dev
   ```

Open the Vite URL (normally http://localhost:5173). The frontend proxies `/api` to FastAPI at port 8000. `GET /api/health` works without API keys; analysis requires a Gemini API key.

## Environment variables

Set these in `backend/.env` locally and in the DigitalOcean App Platform service settings:

| Variable | Required | Purpose |
|---|---|---|
| `GEMINI_API_KEY` | For analysis | Gemini API key used by `google-genai` |
| `GEMMA_MODEL` | No | Model name; defaults to `gemini-2.0-flash-exp` (the model must be available to your API key) |
| `ELEVENLABS_API_KEY` | Optional | Enables text-to-speech |
| `ELEVENLABS_VOICE_ID` | Optional | ElevenLabs voice ID; audio stays unavailable until configured |
| `ELEVENLABS_MODEL` | No | ElevenLabs model; defaults to `eleven_multilingual_v2` |
| `PORT` | No | Runtime port; defaults to `8080` in the container |

Keep `.env` private; do not commit API keys.

## Deploy to DigitalOcean App Platform

1. Push this repository to GitHub and create an App Platform app from the repo.
2. Select Dockerfile as the source/build method. The root `Dockerfile` builds Vite and serves its output from FastAPI in one web service.
3. Set the service HTTP port to `8080` and add the environment variables above as encrypted app-level or service-level variables. Set `GEMINI_API_KEY`; add ElevenLabs variables only if audio is enabled.
4. Deploy. The health endpoint is `/api/health`; the React app is served at `/`.

## What it does

- Accepts PNG, JPEG, and PDF files up to 10 MB. PDF analysis renders up to its first four pages as images.
- Requests extraction and explanation together from Gemma, parses JSON defensively, and retries once if the response is malformed.
- Validates and fills response defaults, preserves human verification, and warns about missing deadlines, placeholders, and uncertain details.
- Keeps checklist checkboxes in the browser only. ElevenLabs audio is optional and degrades gracefully when not configured.
- Includes a chat interface for asking follow-up questions about the analyzed letter via POST /api/ask.

## Known limitations

- Letter analysis requires network access and a model/API key that can access the configured Gemma model. Model names and availability may vary by account.
- This is an AI explanation, not official advice. Always confirm dates, amounts, and required actions with the issuing office.
- PDF rendering is limited to the first four pages. The uploaded file is not stored by this app, though it is sent to the configured model provider for analysis.
- Audio quality and language support depend on the selected ElevenLabs voice/model.
