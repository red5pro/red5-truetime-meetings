# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Primary: meeting participants. These are people starting, joining or hosting a video meeting in the browser,
usually from a link someone sent them, with no download or account. They want to get in quickly, see and hear each
other, and use the tools for the meeting (share a screen, chat, react, raise a hand). Hosts also let guests in from
the lobby and can remove people.

Secondary: the operators and developers who deploy, brand and extend the open-source app for their own users. They
turn features on and off (recording, captions, external streams, sign-in) and can rebrand the app. The participant
experience comes first; operator needs are met through configuration, not by adding complexity for participants.

## Product Purpose

TrueTime Meetings is a browser video meeting app built on Red5's real-time video platform. People start a meeting,
send the link, and others join with their camera and microphone. It is a meeting product people can use, and also
an open-source base for teams that want their own meeting product. It succeeds when people get into the room with
little effort and calls stay fast and smooth as the room grows.

## Positioning

Two things together that a neighbouring product cannot honestly claim both of:

- **Red5 real-time video**: low latency that holds up with many people in the room (up to 30 on screen), plus
  external live streams (for example a broadcast camera) brought in as if they were participants.
- **Open source and ownable**: self-host it, rebrand it, or build your own meeting product on top of it.

## Operating Context

- Flow: Home (new meeting, or join by room name or link) → optional Login (Google sign-in or guest, when enabled)
  → Lobby (camera preview, name, devices, effects) → Meeting (video grid with automatic or tiled layout, pinning,
  control bar, drawers) → Left the room (rejoin or go home).
- In-meeting drawers: chat (with images, videos and PDFs), participants, effects (background blur or replace,
  noise suppression), info, local recording, transcription, external streams.
- People use it on desktop browsers and phones (mobile layouts exist), often with camera permissions, device
  choice and their connection on their mind. Built-in diagnostics check connection quality.
- The end-user guide lives on the Red5 docs site, not in this repo.

## Capabilities and Constraints

- React + MUI + Vite, using the Red5 Pro Conference SDK (`red5pro-conference-sdk`). Needs a Red5 Cloud or Red5 Pro
  (Stream Manager 2.0) deployment.
- Theme, tokens, brand font, logo and shared components come from the `truetime-ui` library (shared with TrueTime
  Studio). Generic UI belongs in that library; local components are only meeting-specific composition. No
  hard-coded colours, radii or shadows.
- Recording (server or in-browser), live captions with transcripts, external streams and sign-in are switched on by
  the operator, so a given deployment may not show them. Design must work with any of them missing.
- All user-facing text goes through i18n (`src/i18n`; only English today).

## Brand Commitments

- Name: TrueTime Meetings™ by Red5. Part of the TrueTime family with TrueTime Studio.
- Logo and fonts come from `truetime-ui` (`truetime-ui/assets/*`, `truetime-ui/fonts.css`).
- Voice in existing docs is plain and direct: short sentences, no jargon for participants.

## Evidence on Hand

- Product screenshot: `docs/images/meeting.png` (a four-person call).
- Feature list and docs in `README.md` and `docs/`.
- No customer logos, testimonials, usage numbers or benchmarks are recorded. Don't invent them.

## Product Principles

1. **Get people into the room.** Joining from a link should take as few steps as possible, with no account or
   download unless the operator requires sign-in.
2. **The people are the content.** In a meeting, video and the people in it come first; controls support them and
   stay out of the way.
3. **Real-time should feel real-time.** Responsiveness and clear connection state are part of the product promise,
   not decoration.
4. **Optional features stay optional.** Operator-enabled features appear only when turned on, and the app feels
   complete without them.
5. **Built to be owned.** Keep the app easy to rebrand and extend: shared tokens and components, no one-off styling.

## Accessibility & Inclusion

No formal standard is committed. Follow good practice: keyboard operation, visible focus (`focusRingStyle`),
readable contrast and live captions where enabled.
