'use client';

import { useEffect, useState } from 'react';
import { graphqlRequest } from '@/lib/api-client';

export function useGraphQLData<T>(
  query: string,
  variables?: Record<string, any>
) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let mounted = true;

    const fetchData = async () => {
      try {
        setLoading(true);
        const result = await graphqlRequest(query, variables);
        if (mounted) {
          setData(result as T);
          setError(null);
        }
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err : new Error('Unknown error'));
          setData(null);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    fetchData();

    return () => {
      mounted = false;
    };
  }, [query, JSON.stringify(variables || {})]);

  return { data, loading, error };
}
