# Organizational Donation Collection System Backend

A comprehensive Node.js + Express + MongoDB backend system for managing hierarchical organizational donation collections with authentication, member management, and recursive reporting.

## Features

- **Hierarchical Organization Structure**: Support for 8-level hierarchy (Bharat → Kshetra → Prant → Vibhag → Jila → Nagar → Khand → Branch)
- **JWT Authentication**: Secure login system with auto-generated credentials
- **Member Management**: Branch-level member registration and management  
- **Payment Tracking**: Complete payment logging with multiple payment modes
- **Recursive Reporting**: Drill-down collection reports with aggregated totals
- **Access Control**: Node-based permissions ensuring data security

## Technology Stack

- **Backend**: Node.js with Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT tokens with bcrypt password hashing
- **Architecture**: Modular structure with separated models, controllers, and routes

## Quick Start

1. **Clone and Install**
   ```bash
   npm install
   ```

2. **Environment Setup**
   ```bash
   cp .env.example .env
   # Edit .env with your MongoDB URI and JWT secret
   ```

3. **Start the Server**
   ```bash
   npm start        # Production mode
   npm run dev      # Development mode with nodemon
   ```

4. **API Base URL**
   ```
   http://localhost:5000/api
   ```

## API Endpoints

### Authentication
- `POST /auth/login` - Login with nodeCode and password
- `GET /auth/me` - Get current user information

### Node Management
- `POST /nodes` - Create child node under current user
- `GET /nodes/:id` - Get node details
- `GET /nodes/:id/children` - Get direct children of node
- `GET /nodes/my-children` - Get current user's children

### Member Management (Branch only)
- `POST /members` - Create new member
- `GET /members/my-members` - Get current branch's members
- `GET /members/:branchId` - Get members of specific branch
- `GET /members/detail/:id` - Get member details

### Payment Management
- `POST /payments` - Record new payment
- `GET /payments/:memberId` - Get member's payment history
- `GET /payments/my-branch` - Get current branch's all payments
- `GET /payments/detail/:id` - Get payment details

### Collection Reports
- `GET /collections/:nodeId` - Get recursive collection report
- `GET /collections/my-summary` - Get current user's collection summary

## Data Models

### Node Schema
```javascript
{
  name: String,                    // Organization name
  type: Enum,                     // Bharat|Kshetra|Prant|Vibhag|Jila|Nagar|Khand|Branch
  parentId: ObjectId,             // Reference to parent node
  nodeCode: String,               // Auto-generated login code
  password: String                // Hashed password
}
```

### Member Schema (Branch only)
```javascript
{
  branchId: ObjectId,             // Must be Branch type node
  name: String,
  email: String,
  phone: String,
  address: String,
  age: Number,
  occupation: String
}
```

### Payment Schema
```javascript
{
  memberId: ObjectId,             // Reference to member
  amount: Number,                 // Payment amount
  modeOfPayment: Enum,           // cash|upi|cheque
  date: Date,                    // Payment date
  description: String            // Optional description
}
```

## Authentication Flow

1. **Node Creation**: Each node gets auto-generated `nodeCode` and `password`
2. **Login**: Use `nodeCode` + `password` to get JWT token
3. **Authorization**: Include `Bearer <token>` in Authorization header
4. **Access Control**: Users can only access their node and descendants

## Example Usage

### 1. Login
```bash
POST /api/auth/login
{
  "nodeCode": "BHA123ABC",
  "password": "auto_generated_password"
}

Response:
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "nodeId": "60d5ec49f1b2c8b1f8e4e1a1",
    "type": "Bharat",
    "name": "Bharat Organization"
  }
}
```

### 2. Create Child Node
```bash
POST /api/nodes
Authorization: Bearer <token>
{
  "name": "Maharashtra Kshetra",
  "type": "Kshetra"
}

Response:
{
  "success": true,
  "data": {
    "nodeCode": "KSH456DEF",
    "rawPassword": "temp789xyz"  // Show only once
  }
}
```

### 3. Create Member (Branch only)
```bash
POST /api/members
Authorization: Bearer <branch_token>
{
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "+91-9876543210",
  "age": 35
}
```

### 4. Record Payment
```bash
POST /api/payments
Authorization: Bearer <branch_token>
{
  "memberId": "60d5ec49f1b2c8b1f8e4e1a2",
  "amount": 1000,
  "modeOfPayment": "upi"
}
```

### 5. Get Collection Report
```bash
GET /api/collections/60d5ec49f1b2c8b1f8e4e1a1
Authorization: Bearer <token>

Response:
{
  "success": true,
  "data": {
    "nodeId": "60d5ec49f1b2c8b1f8e4e1a1",
    "nodeName": "Pune Vibhag",
    "nodeType": "Vibhag",
    "totalCollection": 15000,
    "children": [
      {
        "id": "60d5ec49f1b2c8b1f8e4e1a2",
        "name": "Pune City",
        "type": "Jila", 
        "totalCollection": 10000,
        "children": [...]
      }
    ]
  }
}
```

## Error Handling

The API returns consistent error responses:

```javascript
{
  "success": false,
  "message": "Error description",
  "errors": [...] // Validation errors if applicable
}
```

## Security Features

- **Password Hashing**: bcrypt with salt rounds
- **JWT Tokens**: Secure authentication with expiration
- **Access Control**: Hierarchical permissions
- **Input Validation**: Comprehensive request validation
- **Error Sanitization**: No sensitive data in error responses

## Development Setup

1. **Prerequisites**
   - Node.js 16+ 
   - MongoDB 4.4+

2. **Development Tools**
   - Nodemon for auto-restart
   - Mongoose for MongoDB ODM
   - Express validator for input validation

3. **Database Setup**
   ```bash
   # MongoDB connection string in .env
   MONGO_URI=mongodb://localhost:27017/donation_collection
   ```

## Production Deployment

1. **Environment Variables**
   ```bash
   PORT=5000
   MONGO_URI=mongodb://your-production-db/donation_collection
   JWT_SECRET=your-super-secret-key
   NODE_ENV=production
   ```

2. **Security Considerations**
   - Use strong JWT secrets
   - Enable MongoDB authentication
   - Implement rate limiting
   - Use HTTPS in production

## License

MIT License - feel free to use this project for your organizational needs.