import { describe, expect, it } from 'vitest';
import { deprioritizeContinuityDevices } from './devicePriority';

const mic = (label: string) => ({ deviceId: label, label });

describe('deprioritizeContinuityDevices', () => {
  it('moves iPhone and iPad microphones to the end, keeping the rest in order', () => {
    const sorted = deprioritizeContinuityDevices([
      mic('Default - Ada’s iPhone Microphone'),
      mic('MacBook Pro Microphone'),
      mic('iPad Microphone'),
      mic('USB Headset'),
    ]);
    expect(sorted.map((d) => d.label)).toEqual([
      'MacBook Pro Microphone',
      'USB Headset',
      'Default - Ada’s iPhone Microphone',
      'iPad Microphone',
    ]);
  });

  it('keeps a phone microphone when it is the only one', () => {
    expect(deprioritizeContinuityDevices([mic('iPhone Microphone')])).toHaveLength(1);
  });
});
