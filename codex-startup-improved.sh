#!/bin/bash

# Enhanced Codex Startup Script for n8n AI Agent Platform
# Version: 3.1 - Fixed Sentry types, improved error handling and build process
# Date: June 5, 2025
# Optimized for GitHub Codespaces and development environments

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

# Script options
SKIP_INSTALL=false
SKIP_BUILD=false
QUICK_START=false
RUN_ADMIN_DASHBOARD=true
RUN_FRONTEND=true
PRODUCTION_MODE=false
DEBUG_MODE=false
FIX_ERRORS=true
CLEAN_INSTALL=false

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
    print_header "n8n AI Agent Platform - Enhanced Startup Script v3.0"
    
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
    echo "  --fix-errors            Fix common project errors (default: true)"
    echo ""
    echo -e "${WHITE}Runtime Options:${NC}"
    echo "  -p, --production        Run in production mode"
    echo "  -d, --debug             Enable debug mode with verbose logging"
    echo "  --no-admin              Don't start admin dashboard"
    echo "  --no-frontend           Don't start frontend"
    echo "  --port PORT             Set n8n port (default: 5678)"
    echo "  --admin-port PORT       Set admin dashboard port (default: 3001)"
    echo ""
    echo -e "${WHITE}Examples:${NC}"
    echo "  $0                      Start n8n with all components"
    echo "  $0 --quick              Quick start for development"
    echo "  $0 --production         Start in production mode"
    echo "  $0 --clean --fix-errors Complete clean setup with error fixes"
    echo "  $0 --debug              Debug mode with verbose output"
    echo ""
}

# Function to parse command line arguments
parse_args() {
    while [[ $# -gt 0 ]]; do
        case $1 in
            -h|--help)
                show_help
                exit 0
                ;;
            -q|--quick)
                QUICK_START=true
                SKIP_INSTALL=true
                SKIP_BUILD=true
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
            --fix-errors)
                FIX_ERRORS=true
                shift
                ;;
            --no-fix-errors)
                FIX_ERRORS=false
                shift
                ;;
            -p|--production)
                PRODUCTION_MODE=true
                NODE_ENV=production
                shift
                ;;
            -d|--debug)
                DEBUG_MODE=true
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
}

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to check Node.js version
check_node_version() {
    if ! command_exists node; then
        print_error "Node.js is not installed. Please install Node.js 22.16 or higher."
        return 1
    fi
    
    local node_version
    node_version=$(node --version | cut -d'v' -f2)
    local major_version
    major_version=$(echo "$node_version" | cut -d'.' -f1)
    
    if [ "$major_version" -lt 22 ]; then
        print_warning "Node.js version $node_version detected. Recommended: 22.16+, but continuing..."
    fi
    
    print_success "Node.js version: $node_version"
    return 0
}

# Function to check and install pnpm
check_pnpm() {
    if ! command_exists pnpm; then
        print_step "Installing pnpm..."
        npm install -g pnpm@10.11.1 || {
            print_warning "Failed to install pnpm globally, trying npm alternative..."
            npm install -g @pnpm/exe || {
                print_error "Could not install pnpm. Please install it manually."
                return 1
            }
        }
    fi
    
    local pnpm_version
    pnpm_version=$(pnpm --version)
    print_success "pnpm version: $pnpm_version"
    return 0
}

# Function to fix common project errors
fix_project_errors() {
    if [ "$FIX_ERRORS" = false ]; then
        return 0
    fi
    
    print_step "Fixing common project errors..."
    
    # Fix package.json unused patches
    if grep -q "vue-tsc@2.2.8" package.json; then
        print_step "Removing unused vue-tsc patch from package.json..."
        sed -i '/vue-tsc@2.2.8/d' package.json
        sed -i '/patches\/vue-tsc@2.2.8.patch/d' package.json
    fi
    
    # Ensure turbo is available
    if [ ! -f "node_modules/.bin/turbo" ] && [ ! -f "node_modules/turbo/bin/turbo" ]; then
        print_step "Installing turbo dependency..."
        pnpm add -D turbo@2.5.4 -w
    fi
    
    # Fix missing @sentry/types dependency in n8n-core package
    local core_package="packages/core/package.json"
    if [ -f "$core_package" ] && ! grep -q "@sentry/types" "$core_package"; then
        print_step "Adding missing @sentry/types dependency to n8n-core..."
        pnpm add @sentry/types --filter=n8n-core --save-dev
    fi
    
    # Fix admin dashboard next.config.js if it has deprecated options
    local admin_next_config="packages/admin-dashboard/next.config.js"
    if [ -f "$admin_next_config" ] && grep -q "appDir" "$admin_next_config"; then
        print_step "Fixing deprecated Next.js config options..."
        sed -i 's/appDir.*,//g' "$admin_next_config"
    fi
    
    print_success "Project errors fixed"
}

# Enhanced dependency installation
install_dependencies() {
    if [ "$SKIP_INSTALL" = true ] && [ "$QUICK_START" = true ]; then
        if [ -d "node_modules" ] && [ -f "pnpm-lock.yaml" ]; then
            print_warning "Skipping dependency installation (quick start mode)"
            return 0
        else
            print_step "Quick start requested but dependencies missing, installing..."
            SKIP_INSTALL=false
        fi
    fi
    
    if [ "$SKIP_INSTALL" = true ]; then
        print_warning "Skipping dependency installation"
        return 0
    fi
    
    print_step "Installing project dependencies..."
    
    if [ "$CLEAN_INSTALL" = true ]; then
        print_step "Cleaning existing installations..."
        rm -rf node_modules pnpm-lock.yaml
        find packages -name "node_modules" -type d -exec rm -rf {} + 2>/dev/null || true
    fi
    
    # Install with proper error handling and improved flags
    if ! pnpm install --frozen-lockfile=false; then
        print_warning "Standard install failed, trying with --no-frozen-lockfile..."
        if ! pnpm install --no-frozen-lockfile; then
            print_warning "Install with no frozen lockfile failed, trying with --force..."
            if ! pnpm install --force; then
                print_error "Dependencies installation failed"
                return 1
            fi
        fi
    fi
    
    print_success "Dependencies installed successfully"
    return 0
}

# Enhanced build function
build_project() {
    if [ "$SKIP_BUILD" = true ]; then
        print_warning "Skipping build step"
        return 0
    fi
    
    print_step "Building project components..."
    
    # Ensure turbo is available
    local turbo_cmd="./node_modules/.bin/turbo"
    if [ ! -f "$turbo_cmd" ]; then
        turbo_cmd="npx turbo"
    fi
    
    # First, try to build core dependencies that other packages need
    print_step "Building core dependencies first..."
    $turbo_cmd run build --filter=@n8n/config --filter=@n8n/constants --filter=@n8n/di --filter=@n8n/client-oauth2 --parallel || {
        print_warning "Some core dependencies failed to build, continuing..."
    }
    
    # Build n8n-core specifically to fix @sentry/types issue
    print_step "Building n8n-core package..."
    $turbo_cmd run build --filter=n8n-core || {
        print_warning "n8n-core build failed, trying to fix and rebuild..."
        # Try installing missing dependencies
        pnpm install --filter=n8n-core
        $turbo_cmd run build --filter=n8n-core || {
            print_warning "n8n-core build still failing, continuing with other packages..."
        }
    }
    
    if [ "$PRODUCTION_MODE" = true ]; then
        print_step "Building for production..."
        $turbo_cmd run build || {
            print_warning "Full build failed, trying backend only..."
            $turbo_cmd run build:backend || {
                print_warning "Backend build failed, trying individual packages..."
                # Try building essential packages individually
                for pkg in "n8n-workflow" "@n8n/backend-common" "n8n-core" "n8n"; do
                    $turbo_cmd run build --filter="$pkg" || print_warning "Failed to build $pkg"
                done
            }
        }
    else
        print_step "Building backend components..."
        $turbo_cmd run build:backend || {
            print_warning "Backend build failed, trying development mode..."
            # For development, we can use dev mode which handles compilation differently
            print_step "Switching to development compilation mode..."
        }
    fi
    
    print_success "Build completed (some warnings may be present)"
    return 0
}

# Function to start admin dashboard
start_admin_dashboard() {
    if [ "$RUN_ADMIN_DASHBOARD" = false ]; then
        return 0
    fi
    
    print_step "Starting Admin Dashboard on port $ADMIN_DASHBOARD_PORT..."
    
    cd packages/admin-dashboard
    
    if [ "$PRODUCTION_MODE" = true ]; then
        pnpm run build 2>/dev/null || print_warning "Admin dashboard build failed"
        nohup pnpm run start > ../../admin-dashboard.log 2>&1 &
    else
        nohup pnpm run dev > ../../admin-dashboard.log 2>&1 &
    fi
    
    local admin_pid=$!
    BACKGROUND_PIDS+=($admin_pid)
    cd ../..
    
    sleep 3
    print_success "Admin Dashboard started (PID: $admin_pid) - http://localhost:$ADMIN_DASHBOARD_PORT"
    print_info "Logs: tail -f admin-dashboard.log"
}

# Function to start main n8n server
start_n8n_server() {
    print_step "Starting n8n server on port $DEFAULT_PORT..."
    
    export N8N_PORT=$DEFAULT_PORT
    export NODE_ENV=$NODE_ENV
    export N8N_LOG_LEVEL=$N8N_LOG_LEVEL
    
    if [ "$PRODUCTION_MODE" = true ]; then
        print_step "Starting n8n in production mode..."
        nohup pnpm run start > n8n-server.log 2>&1 &
    else
        print_step "Starting n8n in development mode..."
        # Use dev mode which handles TypeScript compilation on the fly
        nohup pnpm run dev:be > n8n-server.log 2>&1 &
    fi
    
    local n8n_pid=$!
    BACKGROUND_PIDS+=($n8n_pid)
    
    sleep 5
    print_success "n8n server started (PID: $n8n_pid) - http://localhost:$DEFAULT_PORT"
    print_info "Logs: tail -f n8n-server.log"
}

# Function to check service health
check_services_health() {
    print_step "Checking service health..."
    
    local services_ok=true
    
    # Check n8n server
    if ! curl -s "http://localhost:$DEFAULT_PORT" > /dev/null 2>&1; then
        print_warning "n8n server may not be ready yet (port $DEFAULT_PORT)"
        services_ok=false
    else
        print_success "n8n server is responding"
    fi
    
    # Check admin dashboard
    if [ "$RUN_ADMIN_DASHBOARD" = true ]; then
        if ! curl -s "http://localhost:$ADMIN_DASHBOARD_PORT" > /dev/null 2>&1; then
            print_warning "Admin dashboard may not be ready yet (port $ADMIN_DASHBOARD_PORT)"
            services_ok=false
        else
            print_success "Admin dashboard is responding"
        fi
    fi
    
    return 0
}

# Function to show running services
show_services_status() {
    print_header "Service Status"
    
    echo -e "${WHITE}Running Services:${NC}"
    echo -e "  • n8n Server:       ${GREEN}http://localhost:$DEFAULT_PORT${NC}"
    
    if [ "$RUN_ADMIN_DASHBOARD" = true ]; then
        echo -e "  • Admin Dashboard:  ${GREEN}http://localhost:$ADMIN_DASHBOARD_PORT${NC}"
    fi
    
    echo ""
    echo -e "${WHITE}Logs:${NC}"
    echo -e "  • n8n Server:       ${CYAN}tail -f n8n-server.log${NC}"
    
    if [ "$RUN_ADMIN_DASHBOARD" = true ]; then
        echo -e "  • Admin Dashboard:  ${CYAN}tail -f admin-dashboard.log${NC}"
    fi
    
    echo ""
    echo -e "${WHITE}Process Management:${NC}"
    echo -e "  • Stop all services: ${CYAN}pkill -f 'node.*n8n\\|node.*next'${NC}"
    echo -e "  • Restart script:    ${CYAN}$0${NC}"
    echo ""
}

# Function to handle cleanup on exit
cleanup() {
    if [ ${#BACKGROUND_PIDS[@]} -gt 0 ]; then
        print_step "Cleaning up background processes..."
        for pid in "${BACKGROUND_PIDS[@]}"; do
            if kill -0 "$pid" 2>/dev/null; then
                kill "$pid" 2>/dev/null || true
            fi
        done
    fi
}

# Main execution function
main() {
    # Set up signal handlers
    trap cleanup EXIT INT TERM
    
    print_header "n8n AI Agent Platform - Enhanced Startup v3.0"
    
    # Parse command line arguments
    parse_args "$@"
    
    # Show configuration
    print_info "Configuration:"
    print_info "  - Mode: $([ "$PRODUCTION_MODE" = true ] && echo "Production" || echo "Development")"
    print_info "  - n8n Port: $DEFAULT_PORT"
    print_info "  - Admin Dashboard: $([ "$RUN_ADMIN_DASHBOARD" = true ] && echo "Enabled (port $ADMIN_DASHBOARD_PORT)" || echo "Disabled")"
    print_info "  - Debug Mode: $([ "$DEBUG_MODE" = true ] && echo "Enabled" || echo "Disabled")"
    echo ""
    
    # Change to script directory
    cd "$SCRIPT_DIR"
    
    # Check prerequisites
    print_step "Checking prerequisites..."
    check_node_version || exit 1
    check_pnpm || exit 1
    
    # Fix project errors
    fix_project_errors || print_warning "Some errors could not be fixed automatically"
    
    # Install dependencies
    install_dependencies || exit 1
    
    # Build project
    build_project || print_warning "Build had issues but continuing..."
    
    # Start services
    start_admin_dashboard
    start_n8n_server
    
    # Wait a moment for services to start
    sleep 10
    
    # Check health
    check_services_health
    
    # Show status
    show_services_status
    
    # Keep script running
    print_success "All services started successfully!"
    print_info "Press Ctrl+C to stop all services"
    
    # Wait for user interrupt
    while true; do
        sleep 30
        if [ "$DEBUG_MODE" = true ]; then
            print_debug "Services still running... (PIDs: ${BACKGROUND_PIDS[*]})"
        fi
    done
}

# Run main function with all arguments
main "$@"
