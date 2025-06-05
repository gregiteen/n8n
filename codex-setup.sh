#!/bin/bash

# Codex Setup Script for n8n AI Agent Platform
# Optimized for OpenAI Codex cloud environment

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Configuration
NODE_MIN_VERSION=22
SCRIPT_DIR="$(pwd)"  # Use current directory since Codex clones directly here

# Print functions
print_header() {
    echo -e "\n${PURPLE}============================================${NC}"
    echo -e "${PURPLE}  $1${NC}"
    echo -e "${PURPLE}============================================${NC}\n"
}

print_step() {
    echo -e "${CYAN}[STEP]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to check Node.js version
check_node_version() {
    if command_exists node; then
        local node_version=$(node --version | sed 's/v//')
        local major_version=$(echo $node_version | cut -d. -f1)
        
        if [ "$major_version" -ge "$NODE_MIN_VERSION" ]; then
            print_success "Node.js $node_version detected (>= $NODE_MIN_VERSION required)"
            return 0
        else
            print_error "Node.js $major_version detected, but >= $NODE_MIN_VERSION required"
            return 1
        fi
    else
        print_error "Node.js not found"
        return 1
    fi
}

# Function to install pnpm if needed
setup_pnpm() {
    if ! command_exists pnpm; then
        print_step "Installing pnpm..."
        npm install -g pnpm
        print_success "pnpm installed successfully"
    else
        print_success "pnpm already installed: $(pnpm --version)"
    fi
}

# Function to set up environment
setup_environment() {
    print_step "Setting up environment variables..."
    
    # Create .env file if it doesn't exist
    if [ ! -f "$SCRIPT_DIR/.env" ]; then
        cat > "$SCRIPT_DIR/.env" << EOF
# n8n Configuration
N8N_HOST=localhost
N8N_PORT=5678
N8N_PROTOCOL=http
N8N_LOG_LEVEL=info

# Database Configuration
DATABASE_TYPE=sqlite
DB_SQLITE_DATABASE=\${HOME}/.n8n/database.sqlite

# Admin Dashboard Configuration
NEXTAUTH_URL=http://localhost:3001
NEXTAUTH_SECRET=your-development-secret-key-change-in-production

# Development Settings
NODE_ENV=development
EOF
        print_success "Created .env file with default configuration"
    else
        print_success "Environment file already exists"
    fi
}

# Function to install dependencies
install_dependencies() {
    print_step "Installing project dependencies..."
    
    cd "$SCRIPT_DIR"
    
    # Check if we should skip frozen lockfile
    if [ "$NO_FROZEN_LOCKFILE" = true ]; then
        print_warning "Skipping frozen lockfile, running regular install..."
        pnpm install
    else
        # Try frozen lockfile first, fallback to regular install if it fails
        if ! pnpm install --frozen-lockfile 2>/dev/null; then
            print_warning "Frozen lockfile failed, running regular install..."
            pnpm install
        fi
    fi
    
    print_success "Dependencies installed successfully"
}

# Function to build the project
build_project() {
    print_step "Building the project..."
    
    cd "$SCRIPT_DIR"
    
    # Build all packages
    pnpm build
    
    print_success "Project built successfully"
}

# Function to run linting
run_linting() {
    print_step "Running linting checks..."
    
    cd "$SCRIPT_DIR"
    
    # Run linting
    if pnpm lint 2>/dev/null; then
        print_success "Linting passed"
    else
        print_warning "Linting issues found. Run 'pnpm lint:fix' to auto-fix some issues"
    fi
}

# Function to run tests
run_tests() {
    print_step "Running tests..."
    
    cd "$SCRIPT_DIR"
    
    # Run tests
    if pnpm test 2>/dev/null; then
        print_success "All tests passed"
    else
        print_warning "Some tests failed. Check the output above for details"
    fi
}

# Function to start development servers
start_development() {
    print_step "Starting development servers..."
    
    cd "$SCRIPT_DIR"
    
    print_success "Development environment ready!"
    echo -e "\nTo start the development servers, run:"
    echo -e "  ${CYAN}pnpm dev${NC}                 # Start all services"
    echo -e "  ${CYAN}pnpm dev:admin${NC}           # Start admin dashboard only"
    echo -e "  ${CYAN}pnpm dev:n8n${NC}             # Start n8n core only"
    echo -e "\nServices will be available at:"
    echo -e "  ${BLUE}n8n Core:${NC}        http://localhost:5678"
    echo -e "  ${BLUE}Admin Dashboard:${NC} http://localhost:3001"
}

# Function to show help
show_help() {
    echo "n8n AI Agent Platform - Codex Setup Script"
    echo ""
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  --help, -h          Show this help message"
    echo "  --skip-build        Skip the build step"
    echo "  --skip-tests        Skip running tests"
    echo "  --skip-lint         Skip linting checks"
    echo "  --no-frozen-lockfile    Skip frozen lockfile, useful for development"
    echo "  --install-only      Only install dependencies"
    echo "  --build-only        Only build the project"
    echo ""
    echo "Examples:"
    echo "  $0                  # Full setup"
    echo "  $0 --skip-tests     # Setup without running tests"
    echo "  $0 --install-only   # Only install dependencies"
}

# Parse command line arguments
SKIP_BUILD=false
SKIP_TESTS=false
SKIP_LINT=false
INSTALL_ONLY=false
BUILD_ONLY=false
NO_FROZEN_LOCKFILE=false

while [[ $# -gt 0 ]]; do
    case $1 in
        --help|-h)
            show_help
            exit 0
            ;;
        --skip-build)
            SKIP_BUILD=true
            shift
            ;;
        --skip-tests)
            SKIP_TESTS=true
            shift
            ;;
        --skip-lint)
            SKIP_LINT=true
            shift
            ;;
        --install-only)
            INSTALL_ONLY=true
            shift
            ;;
        --build-only)
            BUILD_ONLY=true
            shift
            ;;
        --no-frozen-lockfile)
            NO_FROZEN_LOCKFILE=true
            shift
            ;;
        *)
            print_error "Unknown option: $1"
            show_help
            exit 1
            ;;
    esac
done

# Main execution
main() {
    print_header "n8n AI Agent Platform - Codex Setup"
    
    # Check prerequisites
    if ! check_node_version; then
        print_error "Node.js version check failed. Codex should have Node.js 22+ installed."
        exit 1
    fi
    
    # Setup pnpm
    setup_pnpm
    
    # Setup environment
    setup_environment
    
    # Install dependencies (always run unless build-only)
    if [ "$BUILD_ONLY" = false ]; then
        install_dependencies
    fi
    
    # Build project
    if [ "$SKIP_BUILD" = false ] && [ "$INSTALL_ONLY" = false ]; then
        build_project
    fi
    
    # Run linting
    if [ "$SKIP_LINT" = false ] && [ "$INSTALL_ONLY" = false ] && [ "$BUILD_ONLY" = false ]; then
        run_linting
    fi
    
    # Run tests
    if [ "$SKIP_TESTS" = false ] && [ "$INSTALL_ONLY" = false ] && [ "$BUILD_ONLY" = false ]; then
        run_tests
    fi
    
    # Show final instructions
    if [ "$INSTALL_ONLY" = false ] && [ "$BUILD_ONLY" = false ]; then
        start_development
    fi
    
    print_success "Setup completed successfully!"
}

# Error handling
trap 'print_error "Setup failed on line $LINENO. Exit code: $?"' ERR

# Run main function
main "$@"
