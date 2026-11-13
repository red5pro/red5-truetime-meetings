import { JSX, useMemo, useRef, useState, type ChangeEvent } from 'react';
import { Box, Chip, IconButton, Tooltip } from '@mui/material';
import { alpha } from '@mui/material/styles';
import {
  AttachFile,
  Close,
  GifBox,
  Image as ImageIcon,
  InsertDriveFile,
  OpenInNew,
  PictureAsPdf,
  Videocam,
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { enqueueSnackbar } from 'notistack';
import { ChatPanel, Text, radii, themeColors, type ChatMessage } from 'truetime-ui';
import { urlify } from '../utils/utils';

/** A file sent with a message (the SDK's FileType): its URL may be missing until it's uploaded */
export interface MessageFile {
  id?: string;
  name: string;
  url?: string | null;
}

export interface Message {
  date: string;
  name: string;
  message: string;
  /** Set on messages from other people; your own have none */
  eventType?: string;
  files?: MessageFile[];
}

/** Your own text message, added to the list once it's sent */
export interface SentMessage {
  name: string;
  message: string;
  date: string;
}

interface MessagesTabProps {
  messages?: Message[];
  /**
   * Send a message with optional files. Messages with files are added to the list by the sender
   * once the files are uploaded (with their URLs); text-only ones through `onMessageSent`.
   */
  onSend: (message: string, files?: File[]) => void;
  onMessageSent: (message: SentMessage) => void;
}

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
const ACCEPTED_FILES = 'image/*,video/*,.pdf,application/pdf';

type FileKind = 'image' | 'gif' | 'video' | 'pdf' | 'file';

const kindOfName = (name: string): FileKind => {
  const extension = name.split('.').pop()?.toLowerCase() ?? '';
  if (extension === 'gif') return 'gif';
  if (['png', 'jpg', 'jpeg', 'webp', 'bmp', 'svg'].includes(extension)) return 'image';
  if (['mp4', 'webm', 'ogg', 'mov', 'avi'].includes(extension)) return 'video';
  if (extension === 'pdf') return 'pdf';
  return 'file';
};

const kindIcon: Record<FileKind, JSX.Element> = {
  image: <ImageIcon fontSize="small" />,
  gif: <GifBox fontSize="small" />,
  video: <Videocam fontSize="small" />,
  pdf: <PictureAsPdf fontSize="small" />,
  file: <InsertDriveFile fontSize="small" />,
};

const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

/** Files sent with a message: a preview for images and videos, then the name and an open link */
export function MessageAttachments({ files }: { files: MessageFile[] }) {
  const { t } = useTranslation();

  return (
    <>
      {files.map((file, index) => {
        const kind = kindOfName(file.name);
        return (
          <Box key={`${file.name}-${index}`} sx={{ maxWidth: 260, width: '100%' }}>
            {file.url && (kind === 'image' || kind === 'gif') && (
              <Box
                component="a"
                href={file.url}
                target="_blank"
                rel="noreferrer"
                aria-label={`${t('Open')} ${file.name}`}
                sx={{ display: 'block', mb: 0.5 }}
              >
                <Box
                  component="img"
                  src={file.url}
                  alt=""
                  loading="lazy"
                  sx={(theme) => ({
                    display: 'block',
                    width: '100%',
                    maxHeight: 200,
                    objectFit: 'cover',
                    borderRadius: `${radii.container}px`,
                    backgroundColor: themeColors(theme).surfaceRaised,
                  })}
                />
              </Box>
            )}
            {file.url && kind === 'video' && (
              <Box
                component="video"
                controls
                preload="metadata"
                src={file.url}
                sx={(theme) => ({
                  display: 'block',
                  width: '100%',
                  maxHeight: 200,
                  mb: 0.5,
                  borderRadius: `${radii.container}px`,
                  backgroundColor: themeColors(theme).surfaceRaised,
                })}
              />
            )}
            <Box
              sx={(theme) => ({
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                px: 1.25,
                py: 0.75,
                borderRadius: `${radii.container}px`,
                backgroundColor: themeColors(theme).surfaceRaised,
                color: themeColors(theme).mutedText,
              })}
            >
              {kindIcon[kind]}
              <Text
                variant="caption"
                component="span"
                sx={{
                  flex: 1,
                  minWidth: 0,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  color: 'text.primary',
                }}
              >
                {file.name}
              </Text>
              {file.url && (
                <Tooltip title={t('Open in a new tab')}>
                  <IconButton
                    size="small"
                    component="a"
                    href={file.url}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={`${t('Open in a new tab')}: ${file.name}`}
                    sx={{ p: 0.25, color: 'inherit' }}
                  >
                    <OpenInNew fontSize="small" />
                  </IconButton>
                </Tooltip>
              )}
            </Box>
          </Box>
        );
      })}
    </>
  );
}

function MessagesTab({ messages = [], onSend, onMessageSent }: MessagesTabProps): JSX.Element {
  const { t } = useTranslation();
  const [files, setFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const chatMessages = useMemo<ChatMessage[]>(
    () =>
      messages.map((message, index) => ({
        id: String(index),
        author: message.name,
        text: message.message ?? '',
        timestamp: message.date,
        mine: !message.eventType,
        attachments:
          message.files && message.files.length > 0 ? (
            <MessageAttachments files={message.files} />
          ) : undefined,
      })),
    [messages],
  );

  const handleSend = (text: string) => {
    if (!text && files.length === 0) return false;
    const attached = files.length > 0 ? files : undefined;
    onSend(text, attached);
    if (!attached) {
      onMessageSent({ name: t('You'), message: text, date: new Date().toString() });
    }
    setFiles([]);
    return true;
  };

  const handleFilesPicked = (event: ChangeEvent<HTMLInputElement>) => {
    const picked = Array.from(event.target.files ?? []);
    // Let the same file be picked again after it's removed
    event.target.value = '';

    const accepted: File[] = [];
    const rejected: string[] = [];
    picked.forEach((file) => {
      const typeOk =
        file.type.startsWith('image/') ||
        file.type.startsWith('video/') ||
        file.type === 'application/pdf';
      if (!typeOk) rejected.push(`${file.name}: ${t('only images, videos and PDFs')}`);
      else if (file.size > MAX_FILE_SIZE) rejected.push(`${file.name}: ${t('larger than 5 MB')}`);
      else accepted.push(file);
    });

    if (rejected.length > 0) {
      enqueueSnackbar(`${t("Couldn't attach")} ${rejected.join('; ')}`, {
        variant: 'warning',
        autoHideDuration: 4000,
      });
    }
    if (accepted.length > 0) setFiles((current) => [...current, ...accepted]);
  };

  return (
    <Box sx={{ height: '100%', width: '100%', minHeight: 0 }}>
      <input
        ref={fileInputRef}
        type="file"
        accept={ACCEPTED_FILES}
        multiple
        hidden
        onChange={handleFilesPicked}
        id="message-file-input"
      />
      <ChatPanel
        messages={chatMessages}
        onSend={handleSend}
        renderText={(text) => urlify(text)}
        emptyText={t('No messages yet. Say hello!')}
        placeholder={t('Send a message')}
        sendLabel={t('Send message')}
        canSendWithoutText={files.length > 0}
        composerStart={
          <Tooltip title={t('Attach a file')}>
            <IconButton
              id="message-attach-button"
              aria-label={t('Attach a file')}
              onClick={() => fileInputRef.current?.click()}
              sx={(theme) => ({
                color: themeColors(theme).mutedText,
                '&:hover': { color: themeColors(theme).text },
              })}
            >
              <AttachFile />
            </IconButton>
          </Tooltip>
        }
        composerAbove={
          files.length > 0 ? (
            <Box
              role="list"
              aria-label={t('Files to send')}
              sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75, mb: 1 }}
            >
              {files.map((file, index) => (
                <Chip
                  role="listitem"
                  key={`${file.name}-${index}`}
                  size="small"
                  icon={kindIcon[kindOfName(file.name)]}
                  label={`${file.name} · ${formatFileSize(file.size)}`}
                  onDelete={() => setFiles((current) => current.filter((_, i) => i !== index))}
                  deleteIcon={<Close aria-label={`${t('Remove')} ${file.name}`} />}
                  sx={(theme) => ({
                    maxWidth: '100%',
                    color: themeColors(theme).text,
                    backgroundColor: alpha(themeColors(theme).text, 0.08),
                    '& .MuiChip-icon, & .MuiChip-deleteIcon': {
                      color: themeColors(theme).mutedText,
                    },
                  })}
                />
              ))}
            </Box>
          ) : undefined
        }
      />
    </Box>
  );
}

export default MessagesTab;
