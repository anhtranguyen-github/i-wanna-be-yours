import { useState, useCallback, useEffect } from 'react';
import { AttachedFile } from '@/components/chat/ChatInput';
import { aiTutorService } from '@/services/aiTutorService';
import { useNotification } from '@/context/NotificationContext';

const ALLOWED_EXTENSIONS = ['.pdf', '.txt', '.png', '.jpg', '.jpeg', '.docx'];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

interface UseChatComposerProps {
    conversationId: string | null;
    isGuest?: boolean;
    onAuthRequired?: () => void;
}

export function useChatComposer({ conversationId, isGuest = false, onAuthRequired }: UseChatComposerProps) {
    const [inputValue, setInputValue] = useState('');
    const [attachedFiles, setAttachedFiles] = useState<AttachedFile[]>([]);
    const { addNotification } = useNotification();

    // Draft persistence
    useEffect(() => {
        if (!conversationId) {
            setInputValue('');
            return;
        }
        const draft = localStorage.getItem(`chat_draft_${conversationId}`);
        if (draft) setInputValue(draft);
    }, [conversationId]);

    useEffect(() => {
        if (!conversationId) return;
        if (!inputValue) {
            localStorage.removeItem(`chat_draft_${conversationId}`);
            return;
        }
        const handler = setTimeout(() => {
            localStorage.setItem(`chat_draft_${conversationId}`, inputValue);
        }, 500);
        return () => clearTimeout(handler);
    }, [conversationId, inputValue]);

    const handleFileUpload = async (files: File[]) => {
        if (isGuest) {
            onAuthRequired?.();
            return;
        }

        const validFiles: File[] = [];

        for (const file of files) {
            const extension = '.' + file.name.split('.').pop()?.toLowerCase();
            if (!ALLOWED_EXTENSIONS.includes(extension)) {
                addNotification({
                    message: `File type ${extension} not supported. Allowed: ${ALLOWED_EXTENSIONS.join(', ')}`,
                    type: 'warning'
                });
                continue;
            }
            if (file.size > MAX_FILE_SIZE) {
                addNotification({
                    message: `File too large: ${file.name} exceeds 10MB limit.`,
                    type: 'warning'
                });
                continue;
            }
            validFiles.push(file);
        }

        if (validFiles.length === 0) return;

        // Optimistic UI
        const newAttachments: AttachedFile[] = validFiles.map(file => ({
            id: Math.random().toString(36).substr(2, 9),
            file,
            title: file.name,
            uploading: true
        }));

        setAttachedFiles(prev => [...prev, ...newAttachments]);

        // Upload in background
        for (const attached of newAttachments) {
            try {
                const result = await aiTutorService.uploadFile(attached.file!) as { id: string; ingestionStatus?: string };
                setAttachedFiles(prev => prev.map(f =>
                    f.id === attached.id
                        ? { ...f, uploading: false, backendId: result.id, ingestionStatus: (result.ingestionStatus || 'pending') as any }
                        : f
                ));
            } catch (error) {
                console.error(`Failed to upload ${attached.title}:`, error);
                setAttachedFiles(prev => prev.map(f =>
                    f.id === attached.id
                        ? { ...f, uploading: false, error: true }
                        : f
                ));
                addNotification({
                    message: `Failed to upload ${attached.title}`,
                    type: 'error'
                });
            }
        }
    };

    const removeFile = useCallback((id: string) => {
        setAttachedFiles(prev => prev.filter(f => f.id !== id));
    }, []);

    const reset = useCallback(() => {
        setInputValue('');
        setAttachedFiles([]);
        if (conversationId) localStorage.removeItem(`chat_draft_${conversationId}`);
    }, [conversationId]);

    return {
        inputValue,
        setInputValue,
        attachedFiles,
        handleFileUpload,
        removeFile,
        reset,
        hasActiveUploads: attachedFiles.some(f => f.uploading)
    };
}
