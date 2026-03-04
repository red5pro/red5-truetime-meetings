import { Typography, Box, CardMedia, IconButton } from '@mui/material';
import Grid from '@mui/material/Grid2';
import { urlify } from '../../utils/utils';
import { styled, useTheme, Theme } from '@mui/material/styles';
import { FileType } from 'red5pro-conference-sdk';
import ImageIcon from '@mui/icons-material/Image';
import VideocamIcon from '@mui/icons-material/Videocam';
import GifBoxIcon from '@mui/icons-material/GifBox';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';

const HyperTypography = styled(Typography)(({}: { theme: Theme }) => ({
  '& a': {
    color: '#fff',
  },
}));

const FileInfoBox = styled(Box)(({ theme }: { theme: Theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(0.75), // Reduced from 1
  marginTop: theme.spacing(0.5),
  maxWidth: '100%',
}));

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

  return (
    <Grid container sx={{ mb: 3 }} justifyContent={props?.isMe ? 'flex-end' : 'flex-start'}>
      <Grid
        container
        size={12}
        alignItems="center"
        justifyContent={props?.isMe ? 'flex-end' : 'flex-start'}
      >
        <Typography variant="body1" color={theme.palette.chatText} style={{ fontSize: 14 }}>
          {props?.name}
          {'  '}
        </Typography>
        {
          //@ts-ignore
          <Typography
            variant="body2"
            color={theme.palette.grey}
            sx={{ ml: 1 }}
            style={{ fontSize: 12 }}
          >
            {props?.date}
          </Typography>
        }
      </Grid>

      {/* Text Message */}
      {props?.message && (
        <Grid size={12} sx={{ mt: 1, maxWidth: '100%' }}>
          <HyperTypography
            variant="body1"
            fontSize={14}
            style={{ whiteSpace: 'pre-wrap', overflowWrap: 'break-word', wordBreak: 'break-word' }}
            color={theme.palette.chatText}
            align={props?.isMe ? 'right' : 'left'}
            fontWeight={400}
            lineHeight={1.4}
            id="message"
          >
            {urlify(props?.message)}
          </HyperTypography>
        </Grid>
      )}

      {/* Files */}
      {props?.files && props.files.length > 0 && (
        <Grid size={12} sx={{ mt: props?.message ? 0.75 : 1, maxWidth: '100%', height: 'auto' }}>
          <Box
            sx={{
              height: 'auto',
              display: 'flex',
              flexDirection: 'column',
              alignItems: props?.isMe ? 'flex-end' : 'flex-start',
              gap: 0.75, // Reduced from 1
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
        </Grid>
      )}
    </Grid>
  );
}

export default MessageCard;
