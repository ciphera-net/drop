# Drop API Documentation

## Base URL

- **Development**: `http://localhost:8080`
- **Production**: `https://api.drop.ciphera.net`

All API endpoints are prefixed with `/api/v1`.

## Authentication

Currently, no authentication is required. Rate limiting is applied per IP address.

## Endpoints

### Upload File

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
  "expirationDays": 7,
  "password": "optional-password",
  "downloadLimit": 10,
  "oneTimeDownload": false
}
```

**Response**:
```json
{
  "shareId": "uuid-share-id",
  "shareUrl": "/share-id",
  "expiresAt": "2024-01-01T00:00:00Z",
  "downloadLimit": 10,
  "oneTimeDownload": false
}
```

### Download File

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

### Health Check

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
- `404` - Not Found
- `410` - Gone (File expired)
- `429` - Too Many Requests (Rate limit exceeded)
- `500` - Internal Server Error

## Rate Limiting

Rate limiting is applied per IP address. Default limit is 60 requests per minute.

## Encryption

All files are encrypted client-side using AES-256-GCM before upload. The encryption key is never sent to the server and is embedded in the share URL hash.
