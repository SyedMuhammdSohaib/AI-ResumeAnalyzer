# AI Resume Analyzer

An AI-powered web app that analyzes a resume and gives clear, useful feedback: strengths, weaknesses, missing skills, and suggestions for improvement.

Built as a beginner-friendly MVP using **LangChain**, **FastAPI**, **Groq** and **Next.js**.

## Features

- Upload your resume (PDF) and get an instant AI analysis
- Highlights strengths and weak areas in your resume
- Suggests improvements and missing skills
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

## How It Works

1. The user uploads a resume from the Next.js frontend.
2. The FastAPI backend extracts the text from the file.
3. LangChain sends the text to a Groq-hosted LLM with a carefully written prompt.
4. The analysis is returned to the frontend and displayed to the user.

## Deployment

### Backend (Render)

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

- Match a resume against a specific job description
- Resume score and section-by-section ratings
- Support for more file formats (DOCX)
- User accounts and saved analysis history

## Author

**Syed Muhammad Sohaib**
GitHub: [@SyedMuhammdSohaib](https://github.com/SyedMuhammdSohaib)

## License

This project is open source and available for learning purposes.
