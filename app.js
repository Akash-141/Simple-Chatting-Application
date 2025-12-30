// WebSocket connections
let wsServer = null;
let wsClient = null;
let connectionType = 'tcp';
let waitingForReplyServer = false;
let waitingForReplyClient = false;

// DOM elements
const configPanel = document.getElementById('configPanel');
const dualChatPanel = document.getElementById('dualChatPanel');
const controlsFooter = document.getElementById('controlsFooter');
const connectionTypeSelect = document.getElementById('connectionType');
const connectBtn = document.getElementById('connectBtn');
const disconnectBtn = document.getElementById('disconnectBtn');

// Server elements
const messageInputServer = document.getElementById('messageInputServer');
const sendBtnServer = document.getElementById('sendBtnServer');
const chatMessagesServer = document.getElementById('chatMessagesServer');
const connectionInfoServer = document.getElementById('connectionInfoServer');
const statusIndicatorServer = document.getElementById('statusIndicatorServer');
const characterCounterServer = document.getElementById('characterCounterServer');

// Client elements
const messageInputClient = document.getElementById('messageInputClient');
const sendBtnClient = document.getElementById('sendBtnClient');
const chatMessagesClient = document.getElementById('chatMessagesClient');
const connectionInfoClient = document.getElementById('connectionInfoClient');
const statusIndicatorClient = document.getElementById('statusIndicatorClient');
const characterCounterClient = document.getElementById('characterCounterClient');

// Event Listeners
connectBtn.addEventListener('click', connectBoth);
disconnectBtn.addEventListener('click', disconnectBoth);
sendBtnServer.addEventListener('click', () => sendMessage('server'));
sendBtnClient.addEventListener('click', () => sendMessage('client'));

messageInputServer.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage('server');
    }
});

messageInputClient.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage('client');
    }
});

messageInputServer.addEventListener('input', () => updateCharacterCount('server'));
messageInputClient.addEventListener('input', () => updateCharacterCount('client'));

// Connect both server and client
function connectBoth() {
    connectionType = connectionTypeSelect.value;

    const port = connectionType === 'tcp' ? 8765 : 8766;
    const wsUrl = `ws://localhost:${port}`;

    // Connect Server
    try {
        wsServer = new WebSocket(wsUrl);

        wsServer.onopen = () => {
            console.log('Server WebSocket connected');
            wsServer.send(JSON.stringify({
                type: 'role_select',
                role: 'server'
            }));
            updateConnectionStatus('server', 'connected');
        };

        wsServer.onmessage = (event) => {
            const data = JSON.parse(event.data);
            handleMessage(data, 'server');
        };

        wsServer.onerror = (error) => {
            console.error('Server WebSocket error:', error);
            addSystemMessage('Server connection error', 'error', 'server');
        };

        wsServer.onclose = () => {
            console.log('Server WebSocket disconnected');
            updateConnectionStatus('server', 'disconnected');
        };

    } catch (error) {
        console.error('Failed to connect server:', error);
        alert('Failed to connect server. Make sure the server is running.');
        return;
    }

    // Connect Client
    try {
        wsClient = new WebSocket(wsUrl);

        wsClient.onopen = () => {
            console.log('Client WebSocket connected');
            wsClient.send(JSON.stringify({
                type: 'role_select',
                role: 'client'
            }));
            updateConnectionStatus('client', 'connected');
        };

        wsClient.onmessage = (event) => {
            const data = JSON.parse(event.data);
            handleMessage(data, 'client');
        };

        wsClient.onerror = (error) => {
            console.error('Client WebSocket error:', error);
            addSystemMessage('Client connection error', 'error', 'client');
        };

        wsClient.onclose = () => {
            console.log('Client WebSocket disconnected');
            updateConnectionStatus('client', 'disconnected');
        };

    } catch (error) {
        console.error('Failed to connect client:', error);
        alert('Failed to connect client. Make sure the server is running.');
        return;
    }

    // Show chat interface
    configPanel.style.display = 'none';
    dualChatPanel.classList.add('active');
    controlsFooter.classList.add('active');
}

// Disconnect both
function disconnectBoth() {
    if (wsServer) {
        wsServer.close();
        wsServer = null;
    }

    if (wsClient) {
        wsClient.close();
        wsClient = null;
    }

    dualChatPanel.classList.remove('active');
    controlsFooter.classList.remove('active');
    configPanel.style.display = 'block';

    chatMessagesServer.innerHTML = '';
    chatMessagesClient.innerHTML = '';
    messageInputServer.value = '';
    messageInputClient.value = '';

    waitingForReplyServer = false;
    waitingForReplyClient = false;

    updateInputState('server');
    updateInputState('client');
}

// Send message
function sendMessage(role) {
    const messageInput = role === 'server' ? messageInputServer : messageInputClient;
    const ws = role === 'server' ? wsServer : wsClient;
    const waitingForReply = role === 'server' ? waitingForReplyServer : waitingForReplyClient;

    const message = messageInput.value.trim();

    if (!message) {
        return;
    }

    if (waitingForReply) {
        addSystemMessage('Please wait for a reply before sending another message', 'error', role);
        return;
    }

    // Check UDP character limit
    if (connectionType === 'udp' && message.length > 1000) {
        addSystemMessage('Message exceeds 1000 character limit for UDP', 'error', role);
        return;
    }

    if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({
            type: 'message',
            message: message
        }));

        messageInput.value = '';
        updateCharacterCount(role);

        if (role === 'server') {
            waitingForReplyServer = true;
        } else {
            waitingForReplyClient = true;
        }

        updateInputState(role);
    }
}

// Handle incoming messages
function handleMessage(data, role) {
    switch (data.type) {
        case 'connected':
            addSystemMessage(data.message, 'system', role);
            break;

        case 'role_confirmed':
            addSystemMessage(`Connected as ${data.role}`, 'system', role);
            addSystemMessage('Waiting for peer to connect...', 'system', role);

            const messageInput = role === 'server' ? messageInputServer : messageInputClient;
            const sendBtn = role === 'server' ? sendBtnServer : sendBtnClient;

            messageInput.disabled = false;
            sendBtn.disabled = false;
            updateInputState(role);
            break;

        case 'peer_connected':
            addSystemMessage(data.message, 'system', role);
            break;

        case 'message':
            if (data.sender === 'self') {
                addMessage(data.message, 'self', role);
            } else if (data.sender === 'peer') {
                addMessage(data.message, 'peer', role);

                if (role === 'server') {
                    waitingForReplyServer = false;
                } else {
                    waitingForReplyClient = false;
                }

                updateInputState(role);
            }

            // Show character count for UDP
            if (connectionType === 'udp' && data.length) {
                const chatMessages = role === 'server' ? chatMessagesServer : chatMessagesClient;
                const lastMessage = chatMessages.lastElementChild;
                if (lastMessage) {
                    const lengthInfo = document.createElement('div');
                    lengthInfo.style.fontSize = '11px';
                    lengthInfo.style.color = '#666';
                    lengthInfo.style.marginTop = '5px';
                    lengthInfo.textContent = `(${data.length} characters)`;
                    lastMessage.appendChild(lengthInfo);
                }
            }
            break;

        case 'info':
            addSystemMessage(data.message, 'system', role);
            break;

        case 'error':
            addSystemMessage(data.message, 'error', role);
            break;
    }
}

// Add message to chat
function addMessage(text, sender, role) {
    const chatMessages = role === 'server' ? chatMessagesServer : chatMessagesClient;

    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${sender}`;

    const label = document.createElement('div');
    label.className = 'message-label';
    label.textContent = sender === 'self' ? 'You' : 'Peer';

    const content = document.createElement('div');
    content.className = 'message-content';
    content.textContent = text;

    messageDiv.appendChild(label);
    messageDiv.appendChild(content);

    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Add system message
function addSystemMessage(text, type = 'system', role) {
    const chatMessages = role === 'server' ? chatMessagesServer : chatMessagesClient;

    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${type}`;

    const content = document.createElement('div');
    content.className = 'message-content';
    content.textContent = text;

    messageDiv.appendChild(content);

    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Update connection status
function updateConnectionStatus(role, status) {
    const connectionInfo = role === 'server' ? connectionInfoServer : connectionInfoClient;
    const statusIndicator = role === 'server' ? statusIndicatorServer : statusIndicatorClient;

    if (status === 'connected') {
        const typeText = connectionType.toUpperCase();
        const roleText = role.charAt(0).toUpperCase() + role.slice(1);
        connectionInfo.textContent = `${typeText} ${roleText}`;
        statusIndicator.classList.remove('disconnected');
    } else {
        connectionInfo.textContent = `${role.charAt(0).toUpperCase() + role.slice(1)} - Disconnected`;
        statusIndicator.classList.add('disconnected');
    }
}

// Update input state based on waiting status
function updateInputState(role) {
    const messageInput = role === 'server' ? messageInputServer : messageInputClient;
    const sendBtn = role === 'server' ? sendBtnServer : sendBtnClient;
    const waitingForReply = role === 'server' ? waitingForReplyServer : waitingForReplyClient;

    if (waitingForReply) {
        messageInput.placeholder = 'Waiting for peer to reply...';
        messageInput.disabled = true;
        sendBtn.disabled = true;
    } else {
        messageInput.placeholder = 'Type your message and press Enter...';
        messageInput.disabled = false;
        sendBtn.disabled = false;
        messageInput.focus();
    }
}

// Update character count
function updateCharacterCount(role) {
    const messageInput = role === 'server' ? messageInputServer : messageInputClient;
    const characterCounter = role === 'server' ? characterCounterServer : characterCounterClient;

    const length = messageInput.value.length;

    if (connectionType === 'udp') {
        characterCounter.textContent = `${length} / 1000`;

        if (length > 1000) {
            characterCounter.classList.add('warning');
        } else {
            characterCounter.classList.remove('warning');
        }
    } else {
        characterCounter.textContent = `${length} / ∞`;
        characterCounter.classList.remove('warning');
    }
}

// Initialize character counter on connection type change
connectionTypeSelect.addEventListener('change', () => {
    connectionType = connectionTypeSelect.value;
    updateCharacterCount('server');
    updateCharacterCount('client');
});