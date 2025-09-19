// DOM elements
const startLearningBtn = document.getElementById('startLearningBtn');
const viewProgressBtn = document.getElementById('viewProgressBtn');
const moduleButtons = document.querySelectorAll('.module-btn');
const practiceOptions = document.querySelectorAll('.practice-option');
const challengeBtn = document.querySelector('.challenge-btn');

/**
 * Log signs mastered for daily tracking
 */
function logSignsMastered(count) {
    const today = new Date().toISOString().split('T')[0];
    let signsMasteredLog = JSON.parse(localStorage.getItem('handSpeak_signsMasteredLog') || '[]');
    
    // Find today's entry or create a new one
    let todayEntry = signsMasteredLog.find(entry => entry.date === today);
    
    if (todayEntry) {
        todayEntry.signsMasteredCount += count;
    } else {
        signsMasteredLog.push({
            date: today,
            signsMasteredCount: count
        });
    }
    
    // Keep only last 30 days of data
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const cutoffDate = thirtyDaysAgo.toISOString().split('T')[0];
    
    signsMasteredLog = signsMasteredLog.filter(entry => entry.date >= cutoffDate);
    
    localStorage.setItem('handSpeak_signsMasteredLog', JSON.stringify(signsMasteredLog));
}

// Initialize the learning page
document.addEventListener('DOMContentLoaded', function() {
    console.log('🎮 HandSpeak Learning Module initialized');
    
    // Initialize user data if first visit
    initializeUserData();
    
    // Set up event listeners
    setupEventListeners();
    
    // Load and display user progress
    loadUserProgress();
    
    // Check for daily challenge
    checkDailyChallenge();
    
    // Update streak
    updateStreak();
});

/**
 * Initialize user data in localStorage if it doesn't exist
 */
function initializeUserData() {
    if (!localStorage.getItem('handspeak_user_data')) {
        const initialData = {
            level: 1,
            experience: 0,
            experiencePerLevel: [0, 500, 1000, 1500, 2000, 2500],
            signsMastered: 0,
            streak: 0,
            lastLogin: new Date().toISOString().split('T')[0],
            modules: {
                greetings: {
                    name: "Greetings & Basics",
                    icon: "fa-handshake",
                    description: "Learn essential signs for everyday communication",
                    completed_signs: 0,
                    total_signs: 10,
                    locked: false
                },
                family: {
                    name: "Family & Relationships",
                    icon: "fa-users",
                    description: "Signs for family members and relationships",
                    completed_signs: 0,
                    total_signs: 10,
                    locked: false
                },
                food: {
                    name: "Food & Dining",
                    icon: "fa-utensils",
                    description: "Learn signs related to food and eating",
                    completed_signs: 0,
                    total_signs: 10,
                    locked: false
                },
                questions: {
                    name: "Questions & Conversations",
                    icon: "fa-comments",
                    description: "Advanced signs for interactive conversations",
                    completed_signs: 0,
                    total_signs: 10,
                    locked: true,
                    unlockLevel: 5
                }
            },
            dailyChallenge: null
        };
        
        localStorage.setItem('handspeak_user_data', JSON.stringify(initialData));
    }
}

/**
 * Set up all event listeners for the page
 */
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
    moduleButtons.forEach((button, index) => {
        button.addEventListener('click', function(e) {
            const moduleCard = e.target.closest('.module-card');
            if (moduleCard.classList.contains('locked')) {
                const userData = getUserData();
                const requiredLevel = userData.modules.questions.unlockLevel;
                showStatus(`This module is locked. Reach Level ${requiredLevel} to unlock it!`, 'info');
                return;
            }
            
            // Map module names to their respective moduleIds
            const moduleName = moduleCard.querySelector('h3').textContent;
            let moduleId;
            
            if (moduleName === 'Greetings & Basics') {
                moduleId = 'greetings';
            } else if (moduleName === 'Family & Relationships') {
                moduleId = 'family';
            } else if (moduleName === 'Food & Dining') {
                moduleId = 'food';
            } else if (moduleName === 'Questions & Conversations') {
                moduleId = 'questions';
            }
            
            startModule(moduleId);
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
    
    // Practice start button
    const practiceStartBtn = document.querySelector('.practice-preview button');
    practiceStartBtn.addEventListener('click', function() {
        const practiceType = document.querySelector('.practice-option.active span').textContent;
        startPracticeMode(practiceType);
    });
    
    // Challenge button
    challengeBtn.addEventListener('click', function() {
        startChallenge();
    });
}

/**
 * Get user data from localStorage
 */
function getUserData() {
    const userData = JSON.parse(localStorage.getItem('handspeak_user_data'));
    return userData;
}

/**
 * Save user data to localStorage
 */
function saveUserData(userData) {
    localStorage.setItem('handspeak_user_data', JSON.stringify(userData));
}

/**
 * Load and display user progress on the page
 */
function loadUserProgress() {
    const userData = getUserData();
    
    // Update level and progress bar
    updateLearningJourney(userData);
    
    // Update signs mastered
    document.querySelector('.progress-card:nth-child(2) h3').textContent = `${userData.signsMastered} Signs Mastered`;
    
    // Update streak
    document.querySelector('.progress-card:nth-child(3) h3').textContent = `${userData.streak} Day Streak`;
    
    // Update modules
    renderModules(userData);
}

/**
 * Update the learning journey section with level and progress
 */
function updateLearningJourney(userData) {
    const levelDisplay = document.querySelector('.progress-card:first-child h3');
    const progressFill = document.querySelector('.progress-card:first-child .progress-fill');
    const progressText = document.querySelector('.progress-card:first-child p');
    
    const currentLevel = userData.level;
    const nextLevel = currentLevel + 1;
    
    // Calculate progress percentage to next level
    const currentLevelXP = userData.experiencePerLevel[currentLevel - 1] || 0;
    const nextLevelXP = userData.experiencePerLevel[currentLevel] || (currentLevelXP + 500);
    const xpForNextLevel = nextLevelXP - currentLevelXP;
    const currentXP = userData.experience - currentLevelXP;
    const progressPercent = Math.min(Math.floor((currentXP / xpForNextLevel) * 100), 100);
    
    // Update the DOM
    levelDisplay.textContent = `Level ${currentLevel}`;
    progressFill.style.width = `${progressPercent}%`;
    progressText.textContent = `${progressPercent}% to Level ${nextLevel}`;
}

/**
 * Render all learning modules based on user data
 */
function renderModules(userData) {
    const moduleCards = document.querySelectorAll('.module-card');
    
    // Map module cards to module keys
    const moduleKeys = ['greetings', 'family', 'food', 'questions'];
    
    moduleCards.forEach((card, index) => {
        const moduleKey = moduleKeys[index];
        const module = userData.modules[moduleKey];
        
        if (!module) return;
        
        // Update progress bar
        const progressBar = card.querySelector('.progress-bar .progress-fill');
        const progressText = card.querySelector('.module-progress span');
        const progressPercent = module.completed_signs / module.total_signs * 100;
        
        progressBar.style.width = `${progressPercent}%`;
        progressText.textContent = `${module.completed_signs}/${module.total_signs} Completed`;
        
        // Update button text
        const button = card.querySelector('.module-btn');
        button.textContent = module.completed_signs > 0 ? 'Continue' : 'Start';
        
        // Handle locked state
        if (module.locked) {
            card.classList.add('locked');
            button.textContent = `Unlock at Level ${module.unlockLevel}`;
        } else {
            card.classList.remove('locked');
        }
    });
}

/**
 * Check and update user streak
 */
function updateStreak() {
    const userData = getUserData();
    const today = new Date().toISOString().split('T')[0];
    const lastLogin = userData.lastLogin;
    
    if (lastLogin !== today) {
        // Check if it's a consecutive day
        const lastDate = new Date(lastLogin);
        const currentDate = new Date(today);
        
        // Calculate the difference in days
        const timeDiff = currentDate.getTime() - lastDate.getTime();
        const dayDiff = Math.floor(timeDiff / (1000 * 3600 * 24));
        
        if (dayDiff === 1) {
            // Consecutive day, increment streak
            userData.streak += 1;
        } else if (dayDiff > 1) {
            // Missed a day, reset streak
            userData.streak = 1;
        }
        
        // Update last login
        userData.lastLogin = today;
        saveUserData(userData);
        
        // Update streak display
        document.querySelector('.progress-card:nth-child(3) h3').textContent = `${userData.streak} Day Streak`;
    }
}

/**
 * Check for daily challenge and create one if needed
 */
function checkDailyChallenge() {
    const userData = getUserData();
    const today = new Date().toISOString().split('T')[0];
    const lastChallengeDate = localStorage.getItem('handSpeak_lastChallengeDate');
    
    // Check if we need to generate a new daily challenge
    if (!lastChallengeDate || lastChallengeDate !== today) {
        // Check if user completed yesterday's challenge for streak management
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split('T')[0];
        
        // Get current streak from localStorage or initialize it
        let dailyStreak = parseInt(localStorage.getItem('handSpeak_dailyStreak') || '0');
        
        // If yesterday's challenge was completed, increment streak
        // Otherwise reset streak (unless it's user's first day)
        if (lastChallengeDate === yesterdayStr && localStorage.getItem('handSpeak_dailyChallengeComplete') === 'true') {
            dailyStreak += 1;
        } else if (lastChallengeDate && lastChallengeDate !== yesterdayStr) {
            dailyStreak = 0;
        }
        
        // Save updated streak
        localStorage.setItem('handSpeak_dailyStreak', dailyStreak.toString());
        
        // Generate a new challenge with signs from learned modules
        const challenge = generateDailyChallenge(userData);
        
        // Store the challenge in localStorage
        localStorage.setItem('handSpeak_dailyChallenge', JSON.stringify(challenge));
        localStorage.setItem('handSpeak_dailyChallengeComplete', 'false');
        
        // Update UI to show current streak
        document.querySelector('.progress-card:nth-child(3) h3').textContent = `${dailyStreak} Day Streak`;
    }
    
    // Display the challenge
    const challengeData = JSON.parse(localStorage.getItem('handSpeak_dailyChallenge') || '{}');
    displayDailyChallenge(challengeData);
}

/**
 * Generate a daily challenge based on user's progress
 */
function generateDailyChallenge(userData) {
    // Get all modules that have at least one completed sign
    const availableModules = Object.entries(userData.modules)
        .filter(([key, module]) => !module.locked && module.completed_signs > 0)
        .map(([key, module]) => ({ key, name: module.name }));
    
    // If no modules are available, default to greetings
    if (availableModules.length === 0) {
        return {
            title: "Greetings Mastery",
            description: "Practice and perfect 5 different greeting signs in a row with high accuracy.",
            moduleKey: "greetings",
            signCount: 5,
            signs: [], // Will be populated when challenge starts
            rewards: {
                points: 50,
                badge: "Greetings Badge"
            }
        };
    }
    
    // Randomly select a module
    const selectedModule = availableModules[Math.floor(Math.random() * availableModules.length)];
    
    // Generate challenge details
    return {
        title: `${selectedModule.name.split(' ')[0]} Mastery`,
        description: `Practice and perfect 5 different ${selectedModule.name.toLowerCase()} signs in a row with high accuracy.`,
        moduleKey: selectedModule.key,
        signCount: 5,
        signs: [], // Will be populated when challenge starts
        rewards: {
            points: 50,
            badge: `${selectedModule.name.split(' ')[0]} Badge`
        }
    };
}

/**
 * Display the daily challenge on the page
 */
function displayDailyChallenge(challenge) {
    const challengeTitle = document.querySelector('.challenge-header h3');
    const challengeDescription = document.querySelector('.challenge-card > p');
    const rewardPoints = document.querySelector('.reward:first-child span');
    const rewardBadge = document.querySelector('.reward:last-child span');
    const challengeBtn = document.querySelector('.challenge-btn');
    
    if (!challenge || Object.keys(challenge).length === 0) {
        // Handle case where challenge data is missing
        return;
    }
    
    challengeTitle.textContent = `Today's Challenge: ${challenge.title}`;
    challengeDescription.textContent = challenge.description;
    rewardPoints.textContent = `${challenge.rewards.points} Points`;
    rewardBadge.textContent = challenge.rewards.badge;
    
    // Update button state if challenge is completed
    const isCompleted = localStorage.getItem('handSpeak_dailyChallengeComplete') === 'true';
    if (isCompleted) {
        challengeBtn.textContent = 'Completed';
        challengeBtn.disabled = true;
        challengeBtn.classList.add('btn-secondary');
        challengeBtn.classList.remove('btn-primary');
    } else {
        challengeBtn.textContent = 'Start Challenge';
        challengeBtn.disabled = false;
        challengeBtn.classList.add('btn-primary');
        challengeBtn.classList.remove('btn-secondary');
    }
}

/**
 * Start the daily challenge
 */
function startChallenge() {
    console.log('Starting daily challenge');
    showStatus('Preparing daily challenge...', 'info');
    
    // Get the challenge data
    const challengeData = JSON.parse(localStorage.getItem('handSpeak_dailyChallenge') || '{}');
    if (!challengeData || Object.keys(challengeData).length === 0) {
        showStatus('Error: Challenge data not found', 'error');
        return;
    }
    
    // Get signs from the selected module
    const moduleKey = challengeData.moduleKey;
    const userData = getUserData();
    
    // In a real implementation, we would load the actual signs from the module
    // For this implementation, we'll simulate by creating placeholder signs
    const challengeSigns = [];
    for (let i = 0; i < challengeData.signCount; i++) {
        challengeSigns.push({
            name: `${moduleKey.charAt(0).toUpperCase() + moduleKey.slice(1)} Sign ${i+1}`,
            completed: false
        });
    }
    
    // Update the challenge with selected signs
    challengeData.signs = challengeSigns;
    localStorage.setItem('handSpeak_dailyChallenge', JSON.stringify(challengeData));
    
    // In a real implementation, this would navigate to a challenge page
    // For this implementation, we'll create a modal to display the challenge
    createChallengeModal(challengeData);
}

/**
 * Create a modal to display the challenge
 */
function createChallengeModal(challengeData) {
    const modal = document.createElement('div');
    modal.className = 'challenge-modal';
    modal.style.position = 'fixed';
    modal.style.top = '0';
    modal.style.left = '0';
    modal.style.width = '100%';
    modal.style.height = '100%';
    modal.style.backgroundColor = 'var(--bg)';
    modal.style.backdropFilter = 'blur(8px)';
    modal.style.display = 'flex';
    modal.style.justifyContent = 'center';
    modal.style.alignItems = 'center';
    modal.style.zIndex = '1000';
    
    const modalContent = document.createElement('div');
    modalContent.className = 'challenge-modal-content';
    modalContent.style.backgroundColor = 'var(--card)';
    modalContent.style.padding = '2rem';
    modalContent.style.borderRadius = '12px';
    modalContent.style.width = '80%';
    modalContent.style.maxWidth = '600px';
    modalContent.style.maxHeight = '80%';
    modalContent.style.overflowY = 'auto';
    modalContent.style.color = 'var(--text)';
    modalContent.style.boxShadow = '0 8px 32px rgba(0, 0, 0, 0.2)';
    
    // Create modal header
    const modalHeader = document.createElement('div');
    modalHeader.innerHTML = `<h2>Daily Challenge: ${challengeData.title}</h2>`;
    modalHeader.style.marginBottom = '1rem';
    
    // Create signs list
    const signsList = document.createElement('div');
    signsList.className = 'challenge-signs-list';
    
    challengeData.signs.forEach((sign, index) => {
        const signItem = document.createElement('div');
        signItem.className = 'challenge-sign-item';
        signItem.style.display = 'flex';
        signItem.style.alignItems = 'center';
        signItem.style.justifyContent = 'space-between';
        signItem.style.padding = '1rem';
        signItem.style.margin = '0.5rem 0';
        signItem.style.backgroundColor = 'var(--card-soft)';
        signItem.style.borderRadius = '4px';
        
        signItem.innerHTML = `
            <span>${sign.name}</span>
            <button class="btn btn-primary practice-sign-btn" data-index="${index}">Practice</button>
        `;
        
        signsList.appendChild(signItem);
    });
    
    // Create modal footer
    const modalFooter = document.createElement('div');
    modalFooter.style.marginTop = '1.5rem';
    modalFooter.style.display = 'flex';
    modalFooter.style.justifyContent = 'space-between';
    
    const closeButton = document.createElement('button');
    closeButton.className = 'btn';
    closeButton.style.backgroundColor = 'var(--card-soft)';
    closeButton.style.color = 'var(--text)';
    closeButton.style.border = '1px solid var(--primary)';
    closeButton.style.padding = '0.5rem 1.5rem';
    closeButton.style.borderRadius = '6px';
    closeButton.textContent = 'Close';
    closeButton.onclick = () => document.body.removeChild(modal);
    
    const completeButton = document.createElement('button');
    completeButton.className = 'btn btn-primary';
    completeButton.textContent = 'Complete Challenge';
    completeButton.onclick = () => {
        completeDailyChallenge();
        document.body.removeChild(modal);
    };
    
    modalFooter.appendChild(closeButton);
    modalFooter.appendChild(completeButton);
    
    // Assemble modal
    modalContent.appendChild(modalHeader);
    modalContent.appendChild(signsList);
    modalContent.appendChild(modalFooter);
    modal.appendChild(modalContent);
    
    // Add modal to page
    document.body.appendChild(modal);
    
    // Add event listeners to practice buttons
    document.querySelectorAll('.practice-sign-btn').forEach(button => {
        button.addEventListener('click', function() {
            const index = parseInt(this.getAttribute('data-index'));
            simulatePractice(index, this);
        });
    });
}

/**
 * Simulate practicing a sign
 */
function simulatePractice(signIndex, button) {
    button.textContent = 'Practicing...';
    button.disabled = true;
    
    // Simulate practice delay
    setTimeout(() => {
        // Get challenge data
        const challengeData = JSON.parse(localStorage.getItem('handSpeak_dailyChallenge'));
        
        // Mark sign as completed
        challengeData.signs[signIndex].completed = true;
        
        // Save updated challenge data
        localStorage.setItem('handSpeak_dailyChallenge', JSON.stringify(challengeData));
        
        // Update button
        button.textContent = 'Completed';
        button.classList.remove('btn-primary');
        button.classList.add('btn-success');
        
        // Check if all signs are completed
        const allCompleted = challengeData.signs.every(sign => sign.completed);
        if (allCompleted) {
            document.querySelector('.challenge-modal-content button.btn-primary').textContent = 'Complete Challenge ✓';
        }
    }, 2000);
}

/**
 * Complete the daily challenge
 */
function completeDailyChallenge() {
    // Get challenge data
    const challengeData = JSON.parse(localStorage.getItem('handSpeak_dailyChallenge'));
    
    // Check if all signs are completed
    const allCompleted = challengeData.signs.every(sign => sign.completed);
    if (!allCompleted) {
        showStatus('Complete all signs before finishing the challenge!', 'error');
        return;
    }
    
    // Mark challenge as completed
    localStorage.setItem('handSpeak_dailyChallengeComplete', 'true');
    localStorage.setItem('handSpeak_lastChallengeDate', new Date().toISOString().split('T')[0]);
    
    // Update user data
    const userData = getUserData();
    
    // Add experience points
    userData.experience += challengeData.rewards.points;
    
    // Increment signs mastered
    userData.signsMastered += challengeData.signCount;
    
    // Log signs mastered for daily tracking
    logSignsMastered(challengeData.signCount);
    
    // Check for level up
    checkForLevelUp(userData);
    
    // Save updated user data
    saveUserData(userData);
    
    // Update UI
    loadUserProgress();
    displayDailyChallenge(challengeData);
    
    showStatus(`Daily challenge completed! You earned ${challengeData.rewards.points} points and the ${challengeData.rewards.badge}!`, 'success');
}

/**
 * Helper function to scroll to a section
 */
function scrollToSection(selector) {
    const section = document.querySelector(selector);
    if (section) {
        section.scrollIntoView({ behavior: 'smooth' });
    }
}

/**
 * Show a status message
 */
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

/**
 * Start a learning module
 */
function startModule(moduleId) {
    console.log(`Starting module: ${moduleId}`);
    
    // Save current module to localStorage
    localStorage.setItem('handSpeak_currentModule', moduleId);
    
    // Redirect to the appropriate module page
    if (moduleId === 'greetings') {
            window.location.href = '/module-greetings';
    } else if (moduleId === 'family') {
        window.location.href = '/module-family';
    } else if (moduleId === 'food') {
        window.location.href = '/module-food';
    } else if (moduleId === 'questions') {
        window.location.href = '/module-questions';
    }
}