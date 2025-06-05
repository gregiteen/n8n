#!/bin/bash

# Codex Development Environment Setup Script
# Version: 1.0
# Purpose: Set up lightweight development environment for Codex
# Date: June 5, 2025

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
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Script options
CLEAN_INSTALL=false
FIX_ERRORS=true
SKIP_INSTALL=false

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

# Enhanced help function
show_help() {
    print_header "Codex Development Environment Setup"
    
    echo -e "${WHITE}Usage:${NC} $0 [OPTIONS]"
    echo ""
    echo -e "${WHITE}Options:${NC}"
    echo "  -h, --help              Show this help message"
    echo "  -c, --clean             Clean install (remove node_modules first)"
    echo "  -s, --skip-install      Skip dependency installation"
    echo "  --no-fix-errors         Don't fix common project errors"
    echo ""
    echo -e "${WHITE}Examples:${NC}"
    echo "  $0                      Quick setup for development"
    echo "  $0 --clean              Clean setup from scratch"
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
            -c|--clean)
                CLEAN_INSTALL=true
                shift
                ;;
            -s|--skip-install)
                SKIP_INSTALL=true
                shift
                ;;
            --no-fix-errors)
                FIX_ERRORS=false
                shift
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
    
    print_success "Project errors fixed"
}

# Enhanced dependency installation
install_dependencies() {
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

# Function to verify dev environment
verify_dev_environment() {
    print_step "Verifying development environment..."
    
    # Check if essential project files exist
    if [ -f "CODEX_README.md" ]; then
        print_success "Found Codex documentation"
    fi
    
    if [ -f "package.json" ]; then
        print_success "Found package.json"
    fi
    
    # Make scripts executable
    if [ -f "codex-startup.sh" ] && [ ! -x "codex-startup.sh" ]; then
        chmod +x codex-startup.sh
        print_success "Made codex-startup.sh executable"
    fi
    
    if [ -f "codex-startup-improved.sh" ] && [ ! -x "codex-startup-improved.sh" ]; then
        chmod +x codex-startup-improved.sh
        print_success "Made codex-startup-improved.sh executable"
    fi
    
    print_info "Dev environment is ready"
}

# Show available commands for development
show_available_commands() {
    print_header "Codex Development Commands"
    
    echo -e "${WHITE}Useful Commands for Development:${NC}"
    echo ""
    echo -e "${CYAN}• VS Code Tasks:${NC}"
    echo "  - n8n: Start Development Environment  # Quick start with minimal services"
    echo "  - n8n: Clean Install & Start          # Clean install with error fixes"
    echo "  - n8n: Stop All Services              # Stop any running services"
    echo ""
    echo -e "${CYAN}• Build & Installation:${NC}"
    echo "  pnpm install --frozen-lockfile=false  # Install dependencies"
    echo "  pnpm run build --filter=<package-name> # Build specific package"
    echo ""
    echo -e "${CYAN}• Development Workflow:${NC}"
    echo "  # Make changes to files"
    echo "  git add <changed-files>"
    echo "  git commit -m \"Your commit message\""
    echo "  git push"
    echo ""
    echo -e "${CYAN}• Stop any running processes:${NC}"
    echo "  pkill -f 'node.*n8n\\|node.*next'"
    echo ""
    echo -e "${WHITE}For more commands, check package.json scripts${NC}"
    echo ""
}

# Main execution function
main() {
    print_header "Codex Development Environment Setup"
    
    # Parse command line arguments
    parse_args "$@"
    
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
    
    # Verify development environment
    verify_dev_environment
    
    # Show available commands
    show_available_commands
    
    print_success "Codex development environment is ready!"
    print_info "You can now start working on tasks without running unnecessary services"
    print_info "To use VS Code tasks, press Ctrl+Shift+B or access the Tasks menu"
}

# Run main function with all arguments
main "$@"
