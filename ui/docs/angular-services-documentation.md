# Angular Services Documentation

## Overview

The Ihuzo Finance application uses a comprehensive service architecture to manage data, state, and business logic. All services are implemented as Angular services with dependency injection and follow reactive programming patterns using RxJS.

## Core Services

### 1. Authentication Service (`auth.service.ts`)

**Purpose**: Central authentication and user management service.

**Key Interfaces**:
```typescript
export interface User {
  id: string;
  name: string;
  email?: string;
  phoneNumber?: string;
  role: string;
  accountType: string;
  accountCode?: string;
  accountName?: string;
  avatar?: string;
  createdAt: Date;
  lastLoginAt?: Date;
  isActive: boolean;
  about?: string;
  address?: string;
  province?: string;
  district?: string;
  sector?: string;
  cell?: string;
  village?: string;
  idNumber?: string;
  kycStatus?: string;
  token?: string;
  permissions?: { [key: string]: boolean };
  isAgentCandidate?: boolean;
}

export interface Account {
  account_id: number;
  account_code: string;
  name: string;
  type: string;
  balance: number;
  currency: string;
  status: string;
}
```

**Key Methods**:

#### `login(identifier: string, password: string): Observable<User>`
- Authenticates user with email/phone and password
- Returns user data and available accounts
- Stores authentication token in localStorage
- Updates current user state

#### `logout(): void`
- Clears user session
- Removes stored tokens
- Redirects to login page
- Resets application state

#### `getCurrentUser(): User | null`
- Returns currently authenticated user
- Returns null if not authenticated
- Cached from localStorage

#### `switchAccount(accountId: number): Observable<Account>`
- Switches user's active account
- Updates default account in backend
- Emits account change events
- Updates local storage

#### `isAuthenticated(): boolean`
- Checks if user is currently authenticated
- Validates token existence and validity
- Returns boolean status

#### `getAvailableAccounts(): Account[]`
- Returns list of user's accessible accounts
- Cached from localStorage
- Updated on account changes

**State Management**:
- Uses BehaviorSubject for current account tracking
- Emits account changes via `currentAccount$` observable
- Persists state in localStorage

### 2. Dashboard Service (`dashboard.service.ts`)

**Purpose**: Manages dashboard data and financial statistics.

**Key Interfaces**:
```typescript
export interface DashboardOverview {
  summary: {
    balance: {
      total: number;
      available: number;
      wallets: number;
    };
    transactions: {
      count: number;
      volume: number;
      pending: number;
    };
    loans: {
      active: number;
      amount: number;
      pending: number;
    };
    savings: {
      amount: number;
      goals: number;
      completed: number;
    };
  };
  recent_transactions: Transaction[];
}

export interface Wallet {
  id: number;
  name: string;
  type: string;
  balance: number;
  currency: string;
  status: string;
}
```

**Key Methods**:

#### `getDashboardOverview(): Observable<DashboardOverview>`
- Fetches comprehensive dashboard data
- Includes financial summaries
- Returns recent transactions
- Handles loading states

#### `getWalletData(): Observable<Wallet[]>`
- Retrieves user's wallet information
- Includes balance and status
- Supports account switching

#### `refreshDashboard(): Observable<DashboardOverview>`
- Forces dashboard data refresh
- Clears cache
- Returns updated data

### 3. Navigation Service (`navigation.service.ts`)

**Purpose**: Manages application navigation and menu structure.

**Key Interface**:
```typescript
export interface MenuItem {
  title: string;
  icon: string;
  path: string;
  children?: MenuItem[];
  roles?: string[];
  expanded?: boolean;
}
```

**Key Methods**:

#### `getMenuItems(): MenuItem[]`
- Returns navigation menu items
- Role-based filtering
- Hierarchical structure support
- Icon and path mapping

#### `getBreadcrumbs(): string[]`
- Returns current breadcrumb trail
- Dynamic based on route
- User-friendly navigation

### 4. Wallet Service (`wallet.service.ts`)

**Purpose**: Handles wallet/account operations and financial transactions.

**Key Methods**:

#### `getWallets(): Observable<Wallet[]>`
- Retrieves user's wallets
- Includes balance information
- Supports filtering and sorting

#### `createWallet(walletData: any): Observable<Wallet>`
- Creates new wallet/account
- Validates input data
- Returns created wallet

#### `updateWallet(id: number, data: any): Observable<Wallet>`
- Updates wallet information
- Validates permissions
- Returns updated wallet

#### `deleteWallet(id: number): Observable<boolean>`
- Deletes wallet
- Validates ownership
- Returns success status

### 5. Customer Service (`customer.service.ts`)

**Purpose**: Manages customer data and operations.

**Key Interfaces**:
```typescript
export interface Customer {
  id: number;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  accountCode: string;
  accountName?: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  totalPurchases?: number;
  lastPurchase?: string;
  notes?: string;
}

export interface MilkSale {
  id: number;
  customerId: number;
  quantity: number;
  unitPrice: number;
  totalAmount: number;
  saleDate: string;
  notes?: string;
  status: string;
}
```

**Key Methods**:

#### `getCustomers(): Observable<Customer[]>`
- Retrieves customer list
- Supports pagination
- Includes search and filtering

#### `getCustomer(id: number): Observable<Customer>`
- Gets specific customer details
- Includes purchase history
- Returns complete customer data

#### `createCustomer(customer: Customer): Observable<Customer>`
- Creates new customer
- Validates required fields
- Returns created customer

#### `updateCustomer(id: number, customer: Customer): Observable<Customer>`
- Updates customer information
- Validates permissions
- Returns updated customer

#### `deleteCustomer(id: number): Observable<boolean>`
- Deletes customer
- Validates dependencies
- Returns success status

#### `getCustomerSales(customerId: number): Observable<MilkSale[]>`
- Retrieves customer's sales history
- Includes filtering by date
- Returns sales data

### 6. Chart Service (`chart.service.ts`)

**Purpose**: Manages chart data and visualization.

**Key Interfaces**:
```typescript
export interface ServiceMetrics {
  name: string;
  status: 'operational' | 'degraded' | 'outage';
  uptime: number;
  responseTime: number;
  lastIncident?: string;
}

export interface ChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    backgroundColor?: string[];
    borderColor?: string[];
  }[];
}
```

**Key Methods**:

#### `getFinancialChartData(): Observable<ChartData>`
- Generates financial chart data
- Money in/out trends
- Supports date filtering

#### `getServiceMetrics(): Observable<ServiceMetrics[]>`
- Retrieves service performance data
- System health monitoring
- Real-time updates

#### `createDonutChartData(data: any[]): ChartData`
- Creates donut chart data
- Distribution visualization
- Customizable colors

### 7. API Service (`api.service.ts`)

**Purpose**: Central HTTP service for API communication.

**Key Methods**:

#### `get<T>(url: string, options?: any): Observable<T>`
- Generic GET request
- Error handling
- Response transformation

#### `post<T>(url: string, data: any, options?: any): Observable<T>`
- Generic POST request
- JSON serialization
- Error handling

#### `put<T>(url: string, data: any, options?: any): Observable<T>`
- Generic PUT request
- Update operations
- Error handling

#### `delete<T>(url: string, options?: any): Observable<T>`
- Generic DELETE request
- Resource deletion
- Error handling

### 8. Config Service (`config.service.ts`)

**Purpose**: Manages application configuration and environment settings.

**Key Methods**:

#### `getApiBaseUrl(): string`
- Returns API base URL
- Environment-specific configuration
- Fallback handling

#### `getTokenKey(): string`
- Returns token storage key
- Consistent key management
- Security considerations

#### `getUserKey(): string`
- Returns user storage key
- Session management
- Data persistence

### 9. CORS Proxy Service (`cors-proxy.service.ts`)

**Purpose**: Handles CORS issues and API proxying.

**Key Methods**:

#### `proxyRequest(url: string, options: any): Observable<any>`
- Proxies requests through CORS proxy
- Handles cross-origin issues
- Maintains security

### 10. Auth Fetch Service (`auth-fetch.service.ts`)

**Purpose**: Provides authenticated fetch functionality.

**Key Methods**:

#### `authenticatedFetch(url: string, options: any): Observable<any>`
- Makes authenticated requests
- Includes authorization headers
- Handles token refresh

### 11. Role Service (`role.service.ts`)

**Purpose**: Manages user roles and permissions.

**Key Interfaces**:
```typescript
export interface Role {
  id: number;
  name: string;
  description: string;
  permissions: Permission[];
  createdAt: string;
  updatedAt: string;
  status: 'active' | 'inactive';
}

export interface Permission {
  id: number;
  name: string;
  description: string;
  module: string;
}
```

**Key Methods**:

#### `getRoles(): Observable<Role[]>`
- Retrieves available roles
- Includes permissions
- Supports filtering

#### `getUserRoles(userId: number): Observable<Role[]>`
- Gets user's assigned roles
- Permission checking
- Access control

### 12. User Service (`user.service.ts`)

**Purpose**: Manages user data and operations.

**Key Interfaces**:
```typescript
export interface User {
  id: number;
  name: string;
  email: string;
  type: 'Human' | 'Application';
  role: string;
  status: 'active' | 'inactive';
  lastLogin: string;
  createdAt: string;
  phoneNumber?: string;
  department?: string;
  apiKey?: string;
}
```

**Key Methods**:

#### `getUsers(): Observable<User[]>`
- Retrieves user list
- Supports pagination
- Includes filtering

#### `getUser(id: number): Observable<User>`
- Gets specific user details
- Includes role information
- Returns complete user data

#### `createUser(user: User): Observable<User>`
- Creates new user
- Validates required fields
- Returns created user

#### `updateUser(id: number, user: User): Observable<User>`
- Updates user information
- Validates permissions
- Returns updated user

#### `deleteUser(id: number): Observable<boolean>`
- Deletes user
- Validates dependencies
- Returns success status

## Service Communication Patterns

### 1. Observable-Based Communication
All services use RxJS Observables for:
- Asynchronous data handling
- State management
- Event emission
- Error propagation

### 2. Dependency Injection
Services are injected using Angular's DI system:
```typescript
constructor(
  private http: HttpClient,
  private configService: ConfigService
) {}
```

### 3. Error Handling
Consistent error handling across all services:
```typescript
return this.http.get(url).pipe(
  catchError(this.handleError)
);
```

### 4. Caching Strategies
Services implement caching for:
- User data
- Dashboard statistics
- Navigation state
- Configuration settings

## State Management

### 1. BehaviorSubject Usage
Services use BehaviorSubject for state management:
```typescript
private currentUserSubject = new BehaviorSubject<User | null>(null);
public currentUser$ = this.currentUserSubject.asObservable();
```

### 2. State Persistence
Critical state is persisted in localStorage:
- Authentication tokens
- User preferences
- Account information
- Navigation state

### 3. State Synchronization
Services synchronize state across components:
- Account switching
- User updates
- Navigation changes
- Data refresh

## Performance Optimizations

### 1. Lazy Loading
Services support lazy loading patterns:
- On-demand initialization
- Resource optimization
- Memory management

### 2. Caching
Intelligent caching strategies:
- Data caching
- Response caching
- State caching
- Configuration caching

### 3. Memory Management
Proper cleanup and disposal:
- Subscription management
- Resource cleanup
- Memory leak prevention

## Security Features

### 1. Authentication
- Token-based authentication
- Session management
- Automatic token refresh
- Secure storage

### 2. Authorization
- Role-based access control
- Permission checking
- Route protection
- Component-level security

### 3. Data Protection
- Input validation
- XSS prevention
- CSRF protection
- Secure communication

## Testing Support

### 1. Mock Services
Services include mock implementations for testing:
- Unit testing
- Integration testing
- E2E testing

### 2. Test Utilities
Helper functions for testing:
- Mock data generation
- Service mocking
- State simulation

## Error Handling

### 1. Global Error Handling
Centralized error management:
- HTTP errors
- Network errors
- Validation errors
- Business logic errors

### 2. User Feedback
User-friendly error messages:
- Toast notifications
- Modal dialogs
- Inline validation
- Loading states

## Best Practices

### 1. Service Design
- Single responsibility principle
- Interface segregation
- Dependency inversion
- Open/closed principle

### 2. Code Organization
- Clear naming conventions
- Consistent patterns
- Proper documentation
- Type safety

### 3. Performance
- Efficient data handling
- Minimal API calls
- Optimized rendering
- Memory management

This comprehensive service documentation covers all Angular services, their interfaces, methods, and implementation patterns used in the Ihuzo Finance application.
