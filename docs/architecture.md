# Architecture

TrueTime Meetings is a single-page React app. The browser does most of the work: it captures the camera and
microphone, publishes and subscribes to video through Red5, and applies background effects and noise suppression
locally. A small [config service](../config-service/README.md) provides settings and does the few things that need
a secret.

```
┌──────────────────────── Browser ────────────────────────┐
│  React app (this repo)                                   │
│    pages ─ components ─ hooks ─ red5pro-conference-sdk ──┼──WebRTC (WHIP/WHEP)──▶ Red5 Cloud / Stream Manager
│                                     │                    │                          ▲
│                                     └── PubNub ──────────┼── chat, room events      │
└───────────────┬──────────────────────────────────────────┘                          │
                │ https: settings, tokens, recording, captions, external streams      │
                ▼                                                                      │
        Config service (Node.js, Express) ── conference API (/as/v1/conference) ───────┘
```

## Stack

- **React 19** with the React Compiler (opt-in per component, `compilationMode: 'annotation'`), **React Router 7**
- **MUI 6** layout primitives, with components, theme and tokens from
  [`truetime-ui`](https://github.com/red5pro/truetime-ui)
- **Vite 8**, **Vitest** with Testing Library and jsdom
- **[red5pro-conference-sdk](https://www.npmjs.com/package/red5pro-conference-sdk)**: rooms, publishing,
  subscribing, chat, screen sharing, virtual backgrounds, noise suppression (DeepFilterNet3), stats
- **mediabunny** for local recording, **@aws-sdk/client-s3** for uploading it
- **i18next** / **react-i18next** for text, **notistack** for notifications, **loglevel** for logging

## Pages and routes

Routes are in [src/CustomRoutes.tsx](../src/CustomRoutes.tsx), under `VITE_BASENAME` (`/meetings` by default):

| Path                     | Page                                                               |
| ------------------------ | ------------------------------------------------------------------ |
| `/`                      | `pages/Home`: new meeting, or join by room name or link            |
| `/login`                 | `pages/Login`: Google sign-in or join as guest (when enabled)      |
| `/:id`                   | `pages/Red5`: the room. Behind `ProtectedRoute` when sign-in is on |
| `/mobile-layout-preview` | Development only: preview of the mobile layouts                    |

`pages/Red5` is the room shell. It owns the conference (through `useConference`) and switches between:

- `pages/Lobby`: camera preview, name, devices and effects before joining,
- `pages/Meeting`: the video grid (layouts in `pages/Layout`) and the control bar (`Components/Footer`),
- `pages/LeftTheRoom`: rejoin or go home,

and renders the drawers (chat, participants, effects, info, local recording, transcription, external streams).

## Hooks

The conference logic lives in [src/hooks/](../src/hooks/). `useConference` composes the rest and is the only hook
the room page uses:

| Hook                                                            | Responsibility                                                  |
| --------------------------------------------------------------- | --------------------------------------------------------------- |
| `useConferenceClient`                                           | Creates and holds the SDK's `ConferenceClient`                  |
| `useConferenceEvents`                                           | Subscribes to `ConferenceEvents` and routes them to state       |
| `useConferenceActions`                                          | Join, leave, tokens, guest approval, notifications              |
| `useConferenceState`, `useRoomState`                            | Role, room name, lobby/meeting/left state, reconnection         |
| `useParticipants`, `useSpeakerOrder`                            | Who's in the room and in what order they're shown               |
| `useMediaControls`, `useDeviceManagement`, `usePermissions`     | Mute, camera, device switching, browser permissions             |
| `useScreenShare`, `useVirtualBackground`, `useNoiseSuppression` | Screen sharing and effects                                      |
| `useChat`                                                       | Chat messages, reactions and raised hands (sent as chat events) |
| `useRecording`, `useMediabunnyRecording`                        | Server and local recording, S3 upload                           |
| `useClosedCaptions`, `useTranscription`                         | Live captions and transcripts                                   |
| `useExternalStreams`                                            | Listing and adding external streams                             |
| `useKeyboardShortcuts`                                          | Push to talk (Space) and captions (C)                           |

## Settings

Settings are `VITE_*` values. [src/main.tsx](../src/main.tsx) fetches them from the config service before
rendering, and [src/utils/configStore.ts](../src/utils/configStore.ts) merges them with the build-time values. Always
read settings through `getRuntimeConfig()`, never `import.meta.env` directly, so runtime changes apply. The SDK
options are built in [src/utils/conferenceConfig.ts](../src/utils/conferenceConfig.ts). See
[Configuration](configuration.md).

## Server calls

`getBackendConfig()` in `conferenceConfig.ts` decides where server calls go: the config service's `/api/...`
endpoints when `VITE_CONFIG_SERVICE_URL` is set, otherwise Red5's conference API (`/as/v1/conference/...`) on
`VITE_BACKEND_HOST` or `VITE_HOST`.

| Purpose          | Config service endpoint                                                            |
| ---------------- | ---------------------------------------------------------------------------------- |
| Settings         | `GET /api/config`                                                                  |
| Conference token | `POST /api/generate-token`                                                         |
| Server recording | `POST /api/room/{room}/startRecording`, `.../stopRecording`                        |
| Transcripts      | `GET /api/room/{room}/transcriptions`, `POST .../user/{id}/start-transcription`    |
| External streams | `GET /api/external-streams`, `POST`/`DELETE /api/room/{room}/external-stream/{id}` |
| Moderation       | `POST /api/room/{room}/user/{id}/block`, `.../unblock`                             |
| Node group check | `GET /api/check-node-group-availability`                                           |

## Browser storage

Everything the app keeps in the browser (theme, device choices, noise suppression level, sign-in) is stored under a
single `ttm` key, through [src/utils/appStorage.ts](../src/utils/appStorage.ts). Use its helpers instead of
`localStorage` directly.

## Project layout

```
src/
  pages/          route pages (Home, Login, Red5, Lobby, Meeting, Layout, LeftTheRoom)
  Components/     app components: Footer (control bar), drawers, tabs, video cards (legacy, see Contributing)
  hooks/          conference and media logic
  contexts/       Google sign-in, theme
  utils/          config, storage, recording, conference options
  constants/      roles, layout and bitrate options, languages
  i18n/           translations
  styles/         app-level style helpers on top of truetime-ui tokens
config-service/   the backend (its own package and tests)
scripts/          build info and noise suppression model download, run before dev and build
ci/               Docker start-up script
```
