import { useState, useRef, useCallback, useEffect, MutableRefObject } from 'react';
import { truncateText, getLang, truncateFileName } from '../utils/utils';
import { LocationEventTypes } from '../constants/metaDataKeys';
import { FileType } from 'red5pro-conference-sdk';

// Type definitions

interface Message {
  message: string;
  name: string;
  date: string;
  files?: FileType[];
}

interface ParticipantLocationPayload {
  latitude: number;
  longitude: number;
  accuracy?: number;
  timestamp?: number;
}

interface NotificationEvent {
  eventType: string;
  message?: string;
  name?: string;
  date?: string;
  senderStreamId?: string;
  senderStreamName?: string;
  reaction?: string;
  isRaisedHand?: boolean;
  streamId?: string;
  files?: FileType[];
  metadata?: any;
  location?: ParticipantLocationPayload;
}

interface MessageEvent {
  timetoken: string;
  publisher: string;
  message: NotificationEvent;
  file?: {
    id: string;
    name: string;
  };
}

interface ChatMessage {
  messageEvent: MessageEvent;
}

interface ConferenceClient {
  sendEvent: (eventType: string, data: any) => void;
  sendFiles: (files: File[]) => Promise<any[]>;
  sendMessageWithFiles: (message: string, name: string, fileResults: any[]) => void;
  getFileUrl: (fileId: string, fileName: string) => string | null;
}

interface ShowInfoOptions {
  sender?: string;
  variant?: string;
  onClick?: () => void;
  autoHideDuration?: number;
  anchorOrigin?: {
    vertical: 'top' | 'bottom';
    horizontal: 'left' | 'center' | 'right';
  };
}

interface UseChatReturn {
  messages: Message[];
  numberOfUnReadMessages: number;
  setNumberOfUnReadMessages: React.Dispatch<React.SetStateAction<number>>;
  handleSendMessage: (message: string, files?: File[]) => Promise<void>;
  handleSetMessages: (newMessage: Message) => void;
  handleChatMessage: (chatMessage: ChatMessage) => void;
}

export const useChat = (
  conferenceClientRef: MutableRefObject<ConferenceClient | null>,
  publishStreamIdRef: MutableRefObject<string | null>,
  streamName: string,
  messageDrawerOpen: boolean,
  setMessageDrawerOpen: React.Dispatch<React.SetStateAction<boolean>>,
  showReactions: (senderStreamId: string, senderStreamName: string, reaction: string) => void,
  setRaisedHands: React.Dispatch<React.SetStateAction<string[]>>,
  toggleMic: (muted: boolean) => void,
  showInfo: (message: string, options?: ShowInfoOptions) => void,
  onLocationUpdate?: (
    senderStreamId: string | undefined,
    location: ParticipantLocationPayload | undefined,
  ) => void,
): UseChatReturn => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [numberOfUnReadMessages, setNumberOfUnReadMessages] = useState<number>(0);
  const processedTimetokens = useRef<Set<string>>(new Set());

  // Use refs to store latest function references without triggering re-renders
  const showReactionsRef = useRef(showReactions);
  const setRaisedHandsRef = useRef(setRaisedHands);
  const toggleMicRef = useRef(toggleMic);
  const showInfoRef = useRef(showInfo);
  const setMessageDrawerOpenRef = useRef(setMessageDrawerOpen);
  const onLocationUpdateRef = useRef(onLocationUpdate);

  // Keep refs up to date
  useEffect(() => {
    showReactionsRef.current = showReactions;
  }, [showReactions]);

  useEffect(() => {
    setRaisedHandsRef.current = setRaisedHands;
  }, [setRaisedHands]);

  useEffect(() => {
    toggleMicRef.current = toggleMic;
  }, [toggleMic]);

  useEffect(() => {
    showInfoRef.current = showInfo;
  }, [showInfo]);

  useEffect(() => {
    setMessageDrawerOpenRef.current = setMessageDrawerOpen;
  }, [setMessageDrawerOpen]);

  useEffect(() => {
    onLocationUpdateRef.current = onLocationUpdate;
  }, [onLocationUpdate]);

  const handleSendMessage = useCallback(
    async (message: string, files?: File[]) => {
      console.log('handleSendMessage', message, files);

      try {
        // If there are files, upload them using PubNub File API
        if (files && files.length > 0) {
          //showInfoRef.current("Uploading files...", { autoHideDuration: 2000 });

          const fileResults = await conferenceClientRef.current?.sendFiles(files);

          if (fileResults && fileResults.length > 0) {
            // Send message with file references
            conferenceClientRef.current?.sendMessageWithFiles(message, streamName, fileResults);

            // Generate URLs for the files and add to local messages
            const filesWithUrls: FileType[] = fileResults.map((fileResult) => {
              let url = fileResult.url;

              // If URL is not set, generate it using getFileUrl
              if (!url) {
                url = conferenceClientRef.current?.getFileUrl(fileResult.id, fileResult.name);
              }

              return {
                id: fileResult.id,
                name: truncateFileName(fileResult.name, 25),
                url: url || null,
              };
            });

            // Add the message to local state immediately with files
            handleSetMessages({
              message: message,
              name: 'You',
              date: new Date().toString(),
              files: filesWithUrls,
            });

            /*
                    showInfoRef.current("Files uploaded successfully", {
                        variant: 'success',
                        autoHideDuration: 2000
                    });

                     */
          }
        } else {
          // Send regular text message
          conferenceClientRef.current?.sendEvent('MESSAGE_RECEIVED', {
            message,
            name: streamName,
            date: new Date().toString(),
          });
        }
      } catch (error) {
        console.error('Error sending message with files:', error);
        showInfoRef.current('Failed to send files', {
          variant: 'error',
          autoHideDuration: 3000,
        });
      }
    },
    [conferenceClientRef, streamName],
  );

  const handleSetMessages = useCallback((newMessage: Message) => {
    setMessages((oldMessages) => {
      const lastMessage = oldMessages[oldMessages.length - 1];
      const isSameUser = lastMessage?.name === newMessage?.name;
      const sentInSameTime = lastMessage?.date === newMessage?.date;
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const updatedDate = new Date(newMessage?.date).toLocaleString(getLang(), {
        timeZone: timezone,
        hour: '2-digit',
        minute: '2-digit',
      });

      if ('Invalid Date'.localeCompare(updatedDate) !== 0) {
        newMessage.date = updatedDate;
      }

      // Don't merge messages if they contain files
      if (isSameUser && sentInSameTime && !newMessage.files && !lastMessage?.files) {
        if (lastMessage) {
          lastMessage.message = lastMessage.message + '\n' + newMessage.message;
        }
        return [...oldMessages];
      } else {
        return [...oldMessages, newMessage];
      }
    });
  }, []);

  const handleChatMessage = useCallback(
    (chatMessage: ChatMessage) => {
      const timetoken = chatMessage.messageEvent.timetoken;

      if (processedTimetokens.current.has(timetoken)) {
        console.log('Duplicate message detected, skipping:', timetoken);
        return;
      }

      processedTimetokens.current.add(timetoken);

      const filesArray: FileType[] | undefined = chatMessage.messageEvent.message.files;
      if (filesArray) {
        for (let i = 0; i < filesArray.length; ++i) {
          filesArray[i].url = conferenceClientRef.current?.getFileUrl(
            filesArray[i].id,
            filesArray[i].name,
          );
          filesArray[i].name = truncateFileName(filesArray[i].name, 25);
        }
      }

      chatMessage.messageEvent.message.files = filesArray;

      const notificationEvent = chatMessage.messageEvent.message;
      const eventType = notificationEvent.eventType;

      if (eventType === 'MESSAGE_RECEIVED') {
        if (chatMessage.messageEvent.publisher === publishStreamIdRef.current) {
          return;
        }

        const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        if (notificationEvent.date) {
          notificationEvent.date = new Date(notificationEvent.date).toLocaleString(getLang(), {
            timeZone: timezone,
            hour: '2-digit',
            minute: '2-digit',
          });
        }

        if (!messageDrawerOpen) {
          let notificationMessage = notificationEvent.message
            ? truncateText(notificationEvent.message)
            : '';

          // Add file attachment indicator to notification
          if (notificationEvent.files && notificationEvent.files.length > 0) {
            const fileCount = notificationEvent.files.length;
            const fileText = fileCount === 1 ? 'file' : 'files';
            notificationMessage = notificationMessage
              ? `${notificationMessage} [${fileCount} ${fileText}]`
              : `Sent ${fileCount} ${fileText}`;
          }

          showInfoRef.current(notificationMessage, {
            sender: notificationEvent.name,
            variant: 'message',
            onClick: () => {
              setMessageDrawerOpenRef.current(true);
              setNumberOfUnReadMessages(0);
            },
            autoHideDuration: 5000,
            anchorOrigin: { vertical: 'top', horizontal: 'right' },
          });
          setNumberOfUnReadMessages((numb) => numb + 1);
        }

        // @ts-ignore
        handleSetMessages(notificationEvent);
      } else if (eventType === 'REACTIONS') {
        showReactionsRef.current(
          // @ts-ignore
          notificationEvent.senderStreamId,
          notificationEvent.senderStreamName,
          notificationEvent.reaction,
        );
      } else if (eventType === 'RAISED_HAND') {
        if (notificationEvent.isRaisedHand) {
          // @ts-ignore
          setRaisedHandsRef.current((prev) => [...prev, notificationEvent.senderStreamId]);
        } else {
          setRaisedHandsRef.current((prev) =>
            // @ts-ignore
            prev.filter(
              (streamId) => streamId.localeCompare(notificationEvent.senderStreamId) !== 0,
            ),
          );
        }
      } else if (eventType === 'TURN_YOUR_MIC_OFF') {
        if (notificationEvent.streamId === publishStreamIdRef.current) {
          showInfoRef.current(notificationEvent.senderStreamName + ' is muted you.');
          toggleMicRef.current(true);
        }
      } else if (eventType === LocationEventTypes.LOCATION_UPDATE) {
        onLocationUpdateRef.current?.(notificationEvent.senderStreamId, notificationEvent.location);
      }
    },
    [publishStreamIdRef, messageDrawerOpen, handleSetMessages, conferenceClientRef],
  );

  return {
    messages,
    numberOfUnReadMessages,
    setNumberOfUnReadMessages,
    handleSendMessage,
    handleSetMessages,
    handleChatMessage,
  };
};
