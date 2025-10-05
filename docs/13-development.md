# Development Guide

## Development Setup

### Prerequisites

Before starting development, ensure you have the following installed:

- **Node.js**: Version 18.17.0 or later
- **npm**: Version 9.0.0 or later (comes with Node.js)
- **Git**: For version control
- **VS Code**: Recommended IDE with extensions

### Required VS Code Extensions

```json
{
  "recommendations": [
    "bradlc.vscode-tailwindcss",
    "ms-vscode.vscode-typescript-next",
    "esbenp.prettier-vscode",
    "ms-vscode.vscode-eslint",
    "formulahendry.auto-rename-tag",
    "christian-kohler.path-intellisense",
    "ms-vscode.vscode-json"
  ]
}
```

### Initial Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd new-client
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your configuration
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```

The application will be available at `http://localhost:3000`.

## Development Workflow

### Git Workflow

The project follows a Git flow branching strategy:

```
prod (production branch)
│  
└── prod-dev (dev branch)
```

#### Branch Naming Convention

- `feature/feature-name` - New features
- `bugfix/bug-description` - Bug fixes
- `hotfix/critical-issue` - Critical production fixes
- `refactor/component-name` - Code refactoring
- `chore/task-description` - Maintenance tasks
