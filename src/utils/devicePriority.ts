/**
 * Microphones on a nearby iPhone or iPad (macOS Continuity) show up as audio inputs and often
 * become the system default, so a first visit with no saved device would pick the phone.
 * Matched by label, since that's all the browser gives us (e.g. "Ada's iPhone Microphone",
 * or Chrome's "Default - iPhone Microphone" when the phone is the system default).
 */
const CONTINUITY_DEVICE = /\b(iphone|ipad)\b/i;

export const isContinuityDevice = (device: { label: string }): boolean =>
  CONTINUITY_DEVICE.test(device.label);

/** Same order, with iPhone/iPad devices moved to the end so they're the last to be picked. */
export const deprioritizeContinuityDevices = <T extends { label: string }>(devices: T[]): T[] => [
  ...devices.filter((device) => !isContinuityDevice(device)),
  ...devices.filter(isContinuityDevice),
];
