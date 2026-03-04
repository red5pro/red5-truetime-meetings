import React, { JSX, useEffect, useRef } from 'react';
import { Typography } from '@mui/material';
import { useTheme } from '@mui/material/styles';

function TimeZone(): JSX.Element {
  const theme = useTheme();

  const getTime = (): string => {
    return new Date().toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const [currentTime, setCurrentTime] = React.useState<string>(getTime());
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const updateTime = (): void => {
      setCurrentTime(getTime());
    };

    // Set up interval
    intervalRef.current = setInterval(updateTime, 1000);

    // Cleanup function to clear interval
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  return (
    <Typography color={theme.palette.text.primary} variant="body1">
      {currentTime}
    </Typography>
  );
}

export default TimeZone;
