/**
 * UnSpoken Dashboard - User Progress Visualization
 * Client-side functionality for the user dashboard
 */

// Chart instances
let progressChart = null;
let moduleChart = null;

// Dashboard data
let dashboardData = {
    userProgress: null,
    signsMasteredLog: [],
    moduleData: {},
    dailyStreak: 0,
    dailyChallengeHistory: []
};

/**
 * Initialize the dashboard
 */
document.addEventListener('DOMContentLoaded', function() {
    console.log('📊 UnSpoken Dashboard initialized');
    
    // Load and aggregate all data
    loadDashboardData();
    
    // Update UI with loaded data
    updateMetricsDisplay();
    
    // Render charts
    renderCharts();
    
    // Load daily challenge history
    loadDailyChallengeHistory();
});

/**
 * Load and aggregate all dashboard data from localStorage
 */
function loadDashboardData() {
    console.log('📈 Loading dashboard data...');
    
    // Load main user progress data
    dashboardData.userProgress = JSON.parse(localStorage.getItem('unspoken_user_data') || '{}');
    
    // Load signs mastered log
    dashboardData.signsMasteredLog = JSON.parse(localStorage.getItem('unSpoken_signsMasteredLog') || '[]');
    
    // Load daily streak
    dashboardData.dailyStreak = parseInt(localStorage.getItem('unSpoken_dailyStreak') || '0');
    
    // Load module data
    loadModuleData();
    
    // Load daily challenge history
    loadDailyChallengeData();
    
    console.log('✅ Dashboard data loaded:', dashboardData);
}

/**
 * Load data from all learning modules
 */
function loadModuleData() {
    const moduleKeys = ['unSpoken_module_greetings', 'unSpoken_module_family', 'unSpoken_module_food'];
    
    moduleKeys.forEach(key => {
        const moduleData = JSON.parse(localStorage.getItem(key) || '[]');
        const moduleName = getModuleDisplayName(key);
        
        if (moduleData.length > 0) {
            const masteredCount = moduleData.filter(sign => sign.mastered).length;
            dashboardData.moduleData[moduleName] = {
                completed: masteredCount,
                total: moduleData.length,
                percentage: Math.round((masteredCount / moduleData.length) * 100)
            };
        } else {
            dashboardData.moduleData[moduleName] = {
                completed: 0,
                total: 10, // Default total for each module
                percentage: 0
            };
        }
    });
}

/**
 * Get display name for module key
 */
function getModuleDisplayName(key) {
    const nameMap = {
        'unSpoken_module_greetings': 'Greetings & Basics',
        'unSpoken_module_family': 'Family & Relationships',
        'unSpoken_module_food': 'Food & Dining'
    };
    return nameMap[key] || key;
}

/**
 * Load daily challenge completion history
 */
function loadDailyChallengeData() {
    // Generate last 14 days of challenge history
    const today = new Date();
    dashboardData.dailyChallengeHistory = [];
    
    for (let i = 13; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        
        // Check if challenge was completed on this date
        const lastChallengeDate = localStorage.getItem('unSpoken_lastChallengeDate');
        const isCompleted = localStorage.getItem('unSpoken_dailyChallengeComplete') === 'true' && lastChallengeDate === dateStr;
        
        dashboardData.dailyChallengeHistory.push({
            date: dateStr,
            completed: isCompleted,
            isToday: i === 0
        });
    }
}

/**
 * Update the metrics display with current data
 */
function updateMetricsDisplay() {
    // Update total signs mastered
    const totalSignsMastered = calculateTotalSignsMastered();
    document.getElementById('totalSignsMastered').textContent = totalSignsMastered;
    
    // Update level and progress
    updateLevelDisplay();
    
    // Update daily streak
    document.getElementById('dailyStreak').textContent = dashboardData.dailyStreak;
    
    // Update modules completed
    const modulesCompleted = Object.values(dashboardData.moduleData).filter(module => module.percentage === 100).length;
    document.getElementById('modulesCompleted').textContent = modulesCompleted;
}

/**
 * Calculate total signs mastered across all modules
 */
function calculateTotalSignsMastered() {
    return Object.values(dashboardData.moduleData).reduce((total, module) => total + module.completed, 0);
}

/**
 * Update level and progress display
 */
function updateLevelDisplay() {
    if (!dashboardData.userProgress || Object.keys(dashboardData.userProgress).length === 0) {
        // Initialize with default data if none exists
        dashboardData.userProgress = {
            level: 1,
            experience: 0,
            experiencePerLevel: [0, 500, 1000, 1500, 2000, 2500]
        };
    }
    
    const currentLevel = dashboardData.userProgress.level || 1;
    const experience = dashboardData.userProgress.experience || 0;
    const experiencePerLevel = dashboardData.userProgress.experiencePerLevel || [0, 500, 1000, 1500, 2000, 2500];
    
    const nextLevel = currentLevel + 1;
    const currentLevelXP = experiencePerLevel[currentLevel - 1] || 0;
    const nextLevelXP = experiencePerLevel[currentLevel] || (currentLevelXP + 500);
    const xpForNextLevel = nextLevelXP - currentLevelXP;
    const currentXP = experience - currentLevelXP;
    const progressPercent = Math.min(Math.floor((currentXP / xpForNextLevel) * 100), 100);
    
    document.getElementById('currentLevel').textContent = `Level ${currentLevel}`;
    document.getElementById('levelProgress').textContent = `${progressPercent}% to Level ${nextLevel}`;
    document.getElementById('levelProgressBar').style.width = `${progressPercent}%`;
}

/**
 * Render all charts
 */
function renderCharts() {
    renderProgressChart();
    renderModuleChart();
}

/**
 * Render the progress over time chart
 */
function renderProgressChart() {
    const ctx = document.getElementById('progressChart').getContext('2d');
    
    // Generate last 30 days of data
    const last30Days = generateLast30DaysData();
    
    if (progressChart) {
        progressChart.destroy();
    }
    
    progressChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: last30Days.map(day => day.date),
            datasets: [{
                label: 'Signs Mastered',
                data: last30Days.map(day => day.signsMastered),
                borderColor: 'rgb(99, 102, 241)',
                backgroundColor: 'rgba(99, 102, 241, 0.1)',
                borderWidth: 3,
                fill: true,
                tension: 0.4,
                pointBackgroundColor: 'rgb(99, 102, 241)',
                pointBorderColor: '#fff',
                pointBorderWidth: 2,
                pointRadius: 5
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                x: {
                    display: true,
                    title: {
                        display: true,
                        text: 'Date'
                    },
                    ticks: {
                        maxTicksLimit: 7
                    }
                },
                y: {
                    display: true,
                    title: {
                        display: true,
                        text: 'Signs Mastered'
                    },
                    beginAtZero: true,
                    ticks: {
                        stepSize: 1
                    }
                }
            },
            elements: {
                point: {
                    hoverRadius: 8
                }
            }
        }
    });
}

/**
 * Generate data for the last 30 days
 */
function generateLast30DaysData() {
    const today = new Date();
    const data = [];
    let cumulativeSigns = 0;
    
    for (let i = 29; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        
        // Find signs mastered on this date
        const dayEntry = dashboardData.signsMasteredLog.find(entry => entry.date === dateStr);
        const signsOnDay = dayEntry ? dayEntry.signsMasteredCount : 0;
        
        cumulativeSigns += signsOnDay;
        
        data.push({
            date: dateStr,
            signsMastered: cumulativeSigns
        });
    }
    
    return data;
}

/**
 * Render the module completion chart
 */
function renderModuleChart() {
    const ctx = document.getElementById('moduleChart').getContext('2d');
    
    const moduleNames = Object.keys(dashboardData.moduleData);
    const modulePercentages = Object.values(dashboardData.moduleData).map(module => module.percentage);
    
    if (moduleChart) {
        moduleChart.destroy();
    }
    
    moduleChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: moduleNames,
            datasets: [{
                data: modulePercentages,
                backgroundColor: [
                    'rgba(99, 102, 241, 0.8)',
                    'rgba(34, 197, 94, 0.8)',
                    'rgba(251, 146, 60, 0.8)',
                    'rgba(239, 68, 68, 0.8)',
                    'rgba(168, 85, 247, 0.8)'
                ],
                borderColor: [
                    'rgb(99, 102, 241)',
                    'rgb(34, 197, 94)',
                    'rgb(251, 146, 60)',
                    'rgb(239, 68, 68)',
                    'rgb(168, 85, 247)'
                ],
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        padding: 20,
                        usePointStyle: true
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const moduleName = context.label;
                            const percentage = context.parsed;
                            const moduleData = dashboardData.moduleData[moduleName];
                            return `${moduleName}: ${moduleData.completed}/${moduleData.total} (${percentage}%)`;
                        }
                    }
                }
            }
        }
    });
}

/**
 * Load and display daily challenge history
 */
function loadDailyChallengeHistory() {
    const container = document.getElementById('dailyChallengeContainer');
    
    if (dashboardData.dailyChallengeHistory.length === 0) {
        container.innerHTML = '<div class="no-data">No challenge history available</div>';
        return;
    }
    
    // Create challenge grid
    const grid = document.createElement('div');
    grid.className = 'daily-challenge-grid';
    
    dashboardData.dailyChallengeHistory.forEach(day => {
        const dayElement = document.createElement('div');
        dayElement.className = 'challenge-day';
        
        if (day.completed) {
            dayElement.classList.add('completed');
            dayElement.innerHTML = '<i class="fa-solid fa-check"></i>';
        } else {
            dayElement.classList.add('pending');
            dayElement.innerHTML = '<i class="fa-solid fa-minus"></i>';
        }
        
        if (day.isToday) {
            dayElement.classList.add('today');
        }
        
        // Add tooltip
        dayElement.title = `${day.date}: ${day.completed ? 'Completed' : 'Not completed'}`;
        
        grid.appendChild(dayElement);
    });
    
    container.innerHTML = '';
    container.appendChild(grid);
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
 * Refresh dashboard data (can be called externally)
 */
function refreshDashboard() {
    console.log('🔄 Refreshing dashboard data...');
    loadDashboardData();
    updateMetricsDisplay();
    renderCharts();
    loadDailyChallengeHistory();
    showStatus('Dashboard updated!', 'success');
}

// Make refresh function globally available
window.refreshDashboard = refreshDashboard;
