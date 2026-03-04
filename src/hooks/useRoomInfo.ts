import { useState, useEffect, useCallback, useRef } from 'react';
import { useGetRequest } from './useGetRequest';
import { getBackendConfig } from '../utils/conferenceConfig';

// Type definitions
interface User {
  uid: string;
  metaData?: string;
  role?: string;
  joinTime?: number;
  audioEnabled?: boolean;
  videoEnabled?: boolean;
}

interface RoomInfo {
  userCount: number;
  users: User[];
}

interface GetRequestOptions {
  headers?: Record<string, string>;
}

interface UseGetRequestReturn {
  getData: <T = any>(url: string, options?: GetRequestOptions) => Promise<T>;
  loading: boolean;
  error: string | null;
}

interface UseRoomInfoReturn {
  roomInfo: RoomInfo;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Custom hook to periodically fetch room information
 * @param roomName - The name of the room to fetch info for
 * @param intervalMs - Polling interval in milliseconds (default: 5000)
 * @param enabled - Whether polling is enabled (default: true)
 * @returns { roomInfo, loading, error, refetch }
 */
export const useRoomInfo = (
  roomName: string,
  intervalMs: number = 5000,
  enabled: boolean = true,
): UseRoomInfoReturn => {
  const { getData, loading, error }: UseGetRequestReturn = useGetRequest();
  const [roomInfo, setRoomInfo] = useState<RoomInfo>({ userCount: 0, users: [] });

  // Use ref to store latest getData function reference without triggering re-renders
  const getDataRef = useRef(getData);

  // Keep ref up to date
  useEffect(() => {
    getDataRef.current = getData;
  }, [getData]);

  const fetchRoomInfo = useCallback(async (): Promise<void> => {
    if (!roomName) return;

    try {
      const token = localStorage.getItem('token');

      const backendConfig = getBackendConfig();
      /**
       * The `getRoomUsers` endpoint contains a placeholder `{roomName}` which needs to be replaced
       * with the actual room name.
       */
      const url = `${backendConfig.host}${backendConfig.apiEndpoints.getRoomUsers.replace('{roomName}', roomName)}`;

      const response = await getDataRef.current<any>(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      // The API returns { userCount, users: [...] } directly.
      // Normalize the response to ensure we always have the correct shape.
      if (response && typeof response.userCount === 'number' && Array.isArray(response.users)) {
        const filteredUsers = response.users.filter(
          (user: User) => user.metaData !== 'external-stream',
        );
        response.userCount = filteredUsers.length;
        setRoomInfo({ ...response, users: filteredUsers } as RoomInfo);
      } else {
        setRoomInfo(response || { userCount: 0, users: [] });
      }
    } catch (err) {
      console.error('Failed to fetch room info:', err);
      setRoomInfo({ userCount: 0, users: [] });
    }
  }, [roomName]);

  useEffect(() => {
    if (!enabled || !roomName) return;

    fetchRoomInfo(); // initial fetch

    const intervalId = setInterval(fetchRoomInfo, intervalMs);
    return () => clearInterval(intervalId);
  }, [enabled, roomName, fetchRoomInfo, intervalMs]);

  return {
    roomInfo,
    loading,
    error,
    refetch: fetchRoomInfo,
  };
};
