# Config Service

A lightweight Express.js service for managing runtime configuration via REST API with authentication and validation.

## Features

- **GET /api/config** - Retrieve current configuration (public)
- **POST /api/config** - Update configuration (partial updates supported, requires authentication)
- **PUT /api/config** - Replace entire configuration (requires authentication)
- **GET /health** - Health check endpoint (public)
- **Authentication** - Bearer token authentication for write operations
- **Validation** - Input validation for all configuration values

## Configuration

The service stores configuration in a JSON file at `/data/config.json` (configurable via `CONFIG_FILE` environment variable).

On first startup, it initializes the config file with values from environment variables.

### Environment Variables

- `PORT` - Service port (default: 3001)
- `CONFIG_FILE` - Path to config file (default: /data/config.json)
- `MEETINGS_CONFIG_ADMIN_TOKEN` - Authentication token for write operations (default: "default-admin-token-change-me")

**IMPORTANT:** Always set a custom `MEETINGS_CONFIG_ADMIN_TOKEN` in production!

## Docker

### Build the Docker Image

```bash
docker build -t truetime-meetings-config .
```

### Run the Docker Container

```bash
docker run -p 3001:3001 \
  -e PORT=3001 \
  -e CONFIG_FILE=/data/config.json \
  -e MEETINGS_CONFIG_ADMIN_TOKEN=default-admin-token-change-me \
  truetime-meetings-config
```

**Note:** For production deployments, always set a strong `MEETINGS_CONFIG_ADMIN_TOKEN` value instead of the default.

## API Usage

### Get current configuration (No authentication required)
```bash
curl http://localhost:3000/api/config
```

### Update specific fields (partial update) - **Requires Authentication**
```bash
curl -X POST http://localhost:3000/api/config \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-admin-token" \
  -d '{
    "VITE_ENABLE_RECORDING": "true",
    "VITE_DEFAULT_THEME": "dark"
  }'
```

### Replace entire configuration - **Requires Authentication**
```bash
curl -X PUT http://localhost:3000/api/config \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-admin-token" \
  -d '{
    "VITE_HOST": "https://new-domain.com",
    "VITE_BACKEND_HOST": "",
    "VITE_ENABLE_RECORDING": "false",
    "VITE_ENABLE_CLOSED_CAPTION": "true",
    "VITE_DEFAULT_THEME": "default"
  }'
```

## Validation Rules

The service validates all configuration values:

### URL Fields
- `VITE_HOST` - Must be a valid URL or empty string
- `VITE_BACKEND_HOST` - Must be a valid URL or empty string
- `VITE_LOGO_URL` - Must be a valid URL or empty string
- `VITE_TURN_SERVER_URL` - Must start with `turn:` or `turns:` or be empty

### Boolean Fields
- `VITE_ENABLE_RECORDING` - Must be `"true"` or `"false"`
- `VITE_ENABLE_CLOSED_CAPTION` - Must be `"true"` or `"false"`

### Theme Field
- `VITE_DEFAULT_THEME` - Must be one of: `default`, `dark`, `blue`, `black`

### Example Validation Error Response
```json
{
  "error": "Validation failed",
  "errors": [
    "VITE_HOST must be a valid URL or empty string",
    "VITE_ENABLE_RECORDING must be \"true\" or \"false\"",
    "VITE_DEFAULT_THEME must be one of: default, dark, blue, black"
  ]
}
```

## Security Considerations

The service includes the following security features:

✅ **Authentication** - All write operations (POST/PUT) require Bearer token authentication
✅ **Validation** - All config values are validated before being saved
✅ **CORS** - CORS is enabled for frontend access
✅ **Read-only public endpoint** - GET endpoint is public (config is not sensitive)

### Production Deployment Checklist

1. ✅ **Set a strong MEETINGS_CONFIG_ADMIN_TOKEN** - Add to docker-compose.yml environment variables
2. ⚠️ **Use HTTPS** - Deploy behind a reverse proxy with SSL/TLS
3. ⚠️ **Rate limiting** - Consider adding rate limiting for production (optional)
4. ⚠️ **Network isolation** - Consider restricting config service to internal network only
5. ⚠️ **Audit logging** - Add logging for config changes (already logs to console)

### Setting Custom Admin Token

Update `docker-compose.yml`:

```yaml
config-service:
  environment:
    - MEETINGS_CONFIG_ADMIN_TOKEN=your-super-secret-token-here-min-32-chars
```

Or use a `.env` file:
```bash
MEETINGS_CONFIG_ADMIN_TOKEN=your-super-secret-token-here-min-32-chars
```

## Error Handling

### 401 Unauthorized
```json
{
  "error": "Invalid authentication token"
}
```

### 400 Bad Request (Validation Error)
```json
{
  "error": "Validation failed",
  "errors": ["VITE_HOST must be a valid URL or empty string"]
}
```

### 500 Internal Server Error
```json
{
  "error": "Failed to update configuration"
}
