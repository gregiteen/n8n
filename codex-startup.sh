#!/bin/bash

# Enhanced Codex Startup Script for n8n AI Agent Platform
# Optimized for development, debugging, and production environments
# Version: 2.0

set -e

# Colors for beautiful output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
WHITE='\033[1;37m'
GRAY='\033[0;37m'
NC='\033[0m' # No Color

# Configuration
DEFAULT_PORT=5678
ADMIN_DASHBOARD_PORT=3001
FRONTEND_PORT=8080
NODE_ENV=${NODE_ENV:-development}
N8N_LOG_LEVEL=${N8N_LOG_LEVEL:-info}
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Script options with improved defaults
SKIP_INSTALL=false
SKIP_BUILD=false
QUICK_START=false
RUN_ADMIN_DASHBOARD=true
RUN_FRONTEND=true
RUN_E2E_SERVER=false
PRODUCTION_MODE=false
DOCKER_MODE=false
DEBUG_MODE=false
WATCH_MODE=true
HEALTH_CHECK=true
AUTO_OPEN=true

# Process management
declare -a BACKGROUND_PIDS=()

# Enhanced print functions with timestamps
timestamp() {
    date '+%Y-%m-%d %H:%M:%S'
}

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
    echo -e "${CYAN}[$(timestamp)]${NC} ${BLUE}▶${NC} $1"
}

print_success() {
    echo -e "${CYAN}[$(timestamp)]${NC} ${GREEN}✓${NC} $1"
}

print_warning() {
    echo -e "${CYAN}[$(timestamp)]${NC} ${YELLOW}⚠${NC} $1"
}

print_error() {
    echo -e "${CYAN}[$(timestamp)]${NC} ${RED}✗${NC} $1"
}

print_info() {
    echo -e "${CYAN}[$(timestamp)]${NC} ${WHITE}ℹ${NC} $1"
}

print_debug() {
    if [ "$DEBUG_MODE" = true ]; then
        echo -e "${CYAN}[$(timestamp)]${NC} ${GRAY}🐛${NC} $1"
    fi
}

# Enhanced help function
show_help() {
    print_header "n8n AI Agent Platform - Enhanced Startup Script"
    
    echo -e "${WHITE}Usage:${NC} $0 [OPTIONS]"
    echo ""
    echo -e "${WHITE}Quick Start Options:${NC}"
    echo "  -q, --quick             Quick start (skip install if deps exist)"
    echo "  -h, --help              Show this help message"
    echo ""
    echo -e "${WHITE}Installation & Build:${NC}"
    echo "  -s, --skip-install      Skip dependency installation"
    echo "  -b, --skip-build        Skip build step"
    echo "  --clean                 Clean install (remove node_modules first)"
    echo ""
    echo -e "${WHITE}Runtime Options:${NC}"
    echo "  -p, --production        Run in production mode"
    echo "  -d, --docker            Use Docker instead of local setup"
    echo "  --debug                 Enable debug mode with verbose logging"
    echo "  --no-watch              Disable file watching"
    echo "  --no-health             Skip health checks"
    echo "  --no-open               Don't auto-open browser"
    echo ""
    echo -e "${WHITE}Services:${NC}"
    echo "  --no-admin              Don't start admin dashboard"
    echo "  --no-frontend           Don't start frontend development server"
    echo "  --e2e                   Start E2E test server"
    echo ""
    echo -e "${WHITE}Port Configuration:${NC}"
    echo "  --port PORT             Set n8n port (default: 5678)"
    echo "  --admin-port PORT       Set admin dashboard port (default: 3001)"
    echo "  --frontend-port PORT    Set frontend port (default: 8080)"
    echo ""
    echo -e "${WHITE}Environment Variables:${NC}"
    echo "  NODE_ENV                Set environment (development/production)"
    echo "  N8N_LOG_LEVEL          Set log level (error/warn/info/debug)"
    echo "  N8N_USER_FOLDER        Custom user data folder"
    echo "  N8N_ENCRYPTION_KEY     Custom encryption key"
    echo ""
    echo -e "${WHITE}Examples:${NC}"
    echo "  $0 -q                   Quick start with all services"
    echo "  $0 --production         Production mode with optimizations"
    echo "  $0 --docker             Start using Docker"
    echo "  $0 -s -b --debug        Skip setup, enable debug mode"
    echo "  $0 --no-admin --no-frontend  Start only n8n core"
    echo "  $0 --e2e                Start E2E test environment"
    echo ""
}

# Enhanced dependency checking
check_dependencies() {
    print_step "Checking system dependencies..."
    
    local missing_deps=()
    
    # Check Node.js
    if ! command -v node &> /dev/null; then
        missing_deps+=("node")
    else
        local node_version=$(node --version | cut -d'v' -f2)
        local major_version=$(echo $node_version | cut -d'.' -f1)
        if [ "$major_version" -lt "22" ]; then
            print_warning "Node.js version $node_version detected. Recommended: v22.16+"
        else
            print_debug "Node.js version: $node_version ✓"
        fi
    fi
    
    # Check pnpm
    if ! command -v pnpm &> /dev/null; then
        print_warning "pnpm not found. Installing..."
        npm install -g pnpm@10.11.1 || {
            print_error "Failed to install pnpm globally. Trying corepack..."
            corepack enable
            corepack prepare pnpm@10.11.1 --activate
        }
    else
        print_debug "pnpm version: $(pnpm --version) ✓"
    fi
    
    # Docker check (if needed)
    if [ "$DOCKER_MODE" = true ]; then
        if ! command -v docker &> /dev/null; then
            missing_deps+=("docker")
        else
            print_debug "Docker version: $(docker --version | cut -d' ' -f3) ✓"
        fi
    fi
    
    # Report missing dependencies
    if [ ${#missing_deps[@]} -ne 0 ]; then
        print_error "Missing dependencies: ${missing_deps[*]}"
        print_info "Please install the missing dependencies and try again."
        exit 1
    fi
    
    print_success "All dependencies satisfied"
}

# Enhanced installation with progress
install_dependencies() {
    if [ "$SKIP_INSTALL" = true ]; then
        print_warning "Skipping dependency installation"
        return
    fi
    
    print_step "Installing project dependencies..."
    
    # Check if quick start is possible
    if [ "$QUICK_START" = true ] && [ -d "node_modules" ] && [ -f "pnpm-lock.yaml" ]; then
        print_info "Dependencies appear to exist, verifying..."
        if pnpm list --depth=0 &> /dev/null; then
            print_success "Dependencies verified, skipping installation"
            return
        fi
    fi
    
    # Clean install if requested
    if [ -n "$CLEAN_INSTALL" ]; then
        print_step "Cleaning existing installation..."
        rm -rf node_modules pnpm-lock.yaml
    fi
    
    # Install with progress indication
    print_step "Running pnpm install..."
    if [ "$DEBUG_MODE" = true ]; then
        pnpm install
    else
        pnpm install --reporter=silent
    fi
    
    print_success "Dependencies installed successfully"
}

# Intelligent build system
build_project() {
    if [ "$SKIP_BUILD" = true ]; then
        print_warning "Skipping build step"
        return
    fi
    
    print_step "Building project components..."
    
    if [ "$PRODUCTION_MODE" = true ]; then
        print_step "Building for production..."
        pnpm run build
    else
        print_step "Building backend components..."
        pnpm run build:backend
        
        if [ "$RUN_ADMIN_DASHBOARD" = true ]; then
            print_step "Building admin dashboard..."
            pnpm run build:admin
        fi
    fi
    
    print_success "Build completed successfully"
}

# Health check system
run_health_checks() {
    if [ "$HEALTH_CHECK" = false ]; then
        return
    fi
    
    print_step "Running health checks..."
    
    local checks_passed=0
    local total_checks=3
    
    # Check if ports are available
    if ! nc -z localhost $DEFAULT_PORT 2>/dev/null; then
        print_debug "Port $DEFAULT_PORT available ✓"
        ((checks_passed++))
    else
        print_warning "Port $DEFAULT_PORT is in use"
    fi
    
    # Check admin dashboard port
    if [ "$RUN_ADMIN_DASHBOARD" = true ]; then
        if ! nc -z localhost $ADMIN_DASHBOARD_PORT 2>/dev/null; then
            print_debug "Port $ADMIN_DASHBOARD_PORT available ✓"
            ((checks_passed++))
        else
            print_warning "Port $ADMIN_DASHBOARD_PORT is in use"
        fi
    else
        ((checks_passed++))
    fi
    
    # Check disk space
    local available_space=$(df . | awk 'NR==2 {print $4}')
    if [ "$available_space" -gt 1048576 ]; then  # 1GB in KB
        print_debug "Sufficient disk space available ✓"
        ((checks_passed++))
    else
        print_warning "Low disk space detected"
    fi
    
    if [ $checks_passed -eq $total_checks ]; then
        print_success "All health checks passed ($checks_passed/$total_checks)"
    else
        print_warning "Some health checks failed ($checks_passed/$total_checks)"
    fi
}

# Docker startup with enhanced configuration
start_with_docker() {
    print_header "Starting n8n with Docker"
    
    # Create custom Docker network if it doesn't exist
    if ! docker network ls | grep -q "n8n-network"; then
        print_step "Creating Docker network..."
        docker network create n8n-network
    fi
    
    # Create volume if it doesn't exist
    if ! docker volume ls | grep -q "n8n_data"; then
        print_step "Creating Docker volume..."
        docker volume create n8n_data
    fi
    
    # Enhanced Docker run with health checks
    print_step "Starting n8n container..."
    docker run -d --name n8n-instance \
        --network n8n-network \
        -p $DEFAULT_PORT:5678 \
        -v n8n_data:/home/node/.n8n \
        -e NODE_ENV=$NODE_ENV \
        -e N8N_LOG_LEVEL=$N8N_LOG_LEVEL \
        --health-cmd="curl -f http://localhost:5678/healthz || exit 1" \
        --health-interval=30s \
        --health-timeout=10s \
        --health-retries=3 \
        docker.n8n.io/n8nio/n8n
    
    print_success "n8n Docker container started"
    print_info "Container name: n8n-instance"
    print_info "Health checks enabled"
}

# Enhanced admin dashboard startup
start_admin_dashboard() {
    if [ "$RUN_ADMIN_DASHBOARD" = false ]; then
        return
    fi
    
    print_step "Starting Admin Dashboard..."
    
    cd packages/admin-dashboard
    
    if [ "$PRODUCTION_MODE" = true ]; then
        print_step "Starting in production mode..."
        pnpm run build:admin
        pnpm run start &
    else
        print_step "Starting in development mode..."
        if [ "$WATCH_MODE" = true ]; then
            pnpm run dev &
        else
            pnpm run dev --no-watch &
        fi
    fi
    
    local admin_pid=$!
    BACKGROUND_PIDS+=($admin_pid)
    cd ../..
    
    # Wait for service to be ready
    print_step "Waiting for admin dashboard to be ready..."
    local retry_count=0
    while ! nc -z localhost $ADMIN_DASHBOARD_PORT && [ $retry_count -lt 30 ]; do
        sleep 1
        ((retry_count++))
    done
    
    if [ $retry_count -lt 30 ]; then
        print_success "Admin Dashboard ready at http://localhost:$ADMIN_DASHBOARD_PORT"
    else
        print_warning "Admin Dashboard may still be starting..."
    fi
}

# Enhanced frontend development server
start_frontend() {
    if [ "$RUN_FRONTEND" = false ]; then
        return
    fi
    
    print_step "Starting Frontend Development Server..."
    
    cd packages/editor-ui
    
    if [ "$WATCH_MODE" = true ]; then
        pnpm run dev &
    else
        pnpm run dev --no-watch &
    fi
    
    local frontend_pid=$!
    BACKGROUND_PIDS+=($frontend_pid)
    cd ../..
    
    print_success "Frontend server starting at http://localhost:$FRONTEND_PORT"
}

# Enhanced n8n core startup
start_n8n_core() {
    print_step "Starting n8n core application..."
    
    # Set environment variables
    export NODE_ENV=$NODE_ENV
    export N8N_LOG_LEVEL=$N8N_LOG_LEVEL
    export N8N_PORT=$DEFAULT_PORT
    
    if [ "$DEBUG_MODE" = true ]; then
        export DEBUG="n8n:*"
        export N8N_LOG_LEVEL="debug"
    fi
    
    if [ "$PRODUCTION_MODE" = true ]; then
        print_step "Starting in production mode..."
        pnpm run start &
    elif [ "$RUN_E2E_SERVER" = true ]; then
        print_step "Starting E2E test server..."
        pnpm run dev:e2e:server &
    else
        print_step "Starting in development mode..."
        if [ "$WATCH_MODE" = true ]; then
            pnpm run dev &
        else
            pnpm run dev --no-watch &
        fi
    fi
    
    local n8n_pid=$!
    BACKGROUND_PIDS+=($n8n_pid)
    
    # Wait for n8n to be ready
    print_step "Waiting for n8n to be ready..."
    local retry_count=0
    while ! nc -z localhost $DEFAULT_PORT && [ $retry_count -lt 60 ]; do
        sleep 1
        ((retry_count++))
    done
    
    if [ $retry_count -lt 60 ]; then
        print_success "n8n core ready at http://localhost:$DEFAULT_PORT"
    else
        print_warning "n8n may still be starting..."
    fi
}

# Browser auto-open
open_browser() {
    if [ "$AUTO_OPEN" = false ]; then
        return
    fi
    
    print_step "Opening browser..."
    
    # Detect platform and open browser
    if command -v xdg-open &> /dev/null; then
        xdg-open "http://localhost:$DEFAULT_PORT" &
    elif command -v open &> /dev/null; then
        open "http://localhost:$DEFAULT_PORT" &
    else
        print_info "Please open http://localhost:$DEFAULT_PORT in your browser"
    fi
}

# Enhanced monitoring and status display
show_status() {
    print_header "Service Status"
    
    echo -e "${WHITE}Active Services:${NC}"
    
    # Check n8n core
    if nc -z localhost $DEFAULT_PORT 2>/dev/null; then
        echo -e "  ${GREEN}✓${NC} n8n Core: http://localhost:$DEFAULT_PORT"
    else
        echo -e "  ${RED}✗${NC} n8n Core: Not responding"
    fi
    
    # Check admin dashboard
    if [ "$RUN_ADMIN_DASHBOARD" = true ]; then
        if nc -z localhost $ADMIN_DASHBOARD_PORT 2>/dev/null; then
            echo -e "  ${GREEN}✓${NC} Admin Dashboard: http://localhost:$ADMIN_DASHBOARD_PORT"
        else
            echo -e "  ${RED}✗${NC} Admin Dashboard: Not responding"
        fi
    fi
    
    # Check frontend
    if [ "$RUN_FRONTEND" = true ]; then
        if nc -z localhost $FRONTEND_PORT 2>/dev/null; then
            echo -e "  ${GREEN}✓${NC} Frontend Dev: http://localhost:$FRONTEND_PORT"
        else
            echo -e "  ${RED}✗${NC} Frontend Dev: Not responding"
        fi
    fi
    
    echo ""
    echo -e "${WHITE}Background Processes:${NC} ${#BACKGROUND_PIDS[@]}"
    echo -e "${WHITE}Environment:${NC} $NODE_ENV"
    echo -e "${WHITE}Log Level:${NC} $N8N_LOG_LEVEL"
    echo ""
}

# Graceful shutdown
cleanup() {
    print_header "Shutting Down Services"
    
    for pid in "${BACKGROUND_PIDS[@]}"; do
        if kill -0 $pid 2>/dev/null; then
            print_step "Stopping process $pid..."
            kill -TERM $pid
        fi
    done
    
    # Wait for graceful shutdown
    sleep 2
    
    # Force kill if necessary
    for pid in "${BACKGROUND_PIDS[@]}"; do
        if kill -0 $pid 2>/dev/null; then
            print_warning "Force stopping process $pid..."
            kill -KILL $pid
        fi
    done
    
    print_success "All services stopped"
}

# Trap signals for graceful shutdown
trap cleanup EXIT INT TERM

# Parse command line arguments
parse_arguments() {
    while [[ $# -gt 0 ]]; do
        case $1 in
            -h|--help)
                show_help
                exit 0
                ;;
            -q|--quick)
                QUICK_START=true
                shift
                ;;
            -s|--skip-install)
                SKIP_INSTALL=true
                shift
                ;;
            -b|--skip-build)
                SKIP_BUILD=true
                shift
                ;;
            --clean)
                CLEAN_INSTALL=true
                shift
                ;;
            -p|--production)
                PRODUCTION_MODE=true
                NODE_ENV=production
                WATCH_MODE=false
                shift
                ;;
            -d|--docker)
                DOCKER_MODE=true
                shift
                ;;
            --debug)
                DEBUG_MODE=true
                N8N_LOG_LEVEL=debug
                shift
                ;;
            --no-watch)
                WATCH_MODE=false
                shift
                ;;
            --no-health)
                HEALTH_CHECK=false
                shift
                ;;
            --no-open)
                AUTO_OPEN=false
                shift
                ;;
            --no-admin)
                RUN_ADMIN_DASHBOARD=false
                shift
                ;;
            --no-frontend)
                RUN_FRONTEND=false
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
            --frontend-port)
                FRONTEND_PORT="$2"
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

# Main execution flow
main() {
    # Change to script directory
    cd "$SCRIPT_DIR"
    
    # Parse arguments
    parse_arguments "$@"
    
    # Show startup banner
    print_header "n8n AI Agent Platform - Enhanced Startup"
    
    print_info "Configuration:"
    print_info "  • Environment: $NODE_ENV"
    print_info "  • n8n Port: $DEFAULT_PORT"
    print_info "  • Admin Port: $ADMIN_DASHBOARD_PORT"
    print_info "  • Debug Mode: $DEBUG_MODE"
    print_info "  • Watch Mode: $WATCH_MODE"
    echo ""
    
    # Execute startup sequence
    if [ "$DOCKER_MODE" = true ]; then
        check_dependencies
        start_with_docker
    else
        check_dependencies
        run_health_checks
        install_dependencies
        build_project
        
        # Start services
        start_admin_dashboard &
        start_frontend &
        start_n8n_core
        
        # Wait for all services to be ready
        sleep 3
        
        # Show status and open browser
        show_status
        open_browser
        
        # Keep script running and show periodic status
        print_success "All services started successfully!"
        print_info "Press Ctrl+C to stop all services"
        
        # Monitor services
        while true; do
            sleep 30
            if [ "$DEBUG_MODE" = true ]; then
                show_status
            fi
        done
    fi
}

# Check if script is being sourced or executed
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi
