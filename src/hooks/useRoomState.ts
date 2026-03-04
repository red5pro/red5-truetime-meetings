// hooks/useRoomState.ts
import { useState, useRef, MutableRefObject } from 'react';
import { getInitialPlayOnlyMode } from '../utils/conferenceConfig';

// Type definitions
type PageType = 'lobby' | 'meeting';

interface UseRoomStateReturn {
  lobbyOrMeetingPage: PageType;
  setLobbyOrMeetingPage: React.Dispatch<React.SetStateAction<PageType>>;
  leftTheRoom: boolean;
  setLeftTheRoom: React.Dispatch<React.SetStateAction<boolean>>;
  isJoining: boolean;
  setIsJoining: React.Dispatch<React.SetStateAction<boolean>>;
  isWaitingApproval: boolean;
  setIsWaitingApproval: React.Dispatch<React.SetStateAction<boolean>>;
  isPublished: boolean;
  setIsPublished: React.Dispatch<React.SetStateAction<boolean>>;
  isPlayed: boolean;
  setIsPlayed: React.Dispatch<React.SetStateAction<boolean>>;
  isPlayOnly: boolean;
  setIsPlayOnly: React.Dispatch<React.SetStateAction<boolean>>;
  streamName: string | null;
  setStreamName: React.Dispatch<React.SetStateAction<string | null>>;
  streamNameRef: MutableRefObject<string | null>;
  publishStreamIdRef: MutableRefObject<string | null>;
}

export const useRoomState = (): UseRoomStateReturn => {
  const [lobbyOrMeetingPage, setLobbyOrMeetingPage] = useState<PageType>('lobby');
  const [leftTheRoom, setLeftTheRoom] = useState<boolean>(false);
  const [isJoining, setIsJoining] = useState<boolean>(false);
  const [isWaitingApproval, setIsWaitingApproval] = useState<boolean>(false);
  const [isPublished, setIsPublished] = useState<boolean>(false);
  const [isPlayed, setIsPlayed] = useState<boolean>(false);
  const [isPlayOnly, setIsPlayOnly] = useState<boolean>(getInitialPlayOnlyMode());
  const [streamName, setStreamName] = useState<string | null>(null);
  const streamNameRef = useRef<string | null>(null);
  const publishStreamIdRef = useRef<string | null>(null);

  return {
    lobbyOrMeetingPage,
    setLobbyOrMeetingPage,
    leftTheRoom,
    setLeftTheRoom,
    isJoining,
    setIsJoining,
    isWaitingApproval,
    setIsWaitingApproval,
    isPublished,
    setIsPublished,
    isPlayed,
    setIsPlayed,
    isPlayOnly,
    setIsPlayOnly,
    streamName,
    setStreamName,
    streamNameRef,
    publishStreamIdRef,
  };
};
