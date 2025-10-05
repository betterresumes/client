# Core Pages & Components

## Application Page Structure

```
┌─────────────────────────────────────────────────────────────┐
│                    APPLICATION PAGES                        │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ 🔐 Auth Pages           📊 Dashboard           👑 Admin     │
│ ┌─────────────────┐    ┌─────────────────┐   ┌──────────┐  │
│ │ 🚪 Login        │    │ 📈 Overview     │   │ 👥 Users │  │
│ │ 📝 Register     │    │ 🏢 Companies    │   │ 🏢 Orgs  │  │
│ │ 🔄 Reset Pass   │    │ 📤 Bulk Upload  │   │ 🏠 Tenants│ │
│ │ ✉️ Verify Email │    │ ⚙️ Settings     │   │ ⚙️ Config │  │
│ └─────────────────┘    └─────────────────┘   └──────────┘  │
│                                                             │
│        │                       │                    │      │
│        ▼                       ▼                    ▼      │
│   Role: Public            Role: User           Role: Admin  │
└─────────────────────────────────────────────────────────────┘
```

## User Journey Flow

```
New User Registration ──┐
                       │
                       ▼
┌─────────────────────────┐    ┌──────────────┐    ┌─────────────┐
│ 📝 Registration Form    │───▶│ ✉️ Email      │───▶│ ✅ Account  │
│ • Email Validation      │    │ Verification │    │ Activated   │
│ • Password Rules        │    │ • Send Code  │    │ • Login     │
│ • Terms Agreement       │    │ • Verify     │    │ • Dashboard │
└─────────────────────────┘    └──────────────┘    └─────────────┘
                                                           │
                                                           ▼
Existing User Login ────────────────────────────────────────┼──┐
                                                           │  │
                      ┌─────────────────────────────────────┘  │
                      │                                        │
                      ▼                                        ▼
            ┌──────────────┐                        ┌─────────────┐
            │ 🔐 JWT Auth  │                        │ 📊 Dashboard│
            │ • Credentials│                        │ • Analytics │
            │ • 2FA Check  │                        │ • Quick     │
            │ • Role Load  │                        │   Actions   │
            └──────────────┘                        └─────────────┘
```

## Component Hierarchy

```
┌─────────────────────────────────────────────────────────────┐
│                   COMPONENT ARCHITECTURE                    │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ 🏗️ Layout Level         🎯 Feature Level    🧱 UI Level     │
│ ┌─────────────────┐    ┌─────────────────┐ ┌──────────┐    │
│ │ 📱 App Shell    │    │ 📊 Risk Widget  │ │ 🔘 Button│    │
│ │ 🔝 Header       │    │ 📤 Upload Form  │ │ 📝 Input │    │
│ │ 📋 Sidebar      │    │ 👥 User Table   │ │ 📊 Chart │    │
│ │ 🦶 Footer       │    │ 🏢 Org Card     │ │ 🏷️ Badge │    │
│ └─────────────────┘    └─────────────────┘ └──────────┘    │
│                                                             │
│        ↑                       ↑                  ↑        │
│   App Structure           Business Logic      Reusable     │
│   Navigation              Domain Specific     Primitives   │
└─────────────────────────────────────────────────────────────┘
```

## Dashboard Pages

### Main Dashboard Interface
The primary dashboard provides users with an overview of their risk analysis activities, recent predictions, and key performance metrics. The interface is designed for quick access to frequently used features.

**Core Components**
- Real-time risk metrics and KPIs
- Recent analysis history and results
- Quick action buttons for common tasks
- Personalized recommendations and insights
- Activity feed and notifications

### Company Analysis Interface
Individual company analysis pages provide detailed risk assessment capabilities with comprehensive data visualization and interactive features.

**Analysis Features**
- Detailed risk scoring and probability calculations
- Historical performance trends and patterns
- Comparative analysis with industry benchmarks
- Downloadable reports and export capabilities
- Comments and notes system for collaboration

### Bulk Processing Interface
The bulk processing system allows users to analyze multiple companies simultaneously through file uploads and batch processing capabilities.

**Batch Processing Features**
- CSV and Excel file upload support
- Real-time processing status monitoring
- Progress tracking with detailed job information
- Error handling and validation feedback
- Bulk export and download capabilities

## Administrative Pages

### User Management System
Comprehensive user management interface for administrators to manage team members, permissions, and organizational structure.

**Management Capabilities**
- User creation, modification, and deactivation
- Role assignment and permission management
- Organization and tenant administration
- Activity monitoring and audit trails
- Invitation and onboarding management

### System Administration
Platform-level administration for super users managing the entire system across multiple organizations and tenants.

**Administrative Functions**
- Platform-wide user and organization management
- System configuration and feature toggles
- Performance monitoring and system health
- Data management and backup operations
- Security settings and compliance controls

## Core Component Architecture

### Layout Components

**Application Shell**
The main application layout provides consistent navigation, header, and footer across all pages. It handles responsive design, theme management, and global state presentation.

**Navigation System**
Dynamic navigation that adapts based on user roles and permissions. Includes breadcrumb navigation, quick access menus, and contextual navigation elements.

**Dashboard Layout**
Specialized layout for dashboard pages that includes sidebar navigation, content areas, and flexible widget placement for optimal user experience.

### Data Display Components

**Interactive Tables**
Advanced data tables with sorting, filtering, pagination, and selection capabilities. Tables are optimized for large datasets with virtual scrolling and efficient rendering.

**Chart and Visualization Components**
Comprehensive charting system for displaying risk metrics, trends, and comparative analysis. Includes interactive features like zooming, filtering, and data point selection.

**Status and Progress Indicators**
Real-time status displays for batch processing jobs, system health, and operation progress. Includes loading states, error indicators, and completion notifications.

### Form Components

**Dynamic Form System**
Flexible form components that handle validation, error display, and user input across different data types and business requirements.

**File Upload Components**
Specialized components for handling file uploads with progress tracking, validation, and error handling for bulk data processing.

**Search and Filter Components**
Advanced search and filtering capabilities that integrate with data tables and lists to help users find specific information quickly.

### Interactive Components

**Modal and Dialog System**
Consistent modal dialogs for confirmations, data entry, and detailed information display. Includes accessibility features and keyboard navigation.

**Notification System**
Application-wide notification system for user feedback, system messages, and real-time updates. Supports different notification types and priority levels.

**Action Components**
Buttons, menus, and interactive elements that provide consistent user interaction patterns across the application.