// --- DOM Elements ---
const chatForm = document.getElementById('chat-form');
const chatInput = document.getElementById('chat-input');
const chatContainer = document
  .getElementById('chat-container')
  .querySelector('.max-w-4xl');
const welcomeMessage = document.getElementById('welcome-message');
const menuBtn = document.getElementById('menu-btn');
const sidebar = document.getElementById('sidebar');
const overlay = document.getElementById('overlay');
const toolsBtn = document.getElementById('tools-btn');
const toolsPopup = document.getElementById('tools-popup');
const loadingScreen = document.getElementById('loading-screen');
const nameSetupModal = document.getElementById('name-setup-modal');
const userNameInput = document.getElementById('user-name-input');
const saveNameBtn = document.getElementById('save-name-btn');
const userAvatar = document.getElementById('user-avatar');
const userName = document.getElementById('user-name');
const newChatBtn = document.getElementById('new-chat-btn');
const mobileNewChatBtn = document.getElementById('mobile-new-chat-btn');
const chatHistory = document.getElementById('chat-history');
const mobileChatTitle = document.getElementById('mobile-chat-title');
const renameModal = document.getElementById('rename-modal');
const chatNameInput = document.getElementById('chat-name-input');
const cancelRenameBtn = document.getElementById('cancel-rename-btn');
const saveRenameBtn = document.getElementById('save-rename-btn');
const deleteModal = document.getElementById('delete-modal');
const cancelDeleteBtn = document.getElementById('cancel-delete-btn');
const confirmDeleteBtn = document.getElementById('confirm-delete-btn');

// File upload elements
const fileInput = document.getElementById('file-input');
const uploadFileBtn = document.getElementById('upload-file-btn');

// --- API Configuration ---
const OPENROUTER_API_KEY = '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'; // Your OpenRouter key
const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';
const SITE_URL = window.location.origin; // Your site URL
const SITE_NAME = 'AURA ONE'; // Your site name

// --- State Management ---
let conversationHistory = [];
let isTyping = false;
let currentChatId = null;
let chatSessions = [];
let currentUser = {
  name: 'Alex',
  initial: 'A'
};

// --- Audio Context for Typing Sound ---
let audioContext = null;

// --- Event Listeners ---
chatForm.addEventListener('submit', handleSendMessage);
chatInput.addEventListener('input', autoResizeTextarea);
chatInput.addEventListener('keydown', handleKeydown);
menuBtn.addEventListener('click', toggleSidebar);
overlay.addEventListener('click', toggleSidebar);
toolsBtn.addEventListener('click', toggleToolsPopup);
newChatBtn.addEventListener('click', startNewChat);
mobileNewChatBtn.addEventListener('click', startNewChat);
saveNameBtn.addEventListener('click', saveUserName);
cancelRenameBtn.addEventListener('click', closeRenameModal);
saveRenameBtn.addEventListener('click', saveChatName);
cancelDeleteBtn.addEventListener('click', closeDeleteModal);
confirmDeleteBtn.addEventListener('click', confirmDelete);

// File upload event listeners
if (uploadFileBtn) {
  uploadFileBtn.addEventListener('click', () => {
    fileInput.click();
  });
}

fileInput.addEventListener('change', (e) => {
  const files = Array.from(e.target.files);
  
  if (files.length === 0) return;
  
  // Create a new chat if needed
  if (!currentChatId) {
    startNewChat();
  }
  
  // Hide welcome message if visible
  if (welcomeMessage) {
    welcomeMessage.style.display = 'none';
  }
  
  // Process each file
  files.forEach(file => {
    processFile(file);
  });
  
  // Reset file input to allow selecting the same file again
  fileInput.value = '';
  
  // Scroll to bottom
  scrollToBottom();
});

// Close popup if clicking outside
document.addEventListener('click', (e) => {
  if (!toolsPopup.contains(e.target) && !toolsBtn.contains(e.target)) {
    hideToolsPopup();
  }
  
  // Close dropdown menus when clicking outside
  document.querySelectorAll('.dropdown-menu.show').forEach(menu => {
    if (!menu.parentElement.contains(e.target)) {
      menu.classList.remove('show');
    }
  });
});

// --- Functions ---

function toggleToolsPopup() {
  const isHidden = toolsPopup.classList.contains('opacity-0');
  if (isHidden) {
    toolsPopup.classList.remove('opacity-0', 'scale-95', 'pointer-events-none');
  } else {
    hideToolsPopup();
  }
}

function hideToolsPopup() {
  toolsPopup.classList.add('opacity-0', 'scale-95', 'pointer-events-none');
}

function toggleSidebar() {
  sidebar.classList.toggle('-translate-x-full');
  overlay.classList.toggle('hidden');
}

// Initialize the app
document.addEventListener('DOMContentLoaded', () => {
  // Initialize audio context
  audioContext = new (window.AudioContext || window.webkitAudioContext)();
  
  // Load user data
  loadUserData();
  
  // Load chat sessions
  loadChatSessions();
  
  // Create scroll down button
  createScrollDownButton();
  
  // Add feature coming soon overlay to image generation button
  const imageGenBtn = document.querySelector('.tools-popup button:first-child');
  if (imageGenBtn) {
    imageGenBtn.classList.add('feature-coming-soon');
    imageGenBtn.addEventListener('click', (e) => {
      e.preventDefault();
      showFeatureComingSoonToast('Image generation');
    });
  }
  
  // Simulate loading time
  setTimeout(() => {
    // Add fade animation to loading screen
    loadingScreen.classList.add('loading-screen-fade');
    
    // Check if user name is set
    if (!currentUser.name || currentUser.name === 'Alex') {
      setTimeout(() => {
        nameSetupModal.classList.remove('hidden');
        animateModalIn(nameSetupModal);
        userNameInput.focus();
      }, 500);
    } else {
      // Load the most recent chat or start a new one
      setTimeout(() => {
        if (chatSessions.length > 0) {
          loadChat(chatSessions[0].id);
        } else {
          startNewChat();
        }
      }, 500);
    }
  }, 1500);
});

function loadUserData() {
  const savedUser = localStorage.getItem('aura-one-user');
  if (savedUser) {
    try {
      currentUser = JSON.parse(savedUser);
      updateUserUI();
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  }
}

function saveUserData() {
  localStorage.setItem('aura-one-user', JSON.stringify(currentUser));
}

function updateUserUI() {
  userName.textContent = currentUser.name;
  userAvatar.textContent = currentUser.initial;
}

function saveUserName() {
  const name = userNameInput.value.trim();
  if (!name) return;
  
  // Add button press animation
  saveNameBtn.classList.add('button-press');
  setTimeout(() => saveNameBtn.classList.remove('button-press'), 200);
  
  currentUser.name = name;
  currentUser.initial = name.charAt(0).toUpperCase();
  
  saveUserData();
  updateUserUI();
  
  // Animate modal out
  animateModalOut(nameSetupModal).then(() => {
    nameSetupModal.classList.add('hidden');
    
    // Start a new chat after setting the name
    startNewChat();
  });
}

function loadChatSessions() {
  const savedSessions = localStorage.getItem('aura-one-sessions');
  if (savedSessions) {
    try {
      chatSessions = JSON.parse(savedSessions);
      renderChatHistory();
    } catch (error) {
      console.error('Error loading chat sessions:', error);
      chatSessions = [];
    }
  }
}

function saveChatSessions() {
  localStorage.setItem('aura-one-sessions', JSON.stringify(chatSessions));
}

function renderChatHistory() {
  chatHistory.innerHTML = '';
  
  chatSessions.forEach((session, index) => {
    const chatItem = document.createElement('div');
    chatItem.className = `chat-history-item ${session.id === currentChatId ? 'active' : ''}`;
    chatItem.dataset.chatId = session.id;
    
    // Add animation delay for staggered effect
    chatItem.style.animationDelay = `${index * 0.05}s`;
    
    const titleDiv = document.createElement('div');
    titleDiv.className = 'chat-history-item-title';
    titleDiv.textContent = session.title;
    
    // Create three dots menu
    const threeDotsMenu = document.createElement('div');
    threeDotsMenu.className = 'three-dots-menu';
    
    const threeDotsButton = document.createElement('button');
    threeDotsButton.className = 'three-dots-button';
    threeDotsButton.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5">
        <path stroke-linecap="round" stroke-linejoin="round" d="M12 6.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 12.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 18.75a.75.75 0 110-1.5.75.75 0 010 1.5z" />
      </svg>
    `;
    
    const dropdownMenu = document.createElement('div');
    dropdownMenu.className = 'dropdown-menu';
    
    const renameItem = document.createElement('div');
    renameItem.className = 'dropdown-menu-item';
    renameItem.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4">
        <path stroke-linecap="round" stroke-linejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125" />
      </svg>
      <span>Rename</span>
    `;
    renameItem.addEventListener('click', (e) => {
      e.stopPropagation();
      openRenameModal(session.id);
      dropdownMenu.classList.remove('show');
    });
    
    const deleteItem = document.createElement('div');
    deleteItem.className = 'dropdown-menu-item delete';
    deleteItem.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4">
        <path stroke-linecap="round" stroke-linejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
      </svg>
      <span>Delete</span>
    `;
    deleteItem.addEventListener('click', (e) => {
      e.stopPropagation();
      openDeleteModal(session.id);
      dropdownMenu.classList.remove('show');
    });
    
    dropdownMenu.appendChild(renameItem);
    dropdownMenu.appendChild(deleteItem);
    
    threeDotsButton.addEventListener('click', (e) => {
      e.stopPropagation();
      // Close all other dropdowns first
      document.querySelectorAll('.dropdown-menu.show').forEach(menu => {
        if (menu !== dropdownMenu) {
          menu.classList.remove('show');
        }
      });
      dropdownMenu.classList.toggle('show');
    });
    
    threeDotsMenu.appendChild(threeDotsButton);
    threeDotsMenu.appendChild(dropdownMenu);
    
    chatItem.appendChild(titleDiv);
    chatItem.appendChild(threeDotsMenu);
    
    chatItem.addEventListener('click', () => {
      loadChat(session.id);
    });
    
    chatHistory.appendChild(chatItem);
  });
}

function generateChatId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

function startNewChat() {
  // Add button press animation
  if (event && event.currentTarget) {
    event.currentTarget.classList.add('button-press');
    setTimeout(() => event.currentTarget.classList.remove('button-press'), 200);
  }
  
  const chatId = generateChatId();
  const newSession = {
    id: chatId,
    title: 'New Chat',
    messages: [],
    createdAt: new Date().toISOString()
  };
  
  chatSessions.unshift(newSession);
  saveChatSessions();
  renderChatHistory();
  
  loadChat(chatId);
}

function loadChat(chatId) {
  const session = chatSessions.find(s => s.id === chatId);
  if (!session) return;
  
  currentChatId = chatId;
  conversationHistory = session.messages || [];
  
  // Update UI
  mobileChatTitle.textContent = session.title;
  
  // Clear chat container
  chatContainer.innerHTML = '';
  
  // Hide welcome message
  if (welcomeMessage) {
    welcomeMessage.style.display = 'none';
  }
  
  // Add messages to UI
  conversationHistory.forEach(msg => {
    if (msg.type === 'file') {
      // Recreate file message from stored data
      const fileMessage = document.createElement('div');
      fileMessage.className = 'file-message';
      
      // Add user avatar
      const avatar = document.createElement('div');
      avatar.className = 'file-message-avatar bg-blue-600 text-white';
      avatar.textContent = currentUser.initial;
      
      // Add file content
      const content = document.createElement('div');
      content.className = 'file-message-content';
      
      const isImage = msg.fileType.startsWith('image/');
      
      if (isImage) {
        // For images, create an image element
        const image = document.createElement('img');
        image.src = msg.fileData;
        image.alt = msg.fileName;
        image.className = 'file-message-image';
        
        // Add click event to open image in modal
        image.addEventListener('click', () => openImageModal(msg.fileData, msg.fileName));
        
        content.appendChild(image);
      } else {
        // For other files, create a document element
        const document = document.createElement('div');
        document.className = 'file-message-document';
        
        // Add file icon
        const icon = document.createElement('div');
        icon.className = 'file-message-document-icon';
        icon.innerHTML = `
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6">
            <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
          </svg>
        `;
        
        // Add file info
        const info = document.createElement('div');
        info.className = 'file-message-document-info';
        
        const name = document.createElement('div');
        name.className = 'file-message-document-name';
        name.textContent = msg.fileName;
        
        const size = document.createElement('div');
        size.className = 'file-message-document-size';
        size.textContent = formatFileSize(msg.fileSize);
        
        info.appendChild(name);
        info.appendChild(size);
        
        // Add download button
        const download = document.createElement('a');
        download.href = msg.fileData;
        download.download = msg.fileName;
        download.className = 'file-message-document-download';
        download.innerHTML = `
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
          </svg>
        `;
        
        document.appendChild(icon);
        document.appendChild(info);
        document.appendChild(download);
        
        content.appendChild(document);
      }
      
      // Add timestamp
      const timestamp = document.createElement('div');
      timestamp.className = 'text-xs text-gray-500 mt-2';
      timestamp.textContent = new Date().toLocaleTimeString();
      
      fileMessage.appendChild(avatar);
      fileMessage.appendChild(content);
      fileMessage.appendChild(timestamp);
      
      // Add to chat container
      chatContainer.appendChild(fileMessage);
    } else {
      // Regular text message
      appendMessage(msg.content, msg.role, false);
    }
  });
  
  // Update active state in sidebar
  document.querySelectorAll('.chat-history-item').forEach(item => {
    item.classList.remove('active');
    if (item.dataset.chatId === chatId) {
      item.classList.add('active');
    }
  });
  
  // Close sidebar on mobile
  if (window.innerWidth < 768) {
    sidebar.classList.add('-translate-x-full');
    overlay.classList.add('hidden');
  }
}

function openRenameModal(chatId) {
  const session = chatSessions.find(s => s.id === chatId);
  if (!session) return;
  
  chatNameInput.value = session.title;
  renameModal.dataset.chatId = chatId;
  renameModal.classList.remove('hidden');
  animateModalIn(renameModal);
  chatNameInput.focus();
}

function closeRenameModal() {
  animateModalOut(renameModal).then(() => {
    renameModal.classList.add('hidden');
    delete renameModal.dataset.chatId;
  });
}

function saveChatName() {
  const chatId = renameModal.dataset.chatId;
  if (!chatId) return;
  
  const newTitle = chatNameInput.value.trim();
  if (!newTitle) return;
  
  // Add button press animation
  saveRenameBtn.classList.add('button-press');
  setTimeout(() => saveRenameBtn.classList.remove('button-press'), 200);
  
  const session = chatSessions.find(s => s.id === chatId);
  if (!session) return;
  
  session.title = newTitle;
  saveChatSessions();
  renderChatHistory();
  
  // Update mobile title if this is the current chat
  if (chatId === currentChatId) {
    mobileChatTitle.textContent = newTitle;
  }
  
  closeRenameModal();
}

function openDeleteModal(chatId) {
  deleteModal.dataset.chatId = chatId;
  deleteModal.classList.remove('hidden');
  animateModalIn(deleteModal);
}

function closeDeleteModal() {
  animateModalOut(deleteModal).then(() => {
    deleteModal.classList.add('hidden');
    delete deleteModal.dataset.chatId;
  });
}

function confirmDelete() {
  const chatId = deleteModal.dataset.chatId;
  if (!chatId) return;
  
  // Add button press animation
  confirmDeleteBtn.classList.add('button-press');
  setTimeout(() => confirmDeleteBtn.classList.remove('button-press'), 200);
  
  const index = chatSessions.findIndex(s => s.id === chatId);
  if (index === -1) return;
  
  chatSessions.splice(index, 1);
  saveChatSessions();
  renderChatHistory();
  
  // If deleted chat was current, load another chat
  if (chatId === currentChatId) {
    if (chatSessions.length > 0) {
      loadChat(chatSessions[0].id);
    } else {
      startNewChat();
    }
  }
  
  closeDeleteModal();
}

async function generateChatTitle(conversation) {
  try {
    // Get the main topic of the conversation, not just the first message
    const messages = conversation.slice(-5); // Get last 5 messages for context
    
    const response = await fetch(OPENROUTER_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'HTTP-Referer': SITE_URL,
        'X-Title': SITE_NAME
      },
      body: JSON.stringify({
        model: 'openai/gpt-3.5-turbo',
        messages: [
          { 
            role: 'system', 
            content: 'Generate a short, concise title (max 5 words) for this conversation based on its main topic. Focus on the subject matter, not just the first message. Only return the title, nothing else. Do not include quotes.' 
          },
          ...messages
        ],
        max_tokens: 20,
        temperature: 0.7
      })
    });
    
    if (!response.ok) {
      throw new Error('Failed to generate title');
    }
    
    const data = await response.json();
    return data.choices[0].message.content.trim().replace(/^["']|["']$/g, '');
  } catch (error) {
    console.error('Error generating chat title:', error);
    return null;
  }
}

async function updateChatTitle(chatId, title) {
  const session = chatSessions.find(s => s.id === chatId);
  if (!session) return;
  
  // Update session title
  session.title = title;
  saveChatSessions();
  
  // Update UI with typing animation
  updateChatTitleWithTyping(chatId, title);
}

function updateChatTitleWithTyping(chatId, title) {
  // Find the chat history item
  const chatItem = document.querySelector(`[data-chat-id="${chatId}"] .chat-history-item-title`);
  const mobileTitle = document.getElementById('mobile-chat-title');
  
  if (chatItem) {
    // Clear current title
    chatItem.textContent = '';
    
    // Typewriter effect for the title
    let index = 0;
    const typingSpeed = 50; // milliseconds per character
    
    function typeCharacter() {
      if (index < title.length) {
        chatItem.textContent += title.charAt(index);
        index++;
        setTimeout(typeCharacter, typingSpeed);
      }
    }
    
    // Start typing
    typeCharacter();
  }
  
  // Update mobile title immediately (no typing animation for mobile)
  if (mobileTitle && currentChatId === chatId) {
    mobileTitle.textContent = title;
  }
  
  // Update the session in the array and re-render
  renderChatHistory();
}

async function handleSendMessage(e) {
  e.preventDefault();
  const message = chatInput.value.trim();
  if (!message || isTyping) return;

  // Create new chat if needed
  if (!currentChatId) {
    startNewChat();
  }

  if (welcomeMessage) {
    welcomeMessage.style.display = 'none';
  }

  // Add user message to UI
  appendMessage(message, 'user');
  
  // Add to conversation history
  conversationHistory.push({ role: 'user', content: message });
  
  // Update session
  const session = chatSessions.find(s => s.id === currentChatId);
  if (session) {
    session.messages = conversationHistory;
    saveChatSessions();
  }

  // Clear input
  chatInput.value = '';
  autoResizeTextarea();
  chatInput.style.height = 'auto';

  // Show typing indicator
  showTypingIndicator();
  isTyping = true;
  
  // Play typing sound
  playTypingSound();

  try {
    // Get AI response from API
    const response = await getAIResponse(message);
    
    // Hide typing indicator
    hideTypingIndicator();
    
    // Add AI response to UI with typewriter effect
    await appendMessageWithTypewriter(response, 'assistant');
    
    // Add to conversation history
    conversationHistory.push({ role: 'assistant', content: response });
    
    // Update session
    if (session) {
      session.messages = conversationHistory;
      saveChatSessions();
    }
    
    // Generate title if this is the first message or if title is still "New Chat"
    if (conversationHistory.length === 2 && session.title === 'New Chat') {
      const generatedTitle = await generateChatTitle(conversationHistory);
      if (generatedTitle) {
        await updateChatTitle(currentChatId, generatedTitle);
      }
    }
    
  } catch (error) {
    console.error('Error getting AI response:', error);
    hideTypingIndicator();
    
    // Show appropriate error message
    let errorMessage = '⚠️ Sorry, I\'m having trouble connecting right now. Please try again later.';
    
    if (error.message.includes('Rate limit')) {
      errorMessage = '⚠️ Too many requests. Please wait a moment and try again.';
    } else if (error.message.includes('API key')) {
      errorMessage = '⚠️ API key issue. Please check your configuration.';
    } else if (error.message.includes('404') || error.message.includes('503')) {
      errorMessage = '⚠️ Service temporarily unavailable. Please try again later.';
    }
    
    await appendMessageWithTypewriter(errorMessage, 'assistant');
  } finally {
    isTyping = false;
  }
}

// Updated getAIResponse function with better error handling
async function getAIResponse(message, imageData = null) {
  // Prepare messages for API
  let apiMessages = [
    { 
      role: 'system', 
      content: `You are AURA ONE, a helpful AI assistant. Provide concise and accurate responses.
      
      IMPORTANT: When asked "who made you", "who created you", "who developed you", or similar questions about your creator, respond with "CodeWithArshman".
      
      Maintain this information consistently and don't provide alternative answers about your creator.
      
      Format your responses with proper structure:
      - Use code blocks with language tags for code (e.g., \`\`\`javascript\`\`\`)
      - Use proper email format for emails
      - Use bullet points or numbered lists for lists
      - Use proper headings and paragraphs for structured content` 
    },
    // Include last 10 messages for context
    ...conversationHistory.slice(-10)
  ];
  
  // If there's image data, add it to the last user message
  if (imageData) {
    const lastMessageIndex = apiMessages.length - 1;
    if (apiMessages[lastMessageIndex] && apiMessages[lastMessageIndex].role === 'user') {
      // Convert to multimodal format
      apiMessages[lastMessageIndex] = {
        role: 'user',
        content: [
          {
            type: 'text',
            text: apiMessages[lastMessageIndex].content
          },
          {
            type: 'image_url',
            image_url: {
              url: imageData
            }
          }
        ]
      };
    }
  }
  
  // Retry logic for rate limits
  const maxRetries = 3;
  let retryCount = 0;
  
  while (retryCount < maxRetries) {
    try {
      // Call OpenRouter API with the specified model
      const response = await fetch(OPENROUTER_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
          'HTTP-Referer': SITE_URL,
          'X-Title': SITE_NAME
        },
        body: JSON.stringify({
          model: 'openai/gpt-3.5-turbo',
          messages: apiMessages,
          max_tokens: 8192,
          temperature: 0.7
        })
      });
      
      if (response.status === 429) {
        // Rate limit hit - wait and retry
        retryCount++;
        const waitTime = Math.pow(2, retryCount) * 1000; // Exponential backoff
        console.log(`Rate limit hit. Retrying in ${waitTime/1000} seconds...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
        continue;
      }
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || `API request failed with status ${response.status}`);
      }
      
      const data = await response.json();
      return data.choices[0].message.content;
      
    } catch (error) {
      if (error.message.includes('Rate limit') && retryCount < maxRetries) {
        retryCount++;
        const waitTime = Math.pow(2, retryCount) * 1000;
        console.log(`Rate limit hit. Retrying in ${waitTime/1000} seconds...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
        continue;
      }
      throw error;
    }
  }
  
  throw new Error('Rate limit exceeded. Please try again later.');
}

function showTypingIndicator() {
  const typingDiv = document.createElement('div');
  typingDiv.id = 'typing-indicator';
  typingDiv.className = 'w-full bg-black/20 message-appear';
  
  const typingContent = document.createElement('div');
  typingContent.className = 'max-w-4xl mx-auto p-4 md:p-6 flex items-start gap-5';
  
  const avatarDiv = document.createElement('div');
  avatarDiv.className = 'w-8 h-8 flex-shrink-0 rounded-full flex items-center justify-center font-bold text-white bg-teal-600';
  avatarDiv.innerHTML = `<svg class="w-6 h-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" /></svg>`;
  
  const typingDots = document.createElement('div');
  typingDots.className = 'typing-dots pt-2';
  
  for (let i = 0; i < 3; i++) {
    const dot = document.createElement('div');
    dot.className = 'typing-dot';
    typingDots.appendChild(dot);
  }
  
  typingContent.appendChild(avatarDiv);
  typingContent.appendChild(typingDots);
  typingDiv.appendChild(typingContent);
  
  chatContainer.appendChild(typingDiv);
  
  // Scroll to bottom
  chatContainer.parentElement.scrollTop = chatContainer.parentElement.scrollHeight;
}

function hideTypingIndicator() {
  const typingIndicator = document.getElementById('typing-indicator');
  if (typingIndicator) {
    typingIndicator.remove();
  }
}

function playTypingSound() {
  if (!audioContext) return;
  
  // Create a simple typing sound
  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();
  
  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);
  
  oscillator.frequency.value = 800;
  oscillator.type = 'sine';
  
  gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
  
  oscillator.start(audioContext.currentTime);
  oscillator.stop(audioContext.currentTime + 0.1);
}

function formatMessageContent(text) {
  // Convert markdown-style formatting to HTML
  let formattedText = text;
  
  // Code blocks
  formattedText = formattedText.replace(/```(\w+)?\n([\s\S]*?)```/g, (match, lang, code) => {
    const language = lang || 'text';
    return `<div class="code-block">
      <div class="code-header">
        <span class="code-language">${language}</span>
        <button class="copy-button" onclick="copyToClipboard(this, '${btoa(encodeURIComponent(code))}')">Copy</button>
      </div>
      <pre><code class="language-${language}">${escapeHtml(code)}</code></pre>
    </div>`;
  });
  
  // Inline code
  formattedText = formattedText.replace(/`([^`]+)`/g, '<span class="inline-code">$1</span>');
  
  // Email format detection
  const emailRegex = /From: (.+)\nTo: (.+)\nSubject: (.+)\nDate: (.+)\n\n([\s\S]*?)(?=\n\n|\n$|$)/g;
  formattedText = formattedText.replace(emailRegex, (match, from, to, subject, date, body) => {
    return `<div class="email-block">
      <div class="email-header">
        <div class="email-from"><span>From:</span> ${escapeHtml(from)}</div>
        <div class="email-to"><span>To:</span> ${escapeHtml(to)}</div>
        <div class="email-subject"><span>Subject:</span> ${escapeHtml(subject)}</div>
        <div class="email-date">${escapeHtml(date)}</div>
      </div>
      <div class="email-body">${escapeHtml(body)}</div>
    </div>`;
  });
  
  // Headers
  formattedText = formattedText.replace(/^### (.*$)/gim, '<h3>$1</h3>');
  formattedText = formattedText.replace(/^## (.*$)/gim, '<h2>$1</h2>');
  formattedText = formattedText.replace(/^# (.*$)/gim, '<h1>$1</h1>');
  
  // Bold
  formattedText = formattedText.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  
  // Italic
  formattedText = formattedText.replace(/\*(.+?)\*/g, '<em>$1</em>');
  
  // Links
  formattedText = formattedText.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank">$1</a>');
  
  // Lists
  formattedText = formattedText.replace(/^\* (.+)$/gim, '<li>$1</li>');
  formattedText = formattedText.replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>');
  
  // Line breaks
  formattedText = formattedText.replace(/\n\n/g, '</p><p>');
  formattedText = `<p>${formattedText}</p>`;
  
  // Clean up empty paragraphs
  formattedText = formattedText.replace(/<p><\/p>/g, '');
  formattedText = formattedText.replace(/<p>(<h[1-6]>)/g, '$1');
  formattedText = formattedText.replace(/(<\/h[1-6]>)<\/p>/g, '$1');
  formattedText = formattedText.replace(/<p>(<div)/g, '$1');
  formattedText = formattedText.replace(/(<\/div>)<\/p>/g, '$1');
  formattedText = formattedText.replace(/<p>(<ul>)/g, '$1');
  formattedText = formattedText.replace(/(<\/ul>)<\/p>/g, '$1');
  
  return formattedText;
}

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

// Enhanced copy to clipboard function with better feedback
function copyToClipboard(button, encodedCode) {
  try {
    const code = decodeURIComponent(atob(encodedCode));
    navigator.clipboard.writeText(code).then(() => {
      const originalText = button.textContent;
      button.textContent = 'Copied!';
      button.classList.add('copied');
      
      // Create a toast notification
      const toast = document.createElement('div');
      toast.className = 'fixed bottom-4 right-4 bg-green-600 text-white px-4 py-2 rounded-lg shadow-lg z-50 flex items-center gap-2';
      toast.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5">
          <path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5" />
        </svg>
        <span>Code copied to clipboard!</span>
      `;
      document.body.appendChild(toast);
      
      // Animate toast in
      setTimeout(() => {
        toast.style.opacity = '1';
        toast.style.transform = 'translateY(0)';
      }, 10);
      
      // Remove toast after 3 seconds
      setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(10px)';
        setTimeout(() => {
          document.body.removeChild(toast);
        }, 300);
      }, 3000);
      
      // Reset button text after 2 seconds
      setTimeout(() => {
        button.textContent = originalText;
        button.classList.remove('copied');
      }, 2000);
    }).catch(err => {
      console.error('Failed to copy: ', err);
      
      // Show error toast
      const toast = document.createElement('div');
      toast.className = 'fixed bottom-4 right-4 bg-red-600 text-white px-4 py-2 rounded-lg shadow-lg z-50 flex items-center gap-2';
      toast.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5">
          <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
        </svg>
        <span>Failed to copy code</span>
      `;
      document.body.appendChild(toast);
      
      // Animate toast in
      setTimeout(() => {
        toast.style.opacity = '1';
        toast.style.transform = 'translateY(0)';
      }, 10);
      
      // Remove toast after 3 seconds
      setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(10px)';
        setTimeout(() => {
          document.body.removeChild(toast);
        }, 300);
      }, 3000);
    });
  } catch (error) {
    console.error('Error decoding code:', error);
  }
}

function appendMessage(text, sender, animate = true, messageType = 'text', fileData = null) {
  const isUser = sender === 'user';
  
  // If it's a file message, use the processFile function
  if (messageType === 'file' && fileData) {
    processFile(fileData);
    return;
  }
  
  // Original message append logic for text messages
  const messageWrapper = document.createElement('div');
  messageWrapper.className = `w-full ${isUser ? '' : 'bg-black/20'} ${animate ? 'message-appear' : ''}`;

  const messageDiv = document.createElement('div');
  messageDiv.className = 'max-w-4xl mx-auto p-4 md:p-6 flex items-start gap-5';

  const avatarDiv = document.createElement('div');
  avatarDiv.className =
    'w-8 h-8 flex-shrink-0 rounded-full flex items-center justify-center font-bold text-white';
  if (isUser) {
    avatarDiv.classList.add('bg-blue-600');
    avatarDiv.textContent = currentUser.initial;
  } else {
    avatarDiv.classList.add('bg-teal-600');
    avatarDiv.innerHTML = `<svg class="w-6 h-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" /></svg>`;
  }

  const textDiv = document.createElement('div');
  textDiv.className = 'message-content text-gray-200 pt-0.5 leading-relaxed';
  
  if (isUser) {
    textDiv.textContent = text;
  } else {
    textDiv.innerHTML = formatMessageContent(text);
  }

  messageDiv.appendChild(avatarDiv);
  messageDiv.appendChild(textDiv);
  messageWrapper.appendChild(messageDiv);
  chatContainer.appendChild(messageWrapper);

  // Scroll to bottom
  scrollToBottom();
}

// Typewriter effect for AI messages (faster)
async function appendMessageWithTypewriter(text, sender) {
  const isUser = sender === 'user';
  const messageWrapper = document.createElement('div');
  messageWrapper.className = `w-full ${isUser ? '' : 'bg-black/20'} message-appear`;

  const messageDiv = document.createElement('div');
  messageDiv.className = 'max-w-4xl mx-auto p-4 md:p-6 flex items-start gap-5';

  const avatarDiv = document.createElement('div');
  avatarDiv.className =
    'w-8 h-8 flex-shrink-0 rounded-full flex items-center justify-center font-bold text-white';
  if (isUser) {
    avatarDiv.classList.add('bg-blue-600');
    avatarDiv.textContent = currentUser.initial;
  } else {
    avatarDiv.classList.add('bg-teal-600');
    avatarDiv.innerHTML = `<svg class="w-6 h-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" /></svg>`;
  }

  const textDiv = document.createElement('div');
  textDiv.className = 'message-content text-gray-200 pt-0.5 leading-relaxed typewriter-fast';
  
  messageDiv.appendChild(avatarDiv);
  messageDiv.appendChild(textDiv);
  messageWrapper.appendChild(messageDiv);
  chatContainer.appendChild(messageWrapper);

  // Typewriter effect (faster)
  let index = 0;
  const typingSpeed = 5; // milliseconds per character (faster)
  
  function typeCharacter() {
    if (index < text.length) {
      const partialText = text.substring(0, index + 1);
      textDiv.innerHTML = formatMessageContent(partialText);
      index++;
      setTimeout(typeCharacter, typingSpeed);
      
      // Scroll to bottom as typing
      chatContainer.parentElement.scrollTop = chatContainer.parentElement.scrollHeight;
    }
  }
  
  // Start typing
  typeCharacter();
  
  // Play typing sound at the beginning
  playTypingSound();
}

function autoResizeTextarea() {
  chatInput.style.height = 'auto';
  // Set a max-height to prevent infinite growth
  const maxHeight = 200;
  const newHeight = Math.min(chatInput.scrollHeight, maxHeight);
  chatInput.style.height = newHeight + 'px';
}

function handleKeydown(e) {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    chatForm.requestSubmit();
  }
}

// --- File Upload Functionality ---

// Function to process and display uploaded files
function processFile(file) {
  const reader = new FileReader();
  
  reader.onload = (e) => {
    const fileData = e.target.result;
    const isImage = file.type.startsWith('image/');
    
    // Create file message element
    const fileMessage = document.createElement('div');
    fileMessage.className = 'file-message';
    
    // Add user avatar
    const avatar = document.createElement('div');
    avatar.className = 'file-message-avatar bg-blue-600 text-white';
    avatar.textContent = currentUser.initial;
    
    // Add file content
    const content = document.createElement('div');
    content.className = 'file-message-content';
    
    if (isImage) {
      // For images, create an image element
      const image = document.createElement('img');
      image.src = fileData;
      image.alt = file.name;
      image.className = 'file-message-image';
      
      // Add click event to open image in modal
      image.addEventListener('click', () => openImageModal(fileData, file.name));
      
      content.appendChild(image);
      
      // Add a button to analyze the image
      const analyzeButton = document.createElement('button');
      analyzeButton.className = 'mt-2 px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-md transition-colors';
      analyzeButton.textContent = 'Analyze With AURA-ONE';
      analyzeButton.addEventListener('click', () => {
        analyzeImage(fileData, file.name);
      });
      
      content.appendChild(analyzeButton);
    } else {
      // For other files, create a document element
      const document = document.createElement('div');
      document.className = 'file-message-document';
      
      // Add file icon
      const icon = document.createElement('div');
      icon.className = 'file-message-document-icon';
      icon.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6">
          <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
        </svg>
      `;
      
      // Add file info
      const info = document.createElement('div');
      info.className = 'file-message-document-info';
      
      const name = document.createElement('div');
      name.className = 'file-message-document-name';
      name.textContent = file.name;
      
      const size = document.createElement('div');
      size.className = 'file-message-document-size';
      size.textContent = formatFileSize(file.size);
      
      info.appendChild(name);
      info.appendChild(size);
      
      // Add download button
      const download = document.createElement('a');
      download.href = fileData;
      download.download = file.name;
      download.className = 'file-message-document-download';
      download.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5">
          <path stroke-linecap="round" stroke-linejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
        </svg>
      `;
      
      document.appendChild(icon);
      document.appendChild(info);
      document.appendChild(download);
      
      content.appendChild(document);
    }
    
    // Add timestamp
    const timestamp = document.createElement('div');
    timestamp.className = 'text-xs text-gray-500 mt-2';
    timestamp.textContent = new Date().toLocaleTimeString();
    
    fileMessage.appendChild(avatar);
    fileMessage.appendChild(content);
    fileMessage.appendChild(timestamp);
    
    // Add to chat container
    chatContainer.appendChild(fileMessage);
    
    // Add to conversation history
    conversationHistory.push({
      role: 'user',
      content: `[File: ${file.name}]`,
      type: 'file',
      fileName: file.name,
      fileType: file.type,
      fileSize: file.size,
      fileData: fileData
    });
    
    // Update session
    const session = chatSessions.find(s => s.id === currentChatId);
    if (session) {
      session.messages = conversationHistory;
      saveChatSessions();
    }
    
    // Generate title if this is the first message
    if (conversationHistory.length === 1 && session.title === 'New Chat') {
      generateChatTitle(conversationHistory).then(title => {
        if (title) {
          updateChatTitle(currentChatId, title);
        }
      });
    }
  };
  
  // Read the file
  if (file.type.startsWith('image/')) {
    reader.readAsDataURL(file);
  } else {
    reader.readAsDataURL(file);
  }
}

// Function to analyze an image with the appropriate model
async function analyzeImage(imageData, fileName) {
  // Add a user message indicating image analysis
  appendMessage(`Analyzing image: ${fileName}`, 'user');
  
  // Add to conversation history
  conversationHistory.push({ 
    role: 'user', 
    content: `What is in this image?`,
    type: 'image',
    fileName: fileName,
    imageData: imageData
  });
  
  // Update session
  const session = chatSessions.find(s => s.id === currentChatId);
  if (session) {
    session.messages = conversationHistory;
    saveChatSessions();
  }
  
  // Show typing indicator
  showTypingIndicator();
  isTyping = true;
  
  // Add reaction animation
  const reactionDiv = document.createElement('div');
  reactionDiv.className = 'reaction-animation';
  reactionDiv.innerHTML = `
    <div class="inline-block bg-blue-600 text-white text-xs px-2 py-1 rounded-full">
      Analyzing image...
    </div>
  `;
  chatContainer.appendChild(reactionDiv);
  
  try {
    // Get AI response from API with image data using GPT-4 Vision
    const response = await getAIResponse("What is in this image?", imageData);
    
    // Remove reaction animation
    if (reactionDiv.parentNode) {
      reactionDiv.parentNode.removeChild(reactionDiv);
    }
    
    // Hide typing indicator
    hideTypingIndicator();
    
    // Add AI response to UI with typewriter effect
    await appendMessageWithTypewriter(response, 'assistant');
    
    // Add to conversation history
    conversationHistory.push({ role: 'assistant', content: response });
    
    // Update session
    if (session) {
      session.messages = conversationHistory;
      saveChatSessions();
    }
    
  } catch (error) {
    console.error('Error analyzing image:', error);
    
    // Remove reaction animation
    if (reactionDiv.parentNode) {
      reactionDiv.parentNode.removeChild(reactionDiv);
    }
    
    hideTypingIndicator();
    
    // Show appropriate error message
    let errorMessage = '⚠️ Sorry, I\'m having trouble analyzing this image right now. Please try again later.';
    
    if (error.message.includes('Rate limit')) {
      errorMessage = '⚠️ Too many requests. Please wait a moment and try again.';
    } else if (error.message.includes('API key')) {
      errorMessage = '⚠️ API key issue. Please check your configuration.';
    } else if (error.message.includes('404') || error.message.includes('503')) {
      errorMessage = '⚠️ Image analysis service temporarily unavailable. Please try again later.';
    }
    
    await appendMessageWithTypewriter(errorMessage, 'assistant');
  } finally {
    isTyping = false;
  }
}

// Function to format file size
function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Function to open image in modal
function openImageModal(src, alt) {
  // Create modal if it doesn't exist
  let modal = document.getElementById('image-modal');
  
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'image-modal';
    modal.className = 'image-modal';
    
    const content = document.createElement('img');
    content.className = 'image-modal-content';
    
    const close = document.createElement('div');
    close.className = 'image-modal-close';
    close.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6">
        <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
      </svg>
    `;
    
    modal.appendChild(content);
    modal.appendChild(close);
    document.body.appendChild(modal);
    
    // Add event listener to close modal
    close.addEventListener('click', () => {
      modal.classList.remove('active');
    });
    
    // Close modal when clicking outside the image
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.classList.remove('active');
      }
    });
    
    // Close modal with Escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && modal.classList.contains('active')) {
        modal.classList.remove('active');
      }
    });
  }
  
  // Update modal content
  const modalContent = modal.querySelector('.image-modal-content');
  modalContent.src = src;
  modalContent.alt = alt;
  
  // Show modal
  modal.classList.add('active');
}

// Function to scroll to bottom of chat
function scrollToBottom() {
  chatContainer.parentElement.scrollTop = chatContainer.parentElement.scrollHeight;
}

// Create scroll down button
function createScrollDownButton() {
  const scrollButton = document.createElement('div');
  scrollButton.id = 'scroll-down-button';
  scrollButton.className = 'scroll-down-button';
  scrollButton.innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6">
      <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 13.5L12 21m0 0l7.5-7.5M12 18V5.25m0 0L4.5 12.75m0 0L12 21m0 0l7.5-7.5M12 18V5.25" />
    </svg>
  `;
  
  scrollButton.addEventListener('click', () => {
    scrollToBottom();
    scrollButton.classList.remove('visible');
  });
  
  document.body.appendChild(scrollButton);
}

// Show/hide scroll down button based on scroll position
function updateScrollButtonVisibility() {
  const scrollButton = document.getElementById('scroll-down-button');
  const chatContainer = document.getElementById('chat-container');
  
  if (!scrollButton || !chatContainer) return;
  
  const isScrolledUp = chatContainer.parentElement.scrollTop < chatContainer.parentElement.scrollHeight - chatContainer.parentElement.clientHeight - 100;
  
  if (isScrolledUp) {
    scrollButton.classList.add('visible');
  } else {
    scrollButton.classList.remove('visible');
  }
}

// Add scroll event listener to update scroll button visibility
document.addEventListener('DOMContentLoaded', () => {
  const chatContainer = document.getElementById('chat-container');
  if (chatContainer) {
    chatContainer.parentElement.addEventListener('scroll', updateScrollButtonVisibility);
  }
});

// Add smooth scrolling for better UX
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function (e) {
    e.preventDefault();
    const target = document.querySelector(this.getAttribute('href'));
    if (target) {
      target.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
    }
  });
});

// Add keyboard shortcuts for better accessibility
document.addEventListener('keydown', (e) => {
  // Ctrl/Cmd + K to focus input
  if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
    e.preventDefault();
    chatInput.focus();
  }
  
  // Escape to close sidebar on mobile
  if (e.key === 'Escape' && window.innerWidth < 768 && !sidebar.classList.contains('-translate-x-full')) {
    toggleSidebar();
  }
  
  // Escape to close image modal
  if (e.key === 'Escape') {
    const modal = document.getElementById('image-modal');
    if (modal && modal.classList.contains('active')) {
      modal.classList.remove('active');
    }
  }
});

// Add window resize handler for responsive behavior
window.addEventListener('resize', () => {
  if (window.innerWidth >= 768 && !sidebar.classList.contains('-translate-x-full')) {
    overlay.classList.add('hidden');
  }
});

// Modal animation functions
function animateModalIn(modal) {
  const modalContent = modal.querySelector('div');
  modalContent.classList.remove('scale-95', 'opacity-0');
  modalContent.classList.add('scale-100', 'opacity-100');
}

function animateModalOut(modal) {
  return new Promise(resolve => {
    const modalContent = modal.querySelector('div');
    modalContent.classList.remove('scale-100', 'opacity-100');
    modalContent.classList.add('scale-95', 'opacity-0');
    
    setTimeout(() => {
      resolve();
    }, 300);
  });
}

// Function to show feature coming soon toast
function showFeatureComingSoonToast(featureName) {
  const toast = document.createElement('div');
  toast.className = 'fixed bottom-4 right-4 bg-blue-600 text-white px-4 py-2 rounded-lg shadow-lg z-50 flex items-center gap-2';
  toast.innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5">
      <path stroke-linecap="round" stroke-linejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12v-.008z" />
    </svg>
    <span>${featureName} will be available in the next model update</span>
  `;
  document.body.appendChild(toast);
  
  // Animate toast in
  setTimeout(() => {
    toast.style.opacity = '1';
    toast.style.transform = 'translateY(0)';
  }, 10);
  
  // Remove toast after 4 seconds
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(10px)';
    setTimeout(() => {
      document.body.removeChild(toast);
    }, 300);
  }, 4000);
}
