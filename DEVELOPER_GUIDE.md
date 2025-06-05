# Developer Guide - Agnostic AI Agent Layer

## Introduction

This guide is intended for developers working on the Agnostic AI Agent Layer project. It provides practical guidance on development practices, tool usage, and project-specific conventions. Please read this guide thoroughly before starting development.

## Getting Started

### Prerequisites

- Node.js v20.x LTS
- pnpm (latest version)
- Docker and Docker Compose
- Git
- n8n knowledge (helpful but not required)
- Understanding of LLMs and AI agents

### Environment Setup

1. **Clone the repository**

```bash
git clone https://github.com/organization/agnostic-ai-agent.git
cd agnostic-ai-agent
```

2. **Install dependencies**

```bash
pnpm install
```

3. **Set up environment variables**

```bash
cp .env.example .env
# Edit .env with your configuration
```

4. **Start development server**

```bash
pnpm run dev
```

5. **Start n8n for local development**

```bash
docker-compose up -d n8n
```

### Directory Structure

Our monorepo is organized as follows:

- `packages/api`: Backend REST API
- `packages/frontend`: Next.js frontend application 
- `packages/orchestrator`: AI agent orchestration service
- `packages/privacy-layer`: Privacy and anonymization service
- `packages/n8n-integration`: n8n connector module
- `packages/admin-dashboard`: Admin interface and monitoring
- `packages/common`: Shared utilities and functions
- `packages/schemas`: Shared TypeScript interfaces and types

Each package contains:

- `src/`: Source code
- `tests/`: Unit and integration tests
- `package.json`: Package manifest
- `tsconfig.json`: TypeScript configuration
- `README.md`: Package-specific documentation

### Database Management

We use Prisma ORM for database management. Here are common commands:

```bash
# Generate Prisma client
pnpm run prisma:generate

# Apply migrations
pnpm run prisma:migrate

# Create a new migration
pnpm run prisma:migrate:create

# Reset database (development only)
pnpm run prisma:reset
```

## Development Workflow

### Feature Development Process

1. **Select a task** from the project board
2. **Create a feature branch** from `develop`:

   ```bash
   git checkout -b feature/your-feature-name
   ```

3. **Implement the feature** with appropriate tests
4. **Run linting and tests**:

   ```bash
   pnpm run lint
   pnpm run test
   ```

5. **Commit using Conventional Commits format**:

   ```bash
   git commit -m "feat: add user authentication"
   ```

6. **Push and create a pull request** to the `develop` branch
7. **Address code review comments**
8. **Merge** after approval

### Branch Naming Convention

- Feature branches: `feature/feature-name`
- Bug fixes: `fix/issue-description`
- Release branches: `release/v1.2.3`
- Hotfixes: `hotfix/issue-description`

### Commit Message Convention

We follow the [Conventional Commits](https://www.conventionalcommits.org/) format:

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

Common types:
- `feat`: A new feature
- `fix`: A bug fix
- `docs`: Documentation changes
- `style`: Formatting changes
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

### Pull Request Process

1. **Create a PR** from your feature branch to `develop`
2. **Fill out the PR template** completely
3. **Link any related issues**
4. **Request reviews** from appropriate team members
5. **Address all comments** before merging
6. **Ensure CI passes** all checks
7. **Squash and merge** for a clean history

## Coding Standards

### TypeScript Best Practices

- Use TypeScript's strict mode
- Define explicit return types for functions
- Use interfaces for object shapes
- Avoid using `any` type
- Use generics for reusable components
- Document public APIs with JSDoc comments

Example:

```typescript
/**
 * Creates a new user in the system
 * @param userData User information to create account
 * @returns The newly created user or null if creation failed
 */
async function createUser(userData: UserCreateInput): Promise<User | null> {
  try {
    const user = await prisma.user.create({
      data: userData,
    });
    return user;
  } catch (error) {
    logger.error('Failed to create user', { error, userData });
    return null;
  }
}
```

### React Best Practices

- Use functional components with hooks
- Keep components small and focused
- Utilize React Query for data fetching
- Implement proper error boundaries
- Maintain accessibility standards
- Use TypeScript for props and state

Example:

```tsx
interface UserProfileProps {
  userId: string;
  onUpdate?: (user: User) => void;
}

export const UserProfile: React.FC<UserProfileProps> = ({ userId, onUpdate }) => {
  const { data: user, isLoading, error } = useQuery(['user', userId], () => fetchUser(userId));

  if (isLoading) return <LoadingSpinner />;
  if (error || !user) return <ErrorDisplay error={error as Error} />;

  return (
    <div className="user-profile">
      <h1>{user.name}</h1>
      <UserDetails user={user} onUpdate={onUpdate} />
    </div>
  );
};
```

### API Design Principles

- Use RESTful or GraphQL conventions consistently
- Include version in API paths (e.g., `/api/v1/users`)
- Return appropriate HTTP status codes
- Validate input with schemas (Joi or Zod)
- Use descriptive error messages
- Implement proper pagination
- Follow security best practices

## Testing Strategies

### Unit Testing

- Test individual functions and components
- Mock external dependencies
- Focus on business logic
- Use Jest for JavaScript/TypeScript testing

Example:

```typescript
describe('User Service', () => {
  describe('createUser', () => {
    it('should create a new user with valid data', async () => {
      const mockUserData = { name: 'Test User', email: 'test@example.com' };
      const mockCreatedUser = { id: '1', ...mockUserData };
      
      prisma.user.create = jest.fn().mockResolvedValue(mockCreatedUser);
      
      const result = await createUser(mockUserData);
      
      expect(prisma.user.create).toHaveBeenCalledWith({ data: mockUserData });
      expect(result).toEqual(mockCreatedUser);
    });
  });
});
```

### Integration Testing

- Test API endpoints end-to-end
- Use Supertest with an isolated test database
- Verify database interactions
- Test authorization and permissions

Example:

```typescript
describe('User API', () => {
  describe('POST /api/v1/users', () => {
    it('should create a user when authenticated as admin', async () => {
      const userData = { name: 'New User', email: 'new@example.com' };
      
      const response = await request(app)
        .post('/api/v1/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(userData);
      
      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body.name).toBe(userData.name);
    });
  });
});
```

### E2E Testing

- Test complete user flows
- Use Cypress for browser testing
- Focus on critical user journeys
- Test in an environment close to production

Example:

```typescript
describe('User Registration Flow', () => {
  it('allows a new user to register and login', () => {
    cy.visit('/register');
    cy.get('input[name="email"]').type('test@example.com');
    cy.get('input[name="password"]').type('SecurePass123!');
    cy.get('button[type="submit"]').click();
    
    cy.url().should('include', '/dashboard');
    cy.contains('Welcome, test@example.com');
  });
});
```

## AI Integration

### Working with LLMs

- Use OpenRouter for model switching
- Implement caching for common requests
- Set up appropriate rate limiting
- Store conversation history in vector database
- Implement privacy measures for user data

Example:

```typescript
async function generateResponse(prompt: string, history: ConversationTurn[], options: ModelOptions): Promise<string> {
  try {
    // Select appropriate model based on complexity, cost, etc.
    const modelProvider = selectModelProvider(options);
    
    // Check cache first
    const cachedResponse = await responseCache.get(prompt, history);
    if (cachedResponse) return cachedResponse;
    
    // Apply privacy filters
    const sanitizedPrompt = privacyLayer.sanitize(prompt);
    const sanitizedHistory = privacyLayer.sanitizeHistory(history);
    
    // Generate response
    const response = await modelProvider.generate(sanitizedPrompt, sanitizedHistory, options);
    
    // Cache result
    await responseCache.set(prompt, history, response);
    
    return response;
  } catch (error) {
    logger.error('Failed to generate response', { error });
    throw new ModelGenerationError('Failed to generate response', error as Error);
  }
}
```

### Model Context Protocol Integration

- Use MCP for tool registration and discovery
- Implement standardized tooling interfaces
- Support asynchronous tool execution
- Handle tool permissions and authentication

Example:

```typescript
const weatherTool = {
  name: 'weather',
  description: 'Get weather information for a location',
  parameters: {
    type: 'object',
    properties: {
      location: {
        type: 'string',
        description: 'City name or coordinates'
      }
    },
    required: ['location']
  },
  execute: async ({ location }) => {
    const weather = await weatherService.getWeather(location);
    return weather;
  }
};

mcpRegistry.registerTool(weatherTool);
```

## n8n Integration

### Connecting to n8n API

- Use n8n REST API for workflow management
- Implement proper authentication
- Handle workflow execution and monitoring
- Map AI intents to workflow triggers

Example:

```typescript
async function executeWorkflow(workflowId: string, input: Record<string, any>): Promise<WorkflowExecutionResult> {
  try {
    const n8nClient = await getN8nClient();
    
    const result = await n8nClient.workflows.execute(workflowId, {
      data: input,
    });
    
    return {
      success: true,
      executionId: result.id,
      data: result.data
    };
  } catch (error) {
    logger.error('Workflow execution failed', { workflowId, error });
    return {
      success: false,
      error: error.message
    };
  }
}
```

### Creating Dynamic Workflows

- Generate n8n workflow JSON programmatically
- Validate workflow structure before saving
- Test workflow execution
- Handle credentials securely

Example:

```typescript
async function createEmailWorkflow(options: EmailWorkflowOptions): Promise<string> {
  const workflowData = {
    name: `${options.name} Email Workflow`,
    nodes: [
      {
        name: 'When triggered via API',
        type: 'n8n-nodes-base.webhook',
        parameters: {
          httpMethod: 'POST',
          path: options.webhookPath,
        },
        // Additional configuration
      },
      {
        name: 'Send Email',
        type: 'n8n-nodes-base.emailSend',
        parameters: {
          from: options.from,
          to: '={{ $json.to }}',
          subject: '={{ $json.subject }}',
          text: '={{ $json.body }}',
        },
        credentials: {
          smtp: options.smtpCredentialName,
        },
      }
    ],
    connections: {
      'When triggered via API': {
        main: [
          [
            {
              node: 'Send Email',
              type: 'main',
              index: 0
            }
          ]
        ]
      }
    }
  };
  
  const n8nClient = await getN8nClient();
  const result = await n8nClient.workflows.create(workflowData);
  
  return result.id;
}
```

## Privacy Implementation

### Data Protection

- Implement data encryption at rest and in transit
- Use secure key management
- Minimize data collection and retention
- Anonymize user data where possible
- Implement proper access controls

### Anonymous Routing

- Set up Tor integration for anonymous traffic
- Implement proxy routing for API requests
- Randomize user agent and request patterns
- Avoid trackable fingerprints

Example:

```typescript
async function makeAnonymousRequest(url: string, options: RequestOptions): Promise<Response> {
  // Choose routing method based on privacy level
  const routingMethod = options.highPrivacy ? 'tor' : 'proxy';
  
  if (routingMethod === 'tor') {
    return torClient.request(url, {
      method: options.method || 'GET',
      headers: {
        ...getRandomizedHeaders(),
        ...options.headers
      },
      body: options.body
    });
  } else {
    return proxyClient.request(url, {
      method: options.method || 'GET',
      proxy: await getNextProxy(),
      headers: {
        ...getRandomizedHeaders(),
        ...options.headers
      },
      body: options.body
    });
  }
}
```

## Debugging & Troubleshooting

### Logging Standards

- Use structured logging (JSON format)
- Include request IDs for traceability
- Log appropriate detail level (INFO, ERROR, DEBUG)
- Avoid logging sensitive information
- Implement log rotation and retention policies

Example:

```typescript
// Good logging
logger.info('User created', { userId: user.id, action: 'user_create' });

// Bad logging - contains sensitive info
logger.info(`Created user ${user.email} with password ${user.password}`);
```

### Debugging Tools

- VS Code debugger configuration
- Chrome DevTools for frontend
- Postman/Insomnia collections for API testing
- Docker logs and container inspection
- Database visualization tools

### Common Issues & Solutions

- **API Authentication Errors**: Check credentials and token expiration
- **Database Connection Issues**: Verify connection strings and permissions
- **Frontend State Issues**: Check React DevTools and component hierarchy
- **n8n Connection Problems**: Verify API URL and credentials
- **AI Model Timeouts**: Implement proper retry logic and fallbacks
- **Docker Container Crashes**: Check logs with `docker logs container_name`

## Deployment

### Local Development

- Use Docker Compose for local services
- Hot reload for development speed
- Local environment for testing

### Staging Environment

- Similar to production with reduced resources
- Integration with CI/CD pipeline
- Automated or manual deployment from `develop` branch

### Production Environment

- Kubernetes deployment
- Zero-downtime updates
- Database backups and redundancy
- Monitoring and alerting

## Documentation

### Code Documentation

- Use JSDoc for TypeScript/JavaScript
- Document classes, interfaces, and functions
- Include examples for complex functions
- Document side effects and potential errors

### API Documentation

- Use OpenAPI/Swagger for API endpoints
- Include request/response examples
- Document error codes and messages
- Keep documentation in sync with code

### User Documentation

- Create user guides in Markdown
- Include screenshots and examples
- Document common workflows
- Provide troubleshooting tips

## Resources

### Learning Resources

- [n8n Documentation](https://docs.n8n.io/)
- [LangChain Documentation](https://js.langchain.com/docs/)
- [Model Context Protocol](https://developer.anthropic.com/docs/claude-3-api-reference)
- [Express.js Documentation](https://expressjs.com/)
- [Next.js Documentation](https://nextjs.org/docs)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

### Tools & Utilities

- [Postman](https://www.postman.com/) - API testing
- [VS Code](https://code.visualstudio.com/) - Code editor
- [Docker Desktop](https://www.docker.com/products/docker-desktop) - Container management
- [DBeaver](https://dbeaver.io/) - Database management

---

This guide is a living document and will be updated as the project evolves. If you have suggestions for improvements, please submit a PR with your changes.
