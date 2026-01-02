/**
 * Hooks Index
 * 
 * Re-exports all custom hooks for easy importing.
 */

// Chat-related hooks
export { useArtifacts, useArtifactsMutate } from './useArtifacts';
export { useChatStream, type ChatMessage } from './useChatStream';
export { useConversation } from './useConversation';
export { useIngestionStatus } from './useIngestionStatus';
export { useChatComposer } from './useChatComposer';

// Existing hooks
export { useIsMobile } from './use-mobile';
export { useToast, toast } from './use-toast';
export { useExamSession } from './useExamSession';
export { useExamTimer } from './useExamTimer';
export { useStudyPlanStatus } from './useStudyPlanStatus';
