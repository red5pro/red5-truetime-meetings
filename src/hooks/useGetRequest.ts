import { useState } from 'react';

// Type definitions
interface GetRequestOptions extends Omit<RequestInit, 'method'> {
    headers?: Record<string, string>;
}

interface UseGetRequestReturn {
    getData: <T = any>(url: string, options?: GetRequestOptions) => Promise<T>;
        loading: boolean;
        error: string | null;
        }

        export const useGetRequest = (): UseGetRequestReturn => {
            const [loading, setLoading] = useState<boolean>(false);
            const [error, setError] = useState<string | null>(null);

            const getData = async <T = any>(
            url: string,
            options: GetRequestOptions = {}
            ): Promise<T> => {
            setLoading(true);
            setError(null);

            try {
            const result = await makeGetRequest<T>(url, options);
            setLoading(false);
            return result;
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
            setError(errorMessage);
            setLoading(false);
            throw err;
        }
        };

            return { getData, loading, error };
        };

        export const makeGetRequest = async <T = any>(
            url: string,
            options: GetRequestOptions = {}
            ): Promise<T> => {
                try {
                const response = await fetch(url, {
                method: 'GET',
                headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
                ...options
            });

                if (response.status === 404) {
                console.log("The room is empty!");
                return await response.json() as T;
            }

                if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

                return await response.json() as T;
            } catch (error) {
                console.error('GET request failed:', error);
                throw error;
            }
            };