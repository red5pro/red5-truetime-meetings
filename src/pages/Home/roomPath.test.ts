import { describe, expect, it } from 'vitest';
import { roomPathFromInput } from './roomPath';

describe('roomPathFromInput', () => {
  it('opens a typed room name', () => {
    expect(roomPathFromInput('  daily-standup ')).toBe('/daily-standup');
    expect(roomPathFromInput('team sync')).toBe('/team%20sync');
  });

  it('takes the room, and any token, from a shared link', () => {
    expect(roomPathFromInput('https://meet.example.com/meetings/abc123')).toBe('/abc123');
    expect(roomPathFromInput('https://meet.example.com/meetings/abc123?token=t0k')).toBe(
      '/abc123?token=t0k',
    );
    expect(roomPathFromInput('meet.example.com/meetings/abc123/')).toBe('/abc123');
  });

  it('gives nothing for blank input or a link without a room', () => {
    expect(roomPathFromInput('   ')).toBe('');
    expect(roomPathFromInput('https://meet.example.com/')).toBe('');
  });
});
