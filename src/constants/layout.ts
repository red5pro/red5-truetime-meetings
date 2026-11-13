import { controlBar } from 'truetime-ui';

/** Space above the call controls inside the footer */
export const FOOTER_PADDING_TOP = 4;
/** Space below the call controls, so they don't sit on the window's bottom edge */
export const FOOTER_PADDING_BOTTOM = 16;
/** Height of the call controls bar */
export const CONTROL_BAR_HEIGHT = controlBar.buttonHeight + 2 * controlBar.padding;
/**
 * Height of the footer at rest: what the meeting layout (gallery, drawers, captions) leaves free at
 * the bottom of the window. If you change it, also change the 92px fallbacks in App.css.
 */
export const FOOTER_HEIGHT = FOOTER_PADDING_TOP + CONTROL_BAR_HEIGHT + FOOTER_PADDING_BOTTOM;
