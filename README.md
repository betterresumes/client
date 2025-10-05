# Accunoda.ao

A modern web application for AI-powered financial risk assessment built with Next.js 15, React 19, and TypeScript.

## 🎯 Overview

This platform provides financial institutions, lenders, and risk analysts with advanced tools for predicting company default probabilities using machine learning models. The application features a multi-tenant architecture supporting different organizational levels and role-based access control.

## ⚡ Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Git

### Local Development Setup

```bash
# Clone the repository
git clone <repository-url>
cd new-client

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your configuration

# Start development server
npm run dev
```

The application will be available at `http://localhost:3000`

### Production Deployment

The application is deployed on Vercel with automatic deployment from the `prod` branch:

```bash
# Deploy to production
git checkout prod
git merge main
git push origin prod
```

Vercel automatically handles build optimization, CDN distribution, and environment management.

## 🏗️ Architecture

### Technology Stack
- **Framework**: Next.js 15 with App Router
- **UI Library**: React 19 
- **Language**: TypeScript
- **Styling**: Tailwind CSS + Radix UI
- **State Management**: Zustand + TanStack Query
- **Authentication**: JWT with automatic refresh
- **Deployment**: Vercel

### Key Features
- 🤖 AI-powered risk prediction engine
- 📊 Interactive analytics dashboard  
- 📤 Bulk file processing (CSV/Excel)
- 👥 Multi-tenant user management
- 🔐 Role-based access control
- 📱 Responsive design
- ⚡ Real-time data synchronization

## 🚀 Core Functionality

### Risk Analysis
- Individual company risk assessment
- Batch processing for portfolio analysis
- Historical trend analysis and forecasting
- Risk categorization and scoring

### Dashboard & Analytics
- Interactive data visualization
- Key performance indicators
- Portfolio risk distribution
- Export and reporting capabilities

### User Management
- Multi-level admin system (Super Admin, Tenant Admin, Org Admin)
- User invitation and onboarding
- Organization and tenant management
- Activity tracking and audit logs

## 📁 Project Structure

```
lient/
├── app/                    # Next.js App Router pages
│   ├── (auth)/            # Authentication pages
│   └── (dashboard)/       # Main application pages
├── components/            # Reusable React components
│   ├── ui/               # UI primitives
│   ├── auth/             # Authentication components
│   ├── dashboard/        # Dashboard features
│   └── admin/            # Admin panel components
├── lib/                   # Business logic and utilities
│   ├── api/              # API client and services
│   ├── stores/           # State management
│   ├── types/            # TypeScript definitions
│   └── utils/            # Helper functions
└── docs/                 # Comprehensive documentation
```

## 📚 Documentation

Comprehensive documentation is available in the `/docs` folder:

- [Application Overview](./docs/01-overview.md)
- [Frontend Architecture](./docs/02-architecture.md)  
- [Project Structure](./docs/03-project-structure.md)
- [Authentication System](./docs/04-authentication.md)
- [State Management](./docs/05-state-management.md)
- [API Integration](./docs/07-api-integration.md)
- [Dashboard Features](./docs/08-dashboard-features.md)
- [Admin Panel](./docs/09-admin-panel.md)
- [Configuration](./docs/12-configuration.md)
- [Development Guide](./docs/13-development.md)
- [Deployment](./docs/14-deployment.md)

## 🛠️ Development

### Available Scripts

```bash
# Development
npm run dev          # Start development server
npm run build        # Create production build
npm run start        # Start production server
npm run lint         # Run ESLint
npm run type-check   # Run TypeScript checks
```

### Environment Variables

```bash
# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1

```
