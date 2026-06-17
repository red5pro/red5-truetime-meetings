import React, { useState, useRef, ChangeEvent, FormEvent } from 'react';
import { IconButton, InputAdornment, TextField, Box, Chip } from '@mui/material';
import Grid from '@mui/material/Grid2';
import { styled, useTheme, Theme } from '@mui/material/styles';
import { useTranslation } from 'react-i18next';
import { SvgIcon } from './SvgIcon';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import CloseIcon from '@mui/icons-material/Close';
import ImageIcon from '@mui/icons-material/Image';
import VideocamIcon from '@mui/icons-material/Videocam';
import GifBoxIcon from '@mui/icons-material/GifBox';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';

interface MessageData {
  name: string;
  message: string;
  date: string;
  files?: File[]; // Added to support file attachments
}

interface MessageInputProps {
  handleSendMessage: (message: string, files?: File[]) => void;
  handleSetMessages: (messageData: MessageData) => void;
}

const MessageInputContainer = styled(Grid)(({ theme }: { theme: Theme }) => ({
  padding: '16px 16px 8px 16px',
  background: theme.palette.themeColor?.[70],
  [theme.breakpoints.down('sm')]: {
    width: '100%',
    padding: '16px 0px 8px 0px',
  },
}));

const MessageTextField = styled(TextField)(({ theme }: { theme: Theme }) => ({
  '& .MuiOutlinedInput-root': {
    borderRadius: 30,
    backgroundColor: theme.palette.themeColor?.[30],
    paddingLeft: 18,
    paddingRight: 18,
    '&:hover .MuiOutlinedInput-notchedOutline, &.Mui-focused .MuiOutlinedInput-notchedOutline': {
      borderColor: theme.palette.themeColor?.[50],
      borderWidth: 1,
    },
  },
  '& .MuiOutlinedInput-input::placeholder': {
    color: theme.palette.themeColor?.[99],
    fontWeight: 400,
  },
  '& .MuiOutlinedInput-notchedOutline': {
    borderRadius: 30,
    borderColor: theme.palette.themeColor?.[50],
  },
}));

const FilePreviewContainer = styled(Box)(({}: { theme: Theme }) => ({
  display: 'flex',
  flexWrap: 'wrap',
  gap: '8px',
  marginBottom: '8px',
  padding: '0 8px',
}));

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB in bytes

const MessageInput = React.memo<MessageInputProps>(({ handleSendMessage, handleSetMessages }) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const [text, setText] = useState<string>('');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const sendMessage = (): void => {
    if ((text && !(text.trim().length === 0)) || selectedFiles.length > 0) {
      handleSendMessage(text, selectedFiles.length > 0 ? selectedFiles : undefined);
      handleSetMessages({
        name: t('You'),
        message: text,
        date: new Date().toString(),
        files: selectedFiles.length > 0 ? selectedFiles : undefined,
      });
      setText('');
      setSelectedFiles([]);
    }
  };

  const handleTextChange = (e: ChangeEvent<HTMLInputElement>): void => {
    setText(e.target.value);
  };

  const handleFormSubmit = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    sendMessage();
  };

  const handleAttachmentClick = (): void => {
    fileInputRef.current?.click();
  };

  const handleFileSelect = (event: ChangeEvent<HTMLInputElement>): void => {
    const files = event.target.files;
    if (files) {
      const fileArray = Array.from(files);

      // Validate file types and size
      const validFiles: File[] = [];
      const rejectedFiles: string[] = [];

      fileArray.forEach((file) => {
        // Check file type
        const isValidType =
          file.type.startsWith('image/') ||
          file.type.startsWith('video/') ||
          file.type === 'application/pdf';

        // Check file size
        const isValidSize = file.size <= MAX_FILE_SIZE;

        if (isValidType && isValidSize) {
          validFiles.push(file);
        } else {
          if (!isValidType) {
            rejectedFiles.push(`${file.name} (invalid type)`);
          } else if (!isValidSize) {
            rejectedFiles.push(`${file.name} (exceeds 5 MB)`);
          }
        }
      });

      if (rejectedFiles.length > 0) {
        console.warn('Some files were rejected:', rejectedFiles);
        // You can also show a snackbar/toast notification here
        alert(
          `The following files were rejected:\n${rejectedFiles.join('\n')}\n\nOnly images, videos, and PDFs under 5 MB are allowed.`,
        );
      }

      if (validFiles.length > 0) {
        setSelectedFiles((prev) => [...prev, ...validFiles]);
      }
    }

    // Reset input value to allow selecting the same file again
    if (event.target) {
      event.target.value = '';
    }
  };

  const handleRemoveFile = (index: number): void => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const canSend = text.trim().length > 0 || selectedFiles.length > 0;

  const getFileIcon = (file: File) => {
    if (file.type.startsWith('image/')) {
      if (file.type === 'image/gif') {
        return <GifBoxIcon fontSize="small" />;
      }
      return <ImageIcon fontSize="small" />;
    }
    if (file.type.startsWith('video/')) {
      return <VideocamIcon fontSize="small" />;
    }
    if (file.type === 'application/pdf') {
      return <PictureAsPdfIcon fontSize="small" />;
    }
    return <AttachFileIcon fontSize="small" />;
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <MessageInputContainer container style={{ backgroundColor: theme.palette.themeColor?.[60] }}>
      <Box sx={{ width: '100%' }}>
        {selectedFiles.length > 0 && (
          <FilePreviewContainer>
            {selectedFiles.map((file, index) => (
              <Chip
                key={index}
                icon={getFileIcon(file)}
                label={`${file.name} (${formatFileSize(file.size)})`}
                onDelete={() => handleRemoveFile(index)}
                deleteIcon={<CloseIcon />}
                sx={{
                  backgroundColor: theme.palette.themeColor?.[50],
                  color: theme.palette.themeColor?.[99],
                  maxWidth: '250px',
                  '& .MuiChip-label': {
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  },
                }}
              />
            ))}
          </FilePreviewContainer>
        )}

        <form onSubmit={handleFormSubmit}>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            accept="image/*,video/*,.pdf,application/pdf"
            multiple
            style={{ display: 'none' }}
          />

          <MessageTextField
            autoFocus
            autoComplete="cc-exp-year"
            value={text}
            onChange={handleTextChange}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <IconButton
                    onClick={handleAttachmentClick}
                    aria-label="attach file"
                    size="medium"
                    edge="start"
                  >
                    <AttachFileIcon sx={{ color: '#FFF' }} />
                  </IconButton>
                </InputAdornment>
              ),
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={sendMessage}
                    disabled={!canSend}
                    aria-label="send message"
                    size="medium"
                    edge="end"
                    id="message-send-button"
                    sx={{
                      backgroundColor: canSend ? '#E74C3C' : 'rgba(255, 255, 255, 0.08)',
                      '&:hover': {
                        backgroundColor: canSend ? '#D9432F' : 'rgba(255, 255, 255, 0.08)',
                      },
                      '&.Mui-disabled': {
                        backgroundColor: 'rgba(255, 255, 255, 0.08)',
                      },
                    }}
                  >
                    <SvgIcon
                      size={19}
                      viewBox="0 0 24 24"
                      name="send"
                      color={canSend ? '#FFF' : 'rgba(255, 255, 255, 0.35)'}
                    />
                  </IconButton>
                </InputAdornment>
              ),
            }}
            fullWidth
            placeholder={t('Send a message')}
            variant="outlined"
            id="message-input"
          />
        </form>
      </Box>
    </MessageInputContainer>
  );
});

MessageInput.displayName = 'MessageInput';

export default MessageInput;
