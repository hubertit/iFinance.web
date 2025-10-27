# API Endpoints Documentation

## Overview

The Ihuzo Finance API provides comprehensive endpoints for managing financial operations, user authentication, account management, transactions, and business analytics. The API follows RESTful principles and uses JSON for data exchange.

## Base URL
```
https://api.gemura.rw/v2
```

## Authentication

All protected endpoints require a valid user token passed in the request body:
```json
{
  "token": "user_authentication_token_here"
}
```

## Response Format

All API responses follow a consistent format:

**Success Response:**
```json
{
  "code": 200,
  "status": "success",
  "message": "Operation completed successfully",
  "data": { ... }
}
```

**Error Response:**
```json
{
  "code": 400,
  "status": "error",
  "message": "Error description"
}
```

## API Endpoints

### Authentication Endpoints

#### 1. User Login
**Endpoint:** `POST /auth/login.php`

**Description:** Authenticate user with email/phone and password.

**Request Body:**
```json
{
  "identifier": "user@example.com", // or phone number
  "password": "user_password"
}
```

**Response:**
```json
{
  "code": 200,
  "status": "success",
  "message": "Login successful",
  "data": {
    "user": {
      "id": 1,
      "name": "John Doe",
      "email": "user@example.com",
      "phone": "+250789123456",
      "role": "customer",
      "status": "active",
      "token": "generated_token_here",
      "default_account_id": 1
    },
    "accounts": [
      {
        "id": 1,
        "name": "Main Account",
        "type": "savings",
        "balance": 1000000,
        "currency": "RWF"
      }
    ]
  }
}
```

#### 2. User Registration
**Endpoint:** `POST /auth/register.php`

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "user@example.com",
  "phone": "+250789123456",
  "password": "secure_password",
  "account_type": "customer"
}
```

#### 3. Password Reset Request
**Endpoint:** `POST /auth/request_reset.php`

**Request Body:**
```json
{
  "identifier": "user@example.com"
}
```

#### 4. Reset Password
**Endpoint:** `POST /auth/reset_password.php`

**Request Body:**
```json
{
  "token": "reset_token",
  "new_password": "new_secure_password"
}
```

#### 5. Verify Token
**Endpoint:** `POST /auth/verify_token.php`

**Request Body:**
```json
{
  "token": "user_token_to_verify"
}
```

### Account Management Endpoints

#### 1. Get Account Details
**Endpoint:** `POST /accounts/get.php`

**Request Body:**
```json
{
  "token": "user_token"
}
```

**Response:**
```json
{
  "code": 200,
  "status": "success",
  "data": {
    "user": {
      "id": 1,
      "name": "John Doe",
      "email": "user@example.com",
      "phone": "+250789123456",
      "default_account_id": 1
    },
    "accounts": [
      {
        "id": 1,
        "name": "Main Account",
        "type": "savings",
        "balance": 1000000,
        "currency": "RWF",
        "status": "active"
      }
    ]
  }
}
```

#### 2. List User Accounts
**Endpoint:** `POST /accounts/list.php`

**Request Body:**
```json
{
  "token": "user_token"
}
```

#### 3. Switch Account
**Endpoint:** `POST /accounts/switch.php`

**Request Body:**
```json
{
  "token": "user_token",
  "account_id": 1
}
```

#### 4. Register New User to Account
**Endpoint:** `POST /accounts/register_user.php`

**Request Body:**
```json
{
  "token": "user_token",
  "account_id": 1,
  "user_email": "newuser@example.com",
  "permissions": {
    "can_transact": true,
    "can_view_balance": true,
    "can_view_transactions": true
  }
}
```

#### 5. Manage Account Permissions
**Endpoint:** `POST /accounts/manage_permissions.php`

**Request Body:**
```json
{
  "token": "user_token",
  "account_id": 1,
  "user_id": 2,
  "permissions": {
    "can_transact": false,
    "can_view_balance": true,
    "can_view_transactions": true,
    "can_manage_account": false
  }
}
```

### Dashboard & Statistics Endpoints

#### 1. Dashboard Overview
**Endpoint:** `POST /stats/overview.php`

**Request Body:**
```json
{
  "token": "user_token"
}
```

**Response:**
```json
{
  "code": 200,
  "status": "success",
  "data": {
    "summary": {
      "balance": {
        "total": 1500000,
        "available": 1200000,
        "wallets": 3
      },
      "transactions": {
        "count": 25,
        "volume": 500000,
        "pending": 2
      },
      "loans": {
        "active": 1,
        "amount": 300000,
        "pending": 0
      },
      "savings": {
        "amount": 200000,
        "goals": 2,
        "completed": 1
      }
    },
    "recent_transactions": [
      {
        "id": 1,
        "type": "transfer",
        "amount": 50000,
        "description": "Mobile Money Transfer",
        "created_at": "2024-03-16T10:30:00Z"
      }
    ]
  }
}
```

#### 2. Detailed Statistics
**Endpoint:** `POST /stats/stats.php`

**Request Body:**
```json
{
  "token": "user_token",
  "sections": "accounts,wallets,transactions,performance",
  "date_from": "2024-01-01",
  "date_to": "2024-12-31"
}
```

### Customer Management Endpoints

#### 1. Create Customer
**Endpoint:** `POST /customers/create.php`

**Request Body:**
```json
{
  "token": "user_token",
  "name": "Customer Name",
  "phone": "+250789123456",
  "email": "customer@example.com",
  "address": "Kigali, Rwanda",
  "account_type": "individual"
}
```

#### 2. Get Customer Details
**Endpoint:** `POST /customers/get.php`

**Request Body:**
```json
{
  "token": "user_token",
  "customer_id": 1
}
```

#### 3. Update Customer
**Endpoint:** `POST /customers/update.php`

**Request Body:**
```json
{
  "token": "user_token",
  "customer_id": 1,
  "name": "Updated Name",
  "phone": "+250789123456",
  "email": "updated@example.com"
}
```

#### 4. Delete Customer
**Endpoint:** `POST /customers/delete.php`

**Request Body:**
```json
{
  "token": "user_token",
  "customer_id": 1
}
```

### Supplier Management Endpoints

#### 1. Create Supplier
**Endpoint:** `POST /suppliers/create.php`

**Request Body:**
```json
{
  "token": "user_token",
  "name": "Supplier Name",
  "phone": "+250789123456",
  "email": "supplier@example.com",
  "address": "Kigali, Rwanda",
  "business_type": "dairy_farming"
}
```

#### 2. Get Supplier Details
**Endpoint:** `POST /suppliers/get.php`

#### 3. Update Supplier
**Endpoint:** `POST /suppliers/update.php`

#### 4. Delete Supplier
**Endpoint:** `POST /suppliers/delete.php`

### Collections Management Endpoints

#### 1. Create Collection
**Endpoint:** `POST /collections/create.php`

**Request Body:**
```json
{
  "token": "user_token",
  "supplier_account_code": "A_03DC87",
  "quantity": 50.5,
  "unit_price": 1200,
  "status": "accepted",
  "notes": "Quality: Aremewe"
}
```

#### 2. Get Collection Details
**Endpoint:** `POST /collections/get.php`

#### 3. Update Collection
**Endpoint:** `POST /collections/update.php`

#### 4. Cancel Collection
**Endpoint:** `POST /collections/cancel.php`

### Sales Management Endpoints

#### 1. Record Sale
**Endpoint:** `POST /sales/sell.php`

**Request Body:**
```json
{
  "token": "user_token",
  "customer_account_code": "A_16C846",
  "quantity": 25.0,
  "unit_price": 1500,
  "total_amount": 37500,
  "notes": "Fresh milk sale"
}
```

#### 2. Get Sales Data
**Endpoint:** `POST /sales/sales.php`

#### 3. Update Sale
**Endpoint:** `POST /sales/update.php`

#### 4. Cancel Sale
**Endpoint:** `POST /sales/cancel.php`

### Market/Orders Management Endpoints

#### Customer Order Endpoints

##### 1. List Customer Orders
**Endpoint:** `GET /market/orders/customers/my-orders.php`

**Parameters:**
- `customer_id` (required): Customer ID
- `status` (optional): Filter by status
- `limit` (optional): Records per page (default: 10)
- `page` (optional): Page number (default: 1)

##### 2. Get Order Details
**Endpoint:** `GET /market/orders/customers/my-order-details.php`

**Parameters:**
- `id` (required): Order ID
- `customer_id` (required): Customer ID

##### 3. Place Order
**Endpoint:** `POST /market/orders/customers/place-order.php`

**Request Body:**
```json
{
  "customer_id": 1,
  "seller_id": 2,
  "total_amount": 5000,
  "currency": "RWF",
  "shipping_address": "Kigali, Rwanda",
  "items": [
    {
      "product_id": 1,
      "quantity": 2,
      "unit_price": 2500
    }
  ]
}
```

##### 4. Cancel Order
**Endpoint:** `PUT /market/orders/customers/cancel-order.php`

#### Seller Order Endpoints

##### 1. List Seller Orders
**Endpoint:** `GET /market/orders/sellers/seller-orders.php`

##### 2. Get Seller Order Details
**Endpoint:** `GET /market/orders/sellers/seller-order-details.php`

##### 3. Update Order Status
**Endpoint:** `PUT /market/orders/sellers/update-status.php`

#### Admin Order Endpoints

##### 1. List All Orders (Admin)
**Endpoint:** `GET /market/orders/admin/admin-list.php`

##### 2. Get Any Order Details (Admin)
**Endpoint:** `GET /market/orders/admin/admin-details.php`

### Product Management Endpoints

#### 1. Create Product
**Endpoint:** `POST /market/products/create.php`

#### 2. Get Product Details
**Endpoint:** `POST /market/products/get.php`

#### 3. List Products
**Endpoint:** `POST /market/products/list.php`

#### 4. Update Product
**Endpoint:** `POST /market/products/update.php`

#### 5. Delete Product
**Endpoint:** `POST /market/products/delete.php`

#### 6. Search Products
**Endpoint:** `POST /market/products/search.php`

#### 7. Get Featured Products
**Endpoint:** `POST /market/products/featured.php`

#### 8. Get Recent Products
**Endpoint:** `POST /market/products/recent.php`

### Category Management Endpoints

#### 1. Create Category
**Endpoint:** `POST /market/categories/create.php`

#### 2. List Categories
**Endpoint:** `POST /market/categories/list.php`

#### 3. Get Category Details
**Endpoint:** `POST /market/categories/get.php`

#### 4. Update Category
**Endpoint:** `POST /market/categories/update.php`

#### 5. Delete Category
**Endpoint:** `POST /market/categories/delete.php`

### Analytics Endpoints

#### 1. Collections Analytics
**Endpoint:** `GET /analytics/collections.php`

**Parameters:**
- `token` (required): User token
- `date_from` (optional): Start date (YYYY-MM-DD)
- `date_to` (optional): End date (YYYY-MM-DD)
- `account_code` (optional): Account code filter

#### 2. Customer Analytics
**Endpoint:** `GET /analytics/customers.php`

#### 3. Metrics Data
**Endpoint:** `GET /analytics/metrics.php`

### Profile Management Endpoints

#### 1. Get Profile
**Endpoint:** `POST /profile/get.php`

**Request Body:**
```json
{
  "token": "user_token"
}
```

#### 2. Update Profile
**Endpoint:** `POST /profile/update.php`

**Request Body:**
```json
{
  "token": "user_token",
  "name": "Updated Name",
  "email": "updated@example.com",
  "phone": "+250789123456",
  "address": "Updated Address"
}
```

### KYC (Know Your Customer) Endpoints

#### 1. Upload KYC Photo
**Endpoint:** `POST /kyc/upload_photo.php`

**Request Body:**
```json
{
  "token": "user_token",
  "document_type": "national_id",
  "front_image": "base64_encoded_image",
  "back_image": "base64_encoded_image",
  "selfie_image": "base64_encoded_image"
}
```

### Notification Endpoints

#### 1. Create Notification
**Endpoint:** `POST /notifications/create.php`

#### 2. Get Notifications
**Endpoint:** `POST /notifications/get.php`

#### 3. Update Notification
**Endpoint:** `POST /notifications/update.php`

#### 4. Delete Notification
**Endpoint:** `POST /notifications/delete.php`

### Wallet Management Endpoints

#### 1. Get Wallet Details
**Endpoint:** `POST /wallets/get.php`

**Request Body:**
```json
{
  "token": "user_token"
}
```

### Migration Endpoints

#### 1. Migrate Collections
**Endpoint:** `POST /migrate/collections.php`

**Request Body:**
```json
{
  "token": "user_token",
  "dry_run": false,
  "limit": 100
}
```

### API Keys Management

#### 1. Get API Keys
**Endpoint:** `POST /api_keys/get.php`

**Request Body:**
```json
{
  "token": "user_token"
}
```

## Error Codes

| Code | Description |
|------|-------------|
| 200 | Success |
| 400 | Bad Request - Invalid input |
| 401 | Unauthorized - Invalid credentials |
| 403 | Forbidden - Invalid token |
| 404 | Not Found - Resource not found |
| 500 | Internal Server Error |

## Rate Limiting

- **Authentication endpoints**: 5 requests per minute
- **General endpoints**: 100 requests per minute
- **Analytics endpoints**: 20 requests per minute

## Security Features

1. **Token-based Authentication**: All protected endpoints require valid tokens
2. **Input Validation**: All inputs are validated and sanitized
3. **SQL Injection Protection**: Prepared statements used throughout
4. **CORS Support**: Cross-origin requests properly handled
5. **Rate Limiting**: Prevents abuse and ensures fair usage
6. **Error Handling**: Graceful error responses without exposing sensitive information

## Testing

The API includes comprehensive testing endpoints and Postman collections for easy testing and integration.

### Postman Collection
A complete Postman collection is available at:
```
/api/v2/analytics/Gemura_Analytics_API.postman_collection.json
```

## Integration Examples

### JavaScript/Angular Integration
```typescript
// Login example
const loginData = {
  identifier: 'user@example.com',
  password: 'password123'
};

const response = await fetch('https://api.gemura.rw/v2/auth/login.php', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(loginData)
});

const result = await response.json();
```

### PHP Integration
```php
// Get dashboard data
$data = [
    'token' => 'user_token_here'
];

$response = file_get_contents('https://api.gemura.rw/v2/stats/overview.php', false, stream_context_create([
    'http' => [
        'method' => 'POST',
        'header' => 'Content-Type: application/json',
        'content' => json_encode($data)
    ]
]));

$result = json_decode($response, true);
```

This comprehensive API documentation covers all implemented endpoints with examples, request/response formats, and integration patterns.

