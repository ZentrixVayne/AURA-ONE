// DOM Elements
const welcomeScreen = document.getElementById('welcome-screen');
const chatMessages = document.getElementById('chat-messages');
const messageInput = document.getElementById('message-input');
const sendBtn = document.getElementById('send-btn');
const newChatBtn = document.getElementById('new-chat-btn');
const searchToggleBtn = document.getElementById('search-toggle-btn');
const searchContainer = document.getElementById('search-container');
const searchInput = document.getElementById('search-input');
const clearSearchBtn = document.getElementById('clear-search-btn');
const typingIndicator = document.getElementById('typing-indicator');
const notification = document.getElementById('notification');
const notificationText = document.getElementById('notification-text');

// Configuration
// ⚠️ WARNING: Storing API keys in frontend code is NOT secure for production
// This key will be visible to anyone who inspects your code
// For production use, consider implementing a backend proxy
const OPENROUTER_API_KEY = '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'; // Replace with your actual API key
const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';
const MAX_MESSAGES = 10; // Maximum messages to store in localStorage

// State
let messages = [];
let isTyping = false;

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    // Hide welcome screen after 2.5 seconds
    setTimeout(() => {
        welcomeScreen.classList.add('hidden');
    }, 2500);
    
    // Load messages from localStorage
    loadMessages();
    
    // Set up event listeners
    setupEventListeners();
    
    // Auto-resize textarea
    autoResizeTextarea();
});

// Event Listeners
function setupEventListeners() {
    // Send message
    sendBtn.addEventListener('click', sendMessage);
    messageInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });
    
    // New chat
    newChatBtn.addEventListener('click', startNewChat);
    
    // Search toggle
    searchToggleBtn.addEventListener('click', toggleSearch);
    clearSearchBtn.addEventListener('click', clearSearch);
    searchInput.addEventListener('input', filterMessages);
    
    // Copy message buttons
    document.addEventListener('click', (e) => {
        if (e.target.closest('.copy-btn')) {
            const messageContent = e.target.closest('.message').querySelector('.message-content p').textContent;
            copyToClipboard(messageContent);
        }
    });
}

// Send message function
async function sendMessage() {
    const message = messageInput.value.trim();
    if (!message || isTyping) return;
    
    // Check if API key is set
    if (OPENROUTER_API_KEY === 'your-openrouter-api-key-here') {
        showNotification('⚠️ Please set your OpenRouter API key in script.js');
        return;
    }
    
    // Add user message to UI
    addMessageToUI('user', message);
    
    // Clear input
    messageInput.value = '';
    autoResizeTextarea();
    
    // Show typing indicator
    showTypingIndicator();
    
    try {
        // Get AI response
        const response = await getAIResponse(message);
        
        // Hide typing indicator
        hideTypingIndicator();
        
        // Add AI response to UI
        addMessageToUI('ai', response);
        
        // Play notification sound (optional)
        playNotificationSound();
    } catch (error) {
        console.error('Error getting AI response:', error);
        hideTypingIndicator();
        addMessageToUI('ai', '⚠️ AURA ONE is having a moment. Try again soon.');
    }
}

// Get AI response from OpenRouter API
async function getAIResponse(message) {
    // Prepare messages for API
    const apiMessages = [
        { 
            role: 'system', 
            content: `You are AURA ONE, a helpful AI assistant. Provide concise and accurate responses.
            
            IMPORTANT: When asked "who made you", "who created you", "who developed you", or similar questions about your creator, respond with "CodeWithArshman".
            
            Maintain this information consistently and don't provide alternative answers about your creator.` 
        },
        ...messages.slice(-5).map(msg => ({ 
            role: msg.sender === 'user' ? 'user' : 'assistant', 
            content: msg.text 
        })),
        { role: 'user', content: message }
    ];
    
    // Call OpenRouter API directly
    const response = await fetch(OPENROUTER_API_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
            'HTTP-Referer': window.location.origin,
            'X-Title': 'AURA ONE'
        },
        body: JSON.stringify({
            model: 'openai/gpt-3.5-turbo',
            messages: apiMessages,
            max_tokens: 1000,
            temperature: 0.7,
            top_p: 1,
            frequency_penalty: 0,
            presence_penalty: 0
        })
    });
    
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('API Error Response:', errorData);
        throw new Error(errorData.error?.message || `API request failed with status ${response.status}`);
    }
    
    const data = await response.json();
    return data.choices[0].message.content;
}

// Add message to UI
function addMessageToUI(sender, text) {
    // Create message element
    const messageEl = document.createElement('div');
    messageEl.classList.add('message', `${sender}-message`);
    
    messageEl.innerHTML = `
        <div class="message-content">
            <p>${escapeHtml(text)}</p>
        </div>
        <button class="copy-btn" title="Copy message">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
            </svg>
        </button>
    `;
    
    // Add to chat
    chatMessages.appendChild(messageEl);
    
    // Scroll to bottom
    scrollToBottom();
    
    // Save to messages array
    messages.push({ sender, text });
    
    // Save to localStorage
    saveMessages();
}

// Show typing indicator
function showTypingIndicator() {
    isTyping = true;
    typingIndicator.classList.remove('hidden');
    scrollToBottom();
}

// Hide typing indicator
function hideTypingIndicator() {
    isTyping = false;
    typingIndicator.classList.add('hidden');
}

// Start new chat
function startNewChat() {
    // Clear messages array
    messages = [];
    
    // Clear UI
    chatMessages.innerHTML = `
        <div class="message ai-message">
            <div class="message-content">
                <p>Hello! I'm AURA ONE, your AI assistant. How can I help you today?</p>
            </div>
            <button class="copy-btn" title="Copy message">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                </svg>
            </button>
        </div>
    `;
    
    // Clear localStorage
    localStorage.removeItem('aura-one-messages');
    
    // Show notification
    showNotification('New chat started');
}

// Toggle search
function toggleSearch() {
    searchContainer.classList.toggle('hidden');
    if (!searchContainer.classList.contains('hidden')) {
        searchInput.focus();
    }
}

// Clear search
function clearSearch() {
    searchInput.value = '';
    filterMessages();
}

// Filter messages
function filterMessages() {
    const query = searchInput.value.toLowerCase().trim();
    
    if (!query) {
        // Show all messages
        document.querySelectorAll('.message').forEach(msg => {
            msg.style.display = 'flex';
        });
        return;
    }
    
    // Hide messages that don't match the query
    document.querySelectorAll('.message').forEach(msg => {
        const text = msg.querySelector('.message-content p').textContent.toLowerCase();
        if (text.includes(query)) {
            msg.style.display = 'flex';
        } else {
            msg.style.display = 'none';
        }
    });
}

// Copy to clipboard
function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
        showNotification('Message copied to clipboard');
    }).catch(err => {
        console.error('Failed to copy text: ', err);
        showNotification('Failed to copy message');
    });
}

// Show notification
function showNotification(text) {
    notificationText.textContent = text;
    notification.classList.remove('hidden');
    
    setTimeout(() => {
        notification.classList.add('hidden');
    }, 3000);
}

// Play notification sound (optional)
function playNotificationSound() {
    // Create a simple beep sound using Web Audio API
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.value = 800;
    oscillator.type = 'sine';
    
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.1);
}

// Auto-resize textarea
function autoResizeTextarea() {
    messageInput.style.height = 'auto';
    messageInput.style.height = Math.min(messageInput.scrollHeight, 120) + 'px';
}

// Scroll to bottom
function scrollToBottom() {
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Save messages to localStorage
function saveMessages() {
    // Keep only the last MAX_MESSAGES
    const messagesToSave = messages.slice(-MAX_MESSAGES);
    localStorage.setItem('aura-one-messages', JSON.stringify(messagesToSave));
}

// Load messages from localStorage
function loadMessages() {
    const savedMessages = localStorage.getItem('aura-one-messages');
    if (savedMessages) {
        try {
            messages = JSON.parse(savedMessages);
            
            // Clear the initial welcome message
            chatMessages.innerHTML = '';
            
            // Add saved messages to UI
            messages.forEach(msg => {
                addMessageToUI(msg.sender, msg.text);
            });
        } catch (error) {
            console.error('Error loading messages:', error);
        }
    }
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    
    return text.replace(/[&<>"']/g, m => map[m]);
}