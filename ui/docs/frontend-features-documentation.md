# Frontend Features Documentation

## Overview

The Ihuzo Finance frontend is built with Angular 20+ and provides a comprehensive financial management interface. The application features a modern, responsive design with role-based access control and real-time data visualization.

## Technology Stack

- **Framework**: Angular 20+ with TypeScript
- **Styling**: SCSS with Bootstrap 5.3.8
- **Charts**: ApexCharts with ng-apexcharts
- **Icons**: Feather Icons (Lucide)
- **State Management**: RxJS Observables
- **Build Tool**: Angular CLI
- **Package Manager**: npm

## Application Architecture

### Core Structure
```
src/
├── app/
│   ├── core/                    # Core services and guards
│   ├── features/               # Feature modules
│   ├── layout/                 # Layout components
│   ├── shared/                 # Shared components
│   └── styles/                 # Global styles
├── assets/                     # Static assets
└── environments/               # Environment configurations
```

## Core Services

### 1. Authentication Service (`auth.service.ts`)
**Purpose**: Handles user authentication, token management, and session control.

**Key Features**:
- Login with email/phone and password
- Token-based authentication
- Account switching functionality
- Session management with timeout
- User profile management

**Key Methods**:
```typescript
login(identifier: string, password: string): Observable<User>
logout(): void
getCurrentUser(): User | null
switchAccount(accountId: number): Observable<Account>
isAuthenticated(): boolean
```

### 2. Dashboard Service (`dashboard.service.ts`)
**Purpose**: Manages dashboard data, statistics, and overview information.

**Key Features**:
- Real-time dashboard data
- Financial statistics
- Transaction summaries
- Account balance tracking
- Performance metrics

### 3. Navigation Service (`navigation.service.ts`)
**Purpose**: Manages application navigation and menu structure.

**Key Features**:
- Role-based menu items
- Dynamic navigation
- Breadcrumb support
- Route management

### 4. Wallet Service (`wallet.service.ts`)
**Purpose**: Handles wallet/account operations and financial transactions.

**Key Features**:
- Account management
- Balance tracking
- Transaction history
- Account switching

### 5. Customer Service (`customer.service.ts`)
**Purpose**: Manages customer data and operations.

**Key Features**:
- Customer CRUD operations
- Customer analytics
- Relationship management
- Data validation

## Feature Modules

### 1. Authentication Module (`/features/auth/`)

#### Login Component (`login.component.ts`)
**Purpose**: User authentication interface.

**Features**:
- Email/phone login
- Password validation
- Remember me functionality
- Forgot password link
- Responsive design

**Template Structure**:
```html
<div class="auth-page">
  <div class="auth-section">
    <!-- Login form with validation -->
  </div>
  <div class="background-section">
    <!-- Background with analog clock -->
  </div>
</div>
```

#### Register Component (`register.component.ts`)
**Purpose**: New user registration.

**Features**:
- Multi-step registration
- Account type selection
- Form validation
- Terms and conditions
- Email/phone verification

#### Forgot Password Component (`forgot-password.component.ts`)
**Purpose**: Password reset functionality.

**Features**:
- Email/phone verification
- Security questions
- Reset token validation
- New password setup

#### Lock Component (`lock.component.ts`)
**Purpose**: Session timeout protection.

**Features**:
- PIN/password unlock
- Session timeout handling
- Security protection

### 2. Dashboard Module (`/features/dashboard/`)

#### Dashboard Component (`dashboard.component.ts`)
**Purpose**: Main application dashboard with financial overview.

**Key Features**:
- Real-time balance display
- Transaction summary cards
- Financial charts (Money In/Out trends)
- Recent transactions list
- Quick action buttons
- Account switching
- Auto-refresh functionality

**Chart Integration**:
- ApexCharts for data visualization
- Bar charts for money trends
- Donut charts for distribution
- Interactive tooltips
- Responsive design

**Template Structure**:
```html
<div class="dashboard-container">
  <!-- Quick Actions -->
  <div class="quick-actions">
    <!-- Send Money, Request Money, Top Up, Withdraw, Pay Bills, View Statements -->
  </div>
  
  <!-- Stats Cards -->
  <div class="stats-grid">
    <!-- Total Balance, Transactions, Active Loans, Savings Goals -->
  </div>
  
  <!-- Charts Section -->
  <div class="charts-section">
    <!-- Money In & Out Trends Chart -->
    <!-- Money In vs Money Out Distribution Chart -->
  </div>
  
  <!-- Recent Transactions -->
  <div class="recent-transactions">
    <!-- Transaction list with details -->
  </div>
</div>
```

### 3. Account Management Module (`/features/ikofi/`)

#### Ikofi Component (`ikofi.component.ts`)
**Purpose**: Financial services hub and account management.

**Features**:
- Account overview
- Financial services grid
- Quick actions
- Recent transactions
- Service navigation

**Services Available**:
- Savings management
- Loan applications
- Insurance policies
- Payment processing

### 4. Transaction Management Module (`/features/transactions/`)

#### Transactions Component (`transactions.component.ts`)
**Purpose**: Transaction history and management.

**Features**:
- Transaction history with filtering
- Search functionality
- Date range filtering
- Transaction type filtering
- Pagination support
- Transaction details modal
- Export functionality

### 5. Customer Management Module (`/features/customers/`)

#### Customers List Component (`customers-list.component.ts`)
**Purpose**: Customer listing and management.

**Features**:
- Customer data table
- Search and filtering
- Bulk operations
- Customer details modal
- Export functionality

#### Add Customer Component (`add-customer.component.ts`)
**Purpose**: New customer registration.

**Features**:
- Multi-step form
- Data validation
- Account type selection
- Relationship management

#### Sold Milk Component (`sold-milk.component.ts`)
**Purpose**: Milk sales tracking and management.

**Features**:
- Sales recording
- Customer selection
- Quantity tracking
- Price management
- Sales history

### 6. Supplier Management Module (`/features/suppliers/`)

#### Suppliers List Component (`suppliers-list.component.ts`)
**Purpose**: Supplier management interface.

**Features**:
- Supplier data table
- Search and filtering
- Supplier details
- Relationship management

#### Add Supplier Component (`add-supplier.component.ts`)
**Purpose**: New supplier registration.

**Features**:
- Supplier information form
- Business type selection
- Contact management
- Validation

### 7. Collections Module (`/features/collections/`)

#### Collections List Component (`collections-list.component.ts`)
**Purpose**: Milk collection management.

**Features**:
- Collection tracking
- Status management
- Supplier relationships
- Quality assessment

### 8. Sales Module (`/features/sales/`)

#### Sales List Component (`sales-list.component.ts`)
**Purpose**: Sales management and tracking.

**Features**:
- Sales history
- Customer management
- Revenue tracking
- Performance analytics

### 9. Loans Module (`/features/loans/`)

#### Loans Component (`loans.component.ts`)
**Purpose**: Loan management interface.

**Features**:
- Loan applications
- Payment tracking
- Loan status
- Interest calculations

### 10. Savings Module (`/features/savings/`)

#### Savings Component (`savings.component.ts`)
**Purpose**: Savings goals and management.

**Features**:
- Savings goals tracking
- Progress visualization
- Auto-save settings
- Goal completion

### 11. Insurance Module (`/features/insurance/`)

#### Insurance Component (`insurance.component.ts`)
**Purpose**: Insurance policy management.

**Features**:
- Policy management
- Premium tracking
- Claims processing
- Coverage details

### 12. Notifications Module (`/features/notifications/`)

#### Notifications Component (`notifications.component.ts`)
**Purpose**: Notification management.

**Features**:
- Notification history
- Mark as read
- Filtering
- Bulk actions

### 13. Profile Module (`/features/profile/`)

#### Profile Component (`profile.component.ts`)
**Purpose**: User profile management.

**Features**:
- Personal information
- KYC document upload
- Address management
- Security settings

## Shared Components

### 1. Data Table Component (`data-table.component.ts`)
**Purpose**: Reusable data table with advanced features.

**Features**:
- Sorting and filtering
- Pagination
- Search functionality
- Custom column types
- Row actions
- Loading states
- Export functionality

**Usage Example**:
```html
<app-data-table
  [columns]="tableColumns"
  [data]="tableData"
  [loading]="isLoading"
  [showSearch]="true"
  [showPagination]="true"
  (onRowClick)="onRowSelect($event)">
  
  <ng-template #rowActions let-item>
    <button class="btn btn-sm btn-primary" (click)="editItem(item)">
      Edit
    </button>
  </ng-template>
</app-data-table>
```

### 2. Base Form Component (`base-form.component.ts`)
**Purpose**: Standardized form wrapper.

**Features**:
- Form validation
- Submit/cancel handling
- Loading states
- Error handling
- Consistent styling

### 3. Modal Components

#### Add Customer Modal (`add-customer-modal.component.ts`)
**Purpose**: Customer creation modal.

**Features**:
- Multi-step form
- Validation
- Account type selection
- Relationship management

#### Add Supplier Modal (`add-supplier-modal.component.ts`)
**Purpose**: Supplier creation modal.

**Features**:
- Supplier information form
- Business type selection
- Contact details
- Validation

#### Record Collection Modal (`record-collection-modal.component.ts`)
**Purpose**: Milk collection recording.

**Features**:
- Supplier selection
- Quantity input
- Status management
- Date/time selection
- Notes field

#### Record Sale Modal (`record-sale-modal.component.ts`)
**Purpose**: Sales recording interface.

**Features**:
- Customer selection
- Product details
- Quantity and pricing
- Payment tracking

#### Create Wallet Modal (`create-wallet-modal.component.ts`)
**Purpose**: Wallet/account creation.

**Features**:
- Account type selection
- Joint account support
- Savings goals
- Account rules
- Member management

### 4. Alert Component (`alert.component.ts`)
**Purpose**: Notification and alert system.

**Features**:
- Multiple alert types (success, danger, warning, info)
- Dismissible alerts
- Auto-hide functionality
- Custom styling

### 5. Feather Icon Component (`feather-icon.component.ts`)
**Purpose**: Icon management system.

**Features**:
- Feather icon integration
- Size customization
- Color theming
- Accessibility support

### 6. Analog Clock Component (`analog-clock.component.ts`)
**Purpose**: Background clock display.

**Features**:
- Real-time clock
- Analog display
- Responsive design
- Animation effects

## Layout Components

### 1. Main Layout Component (`main-layout.component.ts`)
**Purpose**: Main application layout wrapper.

**Features**:
- Sidebar navigation
- Top navigation bar
- Content area
- Responsive design
- Mobile optimization

### 2. Sidebar Component (`sidebar.component.ts`)
**Purpose**: Navigation sidebar.

**Features**:
- Collapsible design
- Role-based menu items
- Active state indicators
- Icon-based navigation
- Mobile responsive

### 3. Navbar Component (`navbar.component.ts`)
**Purpose**: Top navigation bar.

**Features**:
- User profile menu
- Notifications dropdown
- Account switching
- Search functionality
- Mobile menu

### 4. Auth Layout Component (`auth-layout.component.ts`)
**Purpose**: Authentication page layout.

**Features**:
- Split-screen design
- Logo display
- Background clock
- Responsive design
- Form integration

## Styling and Theming

### SCSS Architecture
```
src/styles/
├── _variables.scss      # Color variables and theme
├── _mixins.scss         # Reusable mixins
├── _base.scss          # Base styles and resets
└── _components.scss    # Component-specific styles
```

### Color Scheme
- **Primary**: #f24d12 (Orange)
- **Secondary**: #515365 (Dark Gray)
- **Success**: #1abc9c (Teal)
- **Info**: #3498db (Blue)
- **Warning**: #f1c40f (Yellow)
- **Danger**: #e74c3c (Red)

### Responsive Design
- **Mobile**: < 768px
- **Tablet**: 768px - 1024px
- **Desktop**: > 1024px

## State Management

### RxJS Observables
- **Authentication State**: User session and token management
- **Account State**: Current account and switching
- **Dashboard Data**: Real-time financial data
- **Navigation State**: Menu and routing state

### Service Communication
- **HTTP Interceptors**: Request/response handling
- **Error Handling**: Global error management
- **Loading States**: UI loading indicators
- **Caching**: Data caching strategies

## Performance Optimizations

### 1. Lazy Loading
- Feature modules loaded on demand
- Route-based code splitting
- Reduced initial bundle size

### 2. Change Detection
- OnPush change detection strategy
- Immutable data patterns
- Optimized component updates

### 3. Bundle Optimization
- Tree shaking
- Dead code elimination
- Minification and compression

## Security Features

### 1. Authentication
- JWT token-based authentication
- Session timeout handling
- Secure token storage
- Password validation

### 2. Authorization
- Role-based access control
- Route guards
- Component-level permissions
- API access control

### 3. Data Protection
- Input sanitization
- XSS prevention
- CSRF protection
- Secure HTTP headers

## Testing Strategy

### 1. Unit Testing
- Component testing
- Service testing
- Pipe testing
- Guard testing

### 2. Integration Testing
- API integration
- Component interaction
- User workflow testing

### 3. E2E Testing
- Complete user journeys
- Cross-browser testing
- Performance testing

## Deployment Configuration

### 1. Build Configuration
```json
{
  "build": {
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
```

### 2. Environment Configuration
```typescript
export const environment = {
  production: false,
  apiBaseUrl: 'https://api.gemura.rw/v2',
  appName: 'iFinance',
  features: {
    enableAnalytics: true,
    enableNotifications: true,
    enableChat: true,
    enableReports: true
  }
};
```

## Browser Support

- **Chrome**: Latest 2 versions
- **Firefox**: Latest 2 versions
- **Safari**: Latest 2 versions
- **Edge**: Latest 2 versions

## Accessibility Features

- **ARIA Labels**: Screen reader support
- **Keyboard Navigation**: Full keyboard accessibility
- **Color Contrast**: WCAG AA compliance
- **Focus Management**: Proper focus handling
- **Semantic HTML**: Meaningful markup structure

This comprehensive frontend documentation covers all implemented features, components, and architectural decisions in the Ihuzo Finance application.
