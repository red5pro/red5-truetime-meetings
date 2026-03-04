import { useState, useCallback } from 'react';

// Type definitions
export interface DeleteRequestOptions extends Omit<RequestInit, 'method'> {
    headers?: Record<string, string>;
}

interface UseDeleteRequestReturn {
    deleteData: <T = any>(url: string, options?: DeleteRequestOptions) => Promise<T>;
    loading: boolean;
    error: string | null;
}

export const useDeleteRequest = (): UseDeleteRequestReturn => {
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    const deleteData = useCallback(async <T = any>(
        url: string,
        options: DeleteRequestOptions = {}
    ): Promise<T> => {
        setLoading(true);
        setError(null);

        try {
            const response = await makeDeleteRequest<T>(url, options);
            setLoading(false);
            return response;
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
            setError(errorMessage);
            setLoading(false);
            throw err;
        }
    }, []);

    return { deleteData, loading, error };
};

export const makeDeleteRequest = async <T = any>(
    url: string,
    options: DeleteRequestOptions = {}
): Promise<T> => {
    try {
        const { headers: customHeaders, ...otherOptions } = options;

        const response = await fetch(url, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                ...customHeaders
            },
            ...otherOptions
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status} `);
        }

        // Handle empty responses
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.indexOf("application/json") !== -1) {
            return await response.json() as T;
        } else {
            return {} as T;
        }
    } catch (error) {
        console.error('DELETE request failed:', error);
        throw error;
    }
};
