import { Typography, Box, CardMedia, IconButton } from '@mui/material';
import { urlify, getFirstLetter } from '../../utils/utils';
import { styled, useTheme, Theme } from '@mui/material/styles';
import { FileType } from 'red5pro-conference-sdk';
import ImageIcon from '@mui/icons-material/Image';
import VideocamIcon from '@mui/icons-material/Videocam';
import GifBoxIcon from '@mui/icons-material/GifBox';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';

const HyperTypography = styled(Typography)(({}: { theme: Theme }) => ({
  '& a': {
    color: 'inherit',
  },
}));

const FileInfoBox = styled(Box)(({ theme }: { theme: Theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(0.75), // Reduced from 1
  marginTop: theme.spacing(0.5),
  maxWidth: '100%',
}));

const AVATAR_COLORS = ['#5B7FFF', '#D98255', '#4CAF50', '#9C7CF4', '#E0639A', '#3FB6C0'];

const getAvatarColor = (name: string): string => {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  }
  return AVATAR_COLORS[hash % AVATAR_COLORS.length];
};

interface MessageCardProps {
  isMe?: boolean;
  name: string;
  date: string;
  message: string;
  files?: FileType[];
}

function MessageCard(props: MessageCardProps) {
  const theme = useTheme();

  const getFileType = (fileName: string): string => {
    const extension = fileName.split('.').pop()?.toLowerCase() || '';

    const imageExtensions = ['png', 'jpg', 'jpeg', 'webp', 'bmp', 'svg'];
    const videoExtensions = ['mp4', 'webm', 'ogg', 'mov', 'avi'];
    const gifExtensions = ['gif'];

    if (imageExtensions.includes(extension)) return 'image';
    if (videoExtensions.includes(extension)) return 'video';
    if (gifExtensions.includes(extension)) return 'gif';
    return 'file';
  };

  const getFileIcon = (fileName: string) => {
    const fileType = getFileType(fileName);
    const iconProps = { fontSize: 'small' as const, sx: { color: theme.palette.chatText } };

    switch (fileType) {
      case 'image':
        return <ImageIcon {...iconProps} />;
      case 'video':
        return <VideocamIcon {...iconProps} />;
      case 'gif':
        return <GifBoxIcon {...iconProps} />;
      default:
        return <InsertDriveFileIcon {...iconProps} />;
    }
  };

  const handleOpenInNew = (url: string) => {
    window.open(url, '_blank');
  };

  const renderFilePreview = (file: FileType) => {
    if (!file.url) {
      return null;
    }

    const fileType = getFileType(file.name);

    if (fileType === 'image' || fileType === 'gif') {
      return (
        <Box
          sx={{
            position: 'relative',
            cursor: 'pointer',
            width: '100%',
            display: 'flex',
            justifyContent: 'center',
            '&:hover .overlay': {
              opacity: 1,
            },
          }}
          onClick={() => handleOpenInNew(file.url!)}
        >
          <CardMedia
            component="img"
            image={file.url}
            alt={file.name}
            sx={{
              width: '100%',
              maxWidth: '400px',
              height: 'auto',
              maxHeight: '300px',
              objectFit: 'contain',
              borderRadius: 1,
              backgroundColor: 'rgba(0, 0, 0, 0.1)',
              display: 'block',
            }}
            loading="lazy"
          />
          <Box
            className="overlay"
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              opacity: 0,
              transition: 'opacity 0.3s',
              borderRadius: 1,
            }}
          >
            <OpenInNewIcon sx={{ color: '#fff', fontSize: 40 }} />
          </Box>
        </Box>
      );
    }

    if (fileType === 'video') {
      return (
        <Box sx={{ width: '100%', display: 'flex', justifyContent: 'center', marginBottom: 0.5 }}>
          <video
            controls
            preload="metadata"
            style={{
              width: '100%',
              maxWidth: '400px',
              height: 'auto',
              maxHeight: '300px',
              borderRadius: '8px',
              backgroundColor: 'rgba(0, 0, 0, 0.1)',
              display: 'block',
            }}
          >
            <source src={file.url} />
            Your browser does not support the video tag.
          </video>
        </Box>
      );
    }

    return null;
  };

  const isMe = !!props?.isMe;
  const bubbleTextColor = isMe ? '#1A1A1A' : theme.palette.chatText;

  return (
    <Box sx={{ display: 'flex', justifyContent: isMe ? 'flex-end' : 'flex-start', mb: 2.5 }}>
      <Box
        sx={{
          display: 'flex',
          flexDirection: isMe ? 'row-reverse' : 'row',
          alignItems: 'flex-start',
          gap: 1.5,
          maxWidth: '85%',
        }}
      >
        {!isMe && (
          <Box
            sx={{
              width: 36,
              height: 36,
              flexShrink: 0,
              borderRadius: '50%',
              backgroundColor: getAvatarColor(props?.name || ''),
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Typography sx={{ color: '#fff', fontWeight: 600, fontSize: 14 }}>
              {getFirstLetter(props?.name || '')}
            </Typography>
          </Box>
        )}

        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: isMe ? 'flex-end' : 'flex-start',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.75, mb: 0.5, px: 0.5 }}>
            <Typography sx={{ fontSize: 14, fontWeight: 600, color: theme.palette.chatText }}>
              {props?.name}
            </Typography>
            <Typography sx={{ fontSize: 12, color: theme.palette.text.secondary }}>
              {'·'} {props?.date}
            </Typography>
          </Box>

          {/* Text Message */}
          {props?.message && (
            <Box
              sx={{
                backgroundColor: isMe ? '#F0EEE7' : 'rgba(255, 255, 255, 0.08)',
                borderRadius: 3,
                px: 2,
                py: 1.25,
                maxWidth: '100%',
              }}
            >
              <HyperTypography
                variant="body1"
                fontSize={14}
                style={{
                  whiteSpace: 'pre-wrap',
                  overflowWrap: 'break-word',
                  wordBreak: 'break-word',
                }}
                color={bubbleTextColor}
                fontWeight={400}
                lineHeight={1.4}
                id="message"
              >
                {urlify(props?.message)}
              </HyperTypography>
            </Box>
          )}

          {/* Files */}
          {props?.files && props.files.length > 0 && (
            <Box
              sx={{
                mt: props?.message ? 0.75 : 0,
                display: 'flex',
                flexDirection: 'column',
                alignItems: isMe ? 'flex-end' : 'flex-start',
                gap: 0.75,
                maxWidth: '100%',
              }}
            >
              {props.files.map((file, index) => (
                <Box key={index}>
                  {renderFilePreview(file)}
                  <FileInfoBox>
                    {getFileIcon(file.name)}
                    <Typography
                      variant="body2"
                      sx={{
                        flex: 1,
                        color: theme.palette.chatText,
                        fontSize: 12, // Reduced from 13
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        minWidth: 0,
                      }}
                    >
                      {file.name}
                    </Typography>
                    {file.url && (
                      <>
                        <IconButton
                          size="small"
                          onClick={() => handleOpenInNew(file.url!)}
                          title="Open in new tab"
                          sx={{
                            color: theme.palette.chatText,
                            padding: '2px', // Reduced from 4px
                            '&:hover': {
                              backgroundColor: 'rgba(255, 255, 255, 0.1)',
                            },
                          }}
                        >
                          <OpenInNewIcon fontSize="small" />
                        </IconButton>
                      </>
                    )}
                  </FileInfoBox>
                </Box>
              ))}
            </Box>
          )}
        </Box>
      </Box>
    </Box>
  );
}

export default MessageCard;
