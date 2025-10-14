# Ihuzo Finance - User Types & Database Structure

## User Types & Roles

### 1. **Customer** (End Users)
- **Primary users** of the financial services
- Can create and manage accounts (formerly Ikofis)
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

### Key Design Principles

1. **Account-Centric Architecture**: Following banking standards where accounts are the primary financial entities
2. **Role-Based Access Control**: Granular permissions based on user types and relationships
3. **Audit Trail**: All transactions and changes are logged with timestamps and user references
4. **Multi-Currency Support**: Built-in support for different currencies (starting with RWF)
5. **Scalable Design**: UUID primary keys and proper indexing for performance
6. **Real-World Banking Features**: Interest rates, minimum balances, overdraft limits, etc.
7. **Joint Account Support**: Multiple users can have different permission levels on the same account
8. **KYC Integration**: Comprehensive identity verification system
9. **Loan Management**: Full loan lifecycle from application to completion
10. **Insurance Integration**: Policy management and claims processing

### Security Considerations

- All sensitive data encrypted at rest
- API rate limiting and authentication
- Two-factor authentication support
- Audit logging for all financial operations
- Role-based API access controls
- Data retention policies
- GDPR compliance for personal data

This structure provides a solid foundation for a comprehensive fintech platform that can scale and support various financial services while maintaining security and regulatory compliance.
