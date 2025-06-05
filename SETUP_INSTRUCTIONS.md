# Project Setup Instructions

## Prerequisites

To set up and run the n8n AI Platform, you'll need API keys from:

1. **Supabase** - For database, authentication, and vector storage
   - Create a Supabase project at https://supabase.com
   - Set up the pgvector extension for vector embeddings

2. **Vercel** - For deployment and serverless functions
   - Create a Vercel account at https://vercel.com
   - Install the Vercel CLI: `npm i -g vercel`

3. **AI Model Providers**
   - **OpenAI** - Get API keys from https://platform.openai.com
   - **Anthropic** - Get API keys from https://console.anthropic.com
   - **Google (Gemini)** - Get API keys from https://ai.google.dev
   - **OpenRouter** (optional) - Get API keys from https://openrouter.ai

4. **Redis** (for caching and rate limiting)
   - Set up Redis on Upstash or a similar service

## Environment Setup

Create a `.env` file in the root directory with the following variables:

```bash
# Supabase Configuration
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_KEY=your-supabase-anon-key
SUPABASE_SERVICE_KEY=your-supabase-service-role-key

# AI Provider Keys
OPENAI_API_KEY=your-openai-api-key
ANTHROPIC_API_KEY=your-anthropic-api-key
GEMINI_API_KEY=your-gemini-api-key
OPENROUTER_API_KEY=your-openrouter-api-key

# Redis Configuration
REDIS_URL=your-redis-url
REDIS_TOKEN=your-redis-token

# Admin Dashboard Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3001
ADMIN_SECRET=your-admin-secret-for-protected-routes

# Encryption Keys (generate with `openssl rand -base64 32`)
ENCRYPTION_KEY=your-encryption-key
```

## Database Setup

Run the following SQL in your Supabase project SQL editor to set up the necessary tables:

```sql
-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT auth.uid(),
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create RLS policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own data" ON users
  FOR SELECT USING (auth.uid() = id);
  
-- Agents table
CREATE TABLE IF NOT EXISTS agents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  created_by UUID REFERENCES users(id) NOT NULL,
  model TEXT NOT NULL,
  capabilities JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create RLS policies
ALTER TABLE agents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own agents" ON agents
  FOR SELECT USING (auth.uid() = created_by);
CREATE POLICY "Users can insert their own agents" ON agents
  FOR INSERT WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Users can update their own agents" ON agents
  FOR UPDATE USING (auth.uid() = created_by);
CREATE POLICY "Users can delete their own agents" ON agents
  FOR DELETE USING (auth.uid() = created_by);

-- Agent Memory (Vector storage)
CREATE TABLE IF NOT EXISTS agent_memory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID REFERENCES agents(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  embedding vector(1536) NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create RLS policies
ALTER TABLE agent_memory ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can access memory of their agents" ON agent_memory
  FOR ALL USING (EXISTS (
    SELECT 1 FROM agents WHERE agents.id = agent_memory.agent_id AND agents.created_by = auth.uid()
  ));

-- System Health table
CREATE TABLE IF NOT EXISTS system_health (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cpu FLOAT NOT NULL,
  memory FLOAT NOT NULL,
  disk FLOAT NOT NULL,
  network FLOAT NOT NULL,
  status TEXT NOT NULL,
  services JSONB DEFAULT '[]',
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- Create RLS policies
ALTER TABLE system_health ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Only admins can modify system health" ON system_health
  FOR ALL USING (auth.jwt() ->> 'role' = 'admin');
CREATE POLICY "All users can view system health" ON system_health
  FOR SELECT USING (true);
```

## Running the Application

### Development Environment

1. Install dependencies:
   ```bash
   cd /workspaces/n8n
   pnpm install
   ```

2. Start the development server:
   ```bash
   pnpm run dev
   ```

### Building for Production

1. Build all packages:
   ```bash
   pnpm run build
   ```

2. Deploy to Vercel:
   ```bash
   vercel deploy --prod
   ```

## Testing Your Setup

1. Open your browser to `http://localhost:3001` to access the admin dashboard
2. Navigate to the System Health page to verify that all services are connected
3. Try creating your first AI agent with the Agent Builder
4. Test the web browsing capabilities by asking the agent to search for information

## Troubleshooting

- If you encounter connection issues with Supabase, check your API keys and network connectivity
- For model API errors, verify your API keys and check usage quotas
- Redis connection issues might require checking your firewall settings or connection string
- For deployment issues on Vercel, check the build logs and environment variables
