import { useState } from 'react';

// Type definitions
export interface PostRequestOptions extends Omit<RequestInit, 'method' | 'body'> {
    headers?: Record<string, string>;
}

interface UsePostRequestReturn {
    postData: <T = any>(url: string, data: any, options?: PostRequestOptions) => Promise<T>;
    loading: boolean;
    error: string | null;
}

export const usePostRequest = (): UsePostRequestReturn => {
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    const postData = async <T = any>(
        url: string,
        data: any,
        options: PostRequestOptions = {}
    ): Promise<T> => {
        setLoading(true);
        setError(null);

        try {
            const result = await makePostRequest<T>(url, data, options);
            setLoading(false);
            return result;
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
            setError(errorMessage);
            setLoading(false);
            throw err;
        }
    };

    return { postData, loading, error };
};

export const makePostRequest = async <T = any>(
    url: string,
    data: any,
    options: PostRequestOptions = {}
): Promise<T> => {
    try {
        console.log('POST request:', {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            }
        });

        const { headers: customHeaders, ...otherOptions } = options;

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...customHeaders
            },
            body: JSON.stringify(data),
            ...otherOptions
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        return await response.json() as T;
    } catch (error) {
        console.error('POST request failed:', error);
        throw error;
    }
};