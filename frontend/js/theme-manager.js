/**
 * Theme Manager for HMIS
 * Handles dark/light theme switching and persistence
 */

class ThemeManager {
    constructor() {
        this.currentTheme = localStorage.getItem('hmis-theme') || 'light';
        this.init();
    }

    init() {
        this.applyTheme(this.currentTheme);
        this.createThemeToggle();
        this.setupThemeListeners();
    }

    applyTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        this.currentTheme = theme;
        localStorage.setItem('hmis-theme', theme);

        // Update theme toggle button
        const themeToggle = document.getElementById('theme-toggle');
        if (themeToggle) {
            const icon = themeToggle.querySelector('i');
            if (icon) {
                icon.className = theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
            }
        }
    }

    toggleTheme() {
        const newTheme = this.currentTheme === 'light' ? 'dark' : 'light';
        this.applyTheme(newTheme);

        // Show theme change notification
        this.showThemeNotification(newTheme);
    }

    createThemeToggle() {
        // Check if toggle already exists
        if (document.getElementById('theme-toggle')) return;

        const themeToggle = document.createElement('button');
        themeToggle.id = 'theme-toggle';
        themeToggle.className = 'theme-toggle';
        themeToggle.innerHTML = `
            <i class="fas fa-moon"></i>
            <span class="theme-toggle-text">Dark Mode</span>
        `;
        themeToggle.title = 'Toggle Dark/Light Mode';
        themeToggle.onclick = () => this.toggleTheme();

        // Add to header or navigation
        const header = document.querySelector('.header') || document.querySelector('nav') || document.body;
        if (header) {
            header.appendChild(themeToggle);
        }
    }

    setupThemeListeners() {
        // Listen for system theme changes
        if (window.matchMedia) {
            const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
            mediaQuery.addListener((e) => {
                if (!localStorage.getItem('hmis-theme')) {
                    this.applyTheme(e.matches ? 'dark' : 'light');
                }
            });
        }
    }

    showThemeNotification(theme) {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = 'theme-notification';
        notification.innerHTML = `
            <i class="fas fa-${theme === 'dark' ? 'moon' : 'sun'}"></i>
            <span>Switched to ${theme} mode</span>
        `;

        document.body.appendChild(notification);

        // Remove after 3 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 3000);
    }

    getCurrentTheme() {
        return this.currentTheme;
    }

    isDarkMode() {
        return this.currentTheme === 'dark';
    }
}

// Initialize theme manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.themeManager = new ThemeManager();
});

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ThemeManager;
}


