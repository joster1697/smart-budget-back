# SmartBudget Backend

Personal finance management backend with an AI-powered conversational interface. Users manage their finances by sending natural language messages -- the system interprets the intent, extracts financial data, and executes the action automatically.

## Documentation

Full technical documentation is maintained in Notion:

**[Technical Documentation](https://www.notion.so/Technical-documentation-34fea000ffb48012a82bda705c44eb85)**

Covers architecture, local setup, environment variables, database schema, AI conversational flow, WebSocket protocol, Telegram bot setup, API reference, and deployment.

---

## Quick Start

### Prerequisites

- Node.js 20+, Docker Desktop, Git
- Google Gemini API key -- [get one at Google AI Studio](https://aistudio.google.com/app/apikey)

### 1. Clone and install

```bash
git clone <repository-url>
cd smart-budget-back
npm install
```

### 2. Configure `.env`

```bash
cp .env.example .env
```

Fill in your values — all variables are documented in `.env.example`. Required ones:

| Variable | Notes |
|---|---|
| `DB_PASSWORD` | Choose a secure password (must match `docker-compose.yml`) |
| `JWT_SECRET` / `JWT_REFRESH_SECRET` | Replace the placeholder values with your own secrets |
| `GEMINI_API_KEY` | Get one at [Google AI Studio](https://aistudio.google.com/app/apikey) |
| `TELEGRAM_BOT_TOKEN` | Optional — only needed for the Telegram bot |

### 3. Start with Docker

```bash
docker-compose up --build
```

### 4. Run migrations

```bash
docker exec smartbudget-backend npx sequelize-cli db:migrate
docker exec smartbudget-backend npm run db:seed:categories
```

### 5. Verify

| URL | Expected |
|---|---|
| `http://localhost:3000/health` | `{"status":"healthy","database":"connected"}` |
| `http://localhost:3000/api-docs` | Swagger UI |

---

## Tech Stack

Node.js 20 � TypeScript 5 � Express 5 � MySQL 8 � Sequelize 6 � Google Gemini � WebSocket � Telegraf � JWT � Zod � Docker
