import { Divider, ListItemIcon, ListItemText, MenuItem } from '@mui/material';
import { Palette, PersonAddAlt1, PersonRemoveAlt1 } from '@mui/icons-material';
import { themeNames } from 'truetime-ui';

interface DevMenuItemsOptions {
  onAddFakeParticipant?: () => void;
  onRemoveFakeParticipant?: () => void;
  /** The active theme, and how to switch it (saved like a normal theme change) */
  currentTheme?: string;
  onThemeChange?: (theme: string) => void;
}

/** The theme after `current` in truetime-ui's list, wrapping round to the first */
const nextTheme = (current?: string): string => {
  const index = themeNames.indexOf(current as (typeof themeNames)[number]);
  return themeNames[(index + 1) % themeNames.length];
};

/**
 * Development-only menu items, for testing layouts and palettes: add or remove a fake participant,
 * and step through every truetime-ui theme. Returned as an array (MUI's Menu doesn't accept
 * fragments); empty outside `vite dev`. The menu stays open, so they can be clicked repeatedly.
 */
export function devMenuItems({
  onAddFakeParticipant,
  onRemoveFakeParticipant,
  currentTheme,
  onThemeChange,
}: DevMenuItemsOptions) {
  if (!import.meta.env.DEV) return [];
  return [
    <Divider key="dev-divider" />,
    <MenuItem
      key="add-fake-participant"
      id="add-fake-participant"
      onClick={() => onAddFakeParticipant?.()}
    >
      <ListItemIcon>
        <PersonAddAlt1 />
      </ListItemIcon>
      <ListItemText>Add Fake Participant</ListItemText>
    </MenuItem>,
    <MenuItem
      key="remove-fake-participant"
      id="remove-fake-participant"
      onClick={() => onRemoveFakeParticipant?.()}
    >
      <ListItemIcon>
        <PersonRemoveAlt1 />
      </ListItemIcon>
      <ListItemText>Remove Fake Participant</ListItemText>
    </MenuItem>,
    ...(onThemeChange
      ? [
          <MenuItem
            key="dev-theme"
            id="dev-theme-switcher"
            onClick={() => onThemeChange(nextTheme(currentTheme))}
          >
            <ListItemIcon>
              <Palette />
            </ListItemIcon>
            <ListItemText
              primary={`Theme: ${currentTheme ?? themeNames[0]}`}
              secondary="Click for the next one"
            />
          </MenuItem>,
        ]
      : []),
  ];
}
