# Using the Conference SDK

TrueTime Meetings is built on the [Red5 Conference SDK](https://www.npmjs.com/package/red5pro-conference-sdk)
(`red5pro-conference-sdk`). The SDK handles rooms, publishing and subscribing over WHIP/WHEP, chat, screen sharing,
virtual backgrounds, noise suppression, local recording and connection statistics. This app is the UI and the
state around it.

If you want to build your own meeting app, read the SDK's documentation, then use this repo as a full example.

- [Conference SDK guide](https://www.red5.net/docs/red5-cloud/development/sdks/conference-sdk/)
- [API reference](https://www.red5.net/docs/red5-cloud/development/sdks/conference-sdk/api-reference/)
- [Examples](https://www.red5.net/docs/red5-cloud/development/sdks/conference-sdk/examples/)

## Where the app uses it

| What                                   | Where                                                                                                                                                                    |
| -------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Creating the client and its options    | [src/hooks/useConferenceClient.ts](../src/hooks/useConferenceClient.ts), [src/utils/conferenceConfig.ts](../src/utils/conferenceConfig.ts) (`getConferenceClientConfig`) |
| Listening to SDK events                | [src/hooks/useConferenceEvents.ts](../src/hooks/useConferenceEvents.ts)                                                                                                  |
| Joining, leaving, tokens, guests       | [src/hooks/useConferenceActions.ts](../src/hooks/useConferenceActions.ts)                                                                                                |
| Mute, camera, devices                  | [src/hooks/useMediaControls.ts](../src/hooks/useMediaControls.ts), [src/hooks/useDeviceManagement.ts](../src/hooks/useDeviceManagement.ts)                               |
| Screen sharing                         | [src/hooks/useScreenShare.ts](../src/hooks/useScreenShare.ts)                                                                                                            |
| Chat, reactions, raised hands          | [src/hooks/useChat.ts](../src/hooks/useChat.ts)                                                                                                                          |
| Virtual backgrounds, noise suppression | [src/hooks/useVirtualBackground.ts](../src/hooks/useVirtualBackground.ts), [src/hooks/useNoiseSuppression.ts](../src/hooks/useNoiseSuppression.ts)                       |

## The flow of a meeting

1. **Create the client** with the Red5 host, node group, ICE servers and feature options
   (`getConferenceClientConfig`).
2. **Get a token** for the user, room and role from the backend (`POST /api/generate-token`), unless the link
   already has one.
3. **Join** the room with the local media stream. On `USER_PUBLISHED` the app subscribes to everyone already there.
4. **React to events**: `NEW_PARTICIPANT` → subscribe; `SUBSCRIBE_SUCCESS` → attach the `mediaStream` to a video
   tile; `PARTICIPANT_MEDIA_UPDATE` → show mic and camera state; `PARTICIPANT_DISCONNECTED` → remove the tile;
   `AUDIO_LEVEL` → talking indicator; `RECONNECTION_*` → reconnecting banner.
5. **Leave** and clean up.

## Things worth knowing

- **The local video element.** The SDK publishes from a `<video id="red5pro-publisher">` element, and screen
  sharing from `red5pro-publisher-screenshare`. Both must exist before you join or start sharing.
- **Remote video is yours to render.** The SDK hands over a `MediaStream`; the app puts it in its own tiles.
- **Chat carries app events.** Reactions (`REACTIONS`) and raised hands (`RAISED_HAND`) are sent as chat messages
  with an `eventType`, alongside normal messages (`MESSAGE_RECEIVED`). See `useChat.ts`.
- **Noise suppression assets.** The DeepFilterNet3 model is downloaded into `public/noise-suppression/` by
  `scripts/fetch-noise-suppression-assets.ts` and served by the app, because the SDK's default CDN
  (`cdn.mezon.ai`) refuses cross-origin requests and now returns 403 to all downloads. The model comes from the
  [DeepFilterNet](https://github.com/Rikorose/DeepFilterNet) repo. The wasm (`v3/pkg/df_bg.wasm`) must match the
  `deepfilternet3-noise-filter` version, so we host it as an asset on this repo's
  [`noise-suppression-assets-1.3.0`](https://github.com/red5pro/red5-truetime-meetings/releases/tag/noise-suppression-assets-1.3.0)
  release. The script checks SHA-256 hashes and tries `NOISE_SUPPRESSION_MIRROR_URL` (a base URL serving
  `v3/pkg/df_bg.wasm` and `v3/models/...`) first when it is set. When upgrading the package, publish its wasm under
  a new release tag and update `RELEASE_TAG` and the hash in the script. The
  level the SDK takes is an attenuation limit in dB; the app converts a percentage of
  noise removed into it (`noiseSuppressionPercentToLevel`).
- **Tokens stay server-side.** Conference tokens are signed by the config service with the deployment's master
  key and secret, which never reach the browser.
