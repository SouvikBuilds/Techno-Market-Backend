# Swagger API Documentation

## Overview

This project now includes comprehensive Swagger/OpenAPI 3.0 documentation for all API endpoints in the College Marketplace application.

## Accessing the Documentation

### Swagger UI

Once the server is running, you can access the interactive Swagger UI at:

```
http://localhost:8000/api/docs
```

This provides a user-friendly interface to:

- View all available endpoints
- Test endpoints directly from the browser
- See request/response schemas
- Understand authentication requirements

### OpenAPI Specification (JSON)

The raw OpenAPI specification is available at:

```
http://localhost:8000/api/docs/swagger.json
```

## Project Setup

### Installed Packages

The following packages have been added to support Swagger documentation:

- `swagger-ui-express` - Provides the Swagger UI interface
- `swagger-jsdoc` - Generates OpenAPI spec from JSDoc comments

To see the installed packages, run:

```bash
npm list swagger-ui-express swagger-jsdoc
```

## API Documentation Structure

### Files Created

1. **`src/swagger.js`**
   - Main Swagger configuration file
   - Defines OpenAPI 3.0 specification
   - Sets up security schemes (Bearer tokens, cookies)
   - Defines reusable schemas for requests and responses

2. **`src/swagger.routes.js`**
   - JSDoc comments documenting all API endpoints
   - Includes request/response examples
   - Specifies required parameters and headers
   - Documents authentication requirements

### Updated File

3. **`src/app.js`**
   - Added Swagger UI middleware
   - Routes `/api/docs` to the Swagger UI
   - Configured Swagger UI options

## API Endpoints Documentation

### Authentication Endpoints (`/api/v1/auth`)

- `POST /signup` - Register new user with optional avatar
- `POST /verify/me` - Verify email with verification code
- `POST /send/verifyCode` - Resend verification email
- `POST /login` - Authenticate user and receive JWT tokens
- `POST /logout` - Logout and invalidate tokens (requires auth)
- `GET /me` - Get current user profile (requires auth)
- `PATCH /update/me` - Update user profile (requires auth)
- `PATCH /update/avatar` - Update profile picture (requires auth)
- `PATCH /change/password` - Change password (requires auth)
- `POST /refresh-token` - Generate new access token
- `DELETE /delete/user/:id` - Delete user (admin only)
- `PATCH /update/user/:id` - Update user role (admin only)

### Product Endpoints (`/api/v1/products`)

- `POST /add` - Create new product (requires auth, multipart)
- `GET /all-products` - Get all products with pagination
- `GET /seller-products/:id` - Get all products by seller
- `GET /product/:id` - Get product details
- `PATCH /product/:id` - Update product (seller only, requires auth)
- `PATCH /update-icon-image/:id` - Update main image (seller only, requires auth, multipart)
- `DELETE /delete-product/:id` - Delete product (seller only, requires auth)

### Interest Endpoints (`/api/v1/interest`)

- `POST /send-interest/:productId` - Send interest in a product (requires auth)

## Authentication

The API uses two methods for authentication:

### 1. Bearer Token (Recommended for APIs)

Include in the Authorization header:

```
Authorization: Bearer <your_jwt_token>
```

### 2. Cookie Authentication

JWT tokens can be stored in cookies (`accessToken`) and are automatically sent with requests.

## Using Swagger UI to Test Endpoints

### For Endpoints Requiring Authentication:

1. Open Swagger UI at `http://localhost:8000/api/docs`
2. Look for the lock icon in the top right
3. Click "Authorize" button
4. Paste your JWT token in the "Authorization" field with format: `Bearer <token>`
5. Click "Authorize" to enable authenticated requests

### For File Upload Endpoints:

1. Go to the endpoint documentation (e.g., `POST /api/v1/auth/signup`)
2. Click the "Try it out" button
3. Fill in required fields
4. For file uploads, click the file input to select files
5. Click "Execute" to send the request

## API Response Format

### Success Response

```json
{
  "success": true,
  "message": "Operation successful",
  "statusCode": 200,
  "data": {}
}
```

### Error Response

```json
{
  "success": false,
  "message": "Error description",
  "statusCode": 400
}
```

## Data Schemas

### User Schema

- **name**: string (required)
- **email**: string, unique (required)
- **password**: string with complexity requirements (required)
- **stream**: "Btech", "Bca", "Mca", "Others" (required)
- **branch**: "CSE", "IT", "Mechanical", "Electrical", "ECE", "Food Technology", "Others" (required)
- **year**: "1st year", "2nd year", "3rd year", "4th year" (required)
- **avatar**: Cloudinary image URL
- **availabilityTime**: string
- **role**: "admin" or "user" (default: "user")
- **isVerified**: boolean (default: false)

### Product Schema

- **seller**: User ObjectId (required)
- **title**: string (required)
- **price**: number (required)
- **priceNegotiabilityFlag**: boolean (required)
- **category**: "Book", "Notes", "ED Kit", "Others" (required)
- **description**: string (required)
- **productImage**: image URL from Cloudinary (required)
- **productImages**: array of URLs (up to 4 additional images)
- **availability**: boolean (required)

### Interest Schema

- **product**: Product ObjectId
- **buyer**: User ObjectId
- **seller**: User ObjectId

## Server Configuration

### Running the Server

```bash
# Development mode (with auto-reload)
npm run dev

# Production mode
npm start
```

### Default Configuration

- **Port**: 8000 (configurable via PORT env variable)
- **MongoDB**: Connected via MONGODB_URI
- **CORS Origin**: http://localhost:5174 (configurable via ORIGIN env variable)
- **API Version**: v1

## Environment Variables Required

```env
PORT=8000
MONGODB_URI=mongodb+srv://...
ORIGIN=http://localhost:5174
ACCESS_TOKEN_SECRET=your_secret
ACCESS_TOKEN_EXPIRY=7d
REFRESH_TOKEN_SECRET=your_secret
REFRESH_TOKEN_EXPIRY=10d
CLOUDINARY_API_KEY=...
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_SECRET=...
SMTP_USER=...
SMTP_PASS=...
```

## Tips for API Development

### 1. Authentication Flow

```
1. POST /auth/signup → Register user
2. POST /auth/verify/me → Verify email
3. POST /auth/login → Get JWT tokens
4. Use accessToken for authenticated requests
5. Use refreshToken to get new accessToken when expired
```

### 2. Product Listing Flow

```
1. GET /products/all-products → Browse products
2. GET /products/product/:id → View details
3. GET /products/seller-products/:id → View seller's products
```

### 3. Purchase Interest Flow

```
1. GET /products/product/:id → View product
2. POST /interest/send-interest/:productId → Express interest
3. Seller receives email notification
```

## Documentation Maintenance

When adding new endpoints:

1. **Add JSDoc comments in `swagger.routes.js`** following the format:

```javascript
/**
 * @swagger
 * /api/v1/path:
 *   method:
 *     summary: Brief endpoint description
 *     tags: [Tag Name]
 *     description: Detailed description
 *     ...
 */
```

2. **Update schemas in `swagger.js`** if adding new request/response structures

3. **Test in Swagger UI** to ensure documentation is accurate

## Troubleshooting

### Swagger UI Not Loading

- Ensure server is running on port 8000
- Check `src/swagger.js` imports
- Verify `swagger-ui-express` and `swagger-jsdoc` packages are installed

### Endpoints Not Showing

- Verify JSDoc comments are in `swagger.routes.js`
- Check for syntax errors in JSDoc
- Restart the development server

### Authentication Issues

- Ensure token format is correct: `Bearer <token>`
- Check token hasn't expired
- Verify user role has required permissions

## Additional Resources

- [Swagger UI Documentation](https://swagger.io/tools/swagger-ui/)
- [OpenAPI 3.0 Specification](https://spec.openapis.org/oas/v3.0.3)
- [swagger-jsdoc Documentation](https://github.com/Surnet/swagger-jsdoc)

---

**API Base URL**: http://localhost:8000
**Documentation**: http://localhost:8000/api/docs
**OpenAPI JSON**: http://localhost:8000/api/docs/swagger.json
