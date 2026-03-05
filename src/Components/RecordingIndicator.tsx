import React, { useState, useEffect } from 'react';
import { Box } from '@mui/system';

const formatElapsed = (totalSeconds: number): string => {
  const hrs = Math.floor(totalSeconds / 3600);
  const mins = Math.floor((totalSeconds % 3600) / 60);
  const secs = totalSeconds % 60;

  const pad = (n: number) => String(n).padStart(2, '0');

  return hrs > 0 ? `${pad(hrs)}:${pad(mins)}:${pad(secs)}` : `${pad(mins)}:${pad(secs)}`;
};

const RecordingIndicator: React.FC = () => {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setElapsed((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const buttonStyle = {
    display: 'flex',
    alignItems: 'center',
    backgroundColor: '#d32f2f', // Red background
    color: 'white',
    borderRadius: '8px',
    padding: '5px 10px',
    fontWeight: 'bold',
    fontSize: '16px',
    position: 'absolute' as const,
    top: '10px',
    left: '10px',
    zIndex: 9999, // Ensure it appears on top
  };

  const iconStyle = {
    width: '12px',
    height: '12px',
    border: '2px solid white',
    borderRadius: '50%',
    marginRight: '8px',
    backgroundColor: 'white', // White circle
  };

  const timerStyle = {
    marginLeft: '8px',
    fontVariantNumeric: 'tabular-nums' as const,
    fontSize: '14px',
    fontWeight: 'normal' as const,
  };

  return (
    <Box style={buttonStyle}>
      <Box style={iconStyle} />
      <span>Recording</span>
      <span style={timerStyle}>{formatElapsed(elapsed)}</span>
    </Box>
  );
};

export default RecordingIndicator;
