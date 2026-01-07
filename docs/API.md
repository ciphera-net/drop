# Drop API Documentation

## Base URL

- **Development**: `http://localhost:8080`
- **Production**: `https://drop-api.ciphera.net`

All API endpoints are prefixed with `/api/v1`.

## Authentication

Authentication is handled by the **Ciphera Auth** service (`auth.ciphera.net`) using OAuth 2.0 with PKCE.

### Base URL (Auth)
- **Development**: `http://localhost:8081`
- **Production**: `https://auth.ciphera.net`

### OAuth2 Flow

To authenticate a user, applications must follow the standard Authorization Code Flow with PKCE:

1.  **Authorize**: Redirect user to `GET /oauth/authorize`
    *   Params: `client_id`, `redirect_uri`, `response_type=code`, `state`, `code_challenge`, `code_challenge_method=S256`
2.  **Login**: User logs in on the hosted page.
3.  **Callback**: Server redirects back to `redirect_uri` with a `code`.
4.  **Token Exchange**: Application swaps code for token.

### Token Endpoint
**Endpoint**: `POST /oauth/token`

**Request Body**:
```json
{
  "grant_type": "authorization_code",
  "code": "auth-code-from-callback",
  "client_id": "drop-app",
  "redirect_uri": "https://drop.ciphera.net/auth/callback",
  "code_verifier": "pkce-verifier-string"
}
```

**Response**:
```json
{
  "access_token": "jwt-token-string",
  "refresh_token": "random-refresh-token",
  "token_type": "Bearer",
  "expires_in": 900,
  "id_token": "jwt-token-string"
}
```

### Refresh Token Endpoint
**Endpoint**: `POST /api/v1/auth/refresh`

**Request Body**:
```json
{
  "refresh_token": "your-refresh-token"
}
```

**Response**:
```json
{
  "access_token": "new-jwt-token-string",
  "refresh_token": "new-random-refresh-token",
  "expires_in": 900
}
```

## API Endpoints (Backend)

All backend endpoints (except Health) require the JWT token in the `Authorization` header:
`Authorization: Bearer <token>`

### User Files

#### List User Files
List all files owned by the authenticated user (uploaded by them or sent to their requests).

**Endpoint**: `GET /api/v1/user/files`

**Response**:
```json
{
  "files": [
    {
      "id": "uuid",
      "share_id": "share-id",
      "created_at": "2024-01-01T00:00:00Z",
      "file_size": 1024,
      "download_count": 0,
      "expires_at": "2024-01-08T00:00:00Z",
      "encrypted_filename": "..."
    }
  ]
}
```

#### Delete File
Permanently delete a file.

**Endpoint**: `DELETE /api/v1/files/:id`

**Response**: `200 OK`

### File Upload & Download

#### Upload File
Upload an encrypted file to the server.

**Endpoint**: `POST /api/v1/upload`

**Request Body**:
```json
{
  "encryptedData": "base64-encoded-encrypted-file-data",
  "encryptedFilename": "base64-encoded-encrypted-filename",
  "iv": "base64-encoded-iv",
  "fileSize": 1024,
  "mimeType": "application/pdf",
  "expirationMinutes": 10080,
  "password": "optional-password",
  "downloadLimit": 10,
  "oneTimeDownload": false,
  "captcha_id": "optional-captcha-id",
  "captcha_solution": "optional-captcha-solution",
  "captcha_token": "optional-captcha-token"
}
```

**Response**:
```json
{
  "shareId": "uuid-share-id",
  "shareUrl": "https://.../share-id#key",
  "expiresAt": "2024-01-01T00:00:00Z"
}
```

**Note on Captcha**: Anonymous uploads may require captcha verification. If the server returns `423 Locked`, the response will include `"require_captcha": true`. The client must then solve a captcha (using the `ciphera-captcha` service) and retry the upload with `captcha_token` (or `captcha_id` + `captcha_solution`).

#### Download File
Download an encrypted file from the server.

**Endpoint**: `POST /api/v1/download`

**Request Body**:
```json
{
  "shareId": "uuid-share-id",
  "password": "optional-password"
}
```

**Response**:
```json
{
  "encryptedData": "base64-encoded-encrypted-file-data",
  "filename": "base64-encoded-encrypted-filename",
  "iv": "base64-encoded-iv",
  "expiresAt": "2024-01-01T00:00:00Z",
  "downloadCount": 1,
  "downloadLimit": 10,
  "oneTimeDownload": false
}
```

### File Requests

#### Create Request
Create a secure link for others to upload files to you.

**Endpoint**: `POST /api/v1/requests`

**Request Body**:
```json
{
  "encryptedTitle": "base64-encrypted-title",
  "encryptedDescription": "base64-encrypted-desc",
  "iv": "base64-iv",
  "expirationMinutes": 10080,
  "maxUploads": 10
}
```

**Response**:
```json
{
  "requestId": "diceware-id",
  "requestUrl": "/request/diceware-id",
  "expiresAt": "2024-01-08T00:00:00Z"
}
```

#### Get Request Details
Get public details of a file request.

**Endpoint**: `GET /api/v1/requests/:requestId`

**Response**:
```json
{
  "requestId": "diceware-id",
  "encryptedTitle": "...",
  "encryptedDescription": "...",
  "iv": "...",
  "expiresAt": "...",
  "maxUploads": 10
}
```

#### Upload to Request
Upload a file to a specific request.

**Endpoint**: `POST /api/v1/requests/:requestId/upload`

**Request Body**:
```json
{
  "encryptedData": "...",
  "encryptedFilename": "...",
  "iv": "...",
  "fileSize": 1024,
  "mimeType": "application/pdf"
}
```

#### List User Requests
List active file requests created by the user.

**Endpoint**: `GET /api/v1/requests`

**Response**:
```json
{
  "requests": [
    {
      "request_id": "diceware-id",
      "encrypted_title": "...",
      "created_at": "...",
      "expires_at": "..."
    }
  ]
}
```

### System

#### Health Check
Check if the API is running.

**Endpoint**: `GET /health`

**Response**:
```json
{
  "status": "ok",
  "service": "drop-backend"
}
```

## Error Responses

All errors follow this format:

```json
{
  "error": "Error type",
  "message": "Detailed error message"
}
```

**Status Codes**:
- `400` - Bad Request
- `401` - Unauthorized
- `404` - Not Found
- `410` - Gone (File/Request expired)
- `423` - Locked (Captcha verification required)
- `429` - Too Many Requests (Rate limit exceeded)
- `500` - Internal Server Error

## Rate Limiting

Rate limiting is applied per IP address. Default limit is 60 requests per minute.

## Encryption

All files are encrypted client-side using AES-256-GCM before upload. The encryption key is never sent to the server and is embedded in the share URL hash.
