# Frontend Architecture Documentation

This documentation provides comprehensive coverage of the Financial Risk Prediction Application's frontend architecture, built with Next.js 15, React 19, and TypeScript.

## Core Architecture Documents

### Foundation & Structure
1. **[Application Overview](./01-overview.md)** - Business purpose, features, and technology stack
2. **[Frontend Architecture](./02-architecture.md)** - Architectural principles, patterns, and design decisions
3. **[Project Structure](./03-project-structure.md)** - File organization and development workflow

### Authentication & Security
4. **[Authentication System](./04-authentication.md)** - JWT authentication, RBAC, and multi-tenant security
5. **[State Management](./05-state-management.md)** - Zustand stores and TanStack Query integration

### Core Implementation
6. **[Core Pages & Components](./16-core-pages-components.md)** - Page architecture and core component system
7. **[API Client & Integration](./17-api-client-integration.md)** - Centralized API client and backend communication

### Feature Documentation  
8. **[Dashboard Features](./08-dashboard-features.md)** - Risk analysis, bulk processing, and data visualization
9. **[Admin Panel](./09-admin-panel.md)** - User management and system administration

### Technical Details
10. **[Component Library](./06-components.md)** - Component patterns and architecture
11. **[UI Components](./10-ui-components.md)** - Design system and Radix UI integration
12. **[TypeScript Types](./11-types.md)** - Type system and data models
13. **[Configuration](./12-configuration.md)** - Environment and build configuration

### Development & Operations
14. **[Development Guide](./13-development.md)** - Workflow, standards, and best practices
15. **[Deployment](./14-deployment.md)** - Build, deployment, and environment management
15. [Troubleshooting](./15-troubleshooting.md)

## Quick Start

1. **Installation**
   ```bash
   npm install
   ```

2. **Development**
   ```bash
   npm run dev
   ```

3. **Build**
   ```bash
   npm run build
   ```

4. **Production**
   ```bash
   npm start
   ```

## Technology Stack Overview

**Core Framework**
- Next.js 15 with App Router for modern React development
- React 19 with latest features and performance improvements
- TypeScript for type safety and enhanced developer experience

**State Management**
- Zustand for lightweight client-side state management
- TanStack Query for server state, caching, and synchronization
- Persistent storage for user preferences and authentication

**UI & Styling**
- Radix UI for accessible, unstyled component primitives
- Tailwind CSS for utility-first styling and responsive design
- Custom design system with consistent theming

## Architecture Highlights

**Multi-Tenant Support**
Role-based access control with organization and tenant isolation, supporting super admins, tenant admins, and regular users with appropriate data access.

**Performance Optimization**
Code splitting, lazy loading, intelligent caching, and optimistic updates ensure fast loading times and smooth user interactions.

**Security Implementation**
JWT authentication with automatic token refresh, secure storage, route protection, and comprehensive authorization at multiple levels.

**Developer Experience**
TypeScript integration, consistent coding patterns, comprehensive error handling, and clear separation of concerns for maintainable code.

## Quick Navigation Guide

**For New Developers**
1. Start with [Application Overview](./01-overview.md) to understand business context
2. Review [Frontend Architecture](./02-architecture.md) for design principles  
3. Follow [Development Guide](./13-development.md) for setup and workflows

**For Feature Development**
- [Core Pages & Components](./16-core-pages-components.md) for UI development
- [API Client & Integration](./17-api-client-integration.md) for backend communication
- [State Management](./05-state-management.md) for data handling

**For System Understanding**
- [Authentication System](./04-authentication.md) for security implementation
- [Dashboard Features](./08-dashboard-features.md) for business functionality
- [Admin Panel](./09-admin-panel.md) for administrative capabilities

This documentation focuses on architectural concepts and implementation patterns rather than detailed code examples, providing the knowledge needed to understand and work effectively with the application.
- Responsive design with Tailwind CSS

## Core Features

- **Multi-tenant Architecture**: Support for organizations and tenants
- **Role-based Access Control**: Super Admin, Tenant Admin, Org Admin, Users
- **Financial Risk Prediction**: AI-powered default risk assessment
- **Batch Processing**: Bulk upload and analysis of companies
- **Real-time Updates**: Live job status and data synchronization
- **Analytics Dashboard**: Comprehensive risk insights and reporting
- **Admin Management**: User, organization, and tenant management
