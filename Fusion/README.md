# Fusion – AI-Powered Feedback Analysis

A backend API that ingests free-text feedback, stores it, and analyzes it asynchronously using OpenAI (gpt-4o-mini). The system returns sentiment, feature requests, and actionable insights while keeping API response times low.

---

## Architecture

### Modular Structure (NestJS-inspired)

The codebase is organized into feature modules:

```
src/
├── config/                 # Environment, database client
├── common/                 # Shared utilities, middleware, types
│   ├── middleware/         # Error handling middleware
│   ├── types/              # Feedback, FeedbackStatus
│   └── utils/              # Logger, crypto (SHA-256)
├── modules/
│   ├── feedback/           # Feedback feature
│   │   ├── feedback.controller.ts
│   │   ├── feedback.service.ts
│   │   ├── feedback.repository.ts
│   │   ├── feedback.router.ts
│   │   └── feedback.schema.ts
│   └── analysis/           # AI analysis
│       ├── analysis.service.ts   # OpenAI wrapper
│       ├── analysis.worker.ts    # Queue consumer
│       ├── analysis.schema.ts    # Zod validation
│       └── analysis.constants.ts
├── app.ts                  # DI wiring
└── main.ts
```

Controllers handle HTTP; services contain business logic; the repository abstracts DB access. Dependency injection is done manually in `app.ts`.

### Asynchronous Flow

1. **POST /feedback** – Validates input, computes content hash, checks for duplicates, creates a `RECEIVED` record, enqueues the ID, and returns **202 Accepted** immediately.
2. **Background worker** – `AnalysisWorker` consumes the in-memory queue, updates status to `ANALYZING`, calls OpenAI, validates with Zod, then sets `DONE` or `FAILED`.

The API does not wait for LLM completion, keeping response times under ~50ms for new feedback.

### Database

- **Prisma** with **SQLite** (`file:./dev.db`)
- Feedback model: `id`, `content`, `status`, `contentHash`, `rawAiResponse`, `structuredResult`, `analysisError`, `createdAt`, `updatedAt`

---

## Engineering Decisions & Tradeoffs

| Decision | Rationale |
|----------|-----------|
| **In-memory queue (better-queue)** | Chosen for simplicity in a short challenge. In production, Redis + BullMQ (or similar) would be preferred for persistence and scaling. |
| **Zod schema validation** | LLM output is treated as untrusted. `analysisResultSchema` validates structure before persisting. |
| **Repository pattern** | `FeedbackRepository` centralizes DB access, improving testability and keeping service logic decoupled from Prisma. |
| **SHA-256 content deduplication** | Prevents duplicate analysis for identical feedback within the system. |

---

## Future Improvements & Scalability

### Distributed Task Management (Redis/BullMQ)

The current in-memory queue (better-queue) is a deliberate tradeoff for the 3-hour development constraint. In production, migrating to **BullMQ with Redis** would provide:

- **Job persistence** – No data loss on server restarts; jobs survive process crashes.
- **Horizontal scaling** – API servers and workers can scale independently; multiple workers consume from the same queue.

### Event-Driven Architecture (Kafka)

A natural evolution is moving to a **microservices pattern** using Apache Kafka:

- The **Feedback Service** would publish a `FeedbackReceived` event to a Kafka topic.
- A separate **Analysis Microservice** would consume this event, run the AI pipeline, and emit an `AnalysisCompleted` event.
- This design enables high throughput, fault tolerance, and loose coupling between domains.

### Observability & Dead Letter Queues (DLQ)

- **DLQ strategy** – After 3 retries for LLM failures, move the job to a dedicated Dead Letter Queue for manual review and incident investigation.
- **Log aggregation** – Integrate an ELK Stack (Elasticsearch, Logstash, Kibana) or similar for centralized log aggregation and searchable audit trails.

### Database Scalability

- **PostgreSQL** – Migrate from SQLite for production-grade relational integrity, concurrent writes, and ACID guarantees.
- **MongoDB** – Alternatively, use MongoDB for flexible storage of the AI’s varied JSON outputs and schema evolution.

### Security

- **Rate limiting** – Use Redis-backed rate limiting to protect the LLM API from cost spikes and abuse.
- **API key authentication** – Add API key or JWT-based authentication to secure endpoints.

---

## AI Collaboration Log

### AI Tools Used

- **Cursor**

### Example Prompts

- *"Refactor the Express app into a modular structure with separate folders for feedback and analysis."*
- *"Implement a background worker using better-queue to process LLM analysis asynchronously."*
- *"Add an error middleware to the routers and log every error there."*

### Concrete Correction Example

Initially, the AI suggested a synchronous flow where the API waited for the LLM response. This was corrected by introducing a Worker/Queue design so the API returns 202 quickly and response time stays under ~50ms. The Zod validation logic was also adjusted to correctly handle OpenAI’s `response_format: { type: "json_object" }` output, including when the response was not valid JSON.

---

## Setup

```bash
# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env and set OPENAI_API_KEY=sk-...

# Apply schema (SQLite)
npx prisma db push

# For migrations (optional, PostgreSQL/MySQL):
# npx prisma migrate dev
```

## Run

```bash
# Development (watch mode)
npm run dev

# Production
npm run build && npm start
```

Server listens on `http://localhost:3002` by default (configurable via `PORT`).

---

## API

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/feedback` | Submit feedback. Returns 202 (new) or 200 (duplicate). Body: `{ "content": "string" }` |
| GET | `/feedback` | List all feedback with status and analysis results |

---

## License

MIT
