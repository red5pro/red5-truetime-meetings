# Getting started

Run TrueTime Meetings on your machine to try it or work on it. For a production setup, see
[Deployment](deployment.md).

## What you need

- **Node.js 22 or later** and npm.
- **Git**, with access to GitHub over HTTPS. npm installs the shared UI library
  [`truetime-ui`](https://github.com/red5pro/truetime-ui) from there.
- **A Red5 deployment** that hosts the video rooms: [Red5 Cloud](https://www.red5.net/red5-cloud/), or Red5 Pro
  with Stream Manager 2.0 and the conference features enabled. You need its host name (for example
  `userid-000-xxxxxxxxxx.cloud.red5.net`) and its node group.
- **For room tokens, recording, captions and external streams:** the conference master key and secret of your Red5
  Cloud deployment. The [config service](#2-optional-run-the-config-service) uses them; the browser never sees them.

## 1. Run the app

```bash
git clone https://github.com/red5pro/red5-truetime-meetings.git
cd red5-truetime-meetings
npm install
```

Create a `.env` file in the project root:

```env
VITE_HOST="userid-000-xxxxxxxxxx.cloud.red5.net"   # Red5 host, without https://
VITE_NODE_GROUP="default"
VITE_BASENAME="/"                                  # serve the app at the root
```

Start the development server:

```bash
npm run dev
```

Open <http://localhost:3000>, click **New meeting**, and allow your camera and microphone. Open the same meeting
link in a second browser window to see yourself join twice.

`npm run dev` first writes `public/build-info.json` and downloads the noise suppression model into
`public/noise-suppression/` (both are git-ignored), then starts Vite.

> Without `VITE_BASENAME` the app is served under `/meetings`, so it lives at <http://localhost:3000/meetings/>.

Every setting is described in [Configuration](configuration.md).

## 2. Optional: run the config service

Without a backend, the app joins rooms without a token, and recording, captions, transcripts and external streams
don't work. The [config service](../config-service/README.md) in this repo is that backend: it hands the app its
settings and calls Red5's APIs with your credentials.

```bash
cd config-service
npm install
```

Create `config-service/.env`:

```env
PORT=3001
CONFIG_FILE=./config.json
MEETINGS_CONFIG_ADMIN_TOKEN=change-me
CONFERENCE_MASTER_KEY=your-master-key
CONFERENCE_MASTER_SECRET=your-master-secret

# Starting values for config.json, written on first start
VITE_HOST=userid-000-xxxxxxxxxx.cloud.red5.net
VITE_NODE_GROUP=default
VITE_BASENAME=/
VITE_ENABLE_RECORDING=true
VITE_ENABLE_CLOSED_CAPTION=true
```

```bash
npm start      # http://localhost:3001
```

Point the app at it by adding this to the app's `.env`, then restart `npm run dev`:

```env
VITE_CONFIG_SERVICE_URL="http://localhost:3001"
```

`config.json` is only written the first time. To change a setting afterwards, edit `config-service/config.json` or
use the service's API (see [its README](../config-service/README.md#api-usage)).

In development, values in the app's `.env` win over the config service, so you can point a local app at a shared
config service and still override single settings. See [Configuration](configuration.md#where-settings-come-from).

## 3. Check your work

```bash
npm test
npm run lint && npm run format:check
npm run build
```

These run on every pull request. Next: [Architecture](architecture.md) and [Contributing](contributing.md).

## Working on truetime-ui at the same time

Buttons, inputs, the theme and other shared pieces come from `truetime-ui`. To try changes to it before they are
pushed, clone it next to this repo and build it:

```bash
git clone https://github.com/red5pro/truetime-ui.git ../truetime-ui
(cd ../truetime-ui && npm install && npm run build)
npm run ui:sync    # installs ../truetime-ui and clears Vite's cache
# restart npm run dev
```

A plain `npm install` goes back to the GitHub version.
