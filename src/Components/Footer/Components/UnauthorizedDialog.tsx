import {
    Dialog,
    DialogContent,
    IconButton,
    Typography,
    useTheme,
    Box,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { useTranslation } from 'react-i18next';

interface UnauthorizedDialogProps {
    onClose: () => void;
    open: boolean;
    message: string;
}

export function UnauthorizedDialog({ onClose, open, message }: UnauthorizedDialogProps) {
    const { t } = useTranslation();
    const theme = useTheme();

    const handleClose = (): void => {
        onClose();
    };

    return (
        <Dialog
            onClose={handleClose}
            open={open}
            maxWidth="sm"
            fullWidth
            PaperProps={{
                sx: {
                    borderRadius: 3,
                    backgroundColor: 'rgba(20, 20, 20, 0.95)',
                    backdropFilter: 'blur(8px)',
                    color: '#fff',
                },
            }}
        >
            <DialogContent sx={{ px: 3, py: 2 }}>
                <Box
                    display="flex"
                    alignItems="center"
                    justifyContent="space-between"
                >
                    <Typography variant="body1">{t(message)}</Typography>

                    <IconButton
                        aria-label="close"
                        onClick={onClose}
                        sx={{
                            color: theme.palette.grey[500],
                            ml: 2,
                            '&:hover': {
                                color: theme.palette.error.main,
                            },
                        }}
                    >
                        <CloseIcon />
                    </IconButton>
                </Box>
            </DialogContent>
        </Dialog>
    );
}