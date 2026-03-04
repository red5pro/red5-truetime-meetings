import React from 'react';
import { styled, keyframes } from '@mui/material/styles';
import { Box } from '@mui/material';

// Interfaces
interface CircleSpinnerProps {
  size?: number;
  color?: string;
  thickness?: number;
}

interface DotProps {
  delay?: number;
  color?: string;
}

interface RingSpinnerProps {
  size?: number;
  color?: string;
}

interface BarProps {
  delay?: number;
  color?: string;
}

interface DotsSpinnerProps {
  color?: string;
}

interface BarsSpinnerProps {
  color?: string;
}

interface CustomSpinnerProps {
  type?: 'circle' | 'dots' | 'ring' | 'bars';
  size?: number;
  color?: string;
  thickness?: number;
}

// Keyframe animations
const spin = keyframes`
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
`;

const pulse = keyframes`
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
`;

// Option 1: Circle Spinner
const CircleSpinner = styled(Box)<CircleSpinnerProps>(
  ({ size = 40, color = 'white', thickness = 4 }) => ({
    width: size,
    height: size,
    border: `${thickness}px solid rgba(255, 255, 255, 0.2)`,
    borderTop: `${thickness}px solid ${color}`,
    borderRadius: '50%',
    animation: `${spin} 1s linear infinite`,
  }),
);

// Option 2: Dots Spinner
const DotsContainer = styled(Box)({
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  gap: '4px',
  padding: '6px',
});

const Dot = styled(Box)<DotProps>(({ delay = 0, color = 'white' }) => ({
  width: 8,
  height: 8,
  backgroundColor: color,
  borderRadius: '50%',
  animation: `${pulse} 1.4s ease-in-out ${delay}s infinite`,
}));

const DotsSpinner: React.FC<DotsSpinnerProps> = ({ color = 'white' }) => (
  <DotsContainer>
    <Dot color={color} delay={0} />
    <Dot color={color} delay={0.2} />
    <Dot color={color} delay={0.4} />
  </DotsContainer>
);

// Option 3: Ring Spinner
const ringRotate = keyframes`
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
`;

const RingSpinner = styled(Box)<RingSpinnerProps>(({ size = 40, color = 'white' }) => ({
  display: 'inline-block',
  width: size,
  height: size,
  '&:after': {
    content: '""',
    display: 'block',
    width: size * 0.8,
    height: size * 0.8,
    margin: size * 0.1,
    borderRadius: '50%',
    border: `${size * 0.05}px solid ${color}`,
    borderColor: `${color} transparent ${color} transparent`,
    animation: `${ringRotate} 1.2s linear infinite`,
  },
}));

// Option 4: Bars Spinner
const barsScale = keyframes`
  0%, 40%, 100% { transform: scaleY(0.4); }
  20% { transform: scaleY(1.0); }
`;

const BarsContainer = styled(Box)({
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  gap: '2px',
  height: '40px',
});

const Bar = styled(Box)<BarProps>(({ delay = 0, color = 'white' }) => ({
  width: '4px',
  height: '100%',
  backgroundColor: color,
  animation: `${barsScale} 1s ${delay}s infinite ease-in-out`,
}));

const BarsSpinner: React.FC<BarsSpinnerProps> = ({ color = 'white' }) => (
  <BarsContainer>
    <Bar color={color} delay={0} />
    <Bar color={color} delay={0.1} />
    <Bar color={color} delay={0.2} />
    <Bar color={color} delay={0.3} />
    <Bar color={color} delay={0.4} />
  </BarsContainer>
);

// Main Custom Spinner Component
const CustomSpinner: React.FC<CustomSpinnerProps> = ({
  type = 'circle',
  size = 40,
  color = 'white',
  thickness = 4,
}) => {
  switch (type) {
    case 'dots':
      return <DotsSpinner color={color} />;
    case 'ring':
      return <RingSpinner size={size} color={color} />;
    case 'bars':
      return <BarsSpinner color={color} />;
    case 'circle':
    default:
      return <CircleSpinner size={size} color={color} thickness={thickness} />;
  }
};

export default CustomSpinner;
