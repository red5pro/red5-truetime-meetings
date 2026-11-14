import { Box, ButtonBase, Tooltip } from '@mui/material';
import { alpha } from '@mui/material/styles';
import { useTranslation } from 'react-i18next';
import {
  enterAnimation,
  focusRingStyle,
  motion,
  radii,
  themeColors,
  transition,
} from 'truetime-ui';

/** Reactions everyone can send; `key` is what goes over the wire and what receivers look up. */
export const REACTIONS = [
  { key: 'sparkling_heart', emoji: '💖', label: 'Love It' },
  { key: 'thumbs_up', emoji: '👍🏼', label: 'Like' },
  { key: 'party_popper', emoji: '🎉', label: 'Tada' },
  { key: 'clapping_hands', emoji: '👏🏼', label: 'Applause' },
  { key: 'face_with_tears_of_joy', emoji: '😂', label: 'Haha' },
  { key: 'open_mouth', emoji: '😮', label: 'Surprised' },
  { key: 'sad_face', emoji: '😢', label: 'Sad' },
  { key: 'thinking_face', emoji: '🤔', label: 'Thinking' },
  { key: 'thumbs_down', emoji: '👎🏼', label: 'Dislike' },
] as const;

const EMOJI_BUTTON_SIZE = 44;

interface ReactionsTrayProps {
  onSend?: (reactionKey: string) => void;
}

/** Emoji reactions in a pill, centred above the call controls in the bar's tray. */
export function ReactionsTray({ onSend }: ReactionsTrayProps) {
  const { t } = useTranslation();

  return (
    <Box
      sx={(theme) => ({
        // Centre the pill in the tray row (the tray lays its content out from the left)
        mx: 'auto',
        maxWidth: '100%',
        display: 'flex',
        alignItems: 'center',
        gap: 0.5,
        px: 1,
        py: 0.5,
        overflowX: 'auto',
        borderRadius: `${radii.pill}px`,
        backgroundColor: alpha(themeColors(theme).text, 0.06),
      })}
    >
      {REACTIONS.map((reaction, index) => (
        <Tooltip key={reaction.key} title={t(reaction.label)} placement="top">
          <ButtonBase
            id={`reaction-${reaction.key}`}
            aria-label={t(reaction.label)}
            onClick={() => onSend?.(reaction.key)}
            sx={(theme) => ({
              width: EMOJI_BUTTON_SIZE,
              height: EMOJI_BUTTON_SIZE,
              flexShrink: 0,
              borderRadius: radii.round,
              fontSize: 26,
              lineHeight: 1,
              transition: transition(['background-color', 'transform'], { easing: 'spring' }),
              // The tray's emoji pop in one after another
              ...enterAnimation({ variant: 'pop', delay: index * motion.stagger }),
              '@media (hover: hover)': {
                '&:hover': {
                  backgroundColor: alpha(themeColors(theme).text, 0.1),
                  transform: 'scale(1.15)',
                },
              },
              '&.Mui-focusVisible': focusRingStyle(theme),
              '@media (prefers-reduced-motion: reduce)': {
                '&:hover': { transform: 'none' },
              },
            })}
          >
            <span aria-hidden>{reaction.emoji}</span>
          </ButtonBase>
        </Tooltip>
      ))}
    </Box>
  );
}
