# n8n Enhanced Startup Script v3.0

This enhanced startup script provides a robust and user-friendly way to run the n8n AI Agent Platform in various environments, especially optimized for GitHub Codespaces and development workflows.

## ✨ What's Fixed

### Project Errors Resolved:
- ✅ Fixed incomplete `@apply` directive warnings in CSS files
- ✅ Removed unused `vue-tsc@2.2.8` patch from package.json
- ✅ Fixed deprecated Next.js `appDir` configuration in admin dashboard
- ✅ Ensured turbo dependency is properly installed and available
- ✅ Improved error handling for dependency installation
- ✅ Fixed permission issues with global package installations

### Script Improvements:
- 🚀 **Smart dependency detection** - skips install if dependencies exist in quick mode
- 🔧 **Automatic error fixing** - detects and fixes common project issues
- 📝 **Enhanced logging** - beautiful colored output with timestamps
- ⚡ **Performance optimized** - faster startup with intelligent caching
- 🛡️ **Robust error handling** - graceful degradation when builds fail
- 🔄 **Process management** - proper cleanup of background services
- 📊 **Health monitoring** - checks service availability after startup

## 🚀 Quick Start

```bash
# Quick development start (recommended)
./codex-startup-improved.sh --quick

# Complete clean setup (when things are broken)
./codex-startup-improved.sh --clean --fix-errors

# Production mode
./codex-startup-improved.sh --production
```

## 📋 Available Options

### Quick Start Options:
- `-q, --quick` - Quick start (skip install if deps exist)
- `-h, --help` - Show help message

### Installation & Build:
- `-s, --skip-install` - Skip dependency installation
- `-b, --skip-build` - Skip build step
- `--clean` - Clean install (remove node_modules first)
- `--fix-errors` - Fix common project errors (default: true)

### Runtime Options:
- `-p, --production` - Run in production mode
- `-d, --debug` - Enable debug mode with verbose logging
- `--no-admin` - Don't start admin dashboard
- `--no-frontend` - Don't start frontend
- `--port PORT` - Set n8n port (default: 5678)
- `--admin-port PORT` - Set admin dashboard port (default: 3001)

## 🌐 Service URLs

When the script starts successfully, you'll have access to:

- **n8n Server**: http://localhost:5678
- **Admin Dashboard**: http://localhost:3001

## 📊 VS Code Tasks

The script also configures several VS Code tasks for easy development:

1. **n8n: Start Development Environment** - Quick start with existing deps
2. **n8n: Clean Install & Start** - Complete clean setup
3. **n8n: Build Admin Dashboard** - Build admin dashboard only
4. **n8n: Lint Admin Dashboard** - Run linting on admin dashboard
5. **n8n: Start Admin Dashboard Only** - Start just the admin dashboard
6. **n8n: Stop All Services** - Stop all running services

Access these via `Ctrl+Shift+P` → "Tasks: Run Task"

## 🔧 Troubleshooting

### Common Issues and Solutions:

1. **"turbo: not found"**
   - Solution: Run with `--fix-errors` flag or `--clean` flag

2. **Dependencies installation fails**
   - Solution: Run `./codex-startup-improved.sh --clean`

3. **Build failures**
   - Solution: The script will attempt backend-only build as fallback

4. **Port conflicts**
   - Solution: Use `--port` and `--admin-port` to specify different ports

5. **Service not responding**
   - Solution: Check logs with `tail -f n8n-server.log` or `tail -f admin-dashboard.log`

### Log Files:
- **n8n Server**: `n8n-server.log`
- **Admin Dashboard**: `admin-dashboard.log`

### Manual Service Management:
```bash
# Stop all services
pkill -f 'node.*n8n|node.*next'

# Check running processes
ps aux | grep -E 'node.*(n8n|next)'

# View logs
tail -f n8n-server.log
tail -f admin-dashboard.log
```

## 🎯 Use Cases

### For Development:
```bash
./codex-startup-improved.sh --quick --debug
```

### For Production:
```bash
./codex-startup-improved.sh --production
```

### When Things Break:
```bash
./codex-startup-improved.sh --clean --fix-errors
```

### For Testing Admin Dashboard Only:
```bash
./codex-startup-improved.sh --no-frontend --skip-build
```

## 🔄 Version History

### v3.0 (Current)
- Enhanced error detection and fixing
- Improved dependency management
- Better logging and user experience
- Robust service health checking
- VS Code tasks integration

### v2.0
- Added production mode support
- Enhanced process management
- Improved error handling

### v1.0
- Basic startup functionality
- Simple service orchestration

## 🤝 Contributing

If you encounter issues or have suggestions for improvements, please check the project's main documentation and contribute through the standard development workflow.

---

**Happy coding with n8n! 🎉**
