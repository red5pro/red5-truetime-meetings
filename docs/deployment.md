# Deployment

TrueTime Meetings is a static web app (HTML, JavaScript and the noise suppression model) plus the optional
[config service](../config-service/README.md), a small Node.js server. Any web server can host the app; the repo
ships a Docker image that serves it with nginx.

**HTTPS is required.** Browsers only allow the camera, microphone and screen sharing on secure (`https://`) pages.
Put the app and the config service behind a TLS proxy (nginx, Caddy, Traefik, a cloud load balancer, …).

## What runs where

```
Browser ──https──▶ TrueTime Meetings (static files, nginx)
   │
   ├──https──▶ Config service (settings, tokens, recording, captions)  ──▶ Red5 API
   │
   └──WebRTC──▶ Red5 Cloud / Red5 Pro Stream Manager (the video rooms)
```

The browser calls the config service directly, so it must be reachable at a public `https://` URL. That URL is
`VITE_CONFIG_SERVICE_URL`.

## Docker image

The [Dockerfile](../Dockerfile) builds the app and serves `dist/` with nginx on port 80. The config service URL is
not baked in: the image is built with a placeholder, and the container's start-up script
([ci/docker_startup_script.sh](../ci/docker_startup_script.sh)) swaps in `VITE_CONFIG_SERVICE_URL` before starting
nginx. One image can therefore be used for every environment.

```bash
docker build -t truetime-meetings .

docker run -p 3000:80 \
  -e VITE_CONFIG_SERVICE_URL=https://meet.example.com/config \
  truetime-meetings
```

`VITE_CONFIG_SERVICE_URL` is the only variable the container reads, and it's required: the container exits without
it. Every other setting comes from the config service.

Build the config service image from its folder:

```bash
docker build -t truetime-meetings-config ./config-service

docker run -p 3001:3001 \
  -v meetings-config:/data \
  -e MEETINGS_CONFIG_ADMIN_TOKEN=a-long-random-secret \
  -e CONFERENCE_MASTER_KEY=your-master-key \
  -e CONFERENCE_MASTER_SECRET=your-master-secret \
  -e VITE_HOST=userid-000-xxxxxxxxxx.cloud.red5.net \
  -e VITE_ENABLE_RECORDING=true \
  truetime-meetings-config
```

The `VITE_*` variables only seed the config the first time the service starts. After that, change settings through
its API.

## Docker Compose

[docker-compose.yml](../docker-compose.yml) runs the config service and an nginx that serves your local `dist/`
folder on port 3000. Build the app first, with the config service URL the browser will use:

```bash
VITE_CONFIG_SERVICE_URL=https://meet.example.com/config npm run build
```

Put the config service settings in a `.env` file next to `docker-compose.yml`:

```env
MEETINGS_CONFIG_ADMIN_TOKEN=a-long-random-secret
CONFERENCE_MASTER_KEY=your-master-key
CONFERENCE_MASTER_SECRET=your-master-secret
VITE_HOST=userid-000-xxxxxxxxxx.cloud.red5.net
VITE_NODE_GROUP=default
VITE_ENABLE_RECORDING=true
```

Every setting in [Configuration](configuration.md#settings) can go in this file; the Compose file passes them all to
the config service. Then:

```bash
docker compose up -d
```

The config is kept in the `config-data` volume. To keep it in MySQL instead (for example on TrueTime Studio's
database server), set the `MEETINGS_DB_*` variables; see the
[config service README](../config-service/README.md#database-storage).

## Serving under a path

By default the app expects to live under `/meetings` (e.g. `https://example.com/meetings/team-sync`). To serve it
at the root of a domain, set `VITE_BASENAME` to `/` in the config service. If you serve it under a different path,
make sure the noise suppression model is reachable at `<path>/noise-suppression/`, or set
`VITE_NOISE_SUPPRESSION_ASSETS_URL`.

## Security checklist

- Set a long, random `MEETINGS_CONFIG_ADMIN_TOKEN`. Anyone with it can change the app's settings.
- Keep `CONFERENCE_MASTER_KEY` and `CONFERENCE_MASTER_SECRET` on the config service only. They never go to the
  browser.
- Don't put broad AWS keys in `VITE_AWS_*`: they reach the browser (see
  [Configuration](configuration.md#recording-uploads-amazon-s3)).
- Serve everything over HTTPS.
- Consider rate limiting the config service at your proxy.

## Upgrading

Pull the new version, rebuild both images and restart the containers. The config (file or database) is kept.
