// dashboard.js

// --- State ---
const state = {
    userId: 'user-default', // TODO: Auth?
    sessionId: null, // Current Conversation ID (Database ID)
    resources: [], // Array of {id, title}
    isProcessing: false
};

// --- Elements ---
const DOM = {
    chatFeed: document.getElementById('chat-feed'),
    messageInput: document.getElementById('message-input'),
    sendBtn: document.getElementById('send-btn'),
    historyContainer: document.querySelector('.history-container'), // We'll target the 'Today' group for now
    dragOverlay: document.getElementById('drag-overlay'),
    fileInput: document.getElementById('file-upload'),
    resourceTray: document.getElementById('resource-tray'),
    newChatBtn: document.getElementById('new-chat-btn'),
    resourceList: document.getElementById('resources-list'),
    resourceSearch: document.getElementById('resource-search')
};

// --- Initialization ---
document.addEventListener('DOMContentLoaded', () => {
    init();
    setupEventListeners();
});

async function init() {
    await loadHistory();
    await searchResources(''); // Load initial resources
    // Start fresh
    resetView();
}

// --- Event Listeners ---
function setupEventListeners() {
    // Input Auto-Resize
    DOM.messageInput.addEventListener('input', function () {
        this.style.height = 'auto'; // Reset
        this.style.height = (this.scrollHeight) + 'px';

        if (this.value.trim().length > 0) {
            DOM.sendBtn.disabled = false;
        } else {
            DOM.sendBtn.disabled = true;
        }
    });

    // Send on Enter (Shift+Enter for newline)
    DOM.messageInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            if (!DOM.sendBtn.disabled) {
                handleSend();
            }
        }
    });

    DOM.sendBtn.addEventListener('click', handleSend);

    DOM.newChatBtn.addEventListener('click', () => {
        resetView();
    });

    // Drag & Drop
    // Drag & Drop
    let dragCounter = 0;

    document.addEventListener('dragenter', (e) => {
        e.preventDefault();
        dragCounter++;
        DOM.dragOverlay.classList.remove('hidden');
    });

    document.addEventListener('dragleave', (e) => {
        e.preventDefault();
        dragCounter--;
        if (dragCounter === 0) {
            DOM.dragOverlay.classList.add('hidden');
        }
    });

    document.addEventListener('dragover', (e) => {
        e.preventDefault();
    });

    document.addEventListener('drop', (e) => {
        e.preventDefault();
        dragCounter = 0;
        DOM.dragOverlay.classList.add('hidden');
        handleFiles(e.dataTransfer.files);
    });

    // File Input
    DOM.fileInput.addEventListener('change', (e) => {
        handleFiles(e.target.files);
    });

    // Resource Search
    DOM.resourceSearch.addEventListener('input', debounce((e) => {
        searchResources(e.target.value);
    }, 300));
}

// Debounce util
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// --- Core Logic ---

function resetView() {
    state.sessionId = null;
    state.resources = [];
    DOM.chatFeed.innerHTML = `
        <div class="empty-state">
            <h1>How can I help you today?</h1>
            <div class="capabilities">
                <div class="capability-card" onclick="setInput('Draft a technical implementation plan')">
                    <span class="material-icons-round">code</span>
                    <span>Draft a technical implementation plan</span>
                </div>
                <!-- Add other cards back if needed, kept simple for JS -->
            </div>
        </div>
    `;
    updateResourceTray();

    // Deselect history items
    document.querySelectorAll('.history-item').forEach(el => el.classList.remove('active'));
}

async function loadHistory() {
    try {
        const res = await fetch(`/conversations/user/${state.userId}`);
        const conversations = await res.json();

        // Clear existing items in the "Today" group (simplification)
        // ideally we grouped dates properly
        const group = document.querySelector('.history-group');
        // keep label, remove items
        const items = group.querySelectorAll('.history-item');
        items.forEach(i => i.remove());

        conversations.reverse().forEach(conv => {
            const el = document.createElement('a');
            el.className = 'history-item';
            el.textContent = conv.title || 'New Conversation';
            el.onclick = () => loadConversation(conv.id);
            el.dataset.id = conv.id;
            group.appendChild(el);
        });

    } catch (err) {
        console.error('Failed to load history', err);
    }
}

async function loadConversation(id) {
    state.sessionId = id;

    // UI Active State
    document.querySelectorAll('.history-item').forEach(el => el.classList.remove('active'));
    const activeEl = document.querySelector(`.history-item[data-id="${id}"]`);
    if (activeEl) activeEl.classList.add('active');

    // Fetch Details
    try {
        const res = await fetch(`/conversations/${id}`);
        const data = await res.json();

        // Render
        DOM.chatFeed.innerHTML = '';
        data.history.forEach(msg => {
            appendMessage(msg.role, msg.content, false, msg.attachments);
        });

    } catch (err) {
        console.error("Failed to load conversation", err);
    }
}

async function handleSend() {
    const content = DOM.messageInput.value.trim();
    if (!content || state.isProcessing) return;

    // 1. UI Updates
    DOM.messageInput.value = '';
    DOM.messageInput.style.height = 'auto'; // Reset height
    DOM.sendBtn.disabled = true;
    state.isProcessing = true;

    // Optimistic Render
    const currentResources = [...state.resources]; // Copy for processing
    appendMessage('user', content, false, currentResources);

    // 1.5 Process Pending Uploads (Save to DB now)
    const validResourceIds = [];

    for (const res of currentResources) {
        if (res.isNew) {
            try {
                const uploadRes = await fetch('/resources/', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        title: res.title,
                        type: res.type,
                        content: res.content
                    })
                });
                if (uploadRes.ok) {
                    const data = await uploadRes.json();
                    validResourceIds.push(data.id);
                } else {
                    console.error("Failed to save pending resource", res.title);
                }
            } catch (err) {
                console.error("Error saving resource", err);
            }
        } else {
            validResourceIds.push(res.id);
        }
    }

    // Refresh sidebar now that they are saved
    searchResources(DOM.resourceSearch.value || '');

    // 2. Ensure Session Exists
    if (!state.sessionId) {
        try {
            const res = await fetch('/conversations/', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: state.userId,
                    title: content.substring(0, 30) // Simple auto-title
                })
            });
            const data = await res.json();
            state.sessionId = data.id;

            // Refresh history to show new item
            loadHistory();

        } catch (err) {
            console.error("Failed to create session", err);
            state.isProcessing = false;
            return;
        }
    }

    // 3. Post User Message
    try {
        await fetch(`/conversations/${state.sessionId}/messages`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                role: 'user',
                content: content,
                attachmentIds: validResourceIds
            })
        });
    } catch (err) {
        console.error("Failed to save message", err);
    }

    // 4. Invoke Agent
    const aiMessageDiv = appendMessage('ai', '', true); // Empty container for streaming

    // Clear resources from tray after sending (they are now in the message)
    state.resources = [];
    updateResourceTray();

    try {
        const invokeRes = await fetch('/agent/invoke', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                session_id: `sess-${state.sessionId}`,
                user_id: state.userId,
                prompt: content,
                context_config: {
                    resource_ids: validResourceIds
                }
            })
        });

        const invokeData = await invokeRes.json();

        // Extract text response
        let aiText = "I'm sorry, I couldn't process that.";
        let tasks = [];
        let suggestions = [];

        if (invokeData.responses && invokeData.responses.length > 0) {
            aiText = invokeData.responses[0].content;
        }

        if (invokeData.proposedTasks) {
            tasks = invokeData.proposedTasks;
        }

        if (invokeData.suggestions) {
            suggestions = invokeData.suggestions;
        }

        // Simulate Streaming
        await typeText(aiMessageDiv.querySelector('.message-content'), aiText);

        // Render Tasks & Suggestions
        if (tasks.length > 0 || suggestions.length > 0) {
            renderRichContent(aiMessageDiv.querySelector('.message-content'), tasks, suggestions);
        }

        // Save AI Message to DB
        await fetch(`/conversations/${state.sessionId}/messages`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                role: 'assistant',
                content: aiText
            })
        });

    } catch (err) {
        aiMessageDiv.querySelector('.message-content').textContent = "Error invoking agent.";
        console.error(err);
    } finally {
        state.isProcessing = false;
    }
}

// --- Helpers ---

function appendMessage(role, text, isStreaming = false, attachments = []) {
    // Clear empty state if present
    const emptyState = document.querySelector('.empty-state');
    if (emptyState) emptyState.remove();

    const msgDiv = document.createElement('div');
    msgDiv.className = `message ${role}`;

    const avatar = document.createElement('div');
    avatar.className = 'message-avatar';
    avatar.innerHTML = role === 'user' ? '<span class="material-icons-round">person</span>' : '<span class="material-icons-round">smart_toy</span>';

    const content = document.createElement('div');
    content.className = 'message-content';

    if (!isStreaming) {
        // Render Markdown
        content.innerHTML = parseMarkdown(text);
    } else {
        // Cursor for streaming
        content.innerHTML = '<span class="cursor">|</span>';
    }

    // Render Attachments
    if (attachments && attachments.length > 0) {
        const attachContainer = document.createElement('div');
        attachContainer.className = 'message-attachments';

        attachments.forEach(att => {
            const card = document.createElement('div');
            card.className = 'attachment-card';
            card.innerHTML = `
                <span class="material-icons-round">description</span>
                <span>${att.title || 'Attachment'}</span>
            `;
            attachContainer.appendChild(card);
        });

        content.appendChild(attachContainer);
    }

    msgDiv.appendChild(avatar);
    msgDiv.appendChild(content);

    DOM.chatFeed.appendChild(msgDiv);
    scrollToBottom();

    return msgDiv;
}

function scrollToBottom() {
    DOM.chatFeed.scrollTop = DOM.chatFeed.scrollHeight;
}

function parseMarkdown(text) {
    // Basic wrapper for marked
    if (window.marked) {
        return window.marked.parse(text);
    }
    return text; // Fallback
}

// Typewriter effect
async function typeText(element, fullText) {
    const delay = 10; // ms per char
    element.innerHTML = ''; // Clear cursor

    // We'll append chunks to look like tokens
    // But since we want markdown to render correctly, we can't easily do partial markdown rendering 
    // without a sophisticated stream parser.
    // Compromise: We type plain text, then switch to markdown at the end? 
    // OR we just fade in the markdown block.
    // "Typewriter" for raw text is easier. For Markdown it's hard.

    // Let's try a hybrid: 
    // If it detects code blocks, it might break.
    // Simple approach: Split by words and append.

    const words = fullText.split(' ');
    let currentText = '';

    for (const word of words) {
        currentText += word + ' ';
        element.innerHTML = parseMarkdown(currentText);
        scrollToBottom();
        await new Promise(r => setTimeout(r, delay * 2)); // slight pause per word
    }

    // Final generic render to ensure everything is correct
    element.innerHTML = parseMarkdown(fullText);
}

// File Handling
async function handleFiles(files) {
    // Upload files to /resources/
    // This is "Mock" logic mostly as we need to support file upload endpoints.
    // But the requirement says "Resource Tray".

    for (const file of files) {
        try {
            let content;
            let type = 'document';

            // Simple check for text files
            if (file.type.startsWith('text/') || file.name.endsWith('.md') || file.name.endsWith('.txt')) {
                content = await file.text();
            } else {
                // For images, PDF, etc., convert to Base64
                content = await new Promise((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onload = () => resolve(reader.result);
                    reader.onerror = reject;
                    reader.readAsDataURL(file);
                });
                type = file.type.startsWith('image/') ? 'image' : 'file';
            }

            // Defer upload: Store in state directly
            state.resources.push({
                // Temporary ID or undefined ID indicates new
                isNew: true,
                title: file.name,
                type: type,
                content: content
            });

        } catch (err) {
            console.error("Failed to read " + file.name, err);
            alert(`Failed to read ${file.name}: ${err.message}`);
        }
    }
    updateResourceTray();

    // Do NOT refresh sidebar list here as per requirement
    // await searchResources(DOM.resourceSearch.value || '');
}

function updateResourceTray() {
    DOM.resourceTray.innerHTML = '';
    if (state.resources.length > 0) {
        DOM.resourceTray.classList.remove('hidden');
        state.resources.forEach((res, index) => {
            const chip = document.createElement('div');
            chip.className = 'resource-chip';
            chip.innerHTML = `
                <span class="material-icons-round">description</span>
                <span>${res.title}</span>
                <span class="material-icons-round remove-btn" onclick="removeResource(${index})">close</span>
            `;
            DOM.resourceTray.appendChild(chip);
        });
    } else {
        DOM.resourceTray.classList.add('hidden');
    }
}

// Global scope for onclicks
window.setInput = (text) => {
    DOM.messageInput.value = text;
    DOM.messageInput.style.height = 'auto';
    DOM.messageInput.style.height = DOM.messageInput.scrollHeight + 'px';
    DOM.sendBtn.disabled = false;
    DOM.messageInput.focus();
};


window.removeResource = (index) => {
    state.resources.splice(index, 1);
    updateResourceTray();
};

window.toggleAccordion = (id) => {
    const item = document.getElementById(id);
    if (!item) return;

    // Optional: Auto-collapse others (exclusive accordion)
    // For specific UI feel, let's make it exclusive so only one is big at a time
    const allItems = document.querySelectorAll('.accordion-item');
    allItems.forEach(el => {
        if (el.id !== id) {
            el.classList.remove('active');
            const icon = el.querySelector('.arrow-icon');
            if (icon) icon.textContent = 'chevron_right';
        }
    });

    // Toggle clicked
    const isActive = item.classList.contains('active');
    if (isActive) {
        // Don't allow collapsing the last one? Or allow?
        // Let's allow but maybe it looks weird if both empty. 
        // Let's just toggle.
        // Actually, if we enforce one open, we just ensure 'add' and don't toggle off if already active
        // But user might want to minimize side.
        // Let's do standard toggle.
        item.classList.remove('active');
        const icon = item.querySelector('.arrow-icon');
        if (icon) icon.textContent = 'chevron_right';
    } else {
        item.classList.add('active');
        const icon = item.querySelector('.arrow-icon');
        if (icon) icon.textContent = 'expand_more';
    }
};

// --- Resource Logic ---

async function searchResources(query) {
    try {
        const res = await fetch(`/resources/search?q=${encodeURIComponent(query)}`);
        const resources = await res.json();
        renderResourceList(resources);
    } catch (err) {
        console.error('Failed to search resources', err);
    }
}

function renderResourceList(resources) {
    DOM.resourceList.innerHTML = '';

    if (!resources || resources.length === 0) {
        DOM.resourceList.innerHTML = `
            <div class="empty-resources">
                <span>No resources found</span>
            </div>`;
        return;
    }

    resources.forEach(r => {
        const item = document.createElement('div');
        item.className = 'history-item resource-item'; // Reuse history item style for list
        item.style.display = 'flex';
        item.style.alignItems = 'center';
        item.style.justifyContent = 'space-between';

        const titleSpan = document.createElement('span');
        titleSpan.textContent = r.title;
        titleSpan.style.overflow = 'hidden';
        titleSpan.style.textOverflow = 'ellipsis';
        titleSpan.style.whiteSpace = 'nowrap';
        titleSpan.style.flex = '1';

        const actionsDiv = document.createElement('div');
        actionsDiv.style.display = 'flex';
        actionsDiv.style.gap = '4px';

        // Summary Button
        const summaryBtn = document.createElement('span');
        summaryBtn.className = 'material-icons-round';
        summaryBtn.textContent = 'info';
        summaryBtn.style.fontSize = '16px';
        summaryBtn.style.cursor = 'pointer';
        summaryBtn.style.color = 'var(--text-secondary)';
        summaryBtn.title = 'View Summary';
        summaryBtn.onclick = (e) => { e.stopPropagation(); viewSummary(r.id); };

        // Add Button
        const addBtn = document.createElement('span');
        addBtn.className = 'material-icons-round';
        addBtn.textContent = 'add_circle';
        addBtn.style.fontSize = '16px';
        addBtn.style.cursor = 'pointer';
        addBtn.style.color = 'var(--text-secondary)';
        addBtn.title = 'Add to Chat';
        addBtn.onclick = (e) => { e.stopPropagation(); addToChat(r); };

        actionsDiv.appendChild(summaryBtn);
        actionsDiv.appendChild(addBtn);

        item.appendChild(titleSpan);
        item.appendChild(actionsDiv);

        DOM.resourceList.appendChild(item);
    });
}

async function viewSummary(id) {
    try {
        const res = await fetch(`/resources/${id}/summary`);
        const data = await res.json();
        if (data.summary) {
            alert(`Summary:\n${data.summary}`); // Simple alert for now as per plan
        } else {
            alert('No summary available.');
        }
    } catch (err) {
        console.error('Failed to get summary', err);
    }
}

function addToChat(resource) {
    // Check duplicates
    const exists = state.resources.find(r => r.id === resource.id);
    if (exists) {
        // Provide feedback?
        // Flash the tray or alert?
        console.log("Resource already in tray");
        return;
    }

    state.resources.push({
        id: resource.id,
        title: resource.title
    });
    updateResourceTray();

    // Auto-open tray if hidden? updateResourceTray handles it.
}



function renderRichContent(container, tasks, suggestions) {
    const richContainer = document.createElement('div');
    richContainer.className = 'rich-content';

    // Tasks
    if (tasks && tasks.length > 0) {
        const taskGroup = document.createElement('div');
        taskGroup.className = 'task-group';
        taskGroup.innerHTML = '<h4>Proposed Tasks</h4>';

        tasks.forEach(t => {
            const taskEl = document.createElement('div');
            taskEl.className = 'task-card';
            taskEl.innerHTML = `
                <div class="task-header">
                    <span class="material-icons-round">check_circle_outline</span>
                    <span class="task-title">${t.title}</span>
                </div>
                <div class="task-desc">${t.description}</div>
            `;
            taskGroup.appendChild(taskEl);
        });
        richContainer.appendChild(taskGroup);
    }

    // Suggestions
    if (suggestions && suggestions.length > 0) {
        const suggestGroup = document.createElement('div');
        suggestGroup.className = 'suggestion-group';

        suggestions.forEach(s => {
            const btn = document.createElement('button');
            btn.className = 'suggestion-btn';
            btn.textContent = s.text;
            btn.onclick = () => setInput(s.text);
            suggestGroup.appendChild(btn);
        });
        richContainer.appendChild(suggestGroup);
    }

    container.appendChild(richContainer);
    scrollToBottom();
}
