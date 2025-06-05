# Technical Specification for Agnostic AI Agent Layer

## Stack Overview

### Core Technologies

| Component | Technology | Version | Purpose |
|-----------|------------|---------|---------|
| **Backend Runtime** | Node.js | 20.x LTS | Server-side application runtime |
| **Backend Framework** | Express.js | 4.18.x | RESTful API framework |
| **Frontend** | React | 18.x | UI library |
| **Frontend Framework** | Next.js | 14.x | React framework with SSR capabilities |
| **Database** | SQLite (MVP), PostgreSQL (Production) | Latest | Data persistence |
| **Vector Database** | Chroma | Latest | Embeddings storage for AI memory |
| **Authentication** | Passport.js + JWT | Latest | User authentication |
| **AI Integration** | OpenRouter | Latest | Multi-model routing |
| **Automation Engine** | n8n | Latest | Workflow execution engine |
| **Container** | Docker | Latest | Application containerization |
| **Orchestration** | Docker Compose (MVP), Kubernetes (Production) | Latest | Container orchestration |
| **CI/CD** | GitHub Actions | N/A | Continuous integration and deployment |
| **Testing** | Jest, Cypress, Supertest | Latest | Unit, E2E, and API testing |
| **Documentation** | Swagger/OpenAPI, Docusaurus | Latest | API and user documentation |

### Dependency Management

- **Package Manager**: pnpm (for workspace management)
- **Version Control**: Git with GitHub
- **Monorepo Structure**: Using pnpm workspaces

### API Design Principles

- RESTful API design for simplicity
- OpenAPI/Swagger documentation
- JWT-based authentication
- Rate limiting for API endpoints
- Versioning (e.g., `/api/v1/`)

## Standards & Policies

### Coding Standards

#### General Standards

- **Code Formatting**: Prettier with standardized configuration
- **Linting**: ESLint with AirBnB preset and custom security rules
- **Commit Messages**: Conventional Commits format
- **Branch Strategy**: Git Flow (feature/bugfix/release branches)

#### TypeScript Standards

- Strict mode enabled
- Explicit return types for functions
- Interfaces over types when appropriate
- No use of `any` type
- Descriptive naming conventions
- Documented public APIs

#### React Standards

- Functional components with React Hooks
- State management with Context API + React Query for data fetching
- Component organization: Atomic Design principles
- Strict prop validation
- Accessibility (WCAG 2.1 AA compliance)

### Security Policies

- All sensitive data encrypted at rest
- Environment variables for secrets (no hardcoded credentials)
- Input validation on all API endpoints
- Regular dependency audits
- OWASP Top 10 compliance checks
- Regular penetration testing
- HTTPS only (no HTTP)
- Content Security Policy (CSP) implementation
- No logging of sensitive information

### Privacy Policies

- Data minimization principle
- User opt-in for all data collection
- Clear data retention policies
- Option for users to delete their data
- No tracking or analytics without consent
- Transparency in data usage
- Compliance with GDPR, CCPA as applicable

### Testing Policies

- Minimum 80% test coverage for core modules
- Unit tests required for all business logic
- Integration tests for API endpoints
- End-to-end tests for critical user flows
- Performance testing for high-load scenarios
- Security testing integrated into CI/CD pipeline

## Development Procedures

### Setup Process

1. Clone the repository
2. Install pnpm if not already installed
3. Run `pnpm install` to install dependencies
4. Copy `.env.example` to `.env` and configure as needed
5. Run database migrations with `pnpm run migrate`
6. Start the development server with `pnpm run dev`

### Development Workflow

1. Pick a task from the project board
2. Create a feature branch from `develop`
3. Implement the feature with appropriate tests
4. Run lint and format checks
5. Create a PR with detailed description
6. Address code review comments
7. Merge to `develop` after approval

### Code Review Process

- All code changes require pull requests
- At least one approval required before merging
- Automated checks must pass (linting, tests, etc.)
- Code reviewer checklist:
  - Functionality meets requirements
  - Code follows project standards
  - Tests are comprehensive
  - Documentation is updated
  - Security considerations addressed

### Deployment Process

#### Development Environment
- Automatic deployment from `develop` branch
- Environment variables managed in CI/CD pipeline
- Ephemeral test environment for PRs

#### Staging Environment
- Manual promotion from development
- Full integration testing
- Performance testing
- User acceptance testing

#### Production Environment
- Manual promotion from staging
- Blue/green deployment strategy
- Automated rollback on failure
- Deployment window planning

### Release Management

- Semantic versioning (MAJOR.MINOR.PATCH)
- Changelog maintained for each release
- Release notes detailing changes
- Migration guides for breaking changes
- Release branches for maintenance

## Development Stack Details

### Backend Framework & Libraries

| Package | Purpose |
|---------|---------|
| `express` | Web framework |
| `typescript` | Static typing |
| `dotenv` | Environment variable management |
| `passport`, `passport-jwt` | Authentication |
| `winston` | Logging |
| `joi` or `zod` | Schema validation |
| `axios` | HTTP client for API requests |
| `openrouter` | AI model routing |
| `node-cache` or `redis` | Caching layer |
| `sqlite3`, `pg` | Database drivers |
| `prisma` or `typeorm` | ORM |
| `langchain` | LLM framework |
| `chroma-js` | Vector database client |
| `model-context-protocol` | MCP implementation |
| `socket.io` | Real-time communication |
| `jsonwebtoken` | JWT handling |
| `helmet` | Security headers |
| `cors` | CORS handling |
| `compression` | Response compression |
| `tor-request` | Anonymous network requests |
| `bull` | Job queue for background tasks |

### Frontend Libraries & Components

| Package | Purpose |
|---------|---------|
| `react` | UI library |
| `next` | React framework |
| `react-query` | Data fetching and caching |
| `axios` | HTTP client |
| `formik` or `react-hook-form` | Form handling |
| `yup` | Form validation |
| `tailwindcss` | Utility-first CSS |
| `@headlessui/react` | Unstyled accessible components |
| `@heroicons/react` | Icon library |
| `react-markdown` | Markdown rendering |
| `recharts` or `d3` | Data visualization |
| `socket.io-client` | WebSocket client |
| `zustand` | State management |
| `react-i18next` | Internationalization |
| `date-fns` | Date manipulation |
| `uuid` | ID generation |
| `@testing-library/react` | Component testing |

### DevOps & Infrastructure

| Tool/Technology | Purpose |
|-----------------|---------|
| `docker` | Containerization |
| `docker-compose` | Local development orchestration |
| `kubernetes` | Production orchestration (Phase 3) |
| `terraform` | Infrastructure as code (Phase 3) |
| `github-actions` | CI/CD pipeline |
| `jest` | Unit testing |
| `cypress` | E2E testing |
| `supertest` | API testing |
| `lighthouse` | Performance testing |
| `owasp zap` | Security testing |
| `renovate` or `dependabot` | Dependency updates |
| `husky` | Git hooks |
| `vault` | Secret management |

## Project Structure

```
agnostic-ai-agent/
├── packages/                      # Monorepo packages
│   ├── api/                       # Backend API service
│   ├── frontend/                  # React frontend
│   ├── orchestrator/              # AI orchestration service
│   ├── privacy-layer/             # Privacy and anonymization
│   ├── n8n-integration/           # n8n connector
│   ├── admin-dashboard/           # Admin interface
│   ├── common/                    # Shared utilities
│   └── schemas/                   # Shared type definitions
├── infrastructure/                # IaC and deployment
├── docs/                          # Documentation
├── scripts/                       # Development scripts
└── .github/                       # GitHub workflows
```

### Package Structure (Example for API)

```
api/
├── src/
│   ├── config/                    # Configuration
│   ├── controllers/               # Request handlers
│   ├── middlewares/               # Express middlewares
│   ├── models/                    # Data models
│   ├── routes/                    # API routes
│   ├── services/                  # Business logic
│   ├── utils/                     # Utility functions
│   ├── types/                     # TypeScript types
│   ├── app.ts                     # Express app
│   └── index.ts                   # Entry point
├── tests/                         # Tests
├── prisma/                        # Database schema
├── package.json                   # Package manifest
└── tsconfig.json                  # TypeScript config
```

## Developer Tools & Environment

### Required Development Tools

- **Node.js** (v20.x LTS)
- **pnpm** (latest)
- **Docker** and **Docker Compose**
- **Git**
- **Visual Studio Code** (recommended)

### Recommended VS Code Extensions

- ESLint
- Prettier
- Docker
- GitLens
- REST Client
- Prisma
- React Developer Tools
- TypeScript + JavaScript
- Tailwind CSS IntelliSense

### Environment Configuration

Development environments should be configured with the following:

- `.env` file with local development settings
- Local SSL certificates for HTTPS
- Configured Git hooks via Husky
- Docker volumes for persistent data

### Monitoring & Debugging

- Winston/Pino for structured logging
- Sentry for error tracking
- Prometheus metrics for monitoring
- Jaeger for distributed tracing
- VS Code debugging configurations
- Chrome DevTools for frontend debugging

## API Documentation

The API will be documented using OpenAPI/Swagger with the following sections:

- Authentication endpoints
- User management
- AI agent orchestration
- Workflow management
- n8n integration
- System configuration
- Model providers
- Privacy settings

Each endpoint will include:
- Description
- Request parameters
- Response schema
- Error codes
- Example requests/responses
- Authentication requirements

## Performance Expectations

- API response time < 200ms for non-AI operations
- AI operations timeout after 30 seconds
- Frontend load time < 2 seconds
- Support for concurrent users based on hardware
- Caching strategy for repeated operations
- Rate limiting to prevent abuse
- Horizontal scaling capabilities for production

This technical specification provides the foundation for building the Agnostic AI Agent Layer with consistent standards and modern best practices.
