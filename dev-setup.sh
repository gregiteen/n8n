#!/bin/bash

# n8n Developer Setup Script
# A comprehensive setup script for new developers joining the n8n project
# This script handles everything from initial setup to running the development environment

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
PNPM_VERSION="10.11.1"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Developer options
SETUP_GIT_HOOKS=true
SETUP_VSCODE=true
RUN_TESTS=false
INSTALL_RECOMMENDED_EXTENSIONS=true
SETUP_DATABASE=true
INTERACTIVE_MODE=true

# Function to print colored output
print_header() {
    echo -e "\n${PURPLE}============================================${NC}"
    echo -e "${PURPLE}  $1${NC}"
    echo -e "${PURPLE}============================================${NC}\n"
}

print_step() {
    echo -e "${CYAN}[STEP]${NC} $1"
}

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

print_note() {
    echo -e "${YELLOW}[NOTE]${NC} $1"
}

# Function to ask yes/no questions
ask_yes_no() {
    local question="$1"
    local default="${2:-y}"
    
    if [ "$INTERACTIVE_MODE" = false ]; then
        return 0
    fi
    
    while true; do
        if [ "$default" = "y" ]; then
            read -p "$question [Y/n]: " answer
            answer=${answer:-y}
        else
            read -p "$question [y/N]: " answer
            answer=${answer:-n}
        fi
        
        case $answer in
            [Yy]* ) return 0;;
            [Nn]* ) return 1;;
            * ) echo "Please answer yes or no.";;
        esac
    done
}

# Function to show welcome message
show_welcome() {
    clear
    print_header "Welcome to n8n Development Setup!"
    echo -e "This script will help you set up your development environment for n8n."
    echo -e "It will:"
    echo -e "  • Check and install required dependencies"
    echo -e "  • Set up the development environment"
    echo -e "  • Configure Git hooks and VS Code"
    echo -e "  • Install project dependencies"
    echo -e "  • Build the project"
    echo -e "  • Start the development servers"
    echo -e ""
    echo -e "Estimated time: 5-15 minutes (depending on your internet speed)"
    echo -e ""
    
    if ask_yes_no "Do you want to continue with the setup?"; then
        echo ""
    else
        print_status "Setup cancelled. You can run this script again anytime."
        exit 0
    fi
}

# Function to show help
show_help() {
    echo "n8n Developer Setup Script"
    echo ""
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  -h, --help              Show this help message"
    echo "  -y, --yes               Auto-answer yes to all prompts (non-interactive)"
    echo "  --no-git-hooks          Skip Git hooks setup"
    echo "  --no-vscode             Skip VS Code configuration"
    echo "  --with-tests            Run tests after setup"
    echo "  --no-extensions         Skip VS Code extension installation"
    echo "  --no-database           Skip database setup"
    echo ""
    echo "Examples:"
    echo "  $0                      Interactive setup (recommended for first time)"
    echo "  $0 -y                   Quick setup with defaults"
    echo "  $0 --with-tests         Setup and run tests"
}

# Function to check system requirements
check_system_requirements() {
    print_step "Checking system requirements..."
    
    # Check operating system
    if [[ "$OSTYPE" == "linux-gnu"* ]]; then
        OS="Linux"
    elif [[ "$OSTYPE" == "darwin"* ]]; then
        OS="macOS"
    elif [[ "$OSTYPE" == "msys" ]] || [[ "$OSTYPE" == "cygwin" ]]; then
        OS="Windows"
    else
        print_warning "Unknown operating system: $OSTYPE"
        OS="Unknown"
    fi
    
    print_status "Operating System: $OS"
    
    # Check available memory
    if command -v free &> /dev/null; then
        MEMORY_GB=$(free -g | awk '/^Mem:/{print $2}')
        if [ "$MEMORY_GB" -lt 8 ]; then
            print_warning "Less than 8GB RAM detected. You may experience performance issues."
        fi
        print_status "Available Memory: ${MEMORY_GB}GB"
    fi
    
    # Check disk space
    DISK_SPACE=$(df -h . | awk 'NR==2{print $4}')
    print_status "Available Disk Space: $DISK_SPACE"
    
    print_success "System requirements check completed"
}

# Function to check and install Node.js
check_nodejs() {
    print_step "Checking Node.js installation..."
    
    if ! command -v node &> /dev/null; then
        print_error "Node.js is not installed!"
        print_status "Please install Node.js $NODE_MIN_VERSION.x LTS from: https://nodejs.org/"
        
        if [[ "$OS" == "macOS" ]] && command -v brew &> /dev/null; then
            if ask_yes_no "Would you like to install Node.js using Homebrew?"; then
                brew install node@$NODE_MIN_VERSION
            fi
        elif [[ "$OS" == "Linux" ]] && command -v apt-get &> /dev/null; then
            if ask_yes_no "Would you like to install Node.js using apt?"; then
                curl -fsSL https://deb.nodesource.com/setup_${NODE_MIN_VERSION}.x | sudo -E bash -
                sudo apt-get install -y nodejs
            fi
        else
            exit 1
        fi
    fi
    
    NODE_VERSION=$(node --version | cut -d'v' -f2)
    NODE_MAJOR=$(echo $NODE_VERSION | cut -d'.' -f1)
    
    if [ "$NODE_MAJOR" -lt "$NODE_MIN_VERSION" ]; then
        print_error "Node.js version $NODE_VERSION detected. Please upgrade to Node.js $NODE_MIN_VERSION.x or higher."
        exit 1
    fi
    
    print_success "Node.js $NODE_VERSION ✓"
}

# Function to check and install pnpm
check_pnpm() {
    print_step "Checking pnpm installation..."
    
    if ! command -v pnpm &> /dev/null; then
        print_status "Installing pnpm $PNPM_VERSION..."
        npm install -g pnpm@$PNPM_VERSION
    else
        CURRENT_PNPM=$(pnpm --version)
        print_status "Found pnpm $CURRENT_PNPM"
        
        if ask_yes_no "Would you like to update to the recommended version ($PNPM_VERSION)?"; then
            npm install -g pnpm@$PNPM_VERSION
        fi
    fi
    
    print_success "pnpm $(pnpm --version) ✓"
}

# Function to check Git configuration
check_git_config() {
    print_step "Checking Git configuration..."
    
    if ! git config user.name &> /dev/null; then
        print_warning "Git user.name is not set"
        if ask_yes_no "Would you like to set it now?"; then
            read -p "Enter your full name: " git_name
            git config --global user.name "$git_name"
        fi
    fi
    
    if ! git config user.email &> /dev/null; then
        print_warning "Git user.email is not set"
        if ask_yes_no "Would you like to set it now?"; then
            read -p "Enter your email: " git_email
            git config --global user.email "$git_email"
        fi
    fi
    
    print_success "Git user: $(git config user.name) <$(git config user.email)> ✓"
}

# Function to setup Git hooks
setup_git_hooks() {
    if [ "$SETUP_GIT_HOOKS" = false ]; then
        return
    fi
    
    print_step "Setting up Git hooks..."
    
    if command -v lefthook &> /dev/null || [ -f "lefthook.yml" ]; then
        print_status "Installing lefthook hooks..."
        if command -v pnpm &> /dev/null; then
            pnpm run prepare
        else
            npm run prepare
        fi
        print_success "Git hooks installed ✓"
    else
        print_warning "lefthook not found, skipping Git hooks setup"
    fi
}

# Function to setup VS Code
setup_vscode() {
    if [ "$SETUP_VSCODE" = false ]; then
        return
    fi
    
    print_step "Setting up VS Code configuration..."
    
    # Create .vscode directory if it doesn't exist
    mkdir -p .vscode
    
    # Setup recommended settings
    if [ ! -f ".vscode/settings.json" ]; then
        print_status "Creating VS Code settings..."
        cat > .vscode/settings.json << 'EOF'
{
  "typescript.preferences.importModuleSpecifier": "relative",
  "typescript.suggest.autoImports": true,
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": "explicit",
    "source.organizeImports": "explicit"
  },
  "files.associations": {
    "*.jsonc": "jsonc"
  },
  "search.exclude": {
    "**/node_modules": true,
    "**/dist": true,
    "**/.turbo": true,
    "**/coverage": true
  },
  "eslint.workingDirectories": [
    "packages/admin-dashboard",
    "packages/cli",
    "packages/core",
    "packages/frontend"
  ],
  "biome.enabled": true,
  "editor.defaultFormatter": "biomejs.biome"
}
EOF
        print_success "VS Code settings created ✓"
    fi
    
    # Setup recommended extensions
    if [ "$INSTALL_RECOMMENDED_EXTENSIONS" = true ]; then
        print_status "Creating VS Code extensions recommendations..."
        cat > .vscode/extensions.json << 'EOF'
{
  "recommendations": [
    "biomejs.biome",
    "esbenp.prettier-vscode",
    "bradlc.vscode-tailwindcss",
    "ms-vscode.vscode-typescript-next",
    "ms-vscode.vscode-json",
    "redhat.vscode-yaml",
    "ms-vscode.vscode-eslint",
    "formulahendry.auto-rename-tag",
    "christian-kohler.path-intellisense",
    "ms-vscode.vscode-json5",
    "ms-playwright.playwright"
  ]
}
EOF
        print_success "VS Code extensions recommendations created ✓"
        
        if command -v code &> /dev/null; then
            if ask_yes_no "Would you like to install the recommended VS Code extensions now?"; then
                print_status "Installing VS Code extensions..."
                code --install-extension biomejs.biome
                code --install-extension esbenp.prettier-vscode
                code --install-extension bradlc.vscode-tailwindcss
                code --install-extension ms-vscode.vscode-typescript-next
                code --install-extension ms-vscode.vscode-eslint
                print_success "VS Code extensions installed ✓"
            fi
        fi
    fi
}

# Function to install dependencies
install_dependencies() {
    print_step "Installing project dependencies..."
    
    print_status "This may take a few minutes..."
    pnpm install
    
    print_success "Dependencies installed ✓"
}

# Function to build project
build_project() {
    print_step "Building the project..."
    
    print_status "Building backend services..."
    pnpm run build:backend
    
    print_success "Project built ✓"
}

# Function to setup database
setup_database() {
    if [ "$SETUP_DATABASE" = false ]; then
        return
    fi
    
    print_step "Setting up database..."
    
    # Create .env file if it doesn't exist
    if [ ! -f "packages/cli/.env" ]; then
        print_status "Creating default .env configuration..."
        mkdir -p packages/cli
        cat > packages/cli/.env << EOF
# n8n Configuration
N8N_PORT=5678
N8N_LOG_LEVEL=info
N8N_PROTOCOL=http
N8N_HOST=localhost

# Database (default: SQLite)
DB_TYPE=sqlite
DB_SQLITE_DATABASE=database.sqlite

# Admin Dashboard
ADMIN_DASHBOARD_ENABLED=true
ADMIN_DASHBOARD_PORT=3001

# Security
N8N_ENCRYPTION_KEY=$(openssl rand -hex 32)
JWT_SECRET=$(openssl rand -hex 32)

# Development
N8N_SKIP_WEBHOOK_DEREGISTRATION_SHUTDOWN=true
N8N_ENFORCE_SETTINGS_FILE_PERMISSIONS=false

# Debugging
N8N_DEBUG=false
EOF
        print_success "Database configuration created ✓"
    else
        print_status "Using existing .env configuration ✓"
    fi
}

# Function to run tests
run_tests() {
    if [ "$RUN_TESTS" = false ]; then
        return
    fi
    
    print_step "Running tests..."
    
    print_status "Running unit tests..."
    pnpm run test
    
    print_success "Tests completed ✓"
}

# Function to show next steps
show_next_steps() {
    print_header "Setup Complete! 🎉"
    
    echo -e "Your n8n development environment is ready!"
    echo -e ""
    echo -e "${GREEN}Next steps:${NC}"
    echo -e "  1. Start the development server:"
    echo -e "     ${CYAN}./start.sh${NC}"
    echo -e ""
    echo -e "  2. Open your browser and visit:"
    echo -e "     ${CYAN}http://localhost:5678${NC} - n8n main application"
    echo -e "     ${CYAN}http://localhost:3001${NC} - Admin dashboard"
    echo -e ""
    echo -e "${GREEN}Useful commands:${NC}"
    echo -e "  • ${CYAN}pnpm run dev${NC} - Start development server"
    echo -e "  • ${CYAN}pnpm run build${NC} - Build the project"
    echo -e "  • ${CYAN}pnpm run test${NC} - Run tests"
    echo -e "  • ${CYAN}pnpm run lint${NC} - Run linting"
    echo -e "  • ${CYAN}pnpm run format${NC} - Format code"
    echo -e ""
    echo -e "${GREEN}Documentation:${NC}"
    echo -e "  • README.md - Project overview"
    echo -e "  • DEVELOPER_GUIDE.md - Development guidelines"
    echo -e "  • CONTRIBUTING.md - Contribution guidelines"
    echo -e ""
    echo -e "${GREEN}Need help?${NC}"
    echo -e "  • Check the documentation in the repository"
    echo -e "  • Ask in the team Slack channel"
    echo -e "  • Create an issue on GitHub"
    echo -e ""
    
    if ask_yes_no "Would you like to start the development server now?"; then
        print_status "Starting development server..."
        ./start.sh
    fi
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -h|--help)
            show_help
            exit 0
            ;;
        -y|--yes)
            INTERACTIVE_MODE=false
            shift
            ;;
        --no-git-hooks)
            SETUP_GIT_HOOKS=false
            shift
            ;;
        --no-vscode)
            SETUP_VSCODE=false
            shift
            ;;
        --with-tests)
            RUN_TESTS=true
            shift
            ;;
        --no-extensions)
            INSTALL_RECOMMENDED_EXTENSIONS=false
            shift
            ;;
        --no-database)
            SETUP_DATABASE=false
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
    # Change to script directory
    cd "$SCRIPT_DIR"
    
    show_welcome
    check_system_requirements
    check_nodejs
    check_pnpm
    check_git_config
    setup_git_hooks
    setup_vscode
    install_dependencies
    build_project
    setup_database
    run_tests
    show_next_steps
}

# Run main function
main "$@"
