#!/bin/bash

# n8n Startup Script
# This script sets up and runs the n8n monorepo with all its components

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
DEFAULT_PORT=5678
ADMIN_DASHBOARD_PORT=3001
NODE_ENV=${NODE_ENV:-development}
N8N_LOG_LEVEL=${N8N_LOG_LEVEL:-info}

# Script options
SKIP_INSTALL=false
SKIP_BUILD=false
RUN_ADMIN_DASHBOARD=true
RUN_E2E_SERVER=false
PRODUCTION_MODE=false
DOCKER_MODE=false

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
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

# Function to show help
show_help() {
    echo "n8n Startup Script"
    echo ""
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  -h, --help              Show this help message"
    echo "  -s, --skip-install      Skip dependency installation"
    echo "  -b, --skip-build        Skip build step"
    echo "  -p, --production        Run in production mode"
    echo "  -d, --docker            Use Docker instead of local setup"
    echo "  --no-admin              Don't start admin dashboard"
    echo "  --e2e                   Start E2E test server"
    echo "  --port PORT             Set n8n port (default: 5678)"
    echo "  --admin-port PORT       Set admin dashboard port (default: 3001)"
    echo ""
    echo "Examples:"
    echo "  $0                      Start n8n in development mode with admin dashboard"
    echo "  $0 --production         Start n8n in production mode"
    echo "  $0 --docker             Start n8n using Docker"
    echo "  $0 --skip-install -b    Skip install and build, just start"
    echo "  $0 --e2e                Start E2E test server"
}

# Function to check dependencies
check_dependencies() {
    print_status "Checking dependencies..."
    
    if ! command -v node &> /dev/null; then
        print_error "Node.js is not installed. Please install Node.js 22.16 or higher."
        exit 1
    fi
    
    NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$NODE_VERSION" -lt "22" ]; then
        print_error "Node.js version $NODE_VERSION detected. Please upgrade to Node.js 22.16 or higher."
        exit 1
    fi
    
    if ! command -v pnpm &> /dev/null; then
        print_warning "pnpm is not installed. Installing pnpm..."
        npm install -g pnpm@10.11.1
    fi
    
    if [ "$DOCKER_MODE" = true ]; then
        if ! command -v docker &> /dev/null; then
            print_error "Docker is not installed. Please install Docker to use Docker mode."
            exit 1
        fi
    fi
    
    print_success "Dependencies check completed"
}

# Function to install dependencies
install_dependencies() {
    if [ "$SKIP_INSTALL" = true ]; then
        print_warning "Skipping dependency installation"
        return
    fi
    
    print_status "Installing dependencies..."
    pnpm install
    print_success "Dependencies installed"
}

# Function to build project
build_project() {
    if [ "$SKIP_BUILD" = true ]; then
        print_warning "Skipping build step"
        return
    fi
    
    print_status "Building project..."
    if [ "$PRODUCTION_MODE" = true ]; then
        pnpm run build
    else
        pnpm run build:backend
    fi
    print_success "Build completed"
}

# Function to start with Docker
start_with_docker() {
    print_status "Starting n8n with Docker..."
    
    # Check if volume exists, create if not
    if ! docker volume ls | grep -q "n8n_data"; then
        print_status "Creating Docker volume n8n_data..."
        docker volume create n8n_data
    fi
    
    print_status "Starting n8n container on port $DEFAULT_PORT..."
    docker run -it --rm --name n8n \
        -p $DEFAULT_PORT:5678 \
        -v n8n_data:/home/node/.n8n \
        docker.n8n.io/n8nio/n8n
}

# Function to start admin dashboard
start_admin_dashboard() {
    if [ "$RUN_ADMIN_DASHBOARD" = false ]; then
        return
    fi
    
    print_status "Starting Admin Dashboard on port $ADMIN_DASHBOARD_PORT..."
    cd packages/admin-dashboard
    
    if [ "$PRODUCTION_MODE" = true ]; then
        pnpm run build
        pnpm run start &
    else
        pnpm run dev &
    fi
    
    ADMIN_PID=$!
    cd ../..
    
    # Wait a moment for the server to start
    sleep 3
    print_success "Admin Dashboard started at http://localhost:$ADMIN_DASHBOARD_PORT"
}

# Function to start development server
start_development() {
    print_status "Starting n8n in development mode..."
    
    if [ "$RUN_E2E_SERVER" = true ]; then
        print_status "Starting E2E test server..."
        pnpm run dev:e2e:server &
    else
        pnpm run dev &
    fi
    
    N8N_PID=$!
    
    # Wait a moment for the server to start
    sleep 5
    print_success "n8n started at http://localhost:$DEFAULT_PORT"
}

# Function to start production server
start_production() {
    print_status "Starting n8n in production mode..."
    
    export NODE_ENV=production
    pnpm run start &
    N8N_PID=$!
    
    # Wait a moment for the server to start
    sleep 5
    print_success "n8n started at http://localhost:$DEFAULT_PORT"
}

# Function to setup environment
setup_environment() {
    print_status "Setting up environment..."
    
    # Create .env file if it doesn't exist
    if [ ! -f packages/cli/.env ]; then
        print_status "Creating default .env file..."
        cat > packages/cli/.env << EOF
# n8n Configuration
N8N_PORT=$DEFAULT_PORT
N8N_LOG_LEVEL=$N8N_LOG_LEVEL
N8N_PROTOCOL=http
N8N_HOST=localhost

# Database (default: SQLite)
DB_TYPE=sqlite
DB_SQLITE_DATABASE=database.sqlite

# Admin Dashboard
ADMIN_DASHBOARD_ENABLED=true
ADMIN_DASHBOARD_PORT=$ADMIN_DASHBOARD_PORT

# Security
N8N_ENCRYPTION_KEY=$(openssl rand -hex 32)
JWT_SECRET=$(openssl rand -hex 32)

# Development
N8N_SKIP_WEBHOOK_DEREGISTRATION_SHUTDOWN=true
EOF
        print_success "Default .env file created"
    fi
    
    # Export environment variables
    export N8N_PORT=$DEFAULT_PORT
    export N8N_LOG_LEVEL=$N8N_LOG_LEVEL
    export ADMIN_DASHBOARD_PORT=$ADMIN_DASHBOARD_PORT
}

# Function to cleanup on exit
cleanup() {
    print_status "Cleaning up processes..."
    
    if [ ! -z "$N8N_PID" ]; then
        kill $N8N_PID 2>/dev/null || true
    fi
    
    if [ ! -z "$ADMIN_PID" ]; then
        kill $ADMIN_PID 2>/dev/null || true
    fi
    
    # Kill any remaining node processes on our ports
    lsof -ti:$DEFAULT_PORT | xargs kill -9 2>/dev/null || true
    lsof -ti:$ADMIN_DASHBOARD_PORT | xargs kill -9 2>/dev/null || true
    
    print_success "Cleanup completed"
}

# Set up signal handlers
trap cleanup EXIT INT TERM

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -h|--help)
            show_help
            exit 0
            ;;
        -s|--skip-install)
            SKIP_INSTALL=true
            shift
            ;;
        -b|--skip-build)
            SKIP_BUILD=true
            shift
            ;;
        -p|--production)
            PRODUCTION_MODE=true
            shift
            ;;
        -d|--docker)
            DOCKER_MODE=true
            shift
            ;;
        --no-admin)
            RUN_ADMIN_DASHBOARD=false
            shift
            ;;
        --e2e)
            RUN_E2E_SERVER=true
            shift
            ;;
        --port)
            DEFAULT_PORT="$2"
            shift 2
            ;;
        --admin-port)
            ADMIN_DASHBOARD_PORT="$2"
            shift 2
            ;;
        *)
            print_error "Unknown option: $1"
            show_help
            exit 1
            ;;
    esac
done

# Main execution
print_status "Starting n8n setup..."
print_status "Mode: $([ "$PRODUCTION_MODE" = true ] && echo "Production" || echo "Development")"
print_status "n8n Port: $DEFAULT_PORT"
print_status "Admin Dashboard Port: $ADMIN_DASHBOARD_PORT"

if [ "$DOCKER_MODE" = true ]; then
    check_dependencies
    start_with_docker
else
    check_dependencies
    setup_environment
    install_dependencies
    build_project
    
    # Start admin dashboard first
    start_admin_dashboard
    
    # Start main n8n server
    if [ "$PRODUCTION_MODE" = true ]; then
        start_production
    else
        start_development
    fi
    
    print_success "All services started successfully!"
    print_status "n8n: http://localhost:$DEFAULT_PORT"
    if [ "$RUN_ADMIN_DASHBOARD" = true ]; then
        print_status "Admin Dashboard: http://localhost:$ADMIN_DASHBOARD_PORT"
    fi
    print_status "Press Ctrl+C to stop all services"
    
    # Wait for processes
    wait
fi
