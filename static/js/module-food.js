/**
 * HandSpeak - Food & Dining Module
 * Client-side functionality for the Food & Dining learning module
 */

// DOM Elements
const elements = {
    // Progress elements
    completedSigns: document.getElementById('completedSigns'),
    totalSigns: document.getElementById('totalSigns'),
    moduleProgressBar: document.getElementById('moduleProgressBar'),
    
    // Sign display elements
    signVideo: document.getElementById('signVideo'),
    signName: document.getElementById('signName'),
    signDescription: document.getElementById('signDescription'),
    masteryBadge: document.getElementById('masteryBadge'),
    
    // Practice elements
    startPracticeBtn: document.getElementById('startPracticeBtn'),
    webcamFeed: document.getElementById('webcamFeed'),
    feedbackOverlay: document.getElementById('feedbackOverlay'),
    feedbackText: document.getElementById('feedbackText'),
    currentSign: document.getElementById('currentSign'),
    
    // Navigation buttons
    prevSignBtn: document.getElementById('prevSignBtn'),
    nextSignBtn: document.getElementById('nextSignBtn'),
    completeModuleBtn: document.getElementById('completeModuleBtn'),
    
    // Status message
    statusMessage: document.getElementById('statusMessage')
};

// Module data - signs for the Food & Dining module
const signsData = [
    {
        name: "Eat",
        videoUrl: "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExcDdtY2JxZXVnOGQwcWRnNGZxNnJxZnBnZnRvNWJvMGZlcWFxdmJmZiZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/3o7TKNthed4OG7T5Je/giphy.gif",
        description: "To sign 'Eat', bring your dominant hand to your mouth with your fingers and thumb together as if holding food, then tap your mouth a couple of times.",
        mastered: false
    },
    {
        name: "Drink",
        videoUrl: "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExcDdtY2JxZXVnOGQwcWRnNGZxNnJxZnBnZnRvNWJvMGZlcWFxdmJmZiZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/3o7TKNthed4OG7T5Je/giphy.gif",
        description: "To sign 'Drink', shape your hand as if holding a cup with your thumb against your fingers, then bring it to your mouth.",
        mastered: false
    },
    {
        name: "Hungry",
        videoUrl: "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExcDdtY2JxZXVnOGQwcWRnNGZxNnJxZnBnZnRvNWJvMGZlcWFxdmJmZiZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/3o7TKNthed4OG7T5Je/giphy.gif",
        description: "To sign 'Hungry', make a C shape with your hand and draw it down from your throat to your stomach.",
        mastered: false
    },
    {
        name: "Thirsty",
        videoUrl: "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExcDdtY2JxZXVnOGQwcWRnNGZxNnJxZnBnZnRvNWJvMGZlcWFxdmJmZiZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/3o7TKNthed4OG7T5Je/giphy.gif",
        description: "To sign 'Thirsty', extend your index finger and draw it down your throat.",
        mastered: false
    },
    {
        name: "Water",
        videoUrl: "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExcDdtY2JxZXVnOGQwcWRnNGZxNnJxZnBnZnRvNWJvMGZlcWFxdmJmZiZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/3o7TKNthed4OG7T5Je/giphy.gif",
        description: "To sign 'Water', make a W handshape (three middle fingers extended) and tap it to your chin.",
        mastered: false
    },
    {
        name: "Food",
        videoUrl: "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExcDdtY2JxZXVnOGQwcWRnNGZxNnJxZnBnZnRvNWJvMGZlcWFxdmJmZiZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/3o7TKNthed4OG7T5Je/giphy.gif",
        description: "To sign 'Food', bring your dominant hand's fingertips together to your mouth a couple of times.",
        mastered: false
    },
    {
        name: "Breakfast",
        videoUrl: "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExcDdtY2JxZXVnOGQwcWRnNGZxNnJxZnBnZnRvNWJvMGZlcWFxdmJmZiZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/3o7TKNthed4OG7T5Je/giphy.gif",
        description: "To sign 'Breakfast', first sign 'morning' by drawing a half-circle from east to west, then sign 'eat'.",
        mastered: false
    },
    {
        name: "Lunch",
        videoUrl: "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExcDdtY2JxZXVnOGQwcWRnNGZxNnJxZnBnZnRvNWJvMGZlcWFxdmJmZiZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/3o7TKNthed4OG7T5Je/giphy.gif",
        description: "To sign 'Lunch', make an L handshape with your dominant hand and move it from your non-dominant palm upward to your mouth.",
        mastered: false
    },
    {
        name: "Dinner",
        videoUrl: "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExcDdtY2JxZXVnOGQwcWRnNGZxNnJxZnBnZnRvNWJvMGZlcWFxdmJmZiZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/3o7TKNthed4OG7T5Je/giphy.gif",
        description: "To sign 'Dinner', make a D handshape with your dominant hand and move it from your non-dominant palm upward to your mouth.",
        mastered: false
    },
    {
        name: "Restaurant",
        videoUrl: "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExcDdtY2JxZXVnOGQwcWRnNGZxNnJxZnBnZnRvNWJvMGZlcWFxdmJmZiZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/3o7TKNthed4OG7T5Je/giphy.gif",
        description: "To sign 'Restaurant', make an R handshape with your dominant hand and move it in a small circle near your mouth.",
        mastered: false
    }
];

// Module state
let state = {
    currentSignIndex: 0,
    isPracticing: false,
    webcamActive: false,
    stream: null,
    recognitionInterval: null,
    allSignsMastered: false
};

// Local storage key for this module
const STORAGE_KEY = 'handSpeak_module_food';

/**
 * Initialize the module
 */
function initModule() {
    // Load module data from local storage or use default
    loadModuleData();
    
    // Update UI with current sign
    updateSignDisplay();
    updateProgressUI();
    
    // Set up event listeners
    setupEventListeners();
    
    // Check if all signs are mastered
    checkAllSignsMastered();
}

/**
 * Load module data from local storage
 */
function loadModuleData() {
    const savedData = localStorage.getItem(STORAGE_KEY);
    
    if (savedData) {
        const parsedData = JSON.parse(savedData);
        
        // Update mastery status from saved data
        parsedData.forEach((savedSign, index) => {
            if (index < signsData.length) {
                signsData[index].mastered = savedSign.mastered;
            }
        });
    }
    
    // Update total signs count in UI
    elements.totalSigns.textContent = signsData.length;
}

/**
 * Save module data to local storage
 */
function saveModuleData() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(signsData));
    
    // Also update the main learn page data
    updateMainLearnData();
}

/**
 * Update the main learn page data in local storage
 */
function updateMainLearnData() {
    const learnData = JSON.parse(localStorage.getItem('handSpeak_userData')) || {
        level: 1,
        experience: 0,
        signsMastered: 0,
        streak: { current: 0, lastLogin: null },
        modules: {}
    };
    
    // Count mastered signs
    const masteredCount = signsData.filter(sign => sign.mastered).length;
    
    // Update the Food & Dining module data
    learnData.modules.foodDining = {
        name: "Food & Dining",
        completed: masteredCount,
        total: signsData.length,
        locked: false,
        unlockLevel: 3 // Assuming this module unlocks at level 3
    };
    
    // If all signs are mastered, add experience points
    if (masteredCount === signsData.length && !state.allSignsMastered) {
        learnData.experience += 100; // Bonus for completing the module
        state.allSignsMastered = true;
    }
    
    // Update signs mastered count
    learnData.signsMastered = (learnData.modules.greetingsBasics?.completed || 0) + 
        (learnData.modules.familyRelationships?.completed || 0) + 
        masteredCount + 
        (learnData.modules.questionsConversations?.completed || 0);
    
    // Save updated data
    localStorage.setItem('handSpeak_userData', JSON.stringify(learnData));
}

/**
 * Set up event listeners for buttons and interactions
 */
function setupEventListeners() {
    // Navigation buttons
    elements.prevSignBtn.addEventListener('click', showPreviousSign);
    elements.nextSignBtn.addEventListener('click', showNextSign);
    elements.completeModuleBtn.addEventListener('click', completeModule);
    
    // Practice button
    elements.startPracticeBtn.addEventListener('click', togglePractice);
}

/**
 * Update the sign display with the current sign
 */
function updateSignDisplay() {
    const currentSign = signsData[state.currentSignIndex];
    
    // Update sign information
    elements.signName.textContent = currentSign.name;
    elements.signDescription.textContent = currentSign.description;
    elements.signVideo.src = currentSign.videoUrl;
    elements.signVideo.alt = `${currentSign.name} sign demonstration`;
    
    // Update current sign in practice section
    elements.currentSign.textContent = currentSign.name;
    
    // Show/hide mastery badge
    elements.masteryBadge.style.display = currentSign.mastered ? 'inline-flex' : 'none';
    
    // Update navigation buttons
    elements.prevSignBtn.disabled = state.currentSignIndex === 0;
    elements.nextSignBtn.disabled = state.currentSignIndex === signsData.length - 1;
}

/**
 * Update the progress UI (progress bar and completed count)
 */
function updateProgressUI() {
    const completedCount = signsData.filter(sign => sign.mastered).length;
    const progressPercentage = (completedCount / signsData.length) * 100;
    
    elements.completedSigns.textContent = completedCount;
    elements.moduleProgressBar.style.width = `${progressPercentage}%`;
    
    // Show complete module button if all signs are mastered
    if (completedCount === signsData.length) {
        elements.completeModuleBtn.style.display = 'block';
    } else {
        elements.completeModuleBtn.style.display = 'none';
    }
}

/**
 * Check if all signs are mastered
 */
function checkAllSignsMastered() {
    state.allSignsMastered = signsData.every(sign => sign.mastered);
    
    if (state.allSignsMastered) {
        elements.completeModuleBtn.style.display = 'block';
    }
}

/**
 * Show the previous sign
 */
function showPreviousSign() {
    if (state.currentSignIndex > 0) {
        state.currentSignIndex--;
        updateSignDisplay();
        
        // Stop practice if active
        if (state.isPracticing) {
            togglePractice();
        }
    }
}

/**
 * Show the next sign
 */
function showNextSign() {
    if (state.currentSignIndex < signsData.length - 1) {
        state.currentSignIndex++;
        updateSignDisplay();
        
        // Stop practice if active
        if (state.isPracticing) {
            togglePractice();
        }
    }
}

/**
 * Toggle practice mode
 */
function togglePractice() {
    if (state.isPracticing) {
        stopPractice();
    } else {
        startPractice();
    }
}

/**
 * Start practice mode
 */
function startPractice() {
    elements.startPracticeBtn.textContent = 'Stop Practice';
    elements.startPracticeBtn.classList.add('btn-secondary');
    elements.startPracticeBtn.classList.remove('btn-primary');
    state.isPracticing = true;
    
    // Start webcam
    startWebcam();
    
    // Start sign recognition simulation
    startSignRecognition();
}

/**
 * Stop practice mode
 */
function stopPractice() {
    elements.startPracticeBtn.textContent = 'Start Practice';
    elements.startPracticeBtn.classList.add('btn-primary');
    elements.startPracticeBtn.classList.remove('btn-secondary');
    state.isPracticing = false;
    
    // Stop webcam
    stopWebcam();
    
    // Stop sign recognition
    stopSignRecognition();
    
    // Hide feedback overlay
    elements.feedbackOverlay.classList.remove('visible', 'correct', 'incorrect');
}

/**
 * Start webcam
 */
function startWebcam() {
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        navigator.mediaDevices.getUserMedia({ video: true })
            .then(function(stream) {
                elements.webcamFeed.srcObject = stream;
                state.stream = stream;
                state.webcamActive = true;
            })
            .catch(function(error) {
                console.error("Error accessing webcam:", error);
                showStatus('Unable to access webcam. Please check permissions.', 'error');
            });
    } else {
        showStatus('Webcam not supported in this browser.', 'error');
    }
}

/**
 * Stop webcam
 */
function stopWebcam() {
    if (state.stream) {
        state.stream.getTracks().forEach(track => track.stop());
        elements.webcamFeed.srcObject = null;
        state.webcamActive = false;
        state.stream = null;
    }
}

/**
 * Start sign recognition (simulated)
 */
function startSignRecognition() {
    // In a real implementation, this would connect to the sign recognition model
    // For now, we'll simulate recognition with random success after a delay
    
    state.recognitionInterval = setInterval(() => {
        // Simulate recognition with 30% chance of success
        const isCorrect = Math.random() < 0.3;
        
        if (isCorrect) {
            // Show success feedback
            showFeedback(true);
            
            // Mark current sign as mastered
            signsData[state.currentSignIndex].mastered = true;
            logSignMastered();
            
            // Update UI
            updateSignDisplay();
            updateProgressUI();
            
            // Save progress
            saveModuleData();
            
            // Stop practice
            stopPractice();
            
            // Check if all signs are mastered
            checkAllSignsMastered();
        } else {
            // Occasionally show incorrect feedback
            if (Math.random() < 0.2) {
                showFeedback(false);
            }
        }
    }, 3000); // Check every 3 seconds
}

/**
 * Stop sign recognition
 */
function stopSignRecognition() {
    if (state.recognitionInterval) {
        clearInterval(state.recognitionInterval);
        state.recognitionInterval = null;
    }
}

/**
 * Show feedback overlay
 */
function showFeedback(isCorrect) {
    elements.feedbackOverlay.classList.remove('correct', 'incorrect');
    
    if (isCorrect) {
        elements.feedbackOverlay.classList.add('correct');
        elements.feedbackText.textContent = 'Perfect!';
    } else {
        elements.feedbackOverlay.classList.add('incorrect');
        elements.feedbackText.textContent = 'Try Again';
    }
    
    elements.feedbackOverlay.classList.add('visible');
    
    // Hide feedback after 2 seconds
    setTimeout(() => {
        elements.feedbackOverlay.classList.remove('visible');
    }, 2000);
}

/**
 * Complete the module and return to the learn page
 */
function completeModule() {
    // Ensure all signs are marked as mastered
    if (state.allSignsMastered) {
        showStatus('Module completed! Redirecting to Learn page...', 'success');
        
        // In a real implementation, this would update user progress and redirect
        setTimeout(() => {
            window.location.href = '/learn';
        }, 1500);
    } else {
        showStatus('Master all signs to complete this module!', 'error');
    }
}

/**
 * Show a status message
 */
function showStatus(message, type = 'info') {
    elements.statusMessage.textContent = message;
    elements.statusMessage.className = 'status-message';
    elements.statusMessage.classList.add(`status-${type}`);
    elements.statusMessage.style.display = 'block';
    
    setTimeout(() => {
        elements.statusMessage.style.opacity = '1';
    }, 10);
    
    setTimeout(() => {
        elements.statusMessage.style.opacity = '0';
        setTimeout(() => {
            elements.statusMessage.style.display = 'none';
        }, 300);
    }, 3000);
}

/**
 * Log a sign as mastered for daily tracking
 */
function logSignMastered() {
    const today = new Date().toISOString().split('T')[0];
    let signsMasteredLog = JSON.parse(localStorage.getItem('handSpeak_signsMasteredLog') || '[]');
    
    // Find today's entry or create a new one
    let todayEntry = signsMasteredLog.find(entry => entry.date === today);
    
    if (todayEntry) {
        todayEntry.signsMasteredCount += 1;
    } else {
        signsMasteredLog.push({
            date: today,
            signsMasteredCount: 1
        });
    }
    
    // Keep only last 30 days of data
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const cutoffDate = thirtyDaysAgo.toISOString().split('T')[0];
    
    signsMasteredLog = signsMasteredLog.filter(entry => entry.date >= cutoffDate);
    
    localStorage.setItem('handSpeak_signsMasteredLog', JSON.stringify(signsMasteredLog));
}

// Initialize the module when the page loads
document.addEventListener('DOMContentLoaded', initModule);