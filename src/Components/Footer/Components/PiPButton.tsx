import React, { JSX } from 'react';
import { styled, Theme } from '@mui/material/styles';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import { PictureInPicture, PictureInPictureAlt } from '@mui/icons-material';

interface StyleProps {
  rounded?: boolean;
  glass?: boolean;
  active?: boolean;
}

interface PiPButtonProps extends StyleProps {
  footer?: boolean;
  pipIsOpen?: boolean;
  pipSupported?: boolean;
  allParticipants?: any[];
  openAllParticipantsPiP?: () => void;
  closePiP?: () => void;
  disabled?: boolean;
}

const getCustomizedIconButtonStyle = (props: StyleProps, theme: Theme) => {
  const { rounded, glass, active } = props;

  let customizedIconButtonStyle = {
    width: '52px',
    height: '52px',
    color: theme.palette.text.primary,
    transition: 'all 0.2s ease',
    '&:hover': {
      backgroundColor: theme.palette.action.hover,
    },
  };

  if (glass) {
    customizedIconButtonStyle = {
      ...customizedIconButtonStyle,
      // @ts-ignore
      backdropFilter: 'blur(10px)',
      backgroundColor: 'rgba(255, 255, 255, 0.1)',
    };
  }

  if (rounded) {
    customizedIconButtonStyle = {
      ...customizedIconButtonStyle,
      // @ts-ignore
      backgroundColor: active ? theme.palette.primary.main : theme.palette.action.hover,
      color: active ? theme.palette.primary.contrastText : theme.palette.text.primary,
      '&:hover': {
        backgroundColor: active ? theme.palette.primary.dark : theme.palette.action.focus,
      },
    };
  }

  if (active && !rounded) {
    customizedIconButtonStyle = {
      ...customizedIconButtonStyle,
      color: theme.palette.primary.main,
      // @ts-ignore
      backgroundColor: theme.palette.primary.light + '20',
    };
  }

  return customizedIconButtonStyle;
};

const CustomizedIconButton = styled(IconButton)<StyleProps>(({ theme, ...props }) =>
  getCustomizedIconButtonStyle(props, theme),
);

const PiPButton = React.memo<PiPButtonProps>((props) => {
  const {
    footer = false,
    glass = false,
    rounded = true,
    pipIsOpen = false,
    pipSupported = false,
    allParticipants = [],
    openAllParticipantsPiP,
    closePiP,
    disabled = false,
    ...otherProps
  } = props;

  const participantCount = allParticipants.length;

  const handlePiPClick = () => {
    if (!pipSupported) {
      console.warn(
        'Picture-in-Picture is not supported in this browser. Please use Chrome 111+ or Edge 111+',
      );
      return;
    }

    if (pipIsOpen) {
      // Close PiP if it's open
      closePiP?.();
    } else {
      // Open all participants PiP
      openAllParticipantsPiP?.();
    }
  };

  const getTooltipText = (): string => {
    if (!pipSupported) {
      return 'Picture-in-Picture not supported (Chrome 111+ required)';
    }

    if (pipIsOpen) {
      return `Close Picture-in-Picture (${participantCount} participants)`;
    }

    if (participantCount === 0) {
      return 'No participants to show in Picture-in-Picture';
    }

    if (participantCount === 1) {
      return 'Open Picture-in-Picture (1 participant)';
    }

    return `Open Picture-in-Picture (${participantCount} participants)`;
  };

  const getIcon = (): JSX.Element => {
    if (!pipSupported) {
      return <PictureInPictureAlt />;
    }

    return <PictureInPicture />;
  };

  const isDisabled = disabled || !pipSupported || participantCount === 0;

  return (
    <Tooltip title={getTooltipText()}>
      <span>
        <CustomizedIconButton
          glass={glass}
          rounded={rounded}
          active={pipIsOpen}
          onClick={handlePiPClick}
          disabled={isDisabled}
          size="large"
          {...otherProps}
        >
          {getIcon()}
        </CustomizedIconButton>
      </span>
    </Tooltip>
  );
});

PiPButton.displayName = 'PiPButton';

export default PiPButton;
