// DOM elements
const startLearningBtn = document.getElementById('startLearningBtn');
const viewProgressBtn = document.getElementById('viewProgressBtn');
const moduleButtons = document.querySelectorAll('.module-btn');
const practiceOptions = document.querySelectorAll('.practice-option');
const challengeBtn = document.querySelector('.challenge-btn');

// State variables
let currentModule = 'greetings';
let userProgress = {
    level: 3,
    experience: 650,
    nextLevelAt: 1000,
    signsMastered: 12,
    streak: 3,
    modules: {
        greetings: {
            completed: 8,
            total: 10
        },
        family: {
            completed: 4,
            total: 10
        },
        food: {
            completed: 0,
            total: 10
        },
        questions: {
            locked: true,
            completed: 0,
            total: 10
        }
    }
};

// Initialize the learning page
document.addEventListener('DOMContentLoaded', function() {
    console.log('🎮 HandSpeak Learning Module initialized');
    
    // Set up event listeners
    setupEventListeners();
    
    // Load user progress
    loadUserProgress();
});

function setupEventListeners() {
    // Start learning button
    startLearningBtn.addEventListener('click', function() {
        console.log('🎓 Start learning clicked');
        scrollToSection('.learning-modules');
    });
    
    // View progress button
    viewProgressBtn.addEventListener('click', function() {
        console.log('📊 View progress clicked');
        scrollToSection('.learning-dashboard');
    });
    
    // Module buttons
    moduleButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            const moduleCard = e.target.closest('.module-card');
            if (moduleCard.classList.contains('locked')) {
                showStatus('This module is locked. Keep learning to unlock it!', 'info');
                return;
            }
            
            const moduleName = moduleCard.querySelector('h3').textContent;
            startModule(moduleName);
        });
    });
    
    // Practice options
    practiceOptions.forEach(option => {
        option.addEventListener('click', function() {
            // Remove active class from all options
            practiceOptions.forEach(opt => opt.classList.remove('active'));
            
            // Add active class to clicked option
            option.classList.add('active');
            
            // Update practice preview
            const practiceType = option.querySelector('span').textContent;
            updatePracticePreview(practiceType);
        });
    });
    
    // Challenge button
    challengeBtn.addEventListener('click', function() {
        startChallenge();
    });
}

function loadUserProgress() {
    // In a real app, this would load from a server
    // For now, we'll use the mock data in userProgress
    
    // Update level progress
    const progressFill = document.querySelector('.progress-overview .progress-fill');
    const progressPercent = (userProgress.experience / userProgress.nextLevelAt) * 100;
    progressFill.style.width = `${progressPercent}%`;
}

function scrollToSection(selector) {
    const section = document.querySelector(selector);
    if (section) {
        section.scrollIntoView({ behavior: 'smooth' });
    }
}

function startModule(moduleName) {
    console.log(`Starting module: ${moduleName}`);
    showStatus(`Loading ${moduleName} module...`, 'info');
    
    // In a real app, this would load the specific module content
    // For now, we'll just show a status message
    setTimeout(() => {
        showStatus(`${moduleName} module loaded successfully!`, 'success');
    }, 1000);
}

function updatePracticePreview(practiceType) {
    const previewTitle = document.querySelector('.practice-preview h3');
    const previewDescription = document.querySelector('.practice-preview p');
    const previewButton = document.querySelector('.practice-preview button');
    
    previewTitle.textContent = practiceType;
    
    switch(practiceType) {
        case 'Sign Recognition Game':
            previewDescription.textContent = 'Test your knowledge by recognizing signs shown on screen. Use your webcam to practice and get real-time feedback.';
            previewButton.textContent = 'Start Practice';
            break;
        case 'Flashcards':
            previewDescription.textContent = 'Learn and memorize signs with interactive flashcards. Test your recall and track your progress.';
            previewButton.textContent = 'Start Flashcards';
            break;
        case 'Conversation Practice':
            previewDescription.textContent = 'Practice real conversations with guided scenarios. Perfect for building practical signing skills.';
            previewButton.textContent = 'Start Conversation';
            break;
        case 'Speed Challenge':
            previewDescription.textContent = 'How fast can you sign? Test your speed and accuracy with timed challenges.';
            previewButton.textContent = 'Start Challenge';
            break;
        default:
            previewDescription.textContent = 'Select a practice mode to begin.';
            previewButton.textContent = 'Start Practice';
    }
}

function startChallenge() {
    console.log('Starting daily challenge');
    showStatus('Preparing daily challenge...', 'info');
    
    // In a real app, this would load the challenge
    // For now, we'll just show a status message
    setTimeout(() => {
        showStatus('Daily challenge ready!', 'success');
    }, 1000);
}

function showStatus(message, type = 'info') {
    const statusMessage = document.getElementById('statusMessage');
    statusMessage.textContent = message;
    statusMessage.className = 'status-message';
    statusMessage.classList.add(`status-${type}`);
    statusMessage.style.display = 'block';
    
    setTimeout(() => {
        statusMessage.style.opacity = '1';
    }, 10);
    
    setTimeout(() => {
        statusMessage.style.opacity = '0';
        setTimeout(() => {
            statusMessage.style.display = 'none';
        }, 300);
    }, 3000);
}