// Chat UI Components
export { ChatLayoutProvider, useChatLayout, SIDEBAR_WIDTHS } from './ChatLayoutContext';
export { ChatLayoutShell } from './ChatLayoutShell';
export { ChatRightSidebar } from './ChatRightSidebar';
export { ChatMainArea } from './ChatMainArea';

// Extracted sub-components
export { MessageBubble, type ChatMessage } from './MessageBubble';
export { MessageList } from './MessageList';
export { VirtualizedMessageList } from './VirtualizedMessageList';
export { WelcomeCard } from './WelcomeCard';
export { ChatInput, type AttachedFile } from './ChatInput';

// Re-export types
export type { LeftSidebarState, RightSidebarState, Viewport } from './ChatLayoutContext';
