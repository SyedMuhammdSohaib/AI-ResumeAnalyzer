# AI Resume Analyzer

An AI-powered web app that analyzes a resume and gives clear, useful feedback: strengths, weaknesses, missing skills, and suggestions for improvement.

Built as a beginner-friendly MVP using **LangChain**, **FastAPI**, **Groq** and **Next.js**.

## Features

- Upload your resume (PDF) and get an instant AI analysis
- ATS score, section-wise scores, strengths, weaknesses and suggestions
- Job match percentage and missing keywords (when you paste a job description)
- Feedback in **English, Roman Urdu, Urdu or Hindi**
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
venv\Scripts\activate        # On Mac/Linux: source venv/bin/activate
pip install -r requirements.txt
```

Create a `.env` file inside the `backend` folder:

```
GROQ_API_KEY=your_groq_api_key_here
GROQ_MODEL=llama-3.3-70b-versatile
```

(You can copy `backend/.env.example`. If the model gives a 404 for your key, try `openai/gpt-oss-120b`.)

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
| POST   | `/analyze`      | Form: `file` (PDF), optional `job_description`, `language`        |
| POST   | `/rewrite`      | JSON: `{ "text": "...", "job_description": "..." }` → 3 rewrites  |
| POST   | `/cover-letter` | Form: `file` (PDF), `job_description` → cover letter text         |

## Screenshots

_Add screenshots of the app here._

<!-- Example: ![Home page](screenshots/home.png) -->

## Future Improvements

- Interview question generator
- Download the analysis as a PDF report
- Support for more file formats (DOCX)
- User accounts and saved analysis history

## Author

**Syed Muhammad Sohaib**
GitHub: [@SyedMuhammdSohaib](https://github.com/SyedMuhammdSohaib)

## License

This project is open source and available for learning purposes.
