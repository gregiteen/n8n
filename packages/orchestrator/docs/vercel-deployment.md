# Vercel Deployment Guide for n8n AI Platform

This guide explains how to deploy the n8n AI Platform orchestrator to Vercel. The orchestrator contains the MCP implementation for n8n nodes, which allows AI agents to execute n8n workflows and nodes.

## Prerequisites

1. A [Vercel account](https://vercel.com/signup)
2. [Vercel CLI](https://vercel.com/docs/cli) installed (`npm install -g vercel`)
3. API keys for OpenAI and/or other AI providers (for AI features)

## Deployment Steps

### Automatic Deployment

The easiest way to deploy is using our deploy script:

```bash
./deploy-orchestrator.sh
```

This script will:
1. Build the orchestrator package
2. Configure Vercel settings
3. Set up necessary environment variables
4. Deploy to Vercel

### Manual Deployment

If you prefer to deploy manually:

1. **Build the orchestrator package**:

```bash
cd packages/orchestrator
npm install
npm run build
```

2. **Set up environment variables in Vercel**:

Navigate to your Vercel project settings and add these environment variables:

- `PORT`: 3000 (default for Vercel)
- `NODE_ENV`: production
- `OPENAI_API_KEY`: Your OpenAI API key (if using OpenAI features)
- `ANTHROPIC_API_KEY`: Your Anthropic API key (if using Anthropic features)

3. **Deploy using Vercel CLI**:

```bash
cd packages/orchestrator
vercel --prod
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `OPENAI_API_KEY` | Your OpenAI API key | - |
| `ANTHROPIC_API_KEY` | Your Anthropic API key | - |
| `GOOGLE_API_KEY` | Your Google AI API key | - |
| `OPENROUTER_API_KEY` | Your OpenRouter API key | - |
| `NEXTAUTH_SECRET` | Secret for NextAuth authentication | - |
| `NEXTAUTH_URL` | URL for NextAuth (your deployment URL) | - |
| `SUPABASE_URL` | Your Supabase URL | - |
| `SUPABASE_ANON_KEY` | Your Supabase anon key | - |
| `SUPABASE_SERVICE_ROLE_KEY` | Your Supabase service role key | - |
| `DATABASE_URL` | Your database URL | - |
| `PORT` | Port for the service | 3000 |
| `MAX_JSON_REQUEST_SIZE` | Max JSON payload size (MB) | 50 |

## Testing the Deployment

After deployment, you can test the following:

### MCP API Endpoints

Use the included verification script to test the deployment:

```bash
./verify-deployment.sh https://<your-deployment-url>
```

Or manually test the endpoints:

1. **MCP Schema**: `https://<your-deployment-url>/mcp/schema`
2. **List Tools**: `https://<your-deployment-url>/mcp/tools`
3. **Execute a Tool**:

```bash
curl -X POST "https://<your-deployment-url>/mcp/run" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "HTTPRequest",
    "parameters": {
      "url": "https://jsonplaceholder.typicode.com/todos/1",
      "method": "GET"
    }
  }'
```

## Troubleshooting

### Common Issues

1. **Deployment fails with build errors**:
   - Check that all dependencies are correctly installed
   - Verify your TypeScript files compile correctly locally

2. **Internal services not communicating properly**:
   - Check that all components are properly built
   - Verify that environment variables are correctly set
   - Check the logs for any connection errors between services

3. **Rate limiting issues**:
   - The service includes basic rate limiting; adjust if needed in the code

### Logs

You can view deployment logs in the Vercel dashboard.
