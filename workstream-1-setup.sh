#!/bin/bash

# Lightweight setup script for Workstream 1: AI Orchestrator
# This script just installs dependencies and sets up the dev environment
# without starting any services

set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== Setting up development environment for Workstream 1: AI Orchestrator ===${NC}"
echo "This script will ONLY install dependencies and set up the environment, not start servers."

# Check Node.js version
echo -e "${BLUE}Checking Node.js version...${NC}"
node_version=$(node --version | cut -d'v' -f2)
echo "Node.js version: $node_version"

# Check pnpm version
echo -e "${BLUE}Checking pnpm version...${NC}"
pnpm_version=$(pnpm --version)
echo "pnpm version: $pnpm_version"

# Fix errors for Workstream 1 packages only
echo -e "${BLUE}Fixing common project errors for Workstream 1...${NC}"

# Ensure turbo is available
if [ ! -f "node_modules/.bin/turbo" ] && [ ! -f "node_modules/turbo/bin/turbo" ]; then
    echo -e "${YELLOW}Installing turbo dependency...${NC}"
    pnpm add -D turbo@2.5.4 -w
fi

# Fix missing @sentry/types dependency in n8n-core package
core_package="packages/core/package.json"
if [ -f "$core_package" ] && ! grep -q "@sentry/types" "$core_package"; then
    echo -e "${YELLOW}Adding missing @sentry/types dependency to n8n-core...${NC}"
    pnpm add @sentry/types --filter=n8n-core --save-dev
fi

# Install dependencies without building or starting services
echo -e "${BLUE}Installing project dependencies without frozen lockfile...${NC}"
pnpm install --frozen-lockfile=false

echo -e "${GREEN}=== Development environment setup complete! ===${NC}"
echo -e "${YELLOW}Important files for Workstream 1:${NC}"
echo -e "- ${BLUE}WORKSTREAM_1_AI_ORCHESTRATOR.md${NC} - Main tasks document"
echo -e "- ${BLUE}PRD.md${NC} - Product Requirements Document"
echo -e "- ${BLUE}DEVELOPER_GUIDE.md${NC} - Developer guide"
echo -e ""
echo -e "${GREEN}You can now work on Workstream 1 tasks without running the entire application.${NC}"
echo -e "When you need to run a specific command, use the terminal directly."
