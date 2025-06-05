#!/bin/bash

# Wrapper script for codex-dev-environment.sh that handles common errors
# This script will attempt to run the codex-dev-environment.sh with added error handling

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Ensure we're in the correct directory
cd "$(dirname "$0")" || { echo -e "${RED}Failed to change to script directory${NC}"; exit 1; }

# Verify the script exists
if [ ! -f "./codex-dev-environment.sh" ]; then
  echo -e "${RED}Error: codex-dev-environment.sh not found in the current directory$(pwd)${NC}"
  exit 1
fi

# Make sure the script is executable
chmod +x ./codex-dev-environment.sh

# Disable Yarn installation attempt
export SKIP_YARN=true

# Enable network workarounds
export NETWORK_RETRY=true

# Set npm registry to main registry for better reliability
export NPM_CONFIG_REGISTRY=https://registry.npmjs.org/

# Disable strict SSL for possible network issues
export NODE_TLS_REJECT_UNAUTHORIZED=0

echo -e "${BLUE}Running codex-dev-environment.sh with error handling...${NC}"
echo -e "${YELLOW}NOTE: Yarn installation will be skipped to avoid network errors${NC}"

# Run the script with arguments passed to this wrapper
./codex-dev-environment.sh --skip-install "$@"

# Check if the script succeeded
if [ $? -eq 0 ]; then
  echo -e "${GREEN}Setup completed successfully!${NC}"
  
  # Suggest next steps
  echo -e "${BLUE}Suggested next steps:${NC}"
  echo -e "- Run: ${YELLOW}pnpm install${NC} to install dependencies manually"
  echo -e "- Run: ${YELLOW}pnpm build${NC} to build all packages"
  echo -e "- Or use VS Code tasks: Press Ctrl+Shift+B to see available tasks"
else
  echo -e "${RED}Setup failed with errors.${NC}"
  echo -e "${YELLOW}Try running again with:${NC}"
  echo -e "${BLUE}./run-codex-setup.sh --no-fix${NC} to skip fixing common errors"
fi
