import { useState, useCallback } from 'react';
import { useGetRequest } from './useGetRequest';
import { usePostRequest } from './usePostRequest';
import { useDeleteRequest } from './useDeleteRequest';
import { authHeaders, getBackendConfig } from '../utils/conferenceConfig';

export interface ExternalStream {
  nodeState: string;
  subscribers: number;
  nodeRole: string;
  serverAddress: string;
  streamGuid: string;
  streamName: string;
  durationMs: number;
}

interface ExternalStreamsResponse {
  size: number;
  streams: ExternalStream[];
  page: number;
  totalCount: number;
}

export const useExternalStreams = (roomName: string, token: string) => {
  const { getData, loading: loadingStreams, error: errorStreams } = useGetRequest();
  const { postData, loading: addingStream, error: errorAdding } = usePostRequest();
  const { deleteData, loading: removingStream, error: errorRemoving } = useDeleteRequest();
  const [streams, setStreams] = useState<ExternalStream[]>([]);

  const fetchStreams = useCallback(async () => {
    const backendConfig = getBackendConfig();
    const url = `${backendConfig.host}${backendConfig.apiEndpoints.getExternalStreams}`;
    try {
      const data = await getData<ExternalStreamsResponse>(url, { headers: authHeaders(token) });
      setStreams(data.streams || []);
      return data.streams;
    } catch (error) {
      console.error('Failed to fetch external streams:', error);
      throw error;
    }
  }, [getData, token]);

  const addToRoom = useCallback(
    async (streamName: string) => {
      const backendConfig = getBackendConfig();
      const url = `${backendConfig.host}${backendConfig.apiEndpoints.addExternalStream}`
        .replace('{roomName}', roomName)
        .replace('{streamId}', streamName);
      try {
        await postData(url, {}, { headers: authHeaders(token) });
      } catch (error) {
        console.error('Failed to add external stream to room:', error);
        throw error;
      }
    },
    [postData, roomName, token],
  );

  const removeFromRoom = useCallback(
    async (streamName: string) => {
      const backendConfig = getBackendConfig();
      const url = `${backendConfig.host}${backendConfig.apiEndpoints.removeExternalStream}`
        .replace('{roomName}', roomName)
        .replace('{streamId}', streamName);
      try {
        await deleteData(url, { headers: authHeaders(token) });
      } catch (error) {
        console.error('Failed to remove external stream from room:', error);
        throw error;
      }
    },
    [deleteData, roomName, token],
  );

  return {
    streams,
    fetchStreams,
    addToRoom,
    removeFromRoom,
    loading: loadingStreams || addingStream || removingStream,
    error: errorStreams || errorAdding || errorRemoving,
  };
};
