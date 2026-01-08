# 🐦 Twitter Analytics Dashboard

A full-stack data visualization platform for analyzing Twitter network data using Neo4j graph database, featuring interactive network graphs, real-time analytics, and AI-powered natural language queries.

## 🌟 Features

### 📊 **Analytics Dashboard**
- Real-time statistics (38,986+ users, 2,407 tweets, 344 hashtags)
- Interactive data visualizations
- Top users, hashtags, and tweets analysis

### 🕸️ **Network Visualization**
- Interactive force-directed graph powered by Cytoscape.js
- Visual representation of users, tweets, and hashtags relationships
- Dynamic filtering by followers, tweets, and hashtag usage
- Relationship labels (FOLLOWS, POSTS, TAGS)
- Click on nodes to view detailed information

### 💬 **AI-Powered Chat Interface** *(Optional)*
- Natural language queries to database
- OpenAI GPT-5-chat integration for intelligent responses
- Automatically generates and executes Cypher queries
- Conversation history support

### 📈 **Data Exploration**
- User profiles with follower statistics
- Tweet details and engagement metrics
- Hashtag trends and usage patterns

---

## 🏗️ Architecture

### Tech Stack

**Frontend:**
- Next.js 16 (React 18) with TypeScript
- Apollo Client for GraphQL
- Tailwind CSS + shadcn/ui components
- Cytoscape.js for network visualization

**Backend:**
- NestJS with TypeScript
- GraphQL API (Apollo Server)
- Neo4j Graph Database integration
- OpenAI API integration (optional)

**Database:**
- Neo4j 5.15 Community Edition
- APOC plugin for advanced queries
- Pre-loaded Twitter dataset (38,986 users, 2,407 tweets, 344 hashtags)

**Infrastructure:**
- Docker & Docker Compose
- Multi-stage Docker builds
- Automated database initialization
- Health checks and dependency management

**Monitoring:**
- Prometheus metrics (`/metrics` endpoint)
- Grafana dashboards (request rate, latency, GraphQL ops, Neo4j health)
- Node.js runtime metrics (memory, event loop lag)

---

## 🚀 Quick Start

### Prerequisites

- **Docker** & **Docker Compose** (required)
- 4GB+ RAM available for Docker
- Ports 3000, 3001, 7474, 7687 available

### Installation

1. **Clone the repository:**
```bash
git clone https://github.com/Vipul111196/Twitter_KG_Dashboard
cd Twitter_KG_Dashboard
```

2. **Set up environment variables:**
```bash
cp .env.example .env
```

3. **Start all services:**
```bash
docker compose up -d
```

That's it! The system will automatically:
- Pull Docker images (Neo4j, Node.js)
- Build frontend and backend
- Load the Twitter dataset into Neo4j (first startup only)
- Start all services with health checks

### Access the Application

- **Frontend Dashboard:** http://localhost:3000
- **GraphQL Playground:** http://localhost:3001/graphql
- **Neo4j Browser:** http://localhost:7474
- **Grafana Dashboard:** http://localhost:3002 (admin / admin)
- **Prometheus:** http://localhost:9090
- **Backend Metrics:** http://localhost:3001/metrics

**Neo4j Credentials:**
- Username: `neo4j`
- Password: set in your `.env` file

4. **Stop all services:**
```bash
docker compose down
```

---

## ⚙️ Configuration

### Environment Variables

Edit `.env` file to customize configuration:

```bash
# Application Ports
FRONTEND_PORT=3000
BACKEND_PORT=3001

# Neo4j Database Configuration
NEO4J_URI=bolt://neo4j:7687
NEO4J_USERNAME=neo4j
NEO4J_PASSWORD=password
NEO4J_HTTP_PORT=7474
NEO4J_BOLT_PORT=7687
NEO4J_HEAP_SIZE=1G

# Frontend Configuration
FRONTEND_URL=http://localhost:3000
NEXT_PUBLIC_GRAPHQL_URL=http://localhost:3001/graphql

# OpenAI API Key (Optional - for Chat features)
OPENAI_API_KEY=your_openai_api_key_here
```

### Optional: Enable AI Chat

To enable the AI-powered chat interface:

1. Get an API key from [OpenAI Platform](https://platform.openai.com/)
2. Add it to your `.env` file:
```bash
OPENAI_API_KEY=sk-...
```
3. **Recreate the backend container** to load the OpenAI API key variable:
```bash
docker compose up -d backend
```

---

## 📦 Dataset

The application comes pre-loaded with a real Twitter dataset:

- **38,986 users** - Twitter accounts with profile information
- **2,407 tweets** - Tweet content and metadata
- **344 hashtags** - Trending topics
- **56,403+ relationships** - FOLLOWS, POSTS, TAGS connections

**Automatic Loading:**
- Data loads automatically on first startup
- Uses a marker file (`.data-loaded`) to prevent re-loading
- No manual intervention required

**Reset Data:**
```bash
docker compose down -v  # Delete volumes
docker compose up -d    # Restart - will reload data
```

---

## 🛠️ Development

### Project Structure

```
Twitter_KG_Dashboard/
├── frontend/                # Next.js frontend
│   ├── app/                # App router pages
│   ├── components/         # React components
│   ├── lib/               # GraphQL client, types
│   └── __tests__/         # Jest tests
├── backend/                # NestJS backend
│   ├── src/
│   │   ├── modules/       # Feature modules (users, tweets, hashtags, analytics, chat)
│   │   ├── metrics/       # Prometheus metrics (service, controller, interceptor)
│   │   ├── database/      # Neo4j service
│   │   └── main.ts        # App entry point
│   └── test/              # E2E tests
├── monitoring/             # Observability stack
│   ├── prometheus.yml     # Prometheus scrape config
│   └── grafana/           # Grafana provisioning + dashboards
├── infrastructure/
│   └── import/            # Neo4j data and init scripts
├── .github/workflows/     # CI/CD (backend + frontend)
├── docker-compose.yml     # Full stack orchestration
├── Makefile               # Common commands
└── .env.example           # Environment template
```

### Local Development (without Docker)

**Backend:**
```bash
cd backend
npm install
npm run start:dev
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev
```

**Note:** You'll still need Neo4j running (via Docker or locally).

### Run Tests

**Frontend:**
```bash
cd frontend
npm test              # Run tests
npm run test:watch   # Watch mode
```

**Backend:**
```bash
cd backend
npm test              # Unit tests
npm run test:e2e     # E2E tests
```

---

## 🐳 Docker Commands

### Common Operations

```bash
# Start all services
docker compose up -d

# View logs
docker compose logs -f
docker compose logs -f backend  # Specific service

# Stop services
docker compose stop

# Stop and remove containers
docker compose down

# Rebuild after code changes
docker compose up -d --build

# Remove everything including volumes (reset)
docker compose down -v

# Check service health
docker compose ps
```

### Health Checks

All services have health checks:
- **Neo4j:** Cypher-shell connectivity test
- **Backend:** HTTP endpoint check
- **Frontend:** HTTP endpoint check

```bash
docker compose ps  # Shows health status
```

---

## 📡 Monitoring

The stack includes Prometheus + Grafana for production-grade observability.

### Metrics Exposed

The backend exposes a `/metrics` endpoint with:

| Metric | Type | Description |
|--------|------|-------------|
| `http_requests_total` | Counter | Total HTTP requests by method, route, status |
| `http_request_duration_seconds` | Histogram | Request latency (p50, p95, p99) |
| `graphql_queries_total` | Counter | GraphQL operations by field name |
| `neo4j_up` | Gauge | Neo4j connection health (1=up, 0=down) |
| `process_resident_memory_bytes` | Gauge | Node.js memory usage |
| `nodejs_eventloop_lag_seconds` | Gauge | Event loop lag |

### Grafana Dashboard

Pre-configured dashboard at http://localhost:3002 includes:
- Request rate and error rate panels
- p50/p95 latency charts
- GraphQL operation breakdown
- Neo4j connection status
- Process memory and event loop lag

### Quick Commands

```bash
make up          # Start all services including monitoring
make monitoring  # Print monitoring URLs
```

---

## 🔧 Troubleshooting

### Port Already in Use

If ports are occupied:

```bash
# Check what's using the port
lsof -i :3000  # or :3001, :7474, :7687

# Either stop the conflicting service or change ports in .env
FRONTEND_PORT=3100  # Use different port
```

### Neo4j Not Starting

```bash
# Check logs
docker compose logs neo4j

# Common fixes:
# 1. Ensure 4GB+ RAM for Docker
# 2. Delete volumes and restart:
docker compose down -v
docker compose up -d
```

### Backend Can't Connect to Neo4j

```bash
# Verify Neo4j is healthy
docker compose ps

# Restart with fresh network
docker compose down
docker compose up -d
```

### Data Not Loading

```bash
# Verify dump file exists
ls -lh infrastructure/import/neo4j.dump

# Check if data loaded
docker compose exec neo4j ls -la /data/.data-loaded

# If missing, remove marker and restart:
docker compose down
docker volume rm dashboard_project_twitter-neo4j-data
docker compose up -d
```

---

## 🧪 Testing

### Frontend Tests
- **Framework:** Jest + React Testing Library
- **Coverage:** Components, hooks, pages
- **Run:** `npm test` in `frontend/`

### Backend Tests
- **Framework:** Jest + Supertest
- **Coverage:** Services, resolvers, E2E
- **Run:** `npm test` in `backend/`

### CI/CD
- GitHub Actions workflows for automated testing
- Separate workflows for frontend and backend
- Docker build verification after tests pass
- Runs on push and pull requests to `main` and `develop`

---

## 🔒 Security Notes

- `.env` files are gitignored - never commit secrets
- Neo4j credentials should be changed in production
- OpenAI API keys are optional and kept private
- CORS configured for localhost (update for production)

-

**One-Command Setup:** `docker compose up -d` - Everything just works! 🚀

