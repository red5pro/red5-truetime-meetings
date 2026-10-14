# AGENTS.md — red5-truetime-meetings

TrueTime Meetings: video conferencing app built with React, MUI and Red5 Pro (Vite).
See [README.md](README.md) for features, configuration and deployment.

## Use truetime-ui; don't build UI locally

The theme, design tokens, brand font and shared components come from the shared library
[`truetime-ui`](https://github.com/red5pro/truetime-ui), installed from GitHub
(`"truetime-ui": "github:red5pro/truetime-ui"`). Its exports are listed in
[../truetime-ui/README.md](../truetime-ui/README.md).

This app predates the library and still has many local components in `src/Components/`. They are
being moved into `truetime-ui` over time (`DeviceSelector`, `Spinner` (was `CustomSpinner`) and
`ControlButton` (was `CustomizedBtn`) already are). New work should follow that direction, not add
to the local set.

Before writing any UI:

1. **Check `truetime-ui` first** (`../truetime-ui/src/index.ts`). Use what's there:
   `Button`, `Input`, `PasswordInput`, `FormField`, `Label`, `Checkbox`, `Card`, `Heading`, `Text`,
   `Alert`, `Spinner`, `StatusBadge`, `VideoTile`, `ChatPanel`, `DeviceSelector`, `ControlButton`,
   and the helpers `themeColors(theme)` / `focusRingStyle(theme)`.
2. **If it's close but missing a feature**, add a prop to the component in `truetime-ui` instead of
   wrapping or copying it here.
3. **If it doesn't exist and is generic** (could be used by Studio or another app, no meeting
   business logic), add it to `truetime-ui` following its [AGENTS.md](../truetime-ui/AGENTS.md),
   then import it here.
4. **Only build locally** when the component is meetings-specific composition: it wires meeting
   state, contexts, i18n or the Red5 SDK into library components. Build it from `truetime-ui`
   components, not from raw MUI equivalents of them.

Rules:

- Don't create new local generic components (buttons, inputs, spinners, cards, badges, video
  tiles, chat panels). Don't revive the moved ones as local copies.
- `src/Components/CustomizedBtn.tsx` is a re-export of `ControlButton` under the old names; keep
  it as a re-export, and prefer importing `ControlButton` from `truetime-ui` in new code.
- When you substantially touch a local component that has a `truetime-ui` equivalent, switch it to
  the library one. If a local component is generic and not yet in the library, consider moving it
  there (strip app logic into props, add a test, export it, then import it back here).
- No hard-coded colors, radii or shadows. Use `themeColors(theme)`, `theme.palette.themeColor[n]`
  or the exported tokens (`shadows`, `radii`, …). New tokens go in `truetime-ui`.
- Fonts and the logo come from `truetime-ui/fonts.css` and `truetime-ui/assets/*`.
- The app is wrapped in `TrueTimeThemeProvider` in `src/App.tsx`. Don't add another theme provider
  or `CssBaseline`.
- User-facing strings still go through i18n here; pass translated text into library components as
  props.

## Working across both repos

Library changes are made and committed in the truetime-ui repo, not here. To read its source or
change it, clone it next to this repo:
`git clone https://github.com/red5pro/truetime-ui.git ../truetime-ui`.

To try unpushed library changes in this app:

```bash
(cd ../truetime-ui && npm install && npm run build)
npm run ui:sync      # install ../truetime-ui (not saved) and clear Vite's pre-bundle cache
# then restart `npm run dev`
```

A plain `npm install` goes back to the GitHub version. Once the library change is pushed, run
`npm update truetime-ui` (or bump the tag) so `package-lock.json` points at the new commit.

Never edit files under `node_modules/truetime-ui`.

## Layout

- `src/pages/` — route pages (Home, Login, Lobby, Meeting, …)
- `src/Components/` — app components (legacy; see above)
- `src/contexts/`, `src/hooks/`, `src/utils/`, `src/constants/`, `src/types/`
- `src/i18n/` — translations
- `src/styles/themeUtil.ts` — app-level style helpers built on library tokens

## Commands

```bash
npm run dev
npm test
npm run lint && npm run format:check
npm run build
```

Run tests and lint before finishing a change.
