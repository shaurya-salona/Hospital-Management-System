/**
 * Advanced Search System for HMIS
 * Provides global search across all data with filters and suggestions
 */

class AdvancedSearch {
    constructor() {
        this.searchData = [];
        this.searchHistory = JSON.parse(localStorage.getItem('hmis-search-history') || '[]');
        this.searchIndex = new Map();
        this.init();
    }

    init() {
        this.createSearchInterface();
        this.setupSearchListeners();
        this.loadSearchData();
    }

    createSearchInterface() {
        // Check if search interface already exists
        if (document.getElementById('advanced-search')) return;

        const searchContainer = document.createElement('div');
        searchContainer.id = 'advanced-search';
        searchContainer.className = 'advanced-search-container';
        searchContainer.innerHTML = `
            <div class="search-input-container">
                <div class="search-input-wrapper">
                    <i class="fas fa-search search-icon"></i>
                    <input type="text" id="search-input" placeholder="Search patients, appointments, staff..." autocomplete="off">
                    <button id="search-clear" class="search-clear" style="display: none;">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="search-filters">
                    <select id="search-category">
                        <option value="all">All Categories</option>
                        <option value="patients">Patients</option>
                        <option value="appointments">Appointments</option>
                        <option value="staff">Staff</option>
                        <option value="medical">Medical Records</option>
                        <option value="billing">Billing</option>
                    </select>
                    <select id="search-date-range">
                        <option value="all">All Time</option>
                        <option value="today">Today</option>
                        <option value="week">This Week</option>
                        <option value="month">This Month</option>
                        <option value="year">This Year</option>
                    </select>
                </div>
            </div>
            <div id="search-results" class="search-results" style="display: none;">
                <div class="search-results-header">
                    <span id="search-results-count">0 results</span>
                    <button id="search-export" class="search-export-btn">
                        <i class="fas fa-download"></i> Export
                    </button>
                </div>
                <div id="search-results-list" class="search-results-list"></div>
            </div>
            <div id="search-suggestions" class="search-suggestions" style="display: none;"></div>
        `;

        // Add to page
        document.body.appendChild(searchContainer);
    }

    setupSearchListeners() {
        const searchInput = document.getElementById('search-input');
        const searchClear = document.getElementById('search-clear');
        const searchCategory = document.getElementById('search-category');
        const searchDateRange = document.getElementById('search-date-range');
        const searchExport = document.getElementById('search-export');

        if (searchInput) {
            searchInput.addEventListener('input', (e) => this.handleSearchInput(e));
            searchInput.addEventListener('keydown', (e) => this.handleSearchKeydown(e));
            searchInput.addEventListener('focus', () => this.showSearchSuggestions());
            searchInput.addEventListener('blur', () => setTimeout(() => this.hideSearchSuggestions(), 200));
        }

        if (searchClear) {
            searchClear.addEventListener('click', () => this.clearSearch());
        }

        if (searchCategory) {
            searchCategory.addEventListener('change', () => this.performSearch());
        }

        if (searchDateRange) {
            searchDateRange.addEventListener('change', () => this.performSearch());
        }

        if (searchExport) {
            searchExport.addEventListener('click', () => this.exportSearchResults());
        }

        // Global keyboard shortcut (Ctrl+K)
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.key === 'k') {
                e.preventDefault();
                this.focusSearch();
            }
        });
    }

    async loadSearchData() {
        try {
            // Load data from API endpoints
            const endpoints = [
                '/api/patients',
                '/api/appointments',
                '/api/users',
                '/api/medical-records',
                '/api/billing'
            ];

            const promises = endpoints.map(endpoint =>
                fetch(endpoint).then(res => res.json()).catch(() => [])
            );

            const results = await Promise.all(promises);

            this.searchData = {
                patients: results[0] || [],
                appointments: results[1] || [],
                staff: results[2] || [],
                medical: results[3] || [],
                billing: results[4] || []
            };

            this.buildSearchIndex();
        } catch (error) {
            console.error('Error loading search data:', error);
        }
    }

    buildSearchIndex() {
        this.searchIndex.clear();

        Object.entries(this.searchData).forEach(([category, items]) => {
            items.forEach(item => {
                const searchableText = this.extractSearchableText(item, category);
                const words = searchableText.toLowerCase().split(/\s+/);

                words.forEach(word => {
                    if (word.length > 2) {
                        if (!this.searchIndex.has(word)) {
                            this.searchIndex.set(word, []);
                        }
                        this.searchIndex.get(word).push({ item, category });
                    }
                });
            });
        });
    }

    extractSearchableText(item, category) {
        const textFields = [];

        switch (category) {
            case 'patients':
                textFields.push(item.first_name, item.last_name, item.email, item.phone, item.medical_condition);
                break;
            case 'appointments':
                textFields.push(item.patient_name, item.doctor_name, item.appointment_type, item.status, item.notes);
                break;
            case 'staff':
                textFields.push(item.first_name, item.last_name, item.email, item.role, item.department);
                break;
            case 'medical':
                textFields.push(item.patient_name, item.diagnosis, item.treatment, item.notes);
                break;
            case 'billing':
                textFields.push(item.patient_name, item.invoice_number, item.status, item.amount);
                break;
        }

        return textFields.filter(field => field).join(' ');
    }

    handleSearchInput(e) {
        const query = e.target.value.trim();
        const searchClear = document.getElementById('search-clear');

        if (searchClear) {
            searchClear.style.display = query ? 'block' : 'none';
        }

        if (query.length > 2) {
            this.performSearch();
            this.updateSearchSuggestions(query);
        } else {
            this.hideSearchResults();
            this.hideSearchSuggestions();
        }
    }

    handleSearchKeydown(e) {
        if (e.key === 'Enter') {
            this.performSearch();
        } else if (e.key === 'Escape') {
            this.clearSearch();
        }
    }

    performSearch() {
        const query = document.getElementById('search-input').value.trim();
        const category = document.getElementById('search-category').value;
        const dateRange = document.getElementById('search-date-range').value;

        if (query.length < 3) {
            this.hideSearchResults();
            return;
        }

        const results = this.searchData(query, category, dateRange);
        this.displaySearchResults(results, query);

        // Add to search history
        this.addToSearchHistory(query);
    }

    searchData(query, category, dateRange) {
        const results = [];
        const searchCategories = category === 'all' ? Object.keys(this.searchData) : [category];
        const queryWords = query.toLowerCase().split(/\s+/);

        searchCategories.forEach(cat => {
            if (this.searchData[cat]) {
                this.searchData[cat].forEach(item => {
                    const searchableText = this.extractSearchableText(item, cat).toLowerCase();
                    const matches = queryWords.every(word => searchableText.includes(word));

                    if (matches) {
                        // Apply date filter if specified
                        if (this.matchesDateRange(item, dateRange)) {
                            results.push({ item, category: cat, relevance: this.calculateRelevance(item, query) });
                        }
                    }
                });
            }
        });

        return results.sort((a, b) => b.relevance - a.relevance);
    }

    calculateRelevance(item, query) {
        const searchableText = this.extractSearchableText(item, item.category).toLowerCase();
        const queryWords = query.toLowerCase().split(/\s+/);
        let relevance = 0;

        queryWords.forEach(word => {
            if (searchableText.includes(word)) {
                relevance += 1;
            }
            if (searchableText.startsWith(word)) {
                relevance += 2;
            }
        });

        return relevance;
    }

    matchesDateRange(item, dateRange) {
        if (dateRange === 'all') return true;

        const now = new Date();
        const itemDate = new Date(item.created_at || item.date || item.appointment_date);

        switch (dateRange) {
            case 'today':
                return itemDate.toDateString() === now.toDateString();
            case 'week':
                const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                return itemDate >= weekAgo;
            case 'month':
                const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                return itemDate >= monthAgo;
            case 'year':
                const yearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
                return itemDate >= yearAgo;
            default:
                return true;
        }
    }

    displaySearchResults(results, query) {
        const resultsContainer = document.getElementById('search-results');
        const resultsList = document.getElementById('search-results-list');
        const resultsCount = document.getElementById('search-results-count');

        if (!resultsContainer || !resultsList || !resultsCount) return;

        resultsCount.textContent = `${results.length} results for "${query}"`;
        resultsList.innerHTML = '';

        if (results.length === 0) {
            resultsList.innerHTML = '<div class="no-results">No results found</div>';
        } else {
            results.forEach(result => {
                const resultElement = this.createResultElement(result, query);
                resultsList.appendChild(resultElement);
            });
        }

        resultsContainer.style.display = 'block';
    }

    createResultElement(result, query) {
        const element = document.createElement('div');
        element.className = 'search-result-item';
        element.innerHTML = `
            <div class="result-header">
                <span class="result-category">${result.category}</span>
                <span class="result-relevance">${Math.round(result.relevance * 100)}% match</span>
            </div>
            <div class="result-content">
                ${this.highlightSearchTerms(this.formatResultContent(result.item, result.category), query)}
            </div>
            <div class="result-actions">
                <button class="result-action-btn" onclick="window.openResult('${result.category}', ${result.item.id})">
                    <i class="fas fa-eye"></i> View
                </button>
                <button class="result-action-btn" onclick="window.editResult('${result.category}', ${result.item.id})">
                    <i class="fas fa-edit"></i> Edit
                </button>
            </div>
        `;
        return element;
    }

    formatResultContent(item, category) {
        switch (category) {
            case 'patients':
                return `${item.first_name} ${item.last_name} - ${item.email} - ${item.phone}`;
            case 'appointments':
                return `${item.patient_name} - ${item.doctor_name} - ${item.appointment_type} - ${item.status}`;
            case 'staff':
                return `${item.first_name} ${item.last_name} - ${item.role} - ${item.department}`;
            case 'medical':
                return `${item.patient_name} - ${item.diagnosis} - ${item.treatment}`;
            case 'billing':
                return `${item.patient_name} - ${item.invoice_number} - $${item.amount}`;
            default:
                return JSON.stringify(item);
        }
    }

    highlightSearchTerms(text, query) {
        const queryWords = query.split(/\s+/);
        let highlightedText = text;

        queryWords.forEach(word => {
            const regex = new RegExp(`(${word})`, 'gi');
            highlightedText = highlightedText.replace(regex, '<mark>$1</mark>');
        });

        return highlightedText;
    }

    updateSearchSuggestions(query) {
        const suggestions = this.getSearchSuggestions(query);
        this.displaySearchSuggestions(suggestions);
    }

    getSearchSuggestions(query) {
        const suggestions = new Set();

        // Add from search history
        this.searchHistory.forEach(historyItem => {
            if (historyItem.toLowerCase().includes(query.toLowerCase())) {
                suggestions.add(historyItem);
            }
        });

        // Add from search index
        this.searchIndex.forEach((items, word) => {
            if (word.includes(query.toLowerCase())) {
                suggestions.add(word);
            }
        });

        return Array.from(suggestions).slice(0, 5);
    }

    displaySearchSuggestions(suggestions) {
        const suggestionsContainer = document.getElementById('search-suggestions');
        if (!suggestionsContainer) return;

        if (suggestions.length === 0) {
            this.hideSearchSuggestions();
            return;
        }

        suggestionsContainer.innerHTML = suggestions.map(suggestion =>
            `<div class="suggestion-item" onclick="this.selectSuggestion('${suggestion}')">${suggestion}</div>`
        ).join('');

        suggestionsContainer.style.display = 'block';
    }

    selectSuggestion(suggestion) {
        document.getElementById('search-input').value = suggestion;
        this.performSearch();
        this.hideSearchSuggestions();
    }

    addToSearchHistory(query) {
        if (!this.searchHistory.includes(query)) {
            this.searchHistory.unshift(query);
            this.searchHistory = this.searchHistory.slice(0, 10); // Keep only last 10 searches
            localStorage.setItem('hmis-search-history', JSON.stringify(this.searchHistory));
        }
    }

    clearSearch() {
        document.getElementById('search-input').value = '';
        this.hideSearchResults();
        this.hideSearchSuggestions();
    }

    hideSearchResults() {
        const resultsContainer = document.getElementById('search-results');
        if (resultsContainer) {
            resultsContainer.style.display = 'none';
        }
    }

    hideSearchSuggestions() {
        const suggestionsContainer = document.getElementById('search-suggestions');
        if (suggestionsContainer) {
            suggestionsContainer.style.display = 'none';
        }
    }

    showSearchSuggestions() {
        const query = document.getElementById('search-input').value.trim();
        if (query.length > 0) {
            this.updateSearchSuggestions(query);
        }
    }

    focusSearch() {
        const searchInput = document.getElementById('search-input');
        if (searchInput) {
            searchInput.focus();
        }
    }

    exportSearchResults() {
        const results = document.querySelectorAll('.search-result-item');
        const exportData = Array.from(results).map(result => ({
            category: result.querySelector('.result-category').textContent,
            content: result.querySelector('.result-content').textContent,
            relevance: result.querySelector('.result-relevance').textContent
        }));

        const csv = this.convertToCSV(exportData);
        this.downloadCSV(csv, 'search-results.csv');
    }

    convertToCSV(data) {
        const headers = ['Category', 'Content', 'Relevance'];
        const csvContent = [
            headers.join(','),
            ...data.map(row => [
                row.category,
                `"${row.content.replace(/"/g, '""')}"`,
                row.relevance
            ].join(','))
        ].join('\n');

        return csvContent;
    }

    downloadCSV(csv, filename) {
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        window.URL.revokeObjectURL(url);
    }
}

// Initialize advanced search when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.advancedSearch = new AdvancedSearch();
});

// Global functions for result actions
window.openResult = function(category, id) {
    // Implement result opening logic
    console.log(`Opening ${category} with ID ${id}`);
};

window.editResult = function(category, id) {
    // Implement result editing logic
    console.log(`Editing ${category} with ID ${id}`);
};

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AdvancedSearch;
}


