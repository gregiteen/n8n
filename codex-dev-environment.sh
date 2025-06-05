#!/bin/bash

# Codex Development Environment Setup Script
# Version: 1.0
# Date: June 5, 2025
# Purpose: Configure development environment for all n8n AI Agent Platform workstreams

set -e

# Colors for terminal output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
WHITE='\033[1;37m'
NC='\033[0m' # No Color

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CLEAN_INSTALL=false
FIX_ERRORS=true
SKIP_INSTALL=false
WORKSTREAM=""

# Print functions
print_header() {
  echo ""
  echo -e "${PURPLE}╔══════════════════════════════════════════════════════════════════════╗${NC}"
  echo -e "${PURPLE}║                                                                      ║${NC}"
  echo -e "${PURPLE}║  $(printf "%-64s" "$1")  ║${NC}"
  echo -e "${PURPLE}║                                                                      ║${NC}"
  echo -e "${PURPLE}╚══════════════════════════════════════════════════════════════════════╝${NC}"
  echo ""
}

print_step() {
  echo -e "${BLUE}[+] $1${NC}"
}

print_success() {
  echo -e "${GREEN}[✓] $1${NC}"
}

print_warning() {
  echo -e "${YELLOW}[!] $1${NC}"
}

print_error() {
  echo -e "${RED}[✗] $1${NC}"
}

# Help function
show_help() {
  print_header "Codex Development Environment Setup"
  
  echo -e "${WHITE}Usage:${NC} $0 [OPTIONS]"
  echo ""
  echo -e "${WHITE}Options:${NC}"
  echo "  -h, --help              Show this help message"
  echo "  -c, --clean             Clean install (remove node_modules first)"
  echo "  -s, --skip-install      Skip dependency installation"
  echo "  --no-fix                Don't fix common project errors"
  echo "  -w, --workstream NUM    Setup for specific workstream (1-4)"
  echo ""
  echo -e "${WHITE}Examples:${NC}"
  echo "  $0                      Setup for all workstreams"
  echo "  $0 --clean              Clean setup from scratch"
  echo "  $0 -w 1                 Setup for Workstream 1 (AI Orchestrator)"
  echo ""
  echo -e "${WHITE}Workstreams:${NC}"
  echo "  1: AI Orchestrator & LLM Integration"
  echo "  2: n8n Integration"
  echo "  3: Privacy Layer"
  echo "  4: Admin Dashboard"
  echo ""
}

# Parse arguments
parse_args() {
  while [[ $# -gt 0 ]]; do
    case $1 in
      -h|--help)
        show_help
        exit 0
        ;;
      -c|--clean)
        CLEAN_INSTALL=true
        shift
        ;;
      -s|--skip-install)
        SKIP_INSTALL=true
        shift
        ;;
      --no-fix)
        FIX_ERRORS=false
        shift
        ;;
      -w|--workstream)
        WORKSTREAM="$2"
        shift 2
        ;;
      *)
        print_error "Unknown option: $1"
        show_help
        exit 1
        ;;
    esac
  done
}

# Check prerequisites
check_prerequisites() {
  print_step "Checking prerequisites..."
  
  # Check Node.js
  if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed"
    exit 1
  fi
  
  NODE_VERSION=$(node -v | cut -d'v' -f2)
  NODE_MAJOR=$(echo $NODE_VERSION | cut -d'.' -f1)
  
  if [ "$NODE_MAJOR" -lt 22 ]; then
    print_warning "Node.js version $NODE_VERSION detected. Recommended: 22.16+"
  else
    print_success "Node.js version $NODE_VERSION"
  fi
  
  # Check pnpm
  if ! command -v pnpm &> /dev/null; then
    print_step "Installing pnpm..."
    npm install -g pnpm@10.11.1
  fi
  
  PNPM_VERSION=$(pnpm -v)
  print_success "pnpm version $PNPM_VERSION"
  
  return 0
}

# Fix common project errors
fix_common_errors() {
  if [ "$FIX_ERRORS" = false ]; then
    return 0
  fi
  
  print_step "Fixing common project errors..."
  
  # Fix package.json patches if needed
  if grep -q "vue-tsc@2.2.8" package.json; then
    print_step "Fixing vue-tsc patch in package.json..."
    sed -i '/vue-tsc@2.2.8/d' package.json
    sed -i '/patches\/vue-tsc@2.2.8.patch/d' package.json
  fi
  
  # Ensure turbo is available
  if [ ! -f "node_modules/.bin/turbo" ]; then
    print_step "Installing turbo dependency..."
    pnpm add -D turbo@2.5.4 -w
  fi
  
  # Fix Sentry types
  local core_package="packages/core/package.json"
  if [ -f "$core_package" ] && ! grep -q "@sentry/types" "$core_package"; then
    print_step "Adding @sentry/types dependency to n8n-core..."
    pnpm add @sentry/types --filter=n8n-core --save-dev
  fi
  
  # Ensure typescript-config exists for all packages
  if [ ! -d "packages/@n8n/typescript-config" ]; then
    print_step "Creating TypeScript config package..."
    mkdir -p packages/@n8n/typescript-config
    
    # Create a basic tsconfig.common.json
    cat > packages/@n8n/typescript-config/tsconfig.common.json << EOL
{
  "compilerOptions": {
    "target": "es2022",
    "module": "commonjs",
    "moduleResolution": "node",
    "esModuleInterop": true,
    "sourceMap": true,
    "declaration": true,
    "skipLibCheck": true,
    "strict": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "removeComments": true,
    "lib": ["es2022"]
  },
  "exclude": ["node_modules", "dist"]
}
EOL

    # Create package.json for typescript-config
    cat > packages/@n8n/typescript-config/package.json << EOL
{
  "name": "@n8n/typescript-config",
  "version": "0.1.0",
  "private": true
}
EOL
    print_success "Created TypeScript configuration"
  fi
  
  print_success "Fixed common project errors"
  return 0
}

# Install dependencies
install_dependencies() {
  if [ "$SKIP_INSTALL" = true ]; then
    print_warning "Skipping dependency installation"
    return 0
  fi
  
  print_step "Installing project dependencies..."
  
  if [ "$CLEAN_INSTALL" = true ]; then
    print_step "Performing clean install (this may take a while)..."
    # Preserve the lock file but remove node_modules
    find . -name "node_modules" -type d -exec rm -rf {} + 2>/dev/null || true
  fi
  
  # Install with proper error handling
  pnpm install --frozen-lockfile=false || {
    print_warning "Standard install failed, trying without frozen lockfile..."
    pnpm install --no-frozen-lockfile || {
      print_warning "Install still failing, trying with force flag..."
      pnpm install --force || {
        print_error "Dependencies installation failed"
        return 1
      }
    }
  }
  
  print_success "Dependencies installed successfully"
  return 0
}

# Setup AI Orchestrator (Workstream 1)
setup_workstream_1() {
  print_step "Setting up AI Orchestrator & LLM Integration (Workstream 1)..."
  
  # Create basic directory if it doesn't exist
  if [ ! -d "packages/@n8n/ai-orchestrator" ]; then
    mkdir -p packages/@n8n/ai-orchestrator/src
    
    # Create package.json
    cat > packages/@n8n/ai-orchestrator/package.json << EOL
{
  "name": "@n8n/ai-orchestrator",
  "version": "0.1.0",
  "description": "AI Orchestration for n8n",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "scripts": {
    "build": "tsc -p tsconfig.build.json",
    "dev": "tsc -p tsconfig.build.json --watch",
    "clean": "rimraf dist .turbo",
    "typecheck": "tsc --noEmit",
    "lint": "eslint src --ext .ts",
    "test": "jest"
  },
  "dependencies": {
    "@n8n/config": "workspace:*",
    "@n8n/constants": "workspace:*"
  },
  "devDependencies": {
    "@n8n/typescript-config": "workspace:*",
    "@types/jest": "^29.5.0",
    "@types/node": "^18.0.0",
    "jest": "^29.5.0",
    "rimraf": "^5.0.0",
    "typescript": "^5.0.0"
  }
}
EOL

    # Create tsconfig
    cat > packages/@n8n/ai-orchestrator/tsconfig.json << EOL
{
  "extends": "@n8n/typescript-config/tsconfig.common.json",
  "compilerOptions": {
    "rootDir": "src",
    "outDir": "dist",
    "baseUrl": "."
  },
  "include": ["src/**/*"]
}
EOL

    cat > packages/@n8n/ai-orchestrator/tsconfig.build.json << EOL
{
  "extends": "./tsconfig.json",
  "exclude": ["node_modules", "dist", "**/*.spec.ts", "**/*.test.ts"]
}
EOL

    # Create basic source file
    cat > packages/@n8n/ai-orchestrator/src/index.ts << EOL
/**
 * AI Orchestrator for n8n
 * Manages and coordinates AI agents, LLM integrations, and agent reasoning
 */

export class AIOrchestrator {
  constructor(private readonly config: any = {}) {}
  
  /**
   * Initialize the AI Orchestrator
   */
  async initialize(): Promise<void> {
    console.log('AI Orchestrator initializing...');
    // Initialization logic will go here
  }
  
  /**
   * Process a user input through the AI system
   */
  async processInput(input: string): Promise<string> {
    // This is a placeholder implementation
    return \`AI Orchestrator received: \${input}\`;
  }
}

export default AIOrchestrator;
EOL
    
    print_success "Created AI Orchestrator package structure"
  else
    print_success "AI Orchestrator package already exists"
  fi
}

# Setup n8n Integration (Workstream 2)
setup_workstream_2() {
  print_step "Setting up n8n Integration (Workstream 2)..."
  
  # Most of n8n integration is part of the core codebase
  # Just ensure the key directories exist
  
  # Check for cli directory, which is important for n8n integration
  if [ ! -d "packages/cli" ]; then
    print_warning "CLI package is missing, this is required for n8n integration"
  else
    print_success "CLI package exists, ready for n8n integration"
  fi
}

# Setup Privacy Layer (Workstream 3)
setup_workstream_3() {
  print_step "Setting up Privacy Layer (Workstream 3)..."
  
  # Create basic directory if it doesn't exist
  if [ ! -d "packages/@n8n/privacy-layer" ]; then
    mkdir -p packages/@n8n/privacy-layer/src
    
    # Create package.json
    cat > packages/@n8n/privacy-layer/package.json << EOL
{
  "name": "@n8n/privacy-layer",
  "version": "0.1.0",
  "description": "Privacy Layer for n8n AI Agent Platform",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "scripts": {
    "build": "tsc -p tsconfig.build.json",
    "dev": "tsc -p tsconfig.build.json --watch",
    "clean": "rimraf dist .turbo",
    "typecheck": "tsc --noEmit",
    "lint": "eslint src --ext .ts",
    "test": "jest"
  },
  "dependencies": {
    "zod": "catalog:",
    "@n8n/config": "workspace:*"
  },
  "devDependencies": {
    "@n8n/typescript-config": "workspace:*",
    "@types/jest": "^29.5.0",
    "@types/node": "^18.0.0",
    "jest": "^29.5.0",
    "rimraf": "^5.0.0",
    "typescript": "^5.0.0"
  }
}
EOL

    # Create tsconfig
    cat > packages/@n8n/privacy-layer/tsconfig.json << EOL
{
  "extends": "@n8n/typescript-config/tsconfig.common.json",
  "compilerOptions": {
    "rootDir": "src",
    "outDir": "dist",
    "baseUrl": "."
  },
  "include": ["src/**/*"]
}
EOL

    cat > packages/@n8n/privacy-layer/tsconfig.build.json << EOL
{
  "extends": "./tsconfig.json",
  "exclude": ["node_modules", "dist", "**/*.spec.ts", "**/*.test.ts"]
}
EOL

    # Create basic source file
    cat > packages/@n8n/privacy-layer/src/index.ts << EOL
/**
 * Privacy Layer for n8n AI Agent Platform
 * This module provides tools for ensuring user data privacy and compliance
 */

export enum PrivacyImpactLevel {
  NONE = 'none',
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
}

export class PrivacyService {
  constructor(private readonly config: any = {}) {}
  
  /**
   * Redacts sensitive information from text
   */
  redact(text: string, patterns?: RegExp[]): string {
    const defaultPatterns = [
      // Email addresses
      /([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/g,
      // Phone numbers (simple pattern)
      /(\+\d{1,3}[\s-]?)?\(?\d{3}\)?[\s-]?\d{3}[\s-]?\d{4}/g,
    ];

    const patternsToUse = patterns || defaultPatterns;
    let redactedText = text;
    
    patternsToUse.forEach(pattern => {
      redactedText = redactedText.replace(pattern, '[REDACTED]');
    });
    
    return redactedText;
  }
}

export default PrivacyService;
EOL
    
    print_success "Created Privacy Layer package structure"
  else
    print_success "Privacy Layer package already exists"
  fi
  
  # Integrate the changes from the setup-privacy-layer.sh script
  if [ -f "setup-privacy-layer.sh" ]; then
    print_step "Integrating changes from setup-privacy-layer.sh..."
    source setup-privacy-layer.sh
    print_success "Integrated Privacy Layer changes"
  fi
}

# Setup Admin Dashboard (Workstream 4)
setup_workstream_4() {
  print_step "Setting up Admin Dashboard (Workstream 4)..."
  
  # Check if admin-dashboard package exists
  if [ ! -d "packages/admin-dashboard" ]; then
    print_warning "Admin Dashboard package not found, core structure might be missing"
    print_step "Please make sure the admin-dashboard package is properly initialized"
  else
    print_success "Admin Dashboard package exists"
    
    # Ensure package.json has correct scripts
    if [ -f "packages/admin-dashboard/package.json" ]; then
      print_success "Admin Dashboard package.json exists"
    fi
  fi
}

# Verify development environment
verify_dev_environment() {
  print_step "Verifying development environment..."
  
  # Check key project files
  if [ -f "package.json" ]; then
    print_success "Found root package.json"
  else
    print_error "Root package.json not found!"
  fi
  
  # Check important documentation
  if [ -f "DEVELOPER_GUIDE.md" ]; then
    print_success "Found Developer Guide"
  fi
  
  if [ -f "CODEX_README.md" ]; then
    print_success "Found Codex README"
  fi
  
  # Make scripts executable
  for script in "codex-startup.sh" "codex-startup-improved.sh" "dev-env-setup.sh"; do
    if [ -f "$script" ] && [ ! -x "$script" ]; then
      chmod +x "$script"
      print_success "Made $script executable"
    fi
  done
  
  # Make the current script executable too
  chmod +x "$0"
  
  print_success "Development environment verification complete"
  return 0
}

# Print available commands for development
show_available_commands() {
  print_header "Development Commands"
  
  echo -e "${WHITE}Useful Commands for Development:${NC}"
  echo ""
  echo -e "${CYAN}• VS Code Tasks:${NC}"
  echo "  - n8n: Start Development Environment  # Quick start with minimal services"
  echo "  - n8n: Clean Install & Start          # Clean install with error fixes"
  echo "  - n8n: Stop All Services              # Stop any running services"
  echo ""
  
  echo -e "${CYAN}• General Commands:${NC}"
  echo "  pnpm install                          # Install dependencies"
  echo "  pnpm run build                        # Build all packages"
  echo "  pnpm run test                         # Run all tests"
  echo "  pnpm run lint                         # Lint all code"
  echo ""
  
  echo -e "${CYAN}• Workstream 1 (AI Orchestrator):${NC}"
  echo "  pnpm run build --filter=@n8n/ai-orchestrator"
  echo "  pnpm run test --filter=@n8n/ai-orchestrator"
  echo ""
  
  echo -e "${CYAN}• Workstream 2 (n8n Integration):${NC}"
  echo "  pnpm run build --filter=n8n-core"
  echo "  pnpm run test --filter=n8n-core"
  echo ""
  
  echo -e "${CYAN}• Workstream 3 (Privacy Layer):${NC}"
  echo "  pnpm run build --filter=@n8n/privacy-layer"
  echo "  pnpm run test --filter=@n8n/privacy-layer"
  echo ""
  
  echo -e "${CYAN}• Workstream 4 (Admin Dashboard):${NC}"
  echo "  pnpm run build --filter=admin-dashboard"
  echo "  pnpm run test --filter=admin-dashboard"
  echo "  pnpm run dev --filter=admin-dashboard  # Start dashboard in dev mode"
  echo ""
  
  echo -e "${CYAN}• Stop any running processes:${NC}"
  echo "  pkill -f 'node.*n8n\\|node.*next'"
  echo ""
}

# Main function
main() {
  # Show header
  print_header "Codex Development Environment Setup"
  
  # Parse command line arguments
  parse_args "$@"
  
  # Change to script directory
  cd "$SCRIPT_DIR"
  
  # Check prerequisites
  check_prerequisites
  
  # Fix common errors
  fix_common_errors
  
  # Install dependencies
  install_dependencies
  
  # Setup specific workstream if requested
  if [ -n "$WORKSTREAM" ]; then
    case $WORKSTREAM in
      1)
        setup_workstream_1
        ;;
      2)
        setup_workstream_2
        ;;
      3)
        setup_workstream_3
        ;;
      4)
        setup_workstream_4
        ;;
      *)
        print_error "Invalid workstream number: $WORKSTREAM"
        show_help
        exit 1
        ;;
    esac
  else
    # Setup all workstreams
    setup_workstream_1
    setup_workstream_2
    setup_workstream_3
    setup_workstream_4
  fi
  
  # Verify development environment
  verify_dev_environment
  
  # Show available commands
  show_available_commands
  
  print_header "Setup Complete"
  echo -e "${GREEN}Your Codex development environment is ready!${NC}"
  echo -e "${WHITE}You can now start working on any workstream.${NC}"
  echo -e "${WHITE}Run with --workstream <num> to focus on a specific workstream setup.${NC}"
  echo ""
  echo -e "${YELLOW}Note:${NC} Use VS Code tasks for quick access to common operations"
  echo -e "Press ${CYAN}Ctrl+Shift+B${NC} to see available tasks"
  echo ""
}

# Run the main function
main "$@"
