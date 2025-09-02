/**
 * Test script to populate sample data for dashboard testing
 * Run this in the browser console to generate test data
 */

// Sample user progress data
const sampleUserData = {
    level: 3,
    experience: 750,
    experiencePerLevel: [0, 500, 1000, 1500, 2000, 2500],
    signsMastered: 15,
    streak: 5,
    lastLogin: new Date().toISOString().split('T')[0],
    modules: {
        greetings: {
            name: "Greetings & Basics",
            icon: "fa-handshake",
            description: "Learn essential signs for everyday communication",
            completed_signs: 8,
            total_signs: 10,
            locked: false
        },
        family: {
            name: "Family & Relationships",
            icon: "fa-users",
            description: "Signs for family members and relationships",
            completed_signs: 5,
            total_signs: 10,
            locked: false
        },
        food: {
            name: "Food & Dining",
            icon: "fa-utensils",
            description: "Learn signs related to food and eating",
            completed_signs: 2,
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

// Sample signs mastered log for last 30 days
const sampleSignsMasteredLog = [];
const today = new Date();

for (let i = 29; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    
    // Random number of signs mastered (0-3 per day)
    const signsCount = Math.floor(Math.random() * 4);
    
    if (signsCount > 0) {
        sampleSignsMasteredLog.push({
            date: dateStr,
            signsMasteredCount: signsCount
        });
    }
}

// Sample module data
const sampleGreetingsData = [
    { name: "Hello", mastered: true },
    { name: "Thank You", mastered: true },
    { name: "Please", mastered: true },
    { name: "Sorry", mastered: true },
    { name: "Good Morning", mastered: true },
    { name: "Good Night", mastered: true },
    { name: "Yes", mastered: true },
    { name: "No", mastered: true },
    { name: "Nice to Meet You", mastered: false },
    { name: "How are you?", mastered: false }
];

const sampleFamilyData = [
    { name: "Mother", mastered: true },
    { name: "Father", mastered: true },
    { name: "Sister", mastered: true },
    { name: "Brother", mastered: true },
    { name: "Grandmother", mastered: true },
    { name: "Grandfather", mastered: false },
    { name: "Uncle", mastered: false },
    { name: "Aunt", mastered: false },
    { name: "Cousin", mastered: false },
    { name: "Family", mastered: false }
];

const sampleFoodData = [
    { name: "Eat", mastered: true },
    { name: "Drink", mastered: true },
    { name: "Hungry", mastered: false },
    { name: "Thirsty", mastered: false },
    { name: "Water", mastered: false },
    { name: "Food", mastered: false },
    { name: "Breakfast", mastered: false },
    { name: "Lunch", mastered: false },
    { name: "Dinner", mastered: false },
    { name: "Restaurant", mastered: false }
];

// Sample daily challenge data
const sampleDailyChallenge = {
    title: "Greetings Mastery",
    description: "Practice and perfect 5 different greeting signs in a row with high accuracy.",
    moduleKey: "greetings",
    signCount: 5,
    signs: [
        { name: "Hello", completed: true },
        { name: "Thank You", completed: true },
        { name: "Please", completed: true },
        { name: "Good Morning", completed: true },
        { name: "Yes", completed: true }
    ],
    rewards: {
        points: 50,
        badge: "Greetings Badge"
    }
};

// Function to populate all test data
function populateTestData() {
    console.log('🧪 Populating test data for dashboard...');
    
    // Store user data
    localStorage.setItem('handspeak_user_data', JSON.stringify(sampleUserData));
    
    // Store signs mastered log
    localStorage.setItem('handSpeak_signsMasteredLog', JSON.stringify(sampleSignsMasteredLog));
    
    // Store module data
    localStorage.setItem('handSpeak_module_greetings', JSON.stringify(sampleGreetingsData));
    localStorage.setItem('handSpeak_module_family', JSON.stringify(sampleFamilyData));
    localStorage.setItem('handSpeak_module_food', JSON.stringify(sampleFoodData));
    
    // Store daily challenge data
    localStorage.setItem('handSpeak_dailyChallenge', JSON.stringify(sampleDailyChallenge));
    localStorage.setItem('handSpeak_dailyChallengeComplete', 'true');
    localStorage.setItem('handSpeak_lastChallengeDate', new Date().toISOString().split('T')[0]);
    
    // Store daily streak
    localStorage.setItem('handSpeak_dailyStreak', '5');
    
    console.log('✅ Test data populated successfully!');
    console.log('📊 You can now visit the dashboard to see the sample data.');
}

// Function to clear all test data
function clearTestData() {
    console.log('🗑️ Clearing test data...');
    
    const keysToRemove = [
        'handspeak_user_data',
        'handSpeak_signsMasteredLog',
        'handSpeak_module_greetings',
        'handSpeak_module_family',
        'handSpeak_module_food',
        'handSpeak_dailyChallenge',
        'handSpeak_dailyChallengeComplete',
        'handSpeak_lastChallengeDate',
        'handSpeak_dailyStreak'
    ];
    
    keysToRemove.forEach(key => {
        localStorage.removeItem(key);
    });
    
    console.log('✅ Test data cleared!');
}

// Make functions globally available
window.populateTestData = populateTestData;
window.clearTestData = clearTestData;

console.log('🧪 Dashboard test script loaded!');
console.log('📝 Available functions:');
console.log('  - populateTestData() - Populate sample data');
console.log('  - clearTestData() - Clear all test data');
console.log('💡 Run populateTestData() in the console to generate test data for the dashboard.');
