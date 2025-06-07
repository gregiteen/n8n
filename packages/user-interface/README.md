# User Interface (Task Manager)

The primary task management interface for the AI Platform, providing end users with real-time visibility and control over AI agent tasks, workflows, and system operations.

## 🎯 Overview

This is a modern Next.js React application that serves as the main user interface for the AI Platform. It provides a comprehensive task manager dashboard where users can:

- Monitor running AI agent tasks in real-time
- Interact with AI agents through chat interfaces
- Manage and execute workflows
- Control task queues and scheduling
- Configure preferences and settings

## 🏗️ Architecture

```
User Interface (Task Manager)
├── Dashboard - Real-time task monitoring and management
├── Chat Interface - Direct AI agent interaction
├── Workflow Manager - Visual workflow creation and monitoring
├── Settings - User preferences and configuration
└── Real-time Updates - WebSocket connection for live data
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- pnpm
- AI Orchestrator running (backend services)

### Installation

```bash
cd packages/user-interface
pnpm install
```

### Development

```bash
# Start development server (port 3002)
pnpm run dev

# Build for production
pnpm run build

# Start production server
pnpm start

# Run tests
pnpm test

# Type checking
pnpm run type-check
```

### Environment Variables

Create a `.env.local` file:

```env
NEXT_PUBLIC_API_URL=http://localhost:5678
NEXT_PUBLIC_WS_URL=ws://localhost:5678
```

## 📱 Features

### 1. Task Dashboard
- **Real-time Task Status**: Live updates on task progress and status
- **Quick Actions**: Pause, resume, cancel, and retry tasks
- **Task Filtering**: Filter by status, type, and priority
- **Progress Tracking**: Visual progress bars with percentage completion
- **Priority Management**: High, normal, low, urgent priority levels

### 2. AI Chat Interface
- **Multi-Agent Chat**: Tabbed interface for multiple AI agents
- **Real-time Messaging**: Streaming message delivery
- **Agent Status**: Live agent availability and capability display
- **File Sharing**: Upload and share files with agents
- **Message History**: Searchable conversation history

### 3. Workflow Manager
- **Visual Workflow Display**: Node-based workflow visualization
- **Execution Monitoring**: Real-time workflow execution tracking
- **Workflow Control**: Start, pause, stop workflow execution
- **Performance Metrics**: Execution count, timing, and success rates
- **Template Library**: Pre-built workflow templates

### 4. Settings & Preferences
- **Theme Control**: Light, dark, and system theme options
- **Notification Settings**: Email, push, and system alert preferences
- **Dashboard Customization**: Refresh intervals and view preferences
- **Security Settings**: Password, 2FA, and API key management

## 🎨 UI Components

### Core Components
- **MainLayout**: Responsive layout with navigation and header
- **TaskDashboard**: Main task management interface
- **ChatInterface**: AI agent chat functionality
- **WorkflowManager**: Workflow visualization and control
- **SettingsPanel**: User preference management

### UI Library
Built with:
- **Radix UI**: Accessible component primitives
- **Tailwind CSS**: Utility-first styling
- **Lucide React**: Modern icon system
- **Framer Motion**: Smooth animations
- **Recharts**: Data visualization

## 🔄 Real-time Features

### WebSocket Integration
- **Task Updates**: Live task status and progress updates
- **Agent Communication**: Real-time chat messaging
- **System Notifications**: Instant alerts and notifications
- **Workflow Events**: Live workflow execution events

### State Management
- **Zustand**: Lightweight state management
- **React Query**: Server state synchronization
- **Local Storage**: Persistent user preferences

## 📊 Task Management

### Task Types
- **Chat Agent**: Conversational AI interactions
- **Data Analyst**: Data processing and analysis
- **Web Scraper**: Intelligent web scraping tasks
- **Code Generator**: Automated code generation
- **Content Writer**: Content creation and editing
- **Image Analyzer**: Image processing and analysis
- **Workflow Orchestrator**: Complex workflow management
- **Decision Maker**: Automated decision support

### Task States
- **Running**: Currently executing with progress tracking
- **Queued**: Waiting for execution with priority ordering
- **Completed**: Successfully finished with results
- **Failed**: Error state with retry options
- **Paused**: Temporarily suspended with resume capability
- **Cancelled**: User-terminated tasks

## 🔧 Development

### Project Structure
```
src/
├── app/                    # Next.js app router pages
├── components/             # React components
│   ├── ui/                # Base UI components
│   ├── layout/            # Layout components
│   ├── task/              # Task management components
│   ├── chat/              # Chat interface components
│   ├── workflow/          # Workflow components
│   └── settings/          # Settings components
├── lib/                   # Utility functions
├── hooks/                 # Custom React hooks
├── store/                 # State management
└── types/                 # TypeScript definitions
```

### Adding New Features
1. Create component in appropriate directory
2. Add types to `src/types/index.ts`
3. Add routing in `src/app/`
4. Update navigation in `MainLayout`
5. Add tests in `__tests__/`

### Testing
```bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run tests with coverage
pnpm test:coverage
```

## 🔌 API Integration

### Backend Services
- **AI Orchestrator**: Core AI agent management
- **n8n Engine**: Workflow execution engine
- **WebSocket Server**: Real-time communication

### API Endpoints
- `GET /api/tasks` - List tasks
- `POST /api/tasks` - Create task
- `PUT /api/tasks/:id` - Update task
- `DELETE /api/tasks/:id` - Delete task
- `GET /api/agents` - List agents
- `GET /api/workflows` - List workflows
- `POST /api/chat` - Send chat message

## 📝 Contributing

1. Follow the existing code style and patterns
2. Add proper TypeScript types for new features
3. Include tests for new functionality
4. Update documentation for new features
5. Use semantic commit messages

## 🚀 Deployment

### Production Build
```bash
pnpm run build
pnpm start
```

### Docker Deployment
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN npm install -g pnpm && pnpm install
COPY . .
RUN pnpm build
EXPOSE 3002
CMD ["pnpm", "start"]
```

## 🔄 Integration Status

- ✅ **Core UI Components**: Complete
- ✅ **Task Dashboard**: Complete
- ✅ **Chat Interface**: Complete  
- ✅ **Workflow Manager**: Complete
- ✅ **Settings Panel**: Complete
- ⏳ **API Integration**: In Progress
- ⏳ **WebSocket Connection**: In Progress
- ⏳ **Authentication**: Pending
- ⏳ **Testing Suite**: Pending

## 📞 Support

For development support and integration questions, refer to:
- [Project Implementation Tracker](../../IMPLEMENTATION_TRACKER.md)
- [Technical Roadmap](../../TECHNICAL_ROADMAP.md)
- [AI Integration Summary](../../AI_INTEGRATION_SUMMARY.md)
