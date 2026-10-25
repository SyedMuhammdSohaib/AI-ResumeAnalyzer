# AI Resume Analyzer

An AI-powered web app that analyzes a resume and gives clear, useful feedback: strengths, weaknesses, missing skills, and suggestions for improvement.

Built as a beginner-friendly MVP using **LangChain**, **FastAPI**, **Groq** and **Next.js**.

## Features

- Upload your resume (PDF or Word .docx) and get an instant AI analysis
- ATS score, section-wise scores, strengths, weaknesses and suggestions
- Job match percentage and missing keywords (when you paste a job description)
- Feedback in **English, Roman Urdu, Urdu or Hindi**
- **Auto-improve**: AI finds the weakest lines in your resume and shows a before/after rewrite for each
- **Download improved CV**: AI rewrites your whole resume and gives you an editable Word (.docx) file or a PDF
- **Bullet rewriter**: paste a weak resume line and get 3 stronger versions
- **Cover letter generator**: a tailored cover letter from your resume + job description
- Clean, modern web interface
- Fast responses powered by Groq's free cloud LLM API

## Tech Stack

| Layer     | Technology                     |
|-----------|--------------------------------|
| Frontend  | Next.js, React                 |
| Backend   | Python, FastAPI                |
| AI        | LangChain + Groq API           |

## Project Structure

```
resume-analyzer/
├── backend/     # FastAPI server + LangChain logic
├── frontend/    # Next.js user interface
└── README.md
```

## Getting Started

### Prerequisites

- Python 3.10+
- Node.js 18+
- A free API key from [Groq](https://console.groq.com)

### 1. Clone the repository

```bash
git clone https://github.com/SyedMuhammdSohaib/AI-ResumeAnalyzer.git
cd AI-ResumeAnalyzer
```

### 2. Set up the backend

```bash
cd backend
python -m venv venv
# Windows
venv\Scripts\activate
# Mac/Linux
source venv/bin/activate

pip install -r requirements.txt
cp .env.example .env
```

Edit `backend/.env` to fill in your keys.

If the model gives a 404 for your key, set `GROQ_MODEL` to `openai/gpt-oss-120b` or `llama-3.3-70b-versatile`.

Start the server:

```bash
uvicorn app.main:app --reload
```

The API runs at `http://localhost:8000`.

### 3. Set up the frontend

Open a new terminal:

```bash
cd frontend
npm install
cp .env.example .env.local  # or set NEXT_PUBLIC_API_URL in your shell
npm run dev
```

The app runs at `http://localhost:3000`.

**Windows shortcut:** double-click `start-resume-analyzer.bat` in the project root. It starts both servers and opens the browser.

### 4. Quick API check (optional)

With the backend running:

```bash
cd backend
pip install httpx
python test_analyze.py
```

## How It Works

1. The user uploads a resume from the Next.js frontend.
2. The FastAPI backend extracts the text from the file.
3. LangChain sends the text to a Groq-hosted LLM with a carefully written prompt.
4. The analysis is returned to the frontend and displayed to the user.

### API endpoints

| Method | Path            | What it does                                                      |
|--------|-----------------|-------------------------------------------------------------------|
| GET    | `/health`       | Health check                                                      |
| POST   | `/analyze`      | Form: `file` (PDF or DOCX), optional `job_description`, `language` |
| POST   | `/rewrite`      | JSON: `{ "text": "...", "job_description": "..." }` → 3 rewrites  |
| POST   | `/improve`      | Form: `file` (PDF or DOCX), optional `job_description` → weak lines + fixes |
| POST   | `/improved-cv`  | Form: `file` (PDF or DOCX), optional `job_description`, `rewrites`, `format` (`docx` or `pdf`) → file |
| POST   | `/cover-letter` | Form: `file` (PDF or DOCX), `job_description` → cover letter text |

## Deployment

### Backend (Vercel, free, no card needed)

The backend includes `backend/api/index.py` and `backend/vercel.json`, so it can run on Vercel as a Python serverless function.

1. In [Vercel](https://vercel.com), click **Add New → Project** and import this repository.
2. Set **Root Directory** to `backend` and **Framework Preset** to **Other**.
3. Add environment variables: `GROQ_API_KEY`, `GROQ_MODEL` and `ALLOWED_ORIGINS` (see the table below).
4. Deploy, then open `https://<your-backend>.vercel.app/health`. It should return `{"status":"ok"}`.

### Backend (Render, alternative)

1. Create a new [Render](https://render.com) Web Service and connect this repository.
2. Use the following settings:
   - **Runtime:** Python 3.12 (or compatible)
   - **Build Command:** `pip install -r backend/requirements.txt`
   - **Start Command:** `uvicorn app.main:app --host 0.0.0.0 --port $PORT` (Render sets `$PORT`; the included `backend/Dockerfile` also works if you prefer a Docker deploy)
3. Add the following environment variables under **Environment**:
   
   | Variable | Description | Example |
   | --- | --- | --- |
   | `GROQ_API_KEY` | Your Groq API key | `gsk_...` |
   | `GROQ_MODEL` | LLM model to use | `openai/gpt-oss-120b` (or `llama-3.3-70b-versatile`) |
   | `ALLOWED_ORIGINS` | Comma-separated list of allowed frontend origins (CORS) | `https://your-app.vercel.app,http://localhost:3000` |

4. Deploy the service. Your backend URL will be something like `https://your-backend.onrender.com`.

### Frontend (Vercel)

1. Import this repository into [Vercel](https://vercel.com).
2. Set the project root to `frontend` in Vercel project settings.
3. Add the following environment variable:
   
   | Variable | Description | Example |
   | --- | --- | --- |
   | `NEXT_PUBLIC_API_URL` | Base URL of your deployed backend (no trailing slash) | `https://your-backend.onrender.com` |

4. Deploy. The frontend will call `${NEXT_PUBLIC_API_URL}/analyze`.
5. Update `ALLOWED_ORIGINS` on your Render backend to include your new Vercel URL.

**Notes:**
- Keep secrets out of version control. The repo already ignores `.env` and related files. See `backend/.env.example` and `frontend/.env.example`.
- CORS is read from `ALLOWED_ORIGINS` (comma-separated). By default it allows `http://localhost:3000` for local development.
- The frontend reads the backend URL from `process.env.NEXT_PUBLIC_API_URL` (falls back to `http://127.0.0.1:8000` for local development).

## Future Improvements

- Interview question generator
- Download the analysis as a PDF report
- User accounts and saved analysis history

## Author

**Syed Muhammad Sohaib**
GitHub: [@SyedMuhammdSohaib](https://github.com/SyedMuhammdSohaib)

## License

This project is open source and available for learning purposes.
