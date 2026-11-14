# Config Service

A lightweight Express.js service that holds TrueTime Meetings' runtime settings and acts as its backend: it issues
conference tokens and calls Red5's conference API (recording, captions, external streams, moderation) with
credentials the browser never sees.

How the app uses it is described in [Configuration](../docs/configuration.md) and [Deployment](../docs/deployment.md).

## Features

- **GET /api/config** - Retrieve current configuration (public)
- **POST /api/config** - Update configuration (partial updates supported, requires authentication)
- **PUT /api/config** - Replace entire configuration (requires authentication)
- **POST /api/generate-token** - Conference token for a user, room and role
- **/api/room/...** and **/api/external-streams** - Recording, transcription, external streams, room users and
  blocking, forwarded to Red5's conference API (see [src/routes/apiRoutes.js](src/routes/apiRoutes.js))
- **GET /health** - Health check endpoint (public)
- **Authentication** - Bearer token authentication for config writes
- **Validation** - Input validation for configuration values

## Configuration

The service stores configuration in one of two places:

- **A JSON file** (default) at `/data/config.json` (configurable via `CONFIG_FILE`). On first startup
  it is created from the environment variables below.
- **MySQL**, when `MEETINGS_DB_HOST` and `MEETINGS_DB_USER` are set. It is meant to share TrueTime
  Studio's MySQL server, in its own schema (`truetime_meetings` by default), so it never touches
  Studio's `truetime_studio` schema or its migrations. Several config-service containers can then
  share one config.

### Database storage

On startup the service connects (retrying while the database is still starting), creates the
schema and its `meetings_config` table if they don't exist, and fills an empty table once:

1. from the existing config file at `CONFIG_FILE`, if there is one (moving an existing deployment
   to the database keeps its settings; the file is left as it is and no longer used), or
2. from the environment variables, as for a new file.

If the database settings are present but it can't connect, or can't create the schema, the
service stops with an error rather than falling back to the file (two different configs would
otherwise be in use).

The user needs rights on its schema only. Studio's user can be given them with:

```sql
CREATE DATABASE IF NOT EXISTS truetime_meetings;
GRANT ALL ON truetime_meetings.* TO 'truetime_studio'@'%';
```

(or the service creates the schema itself when the user is allowed to). Each setting is one row
(`name`, `value` as JSON, `updated_at`); masked fields are stored as given, as in the file.

### Environment Variables

- `PORT` - Service port (default: 3001)
- `CONFIG_FILE` - Path to config file (default: /data/config.json)
- `MEETINGS_CONFIG_ADMIN_TOKEN` - Authentication token for write operations (default: "default-admin-token-change-me")
- `CONFERENCE_MASTER_KEY` - Conference master key of your Red5 Cloud deployment; needed for tokens and every
  `/api/room/...` call
- `CONFERENCE_MASTER_SECRET` - Conference master secret that goes with it
- `VITE_*` - Starting values for the app's settings, used only when the config is first created (see
  [Configuration](../docs/configuration.md#settings))
- `MEETINGS_DB_HOST` - MySQL host; with `MEETINGS_DB_USER`, stores the config in the database
- `MEETINGS_DB_USER` - MySQL user
- `MEETINGS_DB_PASSWORD` - MySQL password
- `MEETINGS_DB_PORT` - MySQL port (default: 3306)
- `MEETINGS_DB_NAME` - Schema for the config (default: `truetime_meetings`; letters, digits and `_`)
- `MEETINGS_DB_SSL` - `true` to connect over TLS (default: off)
- `MEETINGS_DB_CONNECT_RETRIES` - Connection attempts on startup (default: 10)
- `MEETINGS_DB_CONNECT_RETRY_DELAY_MS` - Wait between attempts (default: 3000)

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
curl http://localhost:3001/api/config
```

### Update specific fields (partial update) - **Requires Authentication**

```bash
curl -X POST http://localhost:3001/api/config \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-admin-token" \
  -d '{
    "VITE_ENABLE_RECORDING": "true",
    "VITE_DEFAULT_THEME": "purple"
  }'
```

### Replace entire configuration - **Requires Authentication**

```bash
curl -X PUT http://localhost:3001/api/config \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-admin-token" \
  -d '{
    "VITE_HOST": "userid-000-xxxxxxxxxx.cloud.red5.net",
    "VITE_BACKEND_HOST": "",
    "VITE_ENABLE_RECORDING": "false",
    "VITE_ENABLE_CLOSED_CAPTION": "true",
    "VITE_DEFAULT_THEME": "black"
  }'
```

## Masked Fields

`VITE_PUBNUB_PUBLISH_KEY`, `VITE_PUBNUB_SUBSCRIBE_KEY`, `VITE_AWS_ACCESS_KEY` and
`VITE_AWS_SECRET_ACCESS_KEY` are returned as `***` once they have a value.

When saving, `***` keeps the stored value, a new value replaces it, and an empty string clears it.

## Validation Rules

The service validates all configuration values:

### Keys

Only the settings listed in [src/utils/validation.js](src/utils/validation.js) (`ALLOWED_KEYS`) are accepted;
any other key is rejected.

### TURN Server

- `VITE_TURN_SERVER_URL` - Must start with `turn:`, `turns:` or `stun:`, or be empty

### Boolean Fields

- `VITE_ENABLE_RECORDING` - Must be `"true"` or `"false"`
- `VITE_ENABLE_CLOSED_CAPTION` - Must be `"true"` or `"false"`
- `VITE_ENABLE_EXTERNAL_STREAMS` - Must be `"true"` or `"false"`
- `VITE_ENABLE_GOOGLE_AUTH` - Must be `"true"` or `"false"`

### Theme Field

- `VITE_DEFAULT_THEME` - Must be one of: `black`, `blue`, `purple`, `emerald`, `aurora`, `sunset`, `ocean`, `broadcast`.
  `default` is saved as `black`. An unset or unknown value in the environment or a stored config
  file also resolves to `black`.

### Example Validation Error Response

```json
{
  "error": "Validation failed",
  "errors": [
    "Unknown config key: VITE_HOSTNAME",
    "VITE_ENABLE_RECORDING must be \"true\" or \"false\"",
    "VITE_DEFAULT_THEME must be one of: black, blue, purple, emerald, aurora, sunset, ocean, broadcast"
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
  "errors": ["VITE_ENABLE_RECORDING must be \"true\" or \"false\""]
}
```

### 500 Internal Server Error

```json
{
  "error": "Failed to update configuration"
}
```
