import { useState, useCallback, MutableRefObject } from 'react';
import { usePostRequest } from './usePostRequest';
import { getBackendConfig } from '../utils/conferenceConfig';

// Type definitions
interface ConferenceClient {
  roomId: string;
  streamName: string;
}

interface Client {
  conferenceClient: MutableRefObject<ConferenceClient>;
}

interface CaptionData {
  text: string;
  timestamp?: string | Date;
  streamId: string;
  speaker?: string;
  metadata?: any;
}

interface Caption {
  id: string;
  text: string;
  timestamp: Date;
  streamId: string;
  speaker: string;
  metadata?: any;
  isCurrent?: boolean;
}

interface PostRequest {
  postData: (url: string, data: any) => Promise<any>;
}

interface UseClosedCaptionsReturn {
  startCaption: () => Promise<void>;
  captionsVisible: boolean;
  setCaptionsVisible: React.Dispatch<React.SetStateAction<boolean>>;
  captionsLanguage: string;
  isLiveCaptions: boolean;
  captions: Caption[];
  handleToggleCaptions: () => void;
  handleCaptionsLanguageChange: (language: string) => void;
  handleCaptionTypeChange: (isLive: boolean) => void;
  addCaption: (captionData: CaptionData) => void;
  formatTimestamp: (timestamp: string | Date) => string;
  getCaptionsForSpeaker: (speakerId: string) => Caption[];
  clearCaptions: () => void;
}

export const useClosedCaptions = (client: Client): UseClosedCaptionsReturn => {
  const { postData }: PostRequest = usePostRequest();
  const [captionsVisible, setCaptionsVisible] = useState<boolean>(false);
  const [captionsLanguage, setCaptionsLanguage] = useState<string>('en');
  const [isLiveCaptions, setIsLiveCaptions] = useState<boolean>(true);
  const [captions, setCaptions] = useState<Caption[]>([]);

  // Captions handlers
  const handleToggleCaptions = useCallback(() => {
    if (captionsVisible) {
      stopCaption().then(() => {
        setCaptions([]);
      });
    } else {
      startCaption();
    }
    setCaptionsVisible((prev) => !prev);
  }, [captionsVisible]);

  const startCaption = useCallback(async (): Promise<void> => {
    try {
      const backendConfig = getBackendConfig();
      const url = `${backendConfig.host}${backendConfig.apiEndpoints.startTranscription
        .replace('{roomName}', client.conferenceClient.current.roomId)
        .replace('{userId}', client.conferenceClient.current.streamName)}`;
      const result = await postData(url, {});
      console.log('startCaption: ', result);
    } catch (error) {
      console.error('Error starting caption:', error);
    }
  }, [client]);

  const stopCaption = useCallback(async (): Promise<void> => {
    try {
      const backendConfig = getBackendConfig();
      const url = `${backendConfig.host}${backendConfig.apiEndpoints.stopTranscription
        .replace('{roomName}', client.conferenceClient.current.roomId)
        .replace('{userId}', client.conferenceClient.current.streamName)}`;
      const result = await postData(url, {});
      console.log('stopCaption: ', result);
    } catch (error) {
      console.error('Error stopping caption:', error);
    }
  }, [client]);

  const handleCaptionsLanguageChange = useCallback((language: string) => {
    setCaptionsLanguage(language);
    // Here you would typically call your translation service
    console.log('Language changed to:', language);
  }, []);

  const handleCaptionTypeChange = useCallback((isLive: boolean) => {
    setIsLiveCaptions(isLive);
    // Here you would switch between live captions and translated text
    console.log('Caption type changed to:', isLive ? 'Live' : 'Translated');
  }, []);

  // addCaption to handle the richer caption data
  const addCaption = useCallback((captionData: CaptionData) => {
    const newCaption: Caption = {
      id: Date.now() + captionData.streamId,
      text: captionData.text,
      timestamp: captionData.timestamp ? new Date(captionData.timestamp) : new Date(),
      streamId: captionData.streamId,
      speaker: captionData.speaker ?? 'Unknown',
      metadata: captionData.metadata,
    };

    setCaptions((prev) => {
      // Mark previous captions as not current
      const updated = prev.map((caption) => ({ ...caption, isCurrent: false }));

      // Check for duplicate captions (same text from same speaker within 1 second)
      const isDuplicate = updated.some(
        (caption) =>
          caption.text === newCaption.text &&
          caption.streamId === newCaption.streamId &&
          Math.abs(caption.timestamp.getTime() - newCaption.timestamp.getTime()) < 1000,
      );

      if (isDuplicate) {
        console.log('Duplicate caption detected, skipping...');
        return prev;
      }

      // Add new caption
      return [...updated, newCaption].slice(-50); // Keep only last 50 captions
    });
  }, []);

  // Utility function to format timestamp for display
  const formatTimestamp = useCallback((timestamp: string | Date): string => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  }, []);

  // Function to get captions for a specific speaker
  const getCaptionsForSpeaker = useCallback(
    (speakerId: string): Caption[] => {
      return captions.filter(
        (caption) => caption.speaker === speakerId || caption.streamId === speakerId,
      );
    },
    [captions],
  );

  // Function to clear all captions
  const clearCaptions = useCallback((): void => {
    setCaptions([]);
  }, []);

  return {
    startCaption,
    captionsVisible,
    setCaptionsVisible,
    captionsLanguage,
    isLiveCaptions,
    captions,
    handleToggleCaptions,
    handleCaptionsLanguageChange,
    handleCaptionTypeChange,
    addCaption,
    formatTimestamp,
    getCaptionsForSpeaker,
    clearCaptions,
  };
};
