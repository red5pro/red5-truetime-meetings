import { useState, useCallback } from 'react';
import log from 'loglevel';
import { getBackendConfig } from '../utils/conferenceConfig';

interface TranscriptionEntry {
    text: string;
    timestamp: number;
    metadata: string;
    receivedAt: number;
}

interface TranscriptionResponse {
    lastUpdated: number;
    userCount: number;
    filterEndTime: number;
    filterStartTime: number;
    totalTranscriptionCount: number;
    transcriptionsByUser: Record<string, TranscriptionEntry[]>;
    roomId: string;
}

interface UseTranscriptionReturn {
    fetchTranscriptions: (startTime: number, endTime: number) => Promise<TranscriptionResponse | null>;
    loading: boolean;
    error: string | null;
    data: TranscriptionResponse | null;
    clearData: () => void;
}

export const useTranscription = (roomId: string, token: string): UseTranscriptionReturn => {
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [data, setData] = useState<TranscriptionResponse | null>(null);

    const fetchTranscriptions = useCallback(async (startTime: number, endTime: number): Promise<TranscriptionResponse | null> => {
        if (!roomId) {
            setError('Room ID is missing');
            return null;
        }

        setLoading(true);
        setError(null);

        try {
            const backendConfig = getBackendConfig();
            const baseUrl = `${backendConfig.host}${backendConfig.apiEndpoints.transcription.replace('{roomName}', roomId)}`;
            const url = `${baseUrl}?startTime=${startTime}&endTime=${endTime}`;

            log.log(`Fetching transcriptions from: ${url}`);

            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();
            setData(result);
            return result;
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to fetch transcriptions';
            log.error('Error fetching transcriptions:', err);
            setError(errorMessage);
            return null;
        } finally {
            setLoading(true); // Wait, I should set it to false
            setLoading(false);
        }
    }, [roomId, token]);

    const clearData = useCallback(() => {
        setData(null);
        setError(null);
    }, []);

    return {
        fetchTranscriptions,
        loading,
        error,
        data,
        clearData
    };
};
