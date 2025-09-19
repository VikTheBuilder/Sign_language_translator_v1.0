document.addEventListener('DOMContentLoaded', () => {
    const chatBubble = document.getElementById('chat-bubble');
    const chatContainer = document.getElementById('chat-container');
    const closeChat = document.getElementById('close-chat');
    const sendBtn = document.getElementById('send-btn');
    const userInput = document.getElementById('user-input');
    const chatBox = document.getElementById('chat-box');

    if (!chatBubble || !chatContainer || !closeChat || !sendBtn || !userInput || !chatBox) {
        console.error('Chatbot UI elements not found. Please ensure the chatbot HTML snippet is included in your page.');
        return;
    }

    chatBubble.addEventListener('click', () => {
        chatContainer.style.display = 'flex';
        chatBubble.style.display = 'none';
        userInput.focus();
    });

    closeChat.addEventListener('click', () => {
        chatContainer.style.display = 'none';
        chatBubble.style.display = 'flex';
    });

    sendBtn.addEventListener('click', sendMessage);
    userInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            sendMessage();
        }
    });

    async function sendMessage() {
        const messageText = userInput.value.trim();
        if (messageText === '') return;

        appendMessage('user', messageText);
        userInput.value = '';
        userInput.focus();

        try {
            const response = await fetch('/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ message: messageText }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to get a response from the server.');
            }

            const data = await response.json();
            appendMessage('bot', data.reply);

        } catch (error) {
            console.error('Error communicating with chatbot:', error);
            appendMessage('bot', `Sorry, I'm having trouble connecting. Please try again later.`);
        }
    }

    function appendMessage(sender, text) {
        const messageElement = document.createElement('div');
        messageElement.classList.add('chat-message', sender === 'user' ? 'user-message' : 'bot-message');
        
        const p = document.createElement('p');
        // A simple way to render newlines from the bot's response
        p.innerHTML = text.replace(/\n/g, '<br>');
        messageElement.appendChild(p);

        chatBox.appendChild(messageElement);
        chatBox.scrollTop = chatBox.scrollHeight;
    }
});