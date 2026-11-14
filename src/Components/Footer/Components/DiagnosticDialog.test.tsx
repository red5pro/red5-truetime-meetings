import { afterEach, describe, expect, it, vi } from 'vitest';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { TrueTimeThemeProvider } from 'truetime-ui';
import { DiagnosticDialog } from './DiagnosticDialog';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, values?: Record<string, string | number>) =>
      key.replace(/\{\{(\w+)\}\}/g, (_, name) => String(values?.[name] ?? '')),
  }),
}));

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let root: Root | null = null;
let container: HTMLDivElement;

afterEach(() => {
  act(() => root?.unmount());
  container?.remove();
  root = null;
});

type Props = Partial<Parameters<typeof DiagnosticDialog>[0]>;

function render(props: Props = {}) {
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
  act(() =>
    root!.render(
      <TrueTimeThemeProvider>
        <DiagnosticDialog
          open
          onClose={() => {}}
          selectFocus={null}
          printStatLogs={false}
          setPrintStatLogs={() => {}}
          {...props}
        />
      </TrueTimeThemeProvider>,
    ),
  );
}

const dialogText = () => document.querySelector('[role="dialog"]')?.textContent ?? '';

describe('DiagnosticDialog', () => {
  it('says all is well when there are no issues', () => {
    render({ networkScore: { inbound: 4.8, outbound: 3.1, statsSamples: {} } });
    const text = dialogText();
    expect(text).toContain('Healthy');
    expect(text).toContain('No issues detected');
    expect(text).toContain('4.8');
    expect(text).toContain('Excellent');
    expect(text).toContain('Fair');
    expect(text).toContain('No active connections to measure yet');
  });

  it('lists issues and labelled metrics for each connection', () => {
    render({
      networkScore: { inbound: 2, outbound: 2, statsSamples: { 'pub-1': {} } },
      connectionStats: {
        'pub-1': {
          connectionType: 'publisher',
          quality: { bitrate: 1_250_000 },
          outboundVideo: {
            framesPerSecond: 30,
            packetsSent: 990,
            packetsLost: 10,
            frameWidth: 1280,
            frameHeight: 720,
          },
          candidatePairs: [{ rtt: 42.4 }],
        },
      },
      currentIssues: [
        {
          type: 'network',
          reason: 'high-rtt',
          statsSample: { description: 'High latency', severity: 'critical', connectionId: 'pub-1' },
        },
      ],
    });
    const text = dialogText();
    expect(text).toContain('1 issue');
    expect(text).toContain('High latency');
    expect(text).toContain('critical');
    expect(text).toContain('1 connection');
    expect(text).toContain('Video sent');
    expect(text).toContain('1.3 Mbps');
    expect(text).toContain('1280×720');
    expect(text).toContain('1.0%');
    expect(text).toContain('42 ms');
  });

  it('turns console logging on from the checkbox', () => {
    const setPrintStatLogs = vi.fn();
    render({ setPrintStatLogs });
    const checkbox = document.querySelector<HTMLInputElement>('#diagnostic-print-stats')!;
    act(() => checkbox.click());
    expect(setPrintStatLogs).toHaveBeenCalledWith(true);
  });
});
