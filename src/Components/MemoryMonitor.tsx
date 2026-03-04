import { useEffect, useState } from 'react';

interface MemoryUsage {
  used: string;
  total: string;
}

// Extend the Performance interface to include the memory property
declare global {
  interface Performance {
    memory?: {
      usedJSHeapSize: number;
      totalJSHeapSize: number;
      jsHeapSizeLimit: number;
    };
  }
}

const MemoryMonitor: React.FC = () => {
  const [memoryUsage, setMemoryUsage] = useState<MemoryUsage | null>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      if (performance.memory) {
        setMemoryUsage({
          used: (performance.memory.usedJSHeapSize / 1024 / 1024).toFixed(2),
          total: (performance.memory.totalJSHeapSize / 1024 / 1024).toFixed(2),
        });
      }
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return memoryUsage ? (
    <div
      style={{
        zIndex: 999999,
        position: 'fixed',
        top: 10,
        right: 10,
        background: '#000',
        color: '#fff',
        padding: '5px',
        borderRadius: '4px',
        fontSize: '12px',
        fontFamily: 'monospace',
      }}
    >
      Memory: {memoryUsage.used}MB / {memoryUsage.total}MB
    </div>
  ) : null;
};

export default MemoryMonitor;
