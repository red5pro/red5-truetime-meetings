import { Divider, ListItemIcon, ListItemText, MenuItem } from '@mui/material';
import { PersonAddAlt1, PersonRemoveAlt1 } from '@mui/icons-material';

interface FakeParticipantMenuItemsOptions {
  onAdd?: () => void;
  onRemove?: () => void;
}

/**
 * Development-only menu items that add or remove a fake participant, for testing layouts. Returned
 * as an array (MUI's Menu doesn't accept fragments); empty outside `vite dev`. The menu stays open,
 * so several can be added in a row.
 */
export function fakeParticipantMenuItems({ onAdd, onRemove }: FakeParticipantMenuItemsOptions) {
  if (!import.meta.env.DEV) return [];
  return [
    <Divider key="fake-participants-divider" />,
    <MenuItem key="add-fake-participant" id="add-fake-participant" onClick={() => onAdd?.()}>
      <ListItemIcon>
        <PersonAddAlt1 />
      </ListItemIcon>
      <ListItemText>Add Fake Participant</ListItemText>
    </MenuItem>,
    <MenuItem
      key="remove-fake-participant"
      id="remove-fake-participant"
      onClick={() => onRemove?.()}
    >
      <ListItemIcon>
        <PersonRemoveAlt1 />
      </ListItemIcon>
      <ListItemText>Remove Fake Participant</ListItemText>
    </MenuItem>,
  ];
}
