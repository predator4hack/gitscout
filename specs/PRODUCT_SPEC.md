# Gitscout MVP — Build Spec (for Claude Code)

## About

The application is called gitscout, that helps recruiters discover qualified candidates based on their Github account activity, projects, starts etc. given the job description or technical requirements(eg. "Python ML engineer with experience in distributed systems"), the system generates optimized search queries, uses the GitHub GraphQL/REST APIs to find the relevant developers, and ranks them based on repository patterns. The core matching algorithm analyzes public repos, commit frequency, tech stack alignment and project complexity to score candidates.

## Instructions

You are Claude Code acting as a senior full‑stack engineer. Build the MVP exactly as specified here.  
Key rule: **do not invent APIs, fields, or dependencies.** If something is unclear, implement the smallest safe version and leave a `TODO:` with an explicit note.

---

## 0) MVP Goal (What “done” means)

A recruiter can paste **Job Description (JD) text** and click **Search**. The app returns a ranked list of GitHub candidates (public profiles) with:

-   GitHub profile link, avatar, name/login
-   a **score** (0–100)
-   top repositories (summary)
-   short “why matched” explanation derived from fetched repo/user signals

MVP must support choosing the **LLM provider** at runtime:

-   `gemini`
-   `groq`
-   `ollama` (local)
-   `mock` (no external call; deterministic output for dev/test)

MVP uses **GitHub GraphQL** only (no GitHub REST usage).

**Do NOT Use frameworks like langchain, llamaindex etc for implementation. We need to implement from scratch.**

## 1) Tech Stack

-   Backend: Python + FastAPI
-   Frontend: React (Vite) + TypeScript
-   GitHub API: GraphQL v4
-   LLM Providers: Gemini (HTTP), Groq (OpenAI-compatible), Ollama (local HTTP)

---

## 2) Non‑Goals (explicitly out of scope for MVP)

Do NOT implement:

-   Auth/login, multi-user accounts, billing
-   storing recruiter searches in DB (optional later)
-   background job queues (optional later)
-   emailing candidates / outreach automation
-   scraping beyond GitHub API
-   ML model training; keep scoring as deterministic heuristic

---

## 3) High-Level Architecture

**Frontend (React)**

-   Form: JD text + provider selector + (optional) model selector + (optional) GitHub token input (dev-only)
-   Results list

**Backend (FastAPI)**

-   `/api/search` endpoint:
    -   generates GitHub search query from JD via LLM provider (or fallback)
    -   calls GitHub GraphQL `search(type: USER)` + enrichment fields
    -   computes feature set + score + explanation
    -   returns JSON response

**Core modules (backend)**

-   `services/llm/*` — provider interface + implementations
-   `services/github/*` — GraphQL client + query templates
-   `services/matching/*` — JD→query logic, feature extraction, scoring

---

## Query: Search Users + Enrich (single call for MVP)

Implement a single query to:

-   search(query: $query, type: USER, first: $first, after: $after)
-   for each User:
    -   profile basics
    -   contributionsCollection (last year)
    -   top public repos (by stars) with languages/topics

Use this query template (validate fields via schema; if any field fails, remove it and document in README):

```
query SearchUsers($query: String!, $first: Int!, $after: String) {
  search(query: $query, type: USER, first: $first, after: $after) {
    userCount
    pageInfo { hasNextPage endCursor }
    nodes {
      ... on User {
        login
        name
        url
        avatarUrl
        bio
        location
        company
        followers { totalCount }

        contributionsCollection {
          contributionCalendar { totalContributions }
          totalCommitContributions
          totalPullRequestContributions
          totalIssueContributions
          totalPullRequestReviewContributions
        }

        repositories(first: 8, orderBy: { field: STARGAZERS, direction: DESC }) {
          nodes {
            nameWithOwner
            url
            description
            stargazerCount
            forkCount
            isFork
            pushedAt

            primaryLanguage { name }

            languages(first: 5, orderBy: { field: SIZE, direction: DESC }) {
              edges { size node { name } }
            }

            repositoryTopics(first: 8) {
              nodes { topic { name } }
            }
          }
        }
      }
    }
  }
}
```
