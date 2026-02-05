import * as React from 'react'
import DialogTitle from '@mui/material/DialogTitle'
import Dialog from '@mui/material/Dialog'
import Button from '@mui/material/Button'
import DialogContent from '@mui/material/DialogContent'
import { SvgIcon } from '../../SvgIcon.js'
import { useTranslation } from 'react-i18next'
import { Box } from '@mui/system'

interface Red5DialogTitleProps {
    children: React.ReactNode
    onClose?: () => void
}

interface GoToLobbyDialogProps {
    onClose: () => void
        url: string
    open: boolean
    onGoToLobbyClicked: () => void
}

const Red5DialogTitle: React.FC<Red5DialogTitleProps> = (props) => {
    const { children, onClose, ...other } = props

    return (
        <DialogTitle {...other}>
            {children}
            {onClose ? (
                <Button
                    aria-label="close"
                    onClick={onClose}
                    sx={{
                        position: 'absolute',
                        right: 26,
                        top: 27
                    }}
                >
                    <SvgIcon size={20} viewBox="0 0 500 500" name={'close'} color={'#fff'} />
                </Button>
            ) : null}
        </DialogTitle>
    )
}

export function GoToLobbyDialog({ onClose, url, open, onGoToLobbyClicked }: GoToLobbyDialogProps) {
    const { t } = useTranslation()
    const [copied, setCopied] = React.useState<boolean>(false)

    const copyToClipboard = (): void => {
        navigator.clipboard.writeText(url)
        setCopied(true)
    }

    const handleClose = (_event?: any, _reason?: string): void => {
        onClose()
    }

    const goToLobbyClicked = (_e: React.MouseEvent<HTMLButtonElement>): void => {
        onGoToLobbyClicked()
    }

    return (
        <Dialog
            onClose={handleClose}
            open={open}
            maxWidth={'sm'}
            BackdropProps={{
                sx: {
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    backdropFilter: 'blur(0.5px)',
                }
            }}
        >
            <Red5DialogTitle onClose={handleClose}>{t('Share this Url with Your Attendees')}</Red5DialogTitle>
            <DialogContent>
                <Box style={{ display: 'flex', flexDirection: 'column' }}>
                    <a
                        href={url}
                        title={url} // Tooltip showing the full URL on hover
                        style={{
                            color: '#fff',
                            fontSize: '1em',
                            cursor: 'pointer',
                            display: 'inline-block',
                            maxWidth: '350px',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                        }}
                    >
                        {url}
                    </a>
                    <span
                        style={{
                            textDecoration: 'underline',
                            cursor: 'pointer',
                            fontSize: '1.5em',
                            marginTop: '15px'
                        }}
                        onClick={copyToClipboard}
                    >
            {copied ? 'Copied!' : 'Copy'}
          </span>
                </Box>

                <Button
                    style={{ marginTop: '35px' }}
                    onClick={goToLobbyClicked}
                    size="medium"
                    color="secondary"
                    variant="contained"
                    type="submit"
                    id="go_to_lobby_button"
                >
                    {t('Go to Lobby')}
                </Button>
            </DialogContent>
        </Dialog>
    )
}