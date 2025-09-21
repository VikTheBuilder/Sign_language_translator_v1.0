// WebSocket connection
const socket = io();

// DOM elements
const videoElement = document.getElementById('videoElement');
const videoOverlay = document.getElementById('videoOverlay');
const translationText = document.getElementById('translationText');
const signHistory = document.getElementById('signHistory');
const startBtn = document.getElementById('startBtn');
const statusMessage = document.getElementById('statusMessage');

// Control buttons
const rewindBtn = document.getElementById('rewindBtn');
const pauseBtn = document.getElementById('pauseBtn');
const recordBtn = document.getElementById('recordBtn');
const speakBtn = document.getElementById('speakBtn');
const clearBtn = document.getElementById('clearBtn');
const copyBtn = document.getElementById('copyBtn');

// State variables
let isCameraActive = false;
let currentGesture = null;
let currentTranslation = null;
let lastGestureTime = 0;
let gestureTimeout = null;
let frameCount = 0;

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    console.log('🎯 UnSpoken application initialized');
    
    // Set up event listeners
    setupEventListeners();
    
    // Connect to WebSocket
    setupWebSocket();
    
    // Initialize video element
    initializeVideo();
    
    // Set initial message
    setInitialMessage();
});

function setInitialMessage() {
    translationText.innerHTML = `
        <div class="translation-item">
            <div class="gesture-name">Welcome to UnSpoken</div>
            <div class="translation-text">Click "Start Translating" to begin</div>
        </div>
    `;
}

function initializeVideo() {
    // Set up video element properties
    videoElement.style.display = 'none';
    videoOverlay.style.display = 'flex';
    
    // Set video element properties
    videoElement.style.width = '100%';
    videoElement.style.height = '100%';
    videoElement.style.objectFit = 'cover';
    
    console.log('📹 Video element initialized');
}

function setupEventListeners() {
    // Start/Stop camera button
    startBtn.addEventListener('click', function() {
        console.log('🎬 Start button clicked, current state:', isCameraActive);
        if (!isCameraActive) {
            startCamera();
        } else {
            stopCamera();
        }
    });
    
    // Text control buttons
    speakBtn.addEventListener('click', function() {
        speakText();
    });
    
    clearBtn.addEventListener('click', function() {
        clearTranslation();
    });
    
    copyBtn.addEventListener('click', function() {
        copyTranslation();
    });
}

function setupWebSocket() {
    // Connection events
    socket.on('connect', function() {
        console.log('🔌 Connected to server');
        showStatus('Connected to UnSpoken', 'success');
    });
    
    socket.on('disconnect', function() {
        console.log('🔌 Disconnected from server');
        showStatus('Disconnected from server', 'error');
    });
    
    // Video frame updates
    socket.on('video_frame', function(data) {
        frameCount++;
        if (frameCount % 30 === 0) {
            console.log('📹 Received video frame data, frame:', frameCount);
        }
        
        if (data.frame) {
            updateVideoFrame(data.frame);
        }
        
        if (data.gesture && data.translation) {
            updateTranslation(data.gesture, data.translation);
        } else if (data.gesture === null && data.translation === null) {
            // Don't clear immediately, wait a bit
            scheduleClearTranslation();
        }
    });
    
    // Status updates
    socket.on('status', function(data) {
        console.log('📊 Status update:', data);
        showStatus(data.message, 'info');
    });
}

function startCamera() {
    console.log('🎬 Starting camera...');
    
    // Update button state
    startBtn.textContent = 'Stop Translating';
    startBtn.classList.remove('btn-primary');
    startBtn.classList.add('btn-secondary');
    
    // Show video element and hide overlay
    videoElement.style.display = 'block';
    videoOverlay.style.display = 'none';
    
    // Reset frame count
    frameCount = 0;
    
    // Update message
    translationText.innerHTML = `
        <div class="translation-item">
            <div class="gesture-name">Camera Active</div>
            <div class="translation-text">Show your hands to the camera</div>
        </div>
    `;
    
    // Send start request to server
    fetch('/start_camera')
        .then(response => {
            console.log('📡 Start camera response status:', response.status);
            return response.json();
        })
        .then(data => {
            console.log('📡 Start camera response data:', data);
            if (data.status === 'success') {
                isCameraActive = true;
                showStatus('Camera started successfully', 'success');
                console.log('✅ Camera started');
            } else {
                showStatus('Failed to start camera: ' + (data.message || 'Unknown error'), 'error');
                console.error('❌ Failed to start camera:', data.message);
                // Reset button state on failure
                resetButtonState();
            }
        })
        .catch(error => {
            console.error('❌ Error starting camera:', error);
            showStatus('Error starting camera: ' + error.message, 'error');
            // Reset button state on error
            resetButtonState();
        });
}

function stopCamera() {
    console.log('🛑 Stopping camera...');
    
    // Update button state
    startBtn.textContent = 'Start Translating';
    startBtn.classList.remove('btn-secondary');
    startBtn.classList.add('btn-primary');
    
    // Hide video element and show placeholder
    videoElement.style.display = 'none';
    videoOverlay.style.display = 'flex';
    
    // Clear any pending timeouts
    if (gestureTimeout) {
        clearTimeout(gestureTimeout);
        gestureTimeout = null;
    }
    
    // Reset translation
    setInitialMessage();
    
    // Send stop request to server
    fetch('/stop_camera')
        .then(response => response.json())
        .then(data => {
            if (data.status === 'success') {
                isCameraActive = false;
                showStatus('Camera stopped', 'info');
                console.log('✅ Camera stopped');
            } else {
                showStatus('Failed to stop camera: ' + (data.message || 'Unknown error'), 'error');
                console.error('❌ Failed to stop camera:', data.message);
            }
        })
        .catch(error => {
            console.error('❌ Error stopping camera:', error);
            showStatus('Error stopping camera: ' + error.message, 'error');
        });
}

function resetButtonState() {
    startBtn.textContent = 'Start Translating';
    startBtn.classList.remove('btn-secondary');
    startBtn.classList.add('btn-primary');
    videoElement.style.display = 'none';
    videoOverlay.style.display = 'flex';
    setInitialMessage();
}

function updateVideoFrame(frameData) {
    try {
        // Create a new image element for the frame
        const img = new Image();
        img.onload = function() {
            // Create a canvas to draw the image
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            // Set canvas size to match video container
            const videoContainer = videoElement.parentElement;
            canvas.width = videoContainer.offsetWidth;
            canvas.height = videoContainer.offsetHeight;
            
            // Draw the image maintaining aspect ratio
            const aspectRatio = img.width / img.height;
            const containerAspectRatio = canvas.width / canvas.height;
            
            let drawWidth, drawHeight, offsetX, offsetY;
            
            if (aspectRatio > containerAspectRatio) {
                // Image is wider than container
                drawWidth = canvas.width;
                drawHeight = canvas.width / aspectRatio;
                offsetX = 0;
                offsetY = (canvas.height - drawHeight) / 2;
            } else {
                // Image is taller than container
                drawHeight = canvas.height;
                drawWidth = canvas.height * aspectRatio;
                offsetX = (canvas.width - drawWidth) / 2;
                offsetY = 0;
            }
            
            ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);
            
            // Convert canvas to data URL and set as video source
            videoElement.src = canvas.toDataURL('image/jpeg', 0.8);
            
            if (frameCount % 30 === 0) {
                console.log('📹 Video frame updated successfully');
            }
        };
        
        img.onerror = function() {
            console.error('❌ Error loading video frame image');
        };
        
        // Set the image source
        img.src = 'data:image/jpeg;base64,' + frameData;
        
    } catch (error) {
        console.error('❌ Error updating video frame:', error);
    }
}

function updateTranslation(gesture, translation) {
    console.log('🎯 Updating translation:', gesture, '->', translation);
    
    // Clear any pending timeout
    if (gestureTimeout) {
        clearTimeout(gestureTimeout);
        gestureTimeout = null;
    }
    
    // Only update if it's a new gesture
    if (gesture !== currentGesture || translation !== currentTranslation) {
        currentGesture = gesture;
        currentTranslation = translation;
        lastGestureTime = Date.now();
        
        // Update translation text
        translationText.innerHTML = `
            <div class="translation-item">
                <div class="gesture-name">${gesture}</div>
                <div class="translation-text">${translation}</div>
            </div>
        `;
        
        // Add animation
        translationText.classList.add('recognition-active');
        setTimeout(() => {
            translationText.classList.remove('recognition-active');
        }, 2000);
        
        showStatus(`Recognized: ${gesture}`, 'success');
    }
}

function scheduleClearTranslation() {
    // Clear any existing timeout
    if (gestureTimeout) {
        clearTimeout(gestureTimeout);
    }
    
    // Wait 3 seconds before clearing
    gestureTimeout = setTimeout(() => {
        if (isCameraActive) {
            translationText.innerHTML = `
                <div class="translation-item">
                    <div class="gesture-name">No Gesture Detected</div>
                    <div class="translation-text">Show your hands clearly to the camera</div>
                </div>
            `;
            currentGesture = null;
            currentTranslation = null;
            console.log('🗑️ Translation cleared after timeout');
        }
    }, 3000);
}

function togglePause() {
    isPaused = !isPaused;
    
    if (isPaused) {
        pauseBtn.textContent = '▶️';
        showStatus('Video paused', 'info');
    } else {
        pauseBtn.textContent = '⏸️';
        showStatus('Video resumed', 'info');
    }
    
    console.log('⏸️ Pause toggled:', isPaused);
}

function toggleRecording() {
    isRecording = !isRecording;
    
    if (isRecording) {
        recordBtn.textContent = '⏹️';
        recordBtn.style.background = '#ef4444';
        showStatus('Recording started', 'success');
    } else {
        recordBtn.textContent = '⏺️';
        recordBtn.style.background = '#f1f5f9';
        showStatus('Recording stopped', 'info');
    }
    
    console.log('⏺️ Recording toggled:', isRecording);
}

function speakText() {
    const text = currentTranslation || translationText.textContent;
    if (text && text !== 'Hello, how are you?' && currentTranslation) {
        // Use browser's speech synthesis
        const utterance = new SpeechSynthesisUtterance(currentTranslation);
        speechSynthesis.speak(utterance);
        showStatus('Speaking text...', 'info');
        console.log('🔊 Speaking text:', currentTranslation);
    } else {
        showStatus('No text to speak', 'error');
    }
}

function clearTranslation() {
    if (isCameraActive) {
        translationText.innerHTML = `
            <div class="translation-item">
                <div class="gesture-name">Ready</div>
                <div class="translation-text">Show your hands to the camera</div>
            </div>
        `;
    } else {
        setInitialMessage();
    }
    currentGesture = null;
    currentTranslation = null;
    showStatus('Translation cleared', 'info');
    console.log('🗑️ Translation cleared');
}

function copyTranslation() {
    const text = currentTranslation || translationText.textContent;
    if (text && text !== 'Hello, how are you?' && currentTranslation) {
        navigator.clipboard.writeText(text).then(() => {
            showStatus('Text copied to clipboard', 'success');
            console.log('📋 Text copied:', text);
        }).catch(err => {
            console.error('❌ Failed to copy text:', err);
            showStatus('Failed to copy text', 'error');
        });
    } else {
        showStatus('No text to copy', 'error');
    }
}

function showStatus(message, type = 'info') {
    // Remove existing status message
    const existingStatus = document.querySelector('.status-message.show');
    if (existingStatus) {
        existingStatus.classList.remove('show');
    }
    
    // Update status message
    statusMessage.textContent = message;
    statusMessage.className = `status-message ${type}`;
    
    // Show status message
    setTimeout(() => {
        statusMessage.classList.add('show');
    }, 100);
    
    // Hide status message after 3 seconds
    setTimeout(() => {
        statusMessage.classList.remove('show');
    }, 3000);
    
    console.log(`📊 Status (${type}):`, message);
}

// Handle page visibility changes
document.addEventListener('visibilitychange', function() {
    if (document.hidden && isCameraActive) {
        console.log('📱 Page hidden - camera continues running');
    }
});

// Handle window resize
window.addEventListener('resize', function() {
    console.log('📐 Window resized');
});

// Error handling
window.addEventListener('error', function(e) {
    console.error('❌ Global error:', e.error);
    showStatus('An error occurred', 'error');
});

// Cleanup on page unload
window.addEventListener('beforeunload', function() {
    if (isCameraActive) {
        // Stop camera if active
        fetch('/stop_camera').catch(console.error);
    }
});

// Add CSS for translation items
const style = document.createElement('style');
style.textContent = `
    .translation-item {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
        align-items: center;
    }
    
    .gesture-name {
        font-size: 1.25rem;
        font-weight: 600;
        color: #4f46e5;
        text-transform: capitalize;
    }
    
    .translation-text {
        font-size: 1.5rem;
        font-weight: 700;
        color: #1e293b;
    }
    
    .status-message.info {
        background: #3b82f6;
    }
    
    .status-message.success {
        background: #10b981;
    }
    
    .status-message.error {
        background: #ef4444;
    }
`;
document.head.appendChild(style);
// Initialize chatbot
document.addEventListener('DOMContentLoaded', function() {
    // Set up chatbot event listeners
    setupChatbotListeners();
});

function setupChatbotListeners() {
    // Open chat button
    openChatBtn.addEventListener('click', function() {
        chatbotContainer.classList.add('open');
        openChatBtn.style.display = 'none';
    });
    
    // Minimize chat button
    minimizeChatBtn.addEventListener('click', function() {
        chatbotContainer.classList.remove('open');
        openChatBtn.style.display = 'flex';
    });
    
    // Send message button
    sendMessageBtn.addEventListener('click', function() {
        sendMessage();
    });
    
    // Enter key to send message
    chatInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            sendMessage();
        }
    });
}

function sendMessage() {
    const message = chatInput.value.trim();
    if (message === '') return;
    
    // Add user message to chat
    addMessage(message, 'user');
    
    // Clear input
    chatInput.value = '';
    
    // Process message and get response
    setTimeout(() => {
        const response = getBotResponse(message);
        addMessage(response, 'bot');
    }, 500);
}

function addMessage(message, sender) {
    const messageElement = document.createElement('div');
    messageElement.classList.add('message');
    messageElement.classList.add(sender + '-message');
    
    const avatar = document.createElement('div');
    avatar.classList.add('message-avatar');
    
    if (sender === 'bot') {
        avatar.innerHTML = '<i class="fa-solid fa-robot"></i>';
    } else {
        avatar.innerHTML = '<i class="fa-solid fa-user"></i>';
    }
    
    const content = document.createElement('div');
    content.classList.add('message-content');
    content.textContent = message;
    
    if (sender === 'user') {
        messageElement.appendChild(content);
        messageElement.appendChild(avatar);
    } else {
        messageElement.appendChild(avatar);
        messageElement.appendChild(content);
    }
    
    chatMessages.appendChild(messageElement);
    
    // Scroll to bottom
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

function getBotResponse(message) {
    const lowerMessage = message.toLowerCase();
    
    // Check for keywords in the message
    if (containsAny(lowerMessage, ['hello', 'hi', 'hey', 'greetings'])) {
        return getRandomResponse(botResponses.greetings);
    }
    
    if (containsAny(lowerMessage, ['help', 'assist', 'support'])) {
        return getRandomResponse(botResponses.help);
    }
    
    if (containsAny(lowerMessage, ['about', 'what is', 'tell me about'])) {
        return getRandomResponse(botResponses.about);
    }
    
    if (containsAny(lowerMessage, ['how', 'works', 'function', 'technology'])) {
        return getRandomResponse(botResponses.how_it_works);
    }
    
    if (containsAny(lowerMessage, ['signs', 'gestures', 'supported', 'recognize'])) {
        return getRandomResponse(botResponses.supported_signs);
    }
    
    if (containsAny(lowerMessage, ['tips', 'advice', 'better', 'improve'])) {
        return getRandomResponse(botResponses.tips);
    }
    
    // If no keywords match, use fallback response
    return getRandomResponse(botResponses.fallback);
}

function containsAny(str, keywords) {
    return keywords.some(keyword => str.includes(keyword));
}

function getRandomResponse(responses) {
    const randomIndex = Math.floor(Math.random() * responses.length);
    return responses[randomIndex];
}