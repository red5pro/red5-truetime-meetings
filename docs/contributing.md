# Contributing

Thanks for helping improve TrueTime Meetings. Bug reports, fixes, docs and features are all welcome.

## Reporting a bug or asking for a feature

Open an issue and include:

- what you did, what you expected and what happened,
- your browser and operating system,
- for connection or video problems, the output of **More options** → **Diagnostic** if you can.

Please don't post tokens, keys or private meeting links in issues.

## Setting up

Follow [Getting started](getting-started.md). Before you write code, read [Architecture](architecture.md) for how
the app fits together.

## Branches

Work happens on epic branches named `epic/<NAME>`. The shared UI library has a branch with the same name, and
`package.json` points at it (`"truetime-ui": "github:red5pro/truetime-ui#epic/<NAME>"`), so every app on one epic
uses the same library. Branch off the current epic branch and open your pull request against it.

## The UI comes from truetime-ui

Buttons, inputs, cards, alerts, spinners, video tiles, the chat panel, device selectors, the theme and the design
tokens all come from [`truetime-ui`](https://github.com/red5pro/truetime-ui), shared with TrueTime Studio.

- **Use a library component** when there is one, instead of MUI's (`Button`, `TextField`, `Checkbox`, `Alert`,
  `CircularProgress`, text `Typography`). MUI layout primitives (`Box`, `Stack`, `Grid`, `Dialog`, `IconButton`, …)
  are fine.
- **Missing a feature?** Add a prop to the library component rather than wrapping or copying it here.
- **Generic component that doesn't exist yet?** Add it to `truetime-ui` (see its `AGENTS.md`), then import it.
- **Build locally only** what's specific to meetings: components that wire meeting state, the SDK or i18n into
  library components.
- **No hard-coded colors, radii or shadows.** Use `themeColors(theme)`, `theme.palette.themeColor[n]` or the
  library's tokens.

`src/Components/` predates the library and still has many local components. They are moving into `truetime-ui`
over time; when you substantially change one that has a library equivalent, switch to the library one.

[AGENTS.md](../AGENTS.md) has the full rules, and how to try unpushed library changes with `npm run ui:sync`.

## Text

User-facing text goes through i18next: `const { t } = useTranslation()` in components. Pass translated text into
library components as props.

## Settings and browser storage

- Read settings with `getRuntimeConfig()` from `src/utils/configStore.ts`, so they can change at run time.
- A new setting the config service should store must be added to `ALLOWED_KEYS` in
  `config-service/src/utils/validation.js` and to its defaults in `config-service/src/services/configService.js`.
- Document new settings in [Configuration](configuration.md).
- Keep browser storage under the single `ttm` key with the helpers in `src/utils/appStorage.ts`.

## Tests and checks

```bash
npm test                              # Vitest, watch mode
npm run lint && npm run format:check
npm run build

cd config-service && npm test && npm run lint && npm run format:check
```

Add or update tests next to the code you change (`*.test.ts` / `*.test.tsx`). A pre-commit hook formats staged
files with Prettier. The same checks run on every pull request
([.github/workflows/pr-checks.yml](../.github/workflows/pr-checks.yml)).

## Pull requests

The [pull request template](../.github/pull_request_template.md) asks for:

- what changed and why, with a link to the issue,
- the epic branch it targets, and any related truetime-ui or Studio pull requests,
- before and after screenshots for UI changes,
- confirmation that the UI uses `truetime-ui`, text goes through i18n, tests are updated and all checks pass.

Keep pull requests focused on one change, and update the docs when a change affects a feature, a setting or the
API the app uses.
