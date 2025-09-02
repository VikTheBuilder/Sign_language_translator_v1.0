document.addEventListener('DOMContentLoaded', function() {
    const root = document.documentElement;
    const toggleBtn = document.getElementById('themeToggle');
    const icon = document.getElementById('themeToggleIcon');

    function applyTheme(theme) {
        if (theme === 'dark') {
            root.setAttribute('data-theme', 'dark');
            if (icon) icon.className = 'fa-solid fa-sun';
        } else {
            root.removeAttribute('data-theme');
            if (icon) icon.className = 'fa-solid fa-moon';
        }
    }

    function preferredTheme() {
        const stored = localStorage.getItem('theme');
        if (stored) return stored;
        return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
            ? 'dark'
            : 'light';
    }

    let theme = preferredTheme();
    applyTheme(theme);

    if (toggleBtn) {
        toggleBtn.addEventListener('click', function() {
            theme = theme === 'dark' ? 'light' : 'dark';
            localStorage.setItem('theme', theme);
            applyTheme(theme);
        });
    }
});


