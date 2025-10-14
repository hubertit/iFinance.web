# Ihuzo Finance - Complete System Documentation

## Table of Contents
1. [System Overview](#system-overview)
2. [User Types & Roles](#user-types--roles)
3. [Database Structure](#database-structure)
4. [Frontend Features](#frontend-features)
5. [API Endpoints](#api-endpoints)
6. [Security & Permissions](#security--permissions)
7. [Business Logic](#business-logic)
8. [Deployment & Configuration](#deployment--configuration)

## System Overview

Ihuzo Finance is a comprehensive fintech platform built with Angular frontend and designed to support various financial services including account management, transactions, loans, savings, and insurance. The system follows real-world banking standards and provides a scalable foundation for financial operations.

### Technology Stack
- **Frontend**: Angular 17+ with TypeScript
- **Styling**: SCSS with custom design system
- **Charts**: ApexCharts for data visualization
- **Icons**: Feather Icons (Lucide)
- **State Management**: RxJS Observables
- **Build Tool**: Angular CLI

## User Types & Roles

### 1. **Customer** (End Users)
- **Primary users** of the financial services
- Can create and manage accounts
- Access to transactions, loans, savings, insurance
- Basic financial operations (send/receive money, pay bills)
- **Sub-types:**
  - Individual Customer
  - Business Customer
  - Joint Account Holder

### 2. **Agent** (Field Representatives)
- **Field representatives** who help customers on the ground
- Can assist customers with account setup and transactions
- Limited administrative access
- Commission-based role
- Can view and assist with customer accounts

### 3. **Partner** (Business Partners)
- **Business partners** and merchants
- Can receive payments, offer services
- Integration with the platform for business transactions
- May have special rates or features
- Access to business analytics

### 4. **Insurer** (Insurance Providers)
- **Insurance providers** on the platform
- Can create and manage insurance products
- Handle claims and policy management
- Access to insurance-related analytics
- Can view customer insurance data

### 5. **Lender** (Financial Institutions)
- **Financial institutions** or individual lenders
- Can offer loan products
- Manage loan applications and approvals
- Access to lending analytics and risk assessment
- Can view customer loan data

### 6. **Admin** (System Administrator)
- **Full system access** and control
- User management, system configuration
- Analytics, reporting, and monitoring
- Platform maintenance and support

## Database Structure

### Core Tables

#### 1. **Users Table**
```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20) UNIQUE NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    user_type ENUM('customer', 'agent', 'partner', 'insurer', 'lender', 'admin') NOT NULL,
    status ENUM('active', 'inactive', 'suspended', 'pending_verification') DEFAULT 'pending_verification',
    kyc_status ENUM('pending', 'verified', 'rejected') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    last_login TIMESTAMP NULL,
    password_hash VARCHAR(255) NOT NULL,
    two_factor_enabled BOOLEAN DEFAULT FALSE,
    profile_picture_url VARCHAR(500) NULL
);
```

#### 2. **Accounts Table** (formerly Wallets)
```sql
CREATE TABLE accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_number VARCHAR(20) UNIQUE NOT NULL,
    account_name VARCHAR(255) NOT NULL,
    account_type ENUM('savings', 'checking', 'business', 'joint', 'loan', 'investment') NOT NULL,
    primary_holder_id UUID NOT NULL REFERENCES users(id),
    status ENUM('active', 'inactive', 'suspended', 'closed') DEFAULT 'active',
    balance DECIMAL(15,2) DEFAULT 0.00,
    currency VARCHAR(3) DEFAULT 'RWF',
    interest_rate DECIMAL(5,4) DEFAULT 0.0000,
    minimum_balance DECIMAL(15,2) DEFAULT 0.00,
    overdraft_limit DECIMAL(15,2) DEFAULT 0.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    closed_at TIMESTAMP NULL,
    description TEXT NULL
);
```

#### 3. **Account Permissions Table**
```sql
CREATE TABLE account_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id UUID NOT NULL REFERENCES accounts(id),
    user_id UUID NOT NULL REFERENCES users(id),
    permission_type ENUM('owner', 'co_owner', 'viewer', 'transactor') NOT NULL,
    can_transact BOOLEAN DEFAULT FALSE,
    can_view_balance BOOLEAN DEFAULT TRUE,
    can_view_transactions BOOLEAN DEFAULT TRUE,
    can_manage_account BOOLEAN DEFAULT FALSE,
    can_add_users BOOLEAN DEFAULT FALSE,
    can_remove_users BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE(account_id, user_id)
);
```

#### 4. **Transactions Table**
```sql
CREATE TABLE transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transaction_reference VARCHAR(50) UNIQUE NOT NULL,
    from_account_id UUID NULL REFERENCES accounts(id),
    to_account_id UUID NULL REFERENCES accounts(id),
    amount DECIMAL(15,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'RWF',
    transaction_type ENUM('deposit', 'withdrawal', 'transfer', 'payment', 'loan_disbursement', 'loan_repayment', 'interest_payment', 'fee_payment') NOT NULL,
    status ENUM('pending', 'completed', 'failed', 'cancelled', 'reversed') DEFAULT 'pending',
    description TEXT NULL,
    metadata JSON NULL,
    initiated_by UUID NOT NULL REFERENCES users(id),
    approved_by UUID NULL REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    processed_at TIMESTAMP NULL,
    failure_reason TEXT NULL
);
```

#### 5. **Loans Table**
```sql
CREATE TABLE loans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    loan_number VARCHAR(20) UNIQUE NOT NULL,
    borrower_id UUID NOT NULL REFERENCES users(id),
    lender_id UUID NOT NULL REFERENCES users(id),
    account_id UUID NOT NULL REFERENCES accounts(id),
    loan_type ENUM('personal', 'business', 'mortgage', 'auto', 'education', 'agricultural') NOT NULL,
    principal_amount DECIMAL(15,2) NOT NULL,
    interest_rate DECIMAL(5,4) NOT NULL,
    term_months INTEGER NOT NULL,
    monthly_payment DECIMAL(15,2) NOT NULL,
    status ENUM('pending', 'approved', 'disbursed', 'active', 'completed', 'defaulted', 'cancelled') DEFAULT 'pending',
    disbursed_amount DECIMAL(15,2) DEFAULT 0.00,
    outstanding_balance DECIMAL(15,2) NOT NULL,
    next_payment_date DATE NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    approved_at TIMESTAMP NULL,
    disbursed_at TIMESTAMP NULL,
    completed_at TIMESTAMP NULL
);
```

#### 6. **Savings Goals Table**
```sql
CREATE TABLE savings_goals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),
    account_id UUID NOT NULL REFERENCES accounts(id),
    goal_name VARCHAR(255) NOT NULL,
    target_amount DECIMAL(15,2) NOT NULL,
    current_amount DECIMAL(15,2) DEFAULT 0.00,
    target_date DATE NOT NULL,
    status ENUM('active', 'completed', 'paused', 'cancelled') DEFAULT 'active',
    auto_save_amount DECIMAL(15,2) DEFAULT 0.00,
    auto_save_frequency ENUM('daily', 'weekly', 'monthly') DEFAULT 'monthly',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    completed_at TIMESTAMP NULL
);
```

#### 7. **Insurance Policies Table**
```sql
CREATE TABLE insurance_policies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    policy_number VARCHAR(20) UNIQUE NOT NULL,
    customer_id UUID NOT NULL REFERENCES users(id),
    insurer_id UUID NOT NULL REFERENCES users(id),
    policy_type ENUM('life', 'health', 'auto', 'property', 'business', 'travel') NOT NULL,
    coverage_amount DECIMAL(15,2) NOT NULL,
    premium_amount DECIMAL(15,2) NOT NULL,
    premium_frequency ENUM('monthly', 'quarterly', 'annually') NOT NULL,
    status ENUM('active', 'expired', 'cancelled', 'suspended') DEFAULT 'active',
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

#### 8. **KYC Documents Table**
```sql
CREATE TABLE kyc_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),
    document_type ENUM('national_id', 'passport', 'drivers_license', 'utility_bill', 'bank_statement') NOT NULL,
    document_number VARCHAR(100) NULL,
    front_image_url VARCHAR(500) NULL,
    back_image_url VARCHAR(500) NULL,
    selfie_image_url VARCHAR(500) NULL,
    status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
    verified_by UUID NULL REFERENCES users(id),
    verified_at TIMESTAMP NULL,
    rejection_reason TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

#### 9. **Notifications Table**
```sql
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type ENUM('transaction', 'loan', 'savings', 'insurance', 'system', 'security') NOT NULL,
    priority ENUM('low', 'medium', 'high', 'urgent') DEFAULT 'medium',
    status ENUM('unread', 'read', 'archived') DEFAULT 'unread',
    action_url VARCHAR(500) NULL,
    metadata JSON NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    read_at TIMESTAMP NULL
);
```

## Frontend Features

### 1. **Authentication System**
- **Login Component** (`/login`)
  - Email/phone and password authentication
  - Remember me functionality
  - Forgot password flow
- **Registration Component** (`/register`)
  - User registration with validation
  - KYC document upload
  - Email/phone verification
- **Lock Screen Component** (`/lock`)
  - Session timeout protection
  - PIN/password unlock
- **Forgot Password Component** (`/forgot-password`)
  - Password reset via email/SMS
  - Security questions

### 2. **Dashboard System**
- **Main Dashboard** (`/dashboard`)
  - Real-time balance display
  - Transaction summary cards
  - Quick action buttons
  - Financial charts (Money In/Out)
  - Recent transactions list
  - Account switching functionality
- **Auto-refresh** (removed as per user request)
- **Wallet-specific data** - Dashboard updates based on selected account

### 3. **Account Management (Ikofi)**
- **Account List** (`/ikofi`)
  - Display all user accounts
  - Account balance and status
  - Account type indicators
  - Quick actions per account
- **Create Account Modal**
  - Account type selection (Individual, Joint)
  - Saving account toggle
  - Joint account member management
  - Target amount and date for savings
  - Account rules and guidelines
  - Member name and phone number collection

### 4. **Transaction Management**
- **Transactions Page** (`/transactions`)
  - Transaction history with filtering
  - Search functionality
  - Date range filtering
  - Transaction type filtering
  - Pagination support
  - Transaction details modal
- **Transaction Types**:
  - Send Money
  - Request Money
  - Top Up Wallet
  - Pay Bills
  - Withdraw

### 5. **Loan Management**
- **Loans Page** (`/loans`)
  - Active loans display
  - Loan application history
  - Payment tracking
  - Loan status indicators
  - Payment due dates
- **Loan Features**:
  - Loan application form
  - Loan approval workflow
  - Payment scheduling
  - Interest calculations

### 6. **Savings Management**
- **Savings Page** (`/savings`)
  - Savings goals tracking
  - Progress visualization
  - Auto-save settings
  - Goal completion status
- **Savings Features**:
  - Create savings goals
  - Set target amounts and dates
  - Progress tracking
  - Auto-save configuration

### 7. **Insurance Management**
- **Insurance Page** (`/insurance`)
  - Active policies display
  - Policy details and coverage
  - Premium payment tracking
  - Claims history
- **Insurance Features**:
  - Policy comparison
  - Premium payment
  - Claims submission
  - Policy renewal

### 8. **Notifications System**
- **Notifications Page** (`/notifications`)
  - Notification history
  - Mark as read functionality
  - Notification filtering
  - Bulk actions
- **Notification Types**:
  - Transaction notifications
  - Loan updates
  - Savings reminders
  - Insurance alerts
  - System announcements

### 9. **Profile Management**
- **Profile Page** (`/profile`)
  - Personal information
  - Address management
  - Account information
  - KYC document upload
  - Profile picture management
- **KYC Features**:
  - NID front and back photo upload
  - Selfie photo upload
  - Document verification status
  - Drag-and-drop file upload

### 10. **Navigation & Layout**
- **Sidebar Navigation**
  - Role-based menu items
  - Collapsible design
  - Active state indicators
  - Icon-based navigation
- **Top Navigation Bar**
  - Account switching
  - Notifications dropdown
  - User profile menu
  - Search functionality
- **Responsive Design**
  - Mobile-friendly layout
  - Tablet optimization
  - Desktop enhancement

## API Endpoints (Planned)

### Authentication Endpoints
```
POST /api/auth/login
POST /api/auth/register
POST /api/auth/logout
POST /api/auth/forgot-password
POST /api/auth/reset-password
POST /api/auth/verify-email
POST /api/auth/verify-phone
```

### Account Management Endpoints
```
GET /api/accounts
POST /api/accounts
GET /api/accounts/{id}
PUT /api/accounts/{id}
DELETE /api/accounts/{id}
GET /api/accounts/{id}/transactions
POST /api/accounts/{id}/transactions
```

### Transaction Endpoints
```
GET /api/transactions
POST /api/transactions
GET /api/transactions/{id}
PUT /api/transactions/{id}
POST /api/transactions/{id}/approve
POST /api/transactions/{id}/reject
```

### Loan Endpoints
```
GET /api/loans
POST /api/loans
GET /api/loans/{id}
PUT /api/loans/{id}
POST /api/loans/{id}/approve
POST /api/loans/{id}/disburse
POST /api/loans/{id}/repay
```

### Savings Endpoints
```
GET /api/savings-goals
POST /api/savings-goals
GET /api/savings-goals/{id}
PUT /api/savings-goals/{id}
DELETE /api/savings-goals/{id}
```

### Insurance Endpoints
```
GET /api/insurance-policies
POST /api/insurance-policies
GET /api/insurance-policies/{id}
PUT /api/insurance-policies/{id}
POST /api/insurance-policies/{id}/claim
```

### Notification Endpoints
```
GET /api/notifications
PUT /api/notifications/{id}/read
PUT /api/notifications/mark-all-read
DELETE /api/notifications/{id}
```

## Security & Permissions

### Permission Matrix

| Feature | Customer | Agent | Partner | Insurer | Lender | Admin |
|---------|----------|-------|---------|---------|--------|-------|
| **Account Management** |
| Create Account | ✅ | ✅ (assist) | ❌ | ❌ | ❌ | ✅ |
| View Own Accounts | ✅ | ✅ (assisted) | ❌ | ❌ | ❌ | ✅ (all) |
| Manage Account Permissions | ✅ (own) | ❌ | ❌ | ❌ | ❌ | ✅ (all) |
| **Transactions** |
| View Own Transactions | ✅ | ✅ (assisted) | ✅ (business) | ❌ | ❌ | ✅ (all) |
| Initiate Transactions | ✅ | ✅ (assist) | ✅ (business) | ❌ | ❌ | ✅ (all) |
| Approve Transactions | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| **Loans** |
| Apply for Loan | ✅ | ✅ (assist) | ❌ | ❌ | ❌ | ✅ |
| View Own Loans | ✅ | ✅ (assisted) | ❌ | ❌ | ❌ | ✅ (all) |
| Approve Loans | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ |
| Manage Loan Products | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ |
| **Insurance** |
| Buy Insurance | ✅ | ✅ (assist) | ❌ | ❌ | ❌ | ✅ |
| View Own Policies | ✅ | ✅ (assisted) | ❌ | ❌ | ❌ | ✅ (all) |
| Create Insurance Products | ❌ | ❌ | ❌ | ✅ | ❌ | ✅ |
| Manage Claims | ❌ | ❌ | ❌ | ✅ | ❌ | ✅ |
| **Savings** |
| Create Savings Goals | ✅ | ✅ (assist) | ❌ | ❌ | ❌ | ✅ |
| View Own Savings | ✅ | ✅ (assisted) | ❌ | ❌ | ❌ | ✅ (all) |
| **System Administration** |
| User Management | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| System Configuration | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| Analytics & Reporting | ❌ | ❌ | ✅ (business) | ✅ (insurance) | ✅ (lending) | ✅ (all) |

### Security Features
- **Authentication**: JWT-based authentication with refresh tokens
- **Authorization**: Role-based access control (RBAC)
- **Data Encryption**: AES-256 encryption for sensitive data
- **API Security**: Rate limiting, CORS, input validation
- **Audit Logging**: Comprehensive audit trail for all operations
- **Two-Factor Authentication**: Optional 2FA for enhanced security
- **Session Management**: Secure session handling with timeout
- **Data Privacy**: GDPR compliance for personal data

## Business Logic

### Account Management
- **Account Creation**: Users can create multiple accounts of different types
- **Joint Accounts**: Multiple users can have different permission levels
- **Account Switching**: Users can switch between their accounts
- **Balance Management**: Real-time balance updates and calculations

### Transaction Processing
- **Transaction Validation**: Amount, account status, and permission checks
- **Transaction Approval**: Multi-level approval for high-value transactions
- **Transaction History**: Comprehensive transaction logging and reporting
- **Transaction Reversal**: Support for transaction cancellation and reversal

### Loan Management
- **Loan Application**: Comprehensive loan application process
- **Credit Assessment**: Automated and manual credit scoring
- **Loan Approval**: Multi-level approval workflow
- **Payment Processing**: Automated payment collection and tracking
- **Default Management**: Default detection and recovery processes

### Savings Management
- **Goal Setting**: Users can set and track savings goals
- **Auto-Save**: Automated savings transfers
- **Progress Tracking**: Visual progress indicators and analytics
- **Goal Completion**: Celebration and next goal suggestions

### Insurance Management
- **Policy Comparison**: Side-by-side policy comparison
- **Premium Payment**: Automated premium collection
- **Claims Processing**: Streamlined claims submission and processing
- **Policy Renewal**: Automated renewal reminders and processing

## Deployment & Configuration

### Environment Configuration
```typescript
// environment.ts
export const environment = {
  production: false,
  appName: 'Ihuzo Finance',
  apiBaseUrl: 'http://localhost:3000/api',
  tokenKey: 'ifinance_token',
  userKey: 'ifinance_user',
  loginKey: 'ifinance_login',
  primary: '#f24d12'
};
```

### Build Configuration
```json
// angular.json
{
  "build": {
    "builder": "@angular-devkit/build-angular:browser",
    "options": {
      "outputPath": "dist/frontend",
      "index": "src/index.html",
      "main": "src/main.ts",
      "polyfills": "src/polyfills.ts",
      "tsConfig": "tsconfig.app.json",
      "assets": ["src/favicon.ico", "src/assets"],
      "styles": ["src/styles.scss"],
      "scripts": []
    }
  }
}
```

### Deployment Scripts
```bash
# deploy.sh
#!/bin/bash
echo "Building Ihuzo Finance..."
ng build --configuration production
echo "Build completed successfully!"
```

## Development Guidelines

### Code Structure
```
src/
├── app/
│   ├── core/
│   │   └── services/          # Core services
│   ├── features/              # Feature modules
│   │   ├── auth/             # Authentication
│   │   ├── dashboard/        # Dashboard
│   │   ├── transactions/     # Transactions
│   │   ├── loans/           # Loans
│   │   ├── savings/         # Savings
│   │   ├── insurance/       # Insurance
│   │   ├── notifications/   # Notifications
│   │   └── profile/         # Profile
│   ├── layout/              # Layout components
│   ├── shared/              # Shared components
│   └── styles/              # Global styles
├── assets/                  # Static assets
└── environments/           # Environment configs
```

### Component Guidelines
- **Single Responsibility**: Each component has one clear purpose
- **Reusability**: Shared components for common functionality
- **Type Safety**: Full TypeScript implementation
- **Testing**: Unit tests for all components and services
- **Documentation**: Comprehensive inline documentation

### Service Guidelines
- **Dependency Injection**: Proper use of Angular DI
- **Observable Patterns**: RxJS for reactive programming
- **Error Handling**: Comprehensive error handling and logging
- **Caching**: Appropriate caching strategies
- **Performance**: Optimized for performance and scalability

## Future Enhancements

### Planned Features
1. **Mobile App**: React Native or Flutter mobile application
2. **API Integration**: Full backend API implementation
3. **Real-time Updates**: WebSocket integration for real-time data
4. **Advanced Analytics**: Machine learning for financial insights
5. **Multi-language Support**: Internationalization (i18n)
6. **Advanced Security**: Biometric authentication
7. **Blockchain Integration**: Cryptocurrency support
8. **AI Chatbot**: Customer service automation
9. **Advanced Reporting**: Comprehensive financial reporting
10. **Third-party Integrations**: Payment gateways, credit bureaus

### Scalability Considerations
- **Microservices Architecture**: Service-oriented architecture
- **Database Sharding**: Horizontal database scaling
- **Caching Strategy**: Redis for high-performance caching
- **CDN Integration**: Global content delivery
- **Load Balancing**: High availability and performance
- **Monitoring**: Comprehensive system monitoring
- **Backup Strategy**: Data backup and disaster recovery

This documentation provides a comprehensive overview of the Ihuzo Finance system, covering all implemented features, database structure, security considerations, and future development plans.
