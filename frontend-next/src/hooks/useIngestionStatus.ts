import useSWR from 'swr';
import { aiTutorService } from '@/services/aiTutorService';
import { useUser } from '@/context/UserContext';

const INGESTION_POLL_INTERVAL = 3000; // 3 seconds

interface IngestionStatusMap {
    [id: string]: 'pending' | 'processing' | 'completed' | 'failed';
}

export function useIngestionStatus(resourceIds: string[]) {
    const { user } = useUser();

    // Only poll if we have IDs
    const shouldPoll = resourceIds.length > 0;

    const { data, error } = useSWR<IngestionStatusMap>(
        shouldPoll ? ['ingestion-status', ...resourceIds] : null,
        async () => {
            const results = await Promise.all(
                resourceIds.map(async (id) => {
                    try {
                        const res = await aiTutorService.getResource(id);
                        return { id, status: res.ingestionStatus };
                    } catch (e) {
                        return { id, status: 'failed' };
                    }
                })
            );

            // Convert to map
            return results.reduce((acc, curr) => {
                acc[curr.id] = curr.status as any;
                return acc;
            }, {} as IngestionStatusMap);
        },
        {
            // Dynamic polling: If any item is pending/processing, keep polling
            refreshInterval: (data) => {
                if (!data) return INGESTION_POLL_INTERVAL;
                const anyPending = Object.values(data).some(
                    s => s === 'pending' || s === 'processing'
                );
                return anyPending ? INGESTION_POLL_INTERVAL : 0;
            },
            revalidateOnFocus: true,
            dedupingInterval: 1000,
        }
    );

    return {
        statuses: data || {},
        isPolling: !!data && Object.values(data).some(s => s === 'pending' || s === 'processing'),
        error
    };
}
