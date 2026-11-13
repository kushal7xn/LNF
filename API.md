# API Documentation

Base URL: `http://localhost:5000/api`

## Authentication

All authenticated endpoints require a Bearer token in the Authorization header:
```
Authorization: Bearer <jwt_token>
```

Tokens are obtained from login/register endpoints and expire after 24 hours.

## Authentication Endpoints

### POST /auth/register
Register a new user account.

**Request Body:**
```json
{
  "username": "string (required)",
  "email": "string (required, valid email)",
  "password": "string (required, min 6 chars)"
}
```

**Response (200):**
```json
{
  "user": {
    "id": 1,
    "username": "john_doe",
    "email": "john@example.com",
    "role": "user"
  },
  "token": "jwt_token_string"
}
```

**Errors:**
- `400`: Validation error or user already exists

### POST /auth/login
Login with existing credentials.

**Request Body:**
```json
{
  "email": "string (required)",
  "password": "string (required)"
}
```

**Response (200):**
```json
{
  "user": {
    "id": 1,
    "username": "john_doe", 
    "email": "john@example.com",
    "role": "user"
  },
  "token": "jwt_token_string"
}
```

**Errors:**
- `401`: Invalid credentials

## Items Endpoints

### GET /items/search
Search approved items (public endpoint).

**Query Parameters:**
- `category` (optional): Filter by category
- `location` (optional): Filter by location  
- `date_from` (optional): Filter by date found (YYYY-MM-DD)
- `date_to` (optional): Filter by date found (YYYY-MM-DD)
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)

**Response (200):**
```json
[
  {
    "id": 1,
    "category": "Phone",
    "color": "Black",
    "location_found": "Central Park",
    "date_found": "2023-12-01",
    "photo_url": "/uploads/item-123.jpg",
    "created_at": "2023-12-01T10:00:00Z",
    "finder_username": "john_doe"
  }
]
```

**Note:** Secret details are NEVER included in this response.

### GET /items/:id
Get single item details (public endpoint).

**Response (200):**
```json
{
  "id": 1,
  "category": "Phone", 
  "color": "Black",
  "location_found": "Central Park",
  "date_found": "2023-12-01",
  "photo_url": "/uploads/item-123.jpg",
  "created_at": "2023-12-01T10:00:00Z",
  "status": "approved",
  "finder_username": "john_doe"
}
```

**Errors:**
- `404`: Item not found or not approved

### POST /items
Post a new found item (authenticated).

**Request Body (multipart/form-data):**
```
category: string (required)
color: string (required) 
location_found: string (required)
date_found: string (required, YYYY-MM-DD)
secret_detail: string (required)
photo: file (optional, image only, max 5MB)
```

**Response (200):**
```json
{
  "id": 1,
  "message": "Item posted successfully and is pending approval"
}
```

**Errors:**
- `400`: Validation error
- `401`: Authentication required

### GET /items/user/mine
Get current user's posted items (authenticated).

**Response (200):**
```json
[
  {
    "id": 1,
    "category": "Phone",
    "color": "Black", 
    "location_found": "Central Park",
    "date_found": "2023-12-01",
    "photo_url": "/uploads/item-123.jpg",
    "status": "approved",
    "claimed_by": null,
    "verified_correct": false,
    "returned": false,
    "created_at": "2023-12-01T10:00:00Z"
  }
]
```

**Note:** Secret details are excluded even for the owner in this endpoint.

## Claims Endpoints

### POST /claims/:itemId
Submit a claim attempt for an item (authenticated).

**Request Body:**
```json
{
  "answer": "string (required)"
}
```

**Response (200):**
```json
{
  "message": "Claim submitted for admin verification",
  "attempt_id": 1,
  "attempts_used": 1,
  "attempts_remaining": 4,
  "pending_verification": true
}
```

**Errors:**
- `400`: Invalid answer or cannot claim own item
- `404`: Item not found
- `429`: Maximum attempts reached

### GET /claims/mine
Get current user's claim attempts (authenticated).

**Response (200):**
```json
[
  {
    "id": 1,
    "item_id": 1,
    "answer": "Has cracked screen",
    "is_correct": null,
    "created_at": "2023-12-01T11:00:00Z",
    "category": "Phone",
    "color": "Black",
    "item_status": "approved"
  }
]
```

### GET /claims/item/:itemId/can-claim
Check if user can claim an item (authenticated).

**Response (200):**
```json
{
  "can_claim": true,
  "attempts_used": 2,
  "remaining_attempts": 3,
  "max_attempts": 5
}
```

## Admin Endpoints

All admin endpoints require `role: "admin"`.

### GET /admin/pending
Get items pending approval.

**Response (200):**
```json
[
  {
    "id": 1,
    "category": "Phone",
    "color": "Black",
    "location_found": "Central Park", 
    "date_found": "2023-12-01",
    "photo_url": "/uploads/item-123.jpg",
    "secret_detail": "Has cracked screen on bottom left",
    "finder_username": "john_doe",
    "finder_email": "john@example.com",
    "created_at": "2023-12-01T10:00:00Z"
  }
]
```

### POST /admin/approve/:id
Approve a pending item.

**Response (200):**
```json
{
  "message": "Item approved successfully"
}
```

### POST /admin/reject/:id
Reject a pending item.

**Request Body:**
```json
{
  "reason": "string (required)"
}
```

**Response (200):**
```json
{
  "message": "Item rejected successfully"
}
```

### GET /admin/claims
Get claim attempts needing verification.

**Response (200):**
```json
[
  {
    "id": 1,
    "item_id": 1,
    "user_id": 2,
    "answer": "Has cracked screen",
    "created_at": "2023-12-01T11:00:00Z",
    "category": "Phone",
    "color": "Black",
    "location_found": "Central Park",
    "secret_detail": "Has cracked screen on bottom left",
    "claimant_username": "jane_doe",
    "finder_username": "john_doe"
  }
]
```

### POST /admin/verify-claim/:id
Verify a claim attempt (binary decision).

**Request Body:**
```json
{
  "is_correct": true
}
```

**Response (200):**
```json
{
  "message": "Claim verified as correct. Item ready for handover.",
  "handover_ready": true
}
```

**Conflict Response (409):**
```json
{
  "error": "Multiple correct claims detected. Manual resolution required.",
  "requires_manual_resolution": true
}
```

### GET /admin/stats
Get dashboard statistics.

**Response (200):**
```json
{
  "pending": 5,
  "approved": 23,
  "claimed": 8,
  "returned": 15,
  "pending_verifications": 3
}
```

## Messages Endpoints

### GET /messages/item/:itemId
Get messages for verified handover (authenticated).

**Response (200):**
```json
{
  "item": {
    "id": 1,
    "category": "Phone",
    "color": "Black",
    "location_found": "Central Park",
    "finder_id": 1,
    "claimant_id": 2
  },
  "messages": [
    {
      "id": 1,
      "sender_id": 1,
      "receiver_id": 2,
      "content": "Hi, when can we meet?",
      "created_at": "2023-12-01T12:00:00Z",
      "sender_username": "john_doe",
      "receiver_username": "jane_doe"
    }
  ]
}
```

**Errors:**
- `403`: Not authorized for this conversation

### POST /messages/item/:itemId
Send message in handover (authenticated).

**Request Body:**
```json
{
  "content": "string (required)"
}
```

**Response (200):**
```json
{
  "message_id": 1,
  "message": "Message sent successfully"
}
```

### POST /messages/item/:itemId/complete
Mark item as returned (finder only).

**Response (200):**
```json
{
  "message": "Item marked as successfully returned"
}
```

### GET /messages/handovers
Get active handovers for current user.

**Response (200):**
```json
[
  {
    "id": 1,
    "category": "Phone",
    "color": "Black",
    "location_found": "Central Park",
    "user_role": "finder",
    "finder_username": "john_doe", 
    "claimant_username": "jane_doe",
    "returned": false
  }
]
```

## Error Responses

All errors follow this format:
```json
{
  "error": "Error message description"
}
```

**Common HTTP Status Codes:**
- `400`: Bad Request (validation error)
- `401`: Unauthorized (missing/invalid token)
- `403`: Forbidden (insufficient permissions) 
- `404`: Not Found
- `409`: Conflict (business logic error)
- `429`: Too Many Requests (rate limited)
- `500`: Internal Server Error

## Security Notes

1. **Secret Detail Protection**: The `secret_detail` field is NEVER included in public endpoints
2. **Authentication**: JWT tokens expire after 24 hours
3. **Rate Limiting**: 100 requests per 15 minutes per IP
4. **File Upload**: Images only, 5MB max size
5. **Input Validation**: All inputs are validated and sanitized
6. **Role-Based Access**: Admin endpoints require admin role

## Rate Limiting

- **General**: 100 requests per 15 minutes per IP
- **Claim Attempts**: Max 5 attempts per user per item (permanent)
- **File Upload**: 5MB max file size

## File Upload

Images are uploaded to `/server/uploads/` and served at `/uploads/<filename>`.

**Supported formats**: JPEG, JPG, PNG, GIF
**Max size**: 5MB
**Naming**: `item-{timestamp}-{random}.{ext}`