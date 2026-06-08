# Trip Planner Assistant

A small chatbot web app that talks to Anthropic's Claude API to help plan trips.

- **Backend:** Node + Express (`server/`), proxies chat requests to the Anthropic SDK.
- **Frontend:** Vite + React in plain JavaScript/JSX (`client/`).
- No database (conversation state lives in the browser for now).

## Project structure

```
.
├── server/        # Express API
│   ├── index.js
│   ├── package.json
│   └── .env.example
└── client/        # Vite + React frontend
    ├── index.html
    ├── vite.config.js
    ├── package.json
    └── src/
        ├── main.jsx
        ├── App.jsx
        └── index.css
```

## Setup

### 1. Backend

```powershell
cd server
npm install
Copy-Item .env.example .env
```

Open `server/.env` and set your `ANTHROPIC_API_KEY`.

Start the API:

```powershell
npm run dev
```

The server runs on `http://localhost:3001`.

### 2. Frontend

In a second terminal:

```powershell
cd client
npm install
npm run dev
```

The app runs on `http://localhost:5173` and proxies `/api` calls to the backend.

## How it works

- The React app keeps the conversation in component state and POSTs the full
  message history to `POST /api/chat`.
- Express forwards the messages to Claude with a trip-planning system prompt and
  returns the assistant's reply.
- Assistant replies are rendered as markdown.
