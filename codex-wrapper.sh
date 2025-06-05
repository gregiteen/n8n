#!/bin/bash

# Codex Wrapper Script
# This wrapper ensures the codex-dev-environment.sh script runs properly in Codex environment
# It handles path issues and network connectivity problems

# Colors for terminal output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}[+] Starting Codex wrapper script...${NC}"

# Export variables to bypass problematic steps
export SKIP_YARN=true

# Determine the absolute path to the n8n directory
if [ -d "/workspaces/n8n" ]; then
  N8N_DIR="/workspaces/n8n"
elif [ -d "/workspace/n8n" ]; then
  N8N_DIR="/workspace/n8n"
else
  # Try to find n8n directory
  N8N_DIR=$(find / -name "codex-dev-environment.sh" -type f 2>/dev/null | head -n 1 | xargs dirname 2>/dev/null)
  
  if [ -z "$N8N_DIR" ]; then
    echo -e "${RED}[✗] Could not find n8n directory containing codex-dev-environment.sh${NC}"
    exit 1
  fi
fi

echo -e "${GREEN}[✓] Found n8n directory at: $N8N_DIR${NC}"

# Check if the script exists
if [ ! -f "$N8N_DIR/codex-dev-environment.sh" ]; then
  echo -e "${RED}[✗] codex-dev-environment.sh not found in $N8N_DIR${NC}"
  exit 1
fi

# Make the script executable if it's not already
if [ ! -x "$N8N_DIR/codex-dev-environment.sh" ]; then
  echo -e "${YELLOW}[!] Making script executable${NC}"
  chmod +x "$N8N_DIR/codex-dev-environment.sh"
fi

# Navigate to the n8n directory
cd "$N8N_DIR"

# Run the script with all arguments passed to this wrapper
echo -e "${BLUE}[+] Running codex-dev-environment.sh with arguments: $@${NC}"
./codex-dev-environment.sh "$@"

# Check exit status
if [ $? -eq 0 ]; then
  echo -e "${GREEN}[✓] Script completed successfully${NC}"
else
  echo -e "${RED}[✗] Script failed with exit code $?${NC}"
  exit 1
fi
