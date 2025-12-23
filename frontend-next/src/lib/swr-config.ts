/**
 * SWR Configuration
 * 
 * Optimized SWR configurations for different data types.
 */

import { SWRConfiguration } from 'swr';

/**
 * Configuration for artifact data
 * - Less frequent revalidation since artifacts don't change often
 * - Keep previous data for smoother UX
 */
export const ARTIFACTS_SWR_CONFIG: SWRConfiguration = {
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
    dedupingInterval: 5000,
    keepPreviousData: true,
    errorRetryCount: 2,
};

/**
 * Configuration for conversation data
 * - Moderate revalidation
 * - Keep previous data during navigation
 */
export const CONVERSATIONS_SWR_CONFIG: SWRConfiguration = {
    revalidateOnFocus: false,
    revalidateOnReconnect: true,
    dedupingInterval: 10000,
    keepPreviousData: true,
    errorRetryCount: 3,
};

/**
 * Configuration for real-time data (chat messages)
 * - More aggressive revalidation
 */
export const REALTIME_SWR_CONFIG: SWRConfiguration = {
    revalidateOnFocus: true,
    revalidateOnReconnect: true,
    dedupingInterval: 2000,
    errorRetryCount: 3,
};

/**
 * Configuration for static resources
 * - Infrequent revalidation
 * - Long dedupe interval
 */
export const RESOURCES_SWR_CONFIG: SWRConfiguration = {
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
    dedupingInterval: 30000,
    keepPreviousData: true,
    errorRetryCount: 2,
};
