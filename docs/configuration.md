# Configuration

TrueTime Meetings is configured with `VITE_*` settings. They can be set at build time, or changed while the app is
running through the [config service](../config-service/README.md), without rebuilding.

## Where settings come from

The app reads each setting from these places. Later ones win:

1. **Build-time environment**: `.env` and the shell environment when you run `npm run build` or `npm run dev`. Vite
   bakes these into the JavaScript.
2. **The config service**: on start-up the app fetches `${VITE_CONFIG_SERVICE_URL}/api/config` and its values
   replace the build-time ones. If the request fails, the build-time values are used.
3. **Development only** (`npm run dev`): values set in `.env` win again, so a local app can use a shared config
   service and still override single settings. Empty values in `.env` don't count.

`VITE_CONFIG_SERVICE_URL` itself can only be set at build time (or, in the Docker image, when the container starts;
see [Deployment](deployment.md)). If it's set, the app also uses the config service as its backend for tokens,
recording and the other server calls. Leave it out completely to run without one; an empty value still counts as
set.

The code is in [src/utils/configStore.ts](../src/utils/configStore.ts) and [src/main.tsx](../src/main.tsx).

## Settings

### Red5 connection

| Setting                       | Default      | What it does                                                                                                                   |
| ----------------------------- | ------------ | ------------------------------------------------------------------------------------------------------------------------------ |
| `VITE_HOST`                   | _(required)_ | Red5 host name, without `https://`, e.g. `userid-000-xxx.cloud.red5.net`                                                       |
| `VITE_NODE_GROUP`             | `default`    | Stream Manager node group the rooms run on                                                                                     |
| `VITE_TURN_SERVER_URL`        | _(none)_     | A TURN (or STUN) server, e.g. `turn:turn.example.com:3478`, tried before Google's public STUN server, which is always included |
| `VITE_TURN_SERVER_USERNAME`   | _(empty)_    | TURN user name                                                                                                                 |
| `VITE_TURN_SERVER_CREDENTIAL` | _(empty)_    | TURN password                                                                                                                  |
| `VITE_PUBNUB_PUBLISH_KEY`     | _(empty)_    | PubNub publish key for chat and room signalling, if your deployment uses your own PubNub keys                                  |
| `VITE_PUBNUB_SUBSCRIBE_KEY`   | _(empty)_    | PubNub subscribe key                                                                                                           |

A TURN server lets people behind strict firewalls or corporate networks connect. Without one, some people may join
but see no video.

### Backend

| Setting                   | Default   | What it does                                                                                     |
| ------------------------- | --------- | ------------------------------------------------------------------------------------------------ |
| `VITE_CONFIG_SERVICE_URL` | _(unset)_ | URL of the config service, **as the browser reaches it**, e.g. `https://meet.example.com/config` |
| `VITE_BACKEND_HOST`       | _(empty)_ | Your own backend's host name, used when there's no config service                                |

Which backend the app calls:

| Set                       | Tokens from                                       | Recording, captions, moderation via                         |
| ------------------------- | ------------------------------------------------- | ----------------------------------------------------------- |
| `VITE_CONFIG_SERVICE_URL` | `${VITE_CONFIG_SERVICE_URL}/api/generate-token`   | the config service (`/api/room/...`)                        |
| only `VITE_BACKEND_HOST`  | `https://${VITE_BACKEND_HOST}/api/generate-token` | Red5's API on `VITE_BACKEND_HOST` (`/as/v1/conference/...`) |
| neither                   | no token (joins with an empty token)              | Red5's API on `VITE_HOST`                                   |

A token in the meeting link (`?token=...`) is always used when present.

### Features

| Setting                        | Default   | What it does                                                          |
| ------------------------------ | --------- | --------------------------------------------------------------------- |
| `VITE_ENABLE_RECORDING`        | `false`   | Server-side recording                                                 |
| `VITE_ENABLE_CLOSED_CAPTION`   | `false`   | Live captions and transcripts                                         |
| `VITE_ENABLE_EXTERNAL_STREAMS` | `false`   | The External streams panel                                            |
| `VITE_ENABLE_GOOGLE_AUTH`      | `false`   | Require Google sign-in (or joining as a guest) before entering a room |
| `VITE_GOOGLE_CLIENT_ID`        | _(empty)_ | Google OAuth client ID, needed when Google sign-in is on              |

Each flag must be the string `"true"` to turn the feature on. Features that are off show as greyed-out buttons.
Recording, captions and external streams also have to be available on your Red5 deployment.

### Camera, audio and effects

| Setting                             | Default                                | What it does                                                             |
| ----------------------------------- | -------------------------------------- | ------------------------------------------------------------------------ |
| `VITE_CAMERA_RESOLUTION`            | _(unset: 640×360)_                     | Camera resolution for everyone: `360p`, `720p` or `1080p`                |
| `VITE_NOISE_SUPPRESSION_LEVEL`      | `20`                                   | Starting share of background noise removed, 0–100 (people can change it) |
| `VITE_NOISE_SUPPRESSION_ASSETS_URL` | `<origin><basename>/noise-suppression` | Where the noise suppression (DeepFilterNet3) model is loaded from        |
| `VITE_VIRTUAL_BACKGROUND_IMAGES`    | _(empty)_                              | Comma-separated image URLs offered as virtual backgrounds                |

### Look and URL

| Setting              | Default       | What it does                                                                            |
| -------------------- | ------------- | --------------------------------------------------------------------------------------- |
| `VITE_DEFAULT_THEME` | `black`       | Theme: `black`, `blue`, `purple`, `emerald`, `aurora`, `sunset`, `ocean` or `broadcast` |
| `VITE_LOGO_URL`      | the Red5 logo | Logo on the home and sign-in pages                                                      |
| `VITE_BASENAME`      | `/meetings`   | Path the app is served under. Set `/` to serve it at the root of the domain             |

### Recording uploads (Amazon S3)

| Setting                      | Default     | What it does                               |
| ---------------------------- | ----------- | ------------------------------------------ |
| `VITE_AWS_ACCESS_KEY`        | _(empty)_   | Access key used to upload local recordings |
| `VITE_AWS_SECRET_ACCESS_KEY` | _(empty)_   | Secret key                                 |
| `VITE_AWS_BUCKET_NAME`       | _(empty)_   | Bucket                                     |
| `VITE_AWS_BUCKET_LOCATION`   | `us-east-1` | Bucket region                              |

When the access key, secret and bucket are all set, local recordings upload to S3 straight from the browser.

> **These keys reach every visitor's browser.** Anything the app uses is readable by anyone who opens it, even
> though the config service masks them in its API. Only use a key limited to uploading into one bucket, or leave
> uploads off.

### Other

| Setting                           | What it does                                                              |
| --------------------------------- | ------------------------------------------------------------------------- |
| `VITE_ANALYTICS_ENDPOINT`         | Analytics endpoint passed to the SDK (`null` turns it off)                |
| `VITE_VERSION`, `VITE_BUILD_TIME` | Written by `scripts/generate-build-info.ts`; shown in **Meeting details** |

## URL parameters

These go on a meeting link, e.g. `https://meet.example.com/meetings/team-sync?role=admin`:

| Parameter  | Values                                    | What it does                                                                               |
| ---------- | ----------------------------------------- | ------------------------------------------------------------------------------------------ |
| `role`     | `admin`, `moderator`, `guest`, `observer` | Role in the room. Unset joins as a publisher. `admin` is the host; `observer` watches only |
| `token`    | a conference token                        | Joins with this token instead of requesting one                                            |
| `playOnly` | `true`                                    | Watch and listen without publishing                                                        |

When Google sign-in is on, people who join as guests always get the `guest` role.

## Config service settings

The config service's own settings (`MEETINGS_CONFIG_ADMIN_TOKEN`, `CONFERENCE_MASTER_KEY`, the MySQL options, …)
and how to change the app's settings through its API are in the
[config service README](../config-service/README.md).
