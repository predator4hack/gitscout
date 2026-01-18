# GitScout

A GitHub candidate discovery tool that helps recruiters find qualified developers based on job descriptions and technical requirements.

## Features

- Search for GitHub candidates using natural language job descriptions
- Multiple LLM provider support (Gemini, Groq, Ollama, Mock)
- GitHub GraphQL API integration for comprehensive user data
- Intelligent scoring algorithm based on repository quality, contributions, and activity
- Clean, responsive UI with detailed candidate profiles

## Tech Stack

### Backend
- **Python 3.13+**
- **FastAPI** - Modern web framework
- **httpx** - Async HTTP client
- **Pydantic** - Data validation

### Frontend
- **React 18** with TypeScript
- **Vite** - Fast build tool

## Setup Instructions

### Backend Setup

1. **Install Python dependencies**:
   ```bash
   uv sync
   ```

2. **Configure environment**:
   ```bash
   cd backend
   cp .env.example .env
   # Edit .env with your GitHub token and API keys
   ```

3. **Start the backend**:
   ```bash
   cd backend
   uvicorn app.main:app --reload --port 8000
   ```

### Frontend Setup

1. **Install dependencies**:
   ```bash
   cd frontend
   npm install
   ```

2. **Start the dev server**:
   ```bash
   npm run dev
   ```

3. **Access the app**: http://localhost:5173

## Usage

1. Enter a job description
2. Select an LLM provider (use "mock" for testing without API keys)
3. Click "Search Candidates"
4. View ranked results with match scores

## License

MIT
