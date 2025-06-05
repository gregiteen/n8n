# Workstream 2: n8n Integration & Workflow Engine

## Team Overview

### Team Lead: Senior Backend Developer with n8n Expertise
**Required Skills:**
- Expert in n8n workflow engine and API
- Strong Node.js/TypeScript development experience
- Experience with API design and implementation
- Understanding of workflow automation systems
- Database design and optimization skills
- Experience with containerization and microservices

### Team Members:
- 2x Backend Developers
- 1x DevOps Engineer

## Scope of Work

This workstream focuses on creating a seamless integration between the AI orchestrator and n8n workflow engine. The team will build the n8n API client, workflow discovery system, dynamic workflow generation, and the execution engine that turns AI intentions into concrete automated actions.

### Core Deliverables

1. **n8n Integration Layer**
   - REST API client for n8n
   - Node discovery and mapping system
   - Workflow execution engine
   - Workflow templates and generation
   - Error handling and recovery
   - Credential management

2. **Workflow Management System**
   - Dynamic workflow assembly
   - Workflow template repository
   - Workflow versioning and history
   - Workflow execution monitoring
   - Workflow scheduling and triggers

3. **Sensor & Actuator Framework**
   - Input sensor abstraction (data sources)
   - Output actuator abstraction (actions)
   - Tool registry for available capabilities
   - Sensor/actuator discovery system
   - Data transformation pipeline

4. **Database & Storage**
   - SQLite implementation (Phase 1)
   - PostgreSQL migration (Phase 2)
   - Database schema and migrations
   - Data access layer and ORM
   - Caching strategy

## Technical Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   AI Engine     │    │   n8n Integration│    │   n8n Engine    │
│   (External)    │◄──►│   (Core Focus)   │◄──►│   (External)    │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                               │
                     ┌─────────┴─────────┐
                     ▼                   ▼
          ┌──────────────────┐  ┌─────────────────┐
          │  Workflow Engine │  │   Database      │
          │                  │  │   Layer         │
          └──────────────────┘  └─────────────────┘
                 │
        ┌────────┼────────┐
        ▼        ▼        ▼
┌──────────┐ ┌────────┐ ┌────────────┐
│ Sensors  │ │Actuators│ │ Templates  │
└──────────┘ └────────┘ └────────────┘
```

## Implementation Plan

### Phase 1: MVP (Months 1-4)

| Week | Focus Area | Tasks |
|------|------------|-------|
| 1-2 | Architecture & Setup | Define architecture, setup project structure, establish API contracts |
| 3-4 | n8n API Client | Create REST client for n8n, implement authentication, basic CRUD operations |
| 5-6 | Workflow Execution | Implement workflow execution engine, handle parameters, return results |
| 7-8 | Node Discovery | Create node discovery system, map capabilities, build tool registry |
| 9-10 | Database Layer | Implement SQLite schema, data access layer, basic ORM mappings |
| 11-12 | Error Handling | Comprehensive error handling, retry mechanism, execution monitoring |
| 13-16 | Testing & Refinement | Unit/integration tests, performance optimization, documentation |

### Phase 2: Beta (Months 5-9)

| Month | Focus Area | Key Deliverables |
|-------|------------|-----------------|
| 5 | Dynamic Workflows | Workflow generation from templates, parameter mapping |
| 6 | Database Migration | PostgreSQL migration, schema optimization, connection pooling |
| 7 | Credential Management | Secure credential storage, credential rotation, access control |
| 8 | Workflow Triggers | Event-based triggers, scheduling, conditional execution |
| 9 | Performance Optimization | Caching strategies, parallel execution, resource optimization |

### Phase 3: Production (Months 10-15)

| Month | Focus Area | Key Deliverables |
|-------|------------|-----------------|
| 10-11 | Scaling | Horizontal scaling, load balancing, high availability |
| 12-13 | Enterprise Features | Workflow audit logs, advanced permissions, compliance features |
| 14-15 | Integration Ecosystem | Expanded node support, webhook management, external triggers |

## Technical Details

### Core Components

#### n8n API Client
```typescript
interface N8nConfig {
  baseUrl: string;
  apiKey: string;
  timeout?: number;
}

class N8nClient {
  private config: N8nConfig;
  private axios: AxiosInstance;
  
  constructor(config: N8nConfig) {
    this.config = config;
    this.axios = axios.create({
      baseURL: config.baseUrl,
      timeout: config.timeout || 30000,
      headers: {
        'X-N8N-API-KEY': config.apiKey,
        'Content-Type': 'application/json'
      }
    });
  }
  
  async getWorkflows(): Promise<Workflow[]> {
    const response = await this.axios.get('/workflows');
    return response.data.data;
  }
  
  async getWorkflow(id: string): Promise<Workflow> {
    const response = await this.axios.get(`/workflows/${id}`);
    return response.data;
  }
  
  async createWorkflow(workflow: WorkflowCreateParams): Promise<Workflow> {
    const response = await this.axios.post('/workflows', workflow);
    return response.data;
  }
  
  async executeWorkflow(id: string, data?: Record<string, any>): Promise<WorkflowExecution> {
    const response = await this.axios.post(`/workflows/${id}/execute`, { data });
    return response.data;
  }
  
  async getNodeTypes(): Promise<NodeType[]> {
    const response = await this.axios.get('/node-types');
    return response.data.data;
  }
  
  // Additional methods for credentials, executions, etc.
}
```

#### Workflow Execution Engine
```typescript
interface WorkflowExecutionParams {
  workflowId: string;
  input?: Record<string, any>;
  options?: {
    timeout?: number;
    waitForCompletion?: boolean;
  };
}

class WorkflowExecutionEngine {
  private n8nClient: N8nClient;
  private db: Database;
  private logger: Logger;
  
  constructor(n8nClient: N8nClient, db: Database, logger: Logger) {
    this.n8nClient = n8nClient;
    this.db = db;
    this.logger = logger;
  }
  
  async executeWorkflow(params: WorkflowExecutionParams): Promise<ExecutionResult> {
    try {
      // Log execution attempt
      const executionRecord = await this.db.executionLogs.create({
        workflowId: params.workflowId,
        status: 'STARTED',
        input: params.input,
        startedAt: new Date()
      });
      
      // Execute workflow
      const execution = await this.n8nClient.executeWorkflow(
        params.workflowId, 
        params.input
      );
      
      // Wait for completion if requested
      let finalExecution = execution;
      if (params.options?.waitForCompletion) {
        finalExecution = await this.waitForCompletion(
          execution.id, 
          params.options.timeout || 60000
        );
      }
      
      // Update execution record
      await this.db.executionLogs.update(executionRecord.id, {
        status: finalExecution.status,
        output: finalExecution.data,
        finishedAt: new Date(),
        executionId: finalExecution.id
      });
      
      return {
        success: finalExecution.status === 'success',
        data: finalExecution.data,
        executionId: finalExecution.id
      };
    } catch (error) {
      this.logger.error('Workflow execution failed', {
        workflowId: params.workflowId,
        error: error.message
      });
      
      // Update execution record with error
      if (executionRecord) {
        await this.db.executionLogs.update(executionRecord.id, {
          status: 'ERROR',
          error: error.message,
          finishedAt: new Date()
        });
      }
      
      throw new WorkflowExecutionError(
        `Failed to execute workflow: ${error.message}`, 
        error
      );
    }
  }
  
  private async waitForCompletion(executionId: string, timeout: number): Promise<WorkflowExecution> {
    const startTime = Date.now();
    let execution: WorkflowExecution;
    
    do {
      execution = await this.n8nClient.getExecution(executionId);
      
      if (execution.finished) {
        return execution;
      }
      
      // Wait before checking again
      await new Promise(resolve => setTimeout(resolve, 500));
    } while (Date.now() - startTime < timeout);
    
    throw new Error(`Execution timed out after ${timeout}ms`);
  }
}
```

#### Node Discovery System
```typescript
interface NodeType {
  name: string;
  displayName: string;
  description: string;
  version: number;
  group: string[];
  inputs: NodeTypeInput[];
  outputs: NodeTypeOutput[];
  properties: NodeTypeProperty[];
}

class NodeDiscoveryService {
  private n8nClient: N8nClient;
  private nodeCache: Map<string, NodeType> = new Map();
  private lastCacheUpdate: number = 0;
  private cacheTTL: number = 3600000; // 1 hour
  
  constructor(n8nClient: N8nClient) {
    this.n8nClient = n8nClient;
  }
  
  async getAllNodeTypes(): Promise<NodeType[]> {
    await this.refreshCacheIfNeeded();
    return Array.from(this.nodeCache.values());
  }
  
  async getNodeType(name: string): Promise<NodeType | null> {
    await this.refreshCacheIfNeeded();
    return this.nodeCache.get(name) || null;
  }
  
  async searchNodeTypes(query: string): Promise<NodeType[]> {
    await this.refreshCacheIfNeeded();
    
    const normalizedQuery = query.toLowerCase();
    
    return Array.from(this.nodeCache.values()).filter(node =>
      node.name.toLowerCase().includes(normalizedQuery) ||
      node.displayName.toLowerCase().includes(normalizedQuery) ||
      node.description.toLowerCase().includes(normalizedQuery) ||
      node.group.some(g => g.toLowerCase().includes(normalizedQuery))
    );
  }
  
  async findNodesByCapability(capability: string): Promise<NodeType[]> {
    await this.refreshCacheIfNeeded();
    
    // This is a simplified implementation
    // A more advanced version would use semantic matching
    return Array.from(this.nodeCache.values()).filter(node =>
      node.description.toLowerCase().includes(capability.toLowerCase())
    );
  }
  
  private async refreshCacheIfNeeded(): Promise<void> {
    const now = Date.now();
    
    if (now - this.lastCacheUpdate > this.cacheTTL || this.nodeCache.size === 0) {
      const nodeTypes = await this.n8nClient.getNodeTypes();
      
      // Update cache
      this.nodeCache.clear();
      nodeTypes.forEach(nodeType => {
        this.nodeCache.set(nodeType.name, nodeType);
      });
      
      this.lastCacheUpdate = now;
    }
  }
}
```

#### Workflow Template System
```typescript
interface WorkflowTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  template: WorkflowData;
  parameters: TemplateParameter[];
  version: string;
}

interface TemplateParameter {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
  description: string;
  required: boolean;
  default?: any;
}

class WorkflowTemplateService {
  private db: Database;
  private n8nClient: N8nClient;
  
  constructor(db: Database, n8nClient: N8nClient) {
    this.db = db;
    this.n8nClient = n8nClient;
  }
  
  async getTemplates(): Promise<WorkflowTemplate[]> {
    return this.db.workflowTemplates.findMany();
  }
  
  async getTemplate(id: string): Promise<WorkflowTemplate | null> {
    return this.db.workflowTemplates.findOne({ id });
  }
  
  async createFromWorkflow(
    workflowId: string,
    templateData: Omit<WorkflowTemplate, 'id' | 'template'>
  ): Promise<WorkflowTemplate> {
    // Get original workflow
    const workflow = await this.n8nClient.getWorkflow(workflowId);
    
    // Create template
    const template: WorkflowTemplate = {
      id: generateId(),
      template: workflow.data,
      ...templateData,
      version: '1.0.0'
    };
    
    return this.db.workflowTemplates.create(template);
  }
  
  async generateWorkflow(
    templateId: string,
    parameters: Record<string, any>
  ): Promise<WorkflowData> {
    const template = await this.getTemplate(templateId);
    if (!template) {
      throw new Error(`Template not found: ${templateId}`);
    }
    
    // Validate parameters
    this.validateParameters(template.parameters, parameters);
    
    // Clone template
    const workflowData = deepClone(template.template);
    
    // Replace parameters in workflow
    this.applyParameters(workflowData, parameters);
    
    return workflowData;
  }
  
  private validateParameters(
    templateParams: TemplateParameter[],
    providedParams: Record<string, any>
  ): void {
    // Check required parameters
    const missingParams = templateParams
      .filter(p => p.required && providedParams[p.name] === undefined)
      .map(p => p.name);
      
    if (missingParams.length > 0) {
      throw new Error(`Missing required parameters: ${missingParams.join(', ')}`);
    }
    
    // Type validation could be added here
  }
  
  private applyParameters(
    workflow: WorkflowData,
    parameters: Record<string, any>
  ): void {
    // This is a simplified implementation
    // A real implementation would recursively traverse the workflow
    // and replace parameter placeholders
    
    // For example, replacing {{params.email}} with parameters.email
    const workflowStr = JSON.stringify(workflow);
    const paramKeys = Object.keys(parameters);
    
    let replacedStr = workflowStr;
    paramKeys.forEach(key => {
      const value = parameters[key];
      const placeholder = `{{params.${key}}}`;
      replacedStr = replacedStr.replace(
        new RegExp(escapeRegExp(placeholder), 'g'),
        JSON.stringify(value).slice(1, -1) // Remove quotes for string values
      );
    });
    
    Object.assign(workflow, JSON.parse(replacedStr));
  }
}
```

## Integration Points

### AI Orchestrator Integration
- Expose tool registry for AI agent
- Accept natural language goals for execution
- Map AI intents to n8n workflows
- Provide execution status updates

### Privacy Layer Integration
- Secure credential storage
- Anonymized execution of workflows
- Filtering sensitive data in logs
- Privacy-preserving audit trail

### Admin Dashboard Integration
- Workflow execution monitoring
- Performance metrics collection
- Usage statistics
- Error reporting

## Key Technical Challenges

1. **n8n Version Compatibility**: Maintaining compatibility with n8n API changes
2. **Workflow Generation**: Reliably generating valid workflow definitions
3. **Error Handling**: Graceful recovery from workflow execution failures
4. **Credential Security**: Secure handling of API keys and credentials
5. **Performance**: Optimizing workflow execution for speed and reliability

## Success Metrics

- **API Reliability**: >99.9% uptime for n8n integration
- **Workflow Coverage**: Support for 90%+ of common n8n nodes
- **Execution Success**: >95% successful workflow executions
- **Performance**: Average workflow execution time <5s
- **Scalability**: Handle 50+ concurrent workflow executions

## Required Tools & Resources

- **Development**: Node.js, TypeScript, Visual Studio Code
- **Testing**: Jest, Supertest
- **Database**: SQLite (MVP), PostgreSQL (Production)
- **Tools**: Postman for API testing
- **Documentation**: OpenAPI/Swagger
- **Deployment**: Docker, Docker Compose

## Timeline and Milestones

| Milestone | Target Date | Deliverables |
|-----------|-------------|-------------|
| M1: Basic Client | Month 1 | n8n API client with basic operations |
| M2: Execution Engine | Month 2 | Workflow execution engine |
| M3: Node Discovery | Month 3 | Complete node discovery system |
| M4: MVP Integration | Month 4 | Full integration with AI orchestrator |
| M5: Template System | Month 6 | Dynamic workflow generation from templates |
| M6: Advanced Features | Month 9 | Full workflow management system |

## Documentation Requirements

1. **API Documentation**: Complete OpenAPI specs for all endpoints
2. **Architecture Guide**: System design and component interaction
3. **Node Mapping**: Documentation of n8n node capabilities
4. **Workflow Templates**: Guide for creating and using templates
5. **Integration Guide**: How to integrate with the workflow engine
6. **Operations Guide**: Deployment and maintenance instructions

## Dependencies

- Workstream 1: For AI orchestrator integration
- Workstream 3: For privacy and security features
- Workstream 4: For admin monitoring capabilities

## Risks and Mitigations

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| n8n API changes | High | Medium | Version compatibility layer, automated tests |
| Workflow execution failures | High | Medium | Robust error handling, retry mechanisms |
| Performance bottlenecks | Medium | Medium | Caching, optimized queries, load testing |
| Credential security breach | Critical | Low | Vault integration, encryption, access control |
| Database scaling issues | Medium | Low | Connection pooling, query optimization |

## Team Communication

- Daily standup (15 min)
- Weekly technical deep dive (1 hour)
- Bi-weekly cross-team sync with other workstreams
- Documentation updates every sprint
- Shared Slack channel for real-time collaboration
