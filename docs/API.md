# API Documentation

All API responses follow a standard JSON format:

**Success Response:**
```json
{
  "success": true,
  "message": "Operation completed successfully",
  "data": {}
}
```

**Error Response:**
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": []
}
```

## Authentication

### `POST /api/auth/register`
Register a new user.
* **Body:**
  * `name` (string, required)
  * `email` (string, required)
  * `password` (string, required, min 6 characters)

### `POST /api/auth/login`
Authenticate a user and get a JWT token.
* **Body:**
  * `email` (string, required)
  * `password` (string, required)

### `GET /api/auth/me`
Get the current logged-in user's data.
* **Headers:** `Authorization: Bearer <token>`

### `POST /api/auth/logout`
Logout the user.
* **Headers:** `Authorization: Bearer <token>`

## Additional Modules (To Be Implemented)
* **Products**: `/api/products`
* **Cart**: `/api/cart`
* **Orders**: `/api/orders`
* **Payments**: `/api/payments`
