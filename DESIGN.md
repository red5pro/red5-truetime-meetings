---
name: TrueTime Meetings
description: Browser video meetings on Red5 real-time video; a dark room where people are the only colour.
colors:
  page: '#141414'
  surface: '#1A1A1A'
  paper: '#1E1E1E'
  surface-raised: '#2C2C2C'
  surface-hover: '#393737'
  border: '#4A4A4A'
  border-strong: '#6E6E6E'
  disabled-text: '#8E8E8E'
  muted-text: '#B8B8B8'
  text: '#FFFFFF'
  primary: '#8A8A8A'
  primary-hover: '#9A9A9A'
  primary-active: '#7A7A7A'
  error: '#FF4444'
  warning: '#FFB74D'
  success: '#81C784'
  info: '#64B5F6'
  program: '#E5252A'
  preview: '#1FBF5B'
  monitor: '#000000'
  tone-active-bg: '#D1E9FC'
  tone-active-fg: '#1E364A'
  tone-off-bg: '#FFE3E3'
  tone-off-fg: '#731F1F'
typography:
  display:
    fontFamily: 'ClashDisplay, sans-serif'
    fontSize: '56px'
    fontWeight: 700
  headline:
    fontFamily: 'ClashDisplay, sans-serif'
    fontSize: '40px'
    letterSpacing: '-0.007em'
  title:
    fontFamily: 'ClashDisplay, sans-serif'
    fontSize: '20px'
    fontWeight: 500
    lineHeight: 1
  body:
    fontFamily: 'ClashDisplay, sans-serif'
    fontSize: '16px'
    fontWeight: 500
    lineHeight: 1.2
  body-small:
    fontFamily: 'ClashDisplay, sans-serif'
    fontSize: '14px'
    lineHeight: 1.2
  label:
    fontFamily: 'ClashDisplay, sans-serif'
    fontSize: '14px'
  button:
    fontFamily: 'ClashDisplay, sans-serif'
    fontSize: '16px'
    fontWeight: 500
    lineHeight: '24px'
  badge:
    fontFamily: 'ClashDisplay, sans-serif'
    fontSize: '12px'
    fontWeight: 600
    lineHeight: '18px'
    letterSpacing: '0.04em'
  mono:
    fontFamily: 'JetBrains Mono, ui-monospace, SFMono-Regular, Menlo, Consolas, monospace'
    fontFeature: 'tnum'
rounded:
  badge: '4px'
  control: '6px'
  container: '12px'
  pill: '24px'
  bar: '28px'
  round: '50%'
spacing:
  unit: '8px'
  xs: '4px'
  sm: '8px'
  md: '16px'
  lg: '24px'
  xl: '40px'
components:
  button-primary:
    backgroundColor: '{colors.primary}'
    textColor: '{colors.text}'
    typography: '{typography.button}'
    rounded: '{rounded.control}'
    padding: '10px 16px'
  button-primary-hover:
    backgroundColor: '{colors.primary-hover}'
  button-pill-cta:
    backgroundColor: '{colors.surface-hover}'
    textColor: '{colors.text}'
    typography: '{typography.button}'
    rounded: '{rounded.pill}'
  button-pill-cta-hover:
    backgroundColor: '{colors.primary-hover}'
  button-danger:
    backgroundColor: '{colors.error}'
    textColor: '{colors.text}'
    rounded: '{rounded.control}'
    padding: '10px 16px'
  input:
    backgroundColor: '{colors.surface-raised}'
    textColor: '{colors.text}'
    rounded: '{rounded.control}'
    padding: '11.5px 20px'
  input-focus:
    backgroundColor: '{colors.surface-hover}'
  card:
    backgroundColor: '{colors.surface}'
    rounded: '{rounded.container}'
    padding: '24px'
  dialog:
    backgroundColor: '{colors.surface-raised}'
    rounded: '{rounded.container}'
    padding: '12px 40px 32px'
  control-bar:
    backgroundColor: '{colors.surface-raised}'
    rounded: '{rounded.bar}'
    padding: '10px'
  toolbar-button:
    backgroundColor: '{colors.surface-hover}'
    textColor: '{colors.text}'
    rounded: '{rounded.pill}'
    height: '52px'
    width: '56px'
  toolbar-button-hover:
    backgroundColor: '{colors.border}'
  toolbar-button-active:
    backgroundColor: '{colors.tone-active-bg}'
    textColor: '{colors.tone-active-fg}'
    rounded: '{rounded.pill}'
  toolbar-button-off:
    backgroundColor: '{colors.tone-off-bg}'
    textColor: '{colors.tone-off-fg}'
    rounded: '{rounded.pill}'
  toolbar-button-leave:
    backgroundColor: '{colors.error}'
    textColor: '{colors.text}'
    rounded: '{rounded.pill}'
    height: '52px'
    width: '76px'
  toolbar-chip:
    backgroundColor: '{colors.surface-hover}'
    textColor: '{colors.text}'
    rounded: '{rounded.pill}'
    height: '40px'
    padding: '0 16px'
  video-tile:
    backgroundColor: '{colors.surface-raised}'
    rounded: '{rounded.control}'
  status-badge-live:
    backgroundColor: '{colors.program}'
    textColor: '{colors.text}'
    typography: '{typography.badge}'
    rounded: '{rounded.badge}'
    padding: '2px 8px'
---

# Design System: TrueTime Meetings

## Overview

**Creative North Star: "The Dark Room"**

TrueTime Meetings is a darkened room where people's faces are the only light. The interface is the room itself:
near-black walls, a few soft grey fixtures, and nothing that competes with the video. Colour enters through
three doors only: the participants' cameras, state that needs attention (mic off, leave, live, warnings), and
the company theme an operator picks. Everything else is greyscale on purpose.

Within that dark room the controls are friendly and calm. Buttons are fully rounded pills, the control bar
floats as one soft-cornered surface at the bottom of the screen, and the brand face (Clash Display) is set
throughout, so even dense panels read as one voice rather than a utility font. First-time joiners should find
it approachable; regulars should stop noticing it. Density is moderate: a 72px control bar, 52px toolbar
buttons, generous dialog padding (40px sides).

The system is a theme, not a single look. The same roles are re-skinned by eight company palettes (`black`
default, `blue`, `purple`, `emerald`, `aurora`, `sunset`, `ocean`, `broadcast`), three of which paint a
gradient behind the page. Every value below is the Black palette; components must read roles, never these hex
values, so a theme swap re-lights the room without touching a component. The visual anti-reference is
enterprise blue chrome: busy, blue-tinted toolbars of the Teams or Webex kind.

**Key Characteristics:**

- Dark only (`color-scheme: dark`); tonal greys from #0A0A0A to #F5F5F5 carry all hierarchy.
- People are the colour; UI colour is reserved for state.
- Pill-shaped controls in a single floating bar; tiles and panels with gentle corners.
- Clash Display for every piece of text; JetBrains Mono only for timecodes and figures.
- Tokens and components come from `truetime-ui`; this app composes them.

## Colors

A deliberately colourless greyscale room, with a small, fixed vocabulary of state colours.

### Primary

- **Neutral Fixture Grey** (primary): the default action fill (contained primary buttons, focus ring, MUI
  primary). It is grey by design in the Black theme; operator themes replace it with their accent. Hover
  lightens to Hover Grey (primary-hover), press darkens to Pressed Grey (primary-active).

### Neutral

- **Room Black** (page): the page behind everything, `palette.themeColor[80]`.
- **Panel Black** (surface): cards, dialog bodies in the theme, level-1 background.
- **Paper Black** (paper): MUI Paper and menu backgrounds.
- **Raised Charcoal** (surface-raised): the control bar, its trays, dialogs, menus, inputs, video tiles
  before video arrives. The one surface every floating control shares.
- **Warm Graphite** (surface-hover): resting fill of toolbar buttons and pill CTAs; hover on inputs.
- **Divider Grey** (border): hairlines and outlines; hover fill of toolbar buttons.
- **Strong Divider** (border-strong): emphasised outlines and select borders.
- **Quiet Grey** (disabled-text), **Soft Grey** (muted-text), **Pure White** (text): the three text levels.
- **Monitor Black** (monitor): pure black behind video, so letterboxing reads as "no picture".

### Tertiary (state)

- **Alert Red** (error): leave call, destructive actions, errors. Its pale tint (tone-off-bg with
  tone-off-fg) marks a mic or camera that is off.
- **Signal Blue** (info): its pale tint (tone-active-bg with tone-active-fg) marks a toggled-on tool.
- **Amber** (warning) and **Leaf Green** (success): connection quality, notices, confirmations.
- **On-Air Red** (program) and **Preview Green** (preview): broadcast tally, identical in every theme. Only for
  what is live or in preview, never for errors.

### Named Rules

**The People Are the Colour Rule.** Chrome stays greyscale in the default theme. A new coloured fill must
mean a state (off, active, live, error, warning, success) or come from the operator's palette.

**The Roles, Not Hex Rule.** Style with `themeColors(theme)` roles or `theme.palette.themeColor[n]`. A
hard-coded hex works in Black and breaks the other seven themes.

**The Tally Is Sacred Rule.** On-Air Red means live. Errors use Alert Red with an icon, so they are never read
as on air.

## Typography

**Display Font:** ClashDisplay (with sans-serif)
**Body Font:** ClashDisplay (with sans-serif). Meetings uses the `display` typeface option, so the brand face
sets everything.
**Label/Mono Font:** JetBrains Mono (with ui-monospace, SFMono-Regular, Menlo, Consolas, monospace), tabular
figures.

**Character:** One geometric grotesque used at calm weights (500 for body, 700 only for the largest
headings), so the brand voice is everywhere without shouting. Mono appears only where digits must not jitter.

### Hierarchy

- **Display** (700, 56px): reserved; rarely used in the meeting app.
- **Headline** (40px, -0.007em): page titles such as the Home heading ("TrueTime Meeting™").
- **Title** (500, 20px, line-height 1): section titles; dialog titles are 24px.
- **Body** (500, 16px, 1.2): primary reading text, button text.
- **Body Small** (400, 14px, 1.2): secondary text in Soft Grey, toolbar button labels, field labels.
- **Badge** (600, 12px, 0.04em, uppercase): status badges such as LIVE.
- **Mono** (tabular): call duration, clock, bitrates, keycaps.

Sizes scale down on small screens through MUI `responsiveFontSizes`.

### Named Rules

**The One Voice Rule.** Don't introduce a second sans. Text uses Clash Display, and only figures that update
in place switch to mono.

## Layout

An 8px spacing unit (`theme.spacing(n)`), with Card paddings of 16, 24 and 40px. The meeting screen is a
full-viewport video grid (automatic or tiled, pinning enlarges one person, up to 30 tiles) above a footer
row: clock and room name on the left, the main control bar centred, and a secondary bar on the right for
info, transcription, participants and chat. Drawers open on the right at 360px wide with 12px padding and stop
above the footer; under the `sm` breakpoint (600px) they go full width and lose their glass. Under `md` (900px)
the control bar's padding halves and toolbar buttons shrink from 52 to 44px. Entry pages (Home, Lobby) centre a
single column with a pill CTA at full width.

## Elevation & Depth

Tonal first, glass over video. Hierarchy comes from stepping through the grey scale (Room Black, Panel Black,
Raised Charcoal, Warm Graphite), not from shadows; dialogs, menus, trays and the control bar sit on the same
Raised Charcoal so they read as one set. Shadow and blur appear only where UI floats over video: drawers can
be frosted glass (20px blur, a translucent hairline and the `glass` shadow), and controls drawn on a tile use
the `overlay` shadow or a translucent black chip (60% black name chip, 45% black action strip).

### Shadow Vocabulary

- **Glass** (`box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.3), inset 0 -1px 0 rgba(255, 255, 255, 0.05), inset 0 0 20px 10px rgba(255, 255, 255, 0.05)`): frosted drawers and panels over the grid.
- **Overlay** (`box-shadow: 0 4px 16px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.2), 0 0 0 1px rgba(255, 255, 255, 0.1)`): controls floating over video.

### Named Rules

**The Flat Room Rule.** Surfaces off the video are flat: no drop shadows on cards, buttons or the control
bar (`boxShadow: none` on contained buttons and Fabs). Depth off video is a step in the grey scale.

**The Glass Only Over Glass Rule.** Blur is for surfaces with video behind them. Older dialogs that add a
faint backdrop blur are legacy; don't copy them.

## Shapes

A soft, friendly geometry in four steps: 4px badges, 6px controls (buttons, inputs, Paper, video tiles), 12px
containers (cards, dialogs, menus) and fully rounded pills (24px) for every call control and page CTA. The
control bar is a 28px-radius capsule. Avatars and round buttons are circles. Borders are hairlines (1px)
except outlined buttons (2px). Video tiles clip their video to the tile radius and draw rings inside the edge
(a 2px white outline for the active speaker, a 3px inset tally ring) so the grid never shifts.

## Components

### Buttons

Friendly and calm: rounded, quiet fills, a slight press-in.

- **Shape:** gently rounded (6px) by default; pill (24px) for primary page actions.
- **Primary:** Neutral Fixture Grey fill, white 16px/500 text, 10px 16px padding, sentence case (no uppercase).
- **Pill CTA:** Warm Graphite fill, full width on entry pages ("New meeting", "Join meeting").
- **Hover / Focus:** fill lightens to Hover Grey; focus is a 2px ring in the focus colour, offset 2px.
  Pressing scales to 0.96 (disabled under reduced motion). Disabled is 50% opacity with `not-allowed`.
- **Outlined / Text:** 2px Divider Grey outline turning Strong Divider on hover; text buttons for secondary
  actions such as Join.
- **Hold to confirm:** costly actions can require press-and-hold, shown as a fill sweeping left to right.

### Control Bar and Toolbar Buttons (signature)

The meeting's single floating capsule (Raised Charcoal, 28px radius, 10px padding, 72px tall). Its tray
grows upward from the same surface so device options stay attached to the control that opened them.

- **Toolbar button:** 52×56 pill in Warm Graphite with a 24px icon; hover goes to Divider Grey.
- **Tones:** `active` (pale Signal Blue) for a tool that is on, `off` (pale Alert Red) for a muted mic or
  camera, `danger` (solid Alert Red, 76px wide) for leave, `ghost` for transparent.
- **Chips:** 40px pills with icon and text, in the tray.
- Every button has a tooltip and an accessible name; toggles report `aria-pressed`.

### Cards / Containers

- **Corner Style:** 12px.
- **Background:** Panel Black for cards; Raised Charcoal for dialogs and menus.
- **Shadow Strategy:** none (see The Flat Room Rule).
- **Border:** optional 1px Raised Charcoal hairline (`outlined` card).
- **Internal Padding:** 24px default; dialogs 12px 40px 32px.

### Inputs / Fields

- **Style:** Raised Charcoal fill, 1px Divider Grey outline, 6px radius, 11.5px 20px padding, Soft Grey
  placeholder.
- **Focus:** fill steps up to Warm Graphite.
- **Labels:** 14px Soft Grey above the field.

### Video Tile (signature)

Gentle 6px corners on Raised Charcoal, Monitor Black behind the video. Name chip bottom-left on 60% black;
actions appear on hover or focus (always on touch). The active speaker gets a white ring; tally sources get a
3px inset ring and a PGM/PVW chip. Fill or 16:9.

### Status Badge

12px uppercase at 600. `live` is solid On-Air Red; `preview` solid Preview Green; success, warning and error
are 14% tints of their colour (error adds an icon).

## Do's and Don'ts

### Do:

- **Do** take every component from `truetime-ui` first (`Button`, `Input`, `Card`, `ControlBar`,
  `ToolbarButton`, `VideoTile`, `StatusBadge`…) and pass translated text in as props.
- **Do** style with `themeColors(theme)` roles and the exported tokens (`radii`, `shadows`, `motion`,
  `controlBar`); check every change in at least Black and one gradient theme (aurora, sunset or ocean).
- **Do** use pills (24px) for call controls and page CTAs, 6px for controls, 12px for containers.
- **Do** show focus with `focusRingStyle(theme)` (2px ring, 2px offset).
- **Do** use the motion tokens: 150ms hover, 200ms state, 240ms enter, 180ms exit, standard easing; spring only
  for reactions and badges popping in.

### Don't:

- **Don't** hard-code hex, rgba, radii or shadows in the app; new tokens go into `truetime-ui`.
- **Don't** add colour to chrome for decoration; a coloured fill must mean a state or come from the theme.
- **Don't** use On-Air Red or Preview Green for anything but tally.
- **Don't** drift toward enterprise blue chrome: dense, blue-tinted toolbars with many small square buttons.
- **Don't** put shadows or blur on surfaces that have no video behind them.
- **Don't** add a light mode, another theme provider or `CssBaseline`.
- **Don't** uppercase button text; only status badges are uppercase.
