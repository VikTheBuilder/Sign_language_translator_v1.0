// Chatbot Configuration File
// Replace the placeholder values with your actual DeepSeek API credentials

const UnSpokenConfig = {
    // DeepSeek API Configuration
    deepseek: {
        apiKey: process.env.DeekSeekApi, // Replace with your actual DeepSeek API key
        apiEndpoint: 'https://openrouter.ai/api/v1',
        model: 'deepseek/deepseek-chat-v3.1:free',
        maxTokens: 2000,
        temperature: 0.7,
        systemPrompt: `You are UnSpoken, a helpful assistant for sign language learning and communication. You should:
1. Provide accurate information about sign language
2. Help users learn signs and improve their signing skills
3. Be patient and encouraging with learners
4. Explain concepts clearly and simply
5. Offer tips for better sign recognition
6. Be supportive and inclusive
7. If you don't know something about sign language, be honest and suggest they consult a sign language expert`
    },
    
    // Chatbot UI Configuration
    ui: {
        maxMessages: 50,
        typingIndicatorDelay: 300,
        messageAnimationDuration: 300,
        autoScroll: true,
        theme: 'default' // Can be 'default', 'dark', or 'auto'
    },
    
    // Feature Flags
    features: {
        enableTypingIndicator: true,
        enableMessageHistory: true,
        enableAutoScroll: true,
        enableSoundEffects: false,
        enableEmojiSupport: true,
        enableMarkdown: false
    }
};

// Export configuration for use in other modules
export { UnSpokenConfig };