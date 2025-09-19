/**
 * State Management System
 * Lightweight state management for HMIS frontend
 */

class StateManager {
    constructor() {
        this.state = {};
        this.subscribers = {};
        this.middleware = [];
        this.history = [];
        this.maxHistorySize = 50;
        this.isDispatching = false;

        this.init();
    }

    init() {
        // Initialize default state
        this.state = {
            // Authentication state
            auth: {
                isAuthenticated: false,
                user: null,
                token: null,
                role: null,
                permissions: []
            },

            // UI state
            ui: {
                loading: false,
                notifications: [],
                modals: {
                    active: null,
                    data: null
                },
                sidebar: {
                    collapsed: false
                },
                theme: 'light'
            },

            // Data state
            data: {
                patients: {
                    list: [],
                    current: null,
                    pagination: { page: 1, limit: 10, total: 0 },
                    filters: {},
                    loading: false,
                    error: null
                },
                appointments: {
                    list: [],
                    current: null,
                    pagination: { page: 1, limit: 10, total: 0 },
                    filters: {},
                    loading: false,
                    error: null
                },
                medicalRecords: {
                    list: [],
                    current: null,
                    pagination: { page: 1, limit: 10, total: 0 },
                    loading: false,
                    error: null
                },
                inventory: {
                    list: [],
                    current: null,
                    pagination: { page: 1, limit: 10, total: 0 },
                    filters: {},
                    loading: false,
                    error: null
                },
                analytics: {
                    dashboard: null,
                    reports: {},
                    loading: false,
                    error: null
                }
            },

            // Cache state
            cache: {
                enabled: true,
                stats: {
                    hits: 0,
                    misses: 0,
                    size: 0
                }
            }
        };

        // Load state from localStorage
        this.loadFromStorage();

        // Setup auto-save
        this.setupAutoSave();
    }

    /**
     * Get current state
     */
    getState() {
        return { ...this.state };
    }

    /**
     * Get specific state slice
     */
    getStateSlice(path) {
        return this.getNestedValue(this.state, path);
    }

    /**
     * Dispatch action to update state
     */
    dispatch(action) {
        if (this.isDispatching) {
            throw new Error('Cannot dispatch while already dispatching');
        }

        this.isDispatching = true;

        try {
            // Apply middleware
            let processedAction = action;
            for (const middleware of this.middleware) {
                processedAction = middleware(processedAction, this.getState);
            }

            // Save to history
            this.saveToHistory();

            // Update state
            const newState = this.reducer(this.state, processedAction);
            this.state = newState;

            // Notify subscribers
            this.notifySubscribers(processedAction);

            // Auto-save to localStorage
            this.saveToStorage();

            return processedAction;
        } finally {
            this.isDispatching = false;
        }
    }

    /**
     * State reducer
     */
    reducer(state, action) {
        const newState = { ...state };

        switch (action.type) {
            // Authentication actions
            case 'AUTH_LOGIN':
                newState.auth = {
                    ...state.auth,
                    isAuthenticated: true,
                    user: action.payload.user,
                    token: action.payload.token,
                    role: action.payload.role,
                    permissions: action.payload.permissions || []
                };
                break;

            case 'AUTH_LOGOUT':
                newState.auth = {
                    isAuthenticated: false,
                    user: null,
                    token: null,
                    role: null,
                    permissions: []
                };
                // Clear all data on logout
                newState.data = this.getInitialDataState();
                break;

            case 'AUTH_UPDATE_PROFILE':
                newState.auth = {
                    ...state.auth,
                    user: { ...state.auth.user, ...action.payload }
                };
                break;

            // UI actions
            case 'UI_SET_LOADING':
                newState.ui = {
                    ...state.ui,
                    loading: action.payload
                };
                break;

            case 'UI_ADD_NOTIFICATION':
                newState.ui = {
                    ...state.ui,
                    notifications: [...state.ui.notifications, action.payload]
                };
                break;

            case 'UI_REMOVE_NOTIFICATION':
                newState.ui = {
                    ...state.ui,
                    notifications: state.ui.notifications.filter(n => n.id !== action.payload)
                };
                break;

            case 'UI_CLEAR_NOTIFICATIONS':
                newState.ui = {
                    ...state.ui,
                    notifications: []
                };
                break;

            case 'UI_OPEN_MODAL':
                newState.ui = {
                    ...state.ui,
                    modals: {
                        active: action.payload.type,
                        data: action.payload.data
                    }
                };
                break;

            case 'UI_CLOSE_MODAL':
                newState.ui = {
                    ...state.ui,
                    modals: {
                        active: null,
                        data: null
                    }
                };
                break;

            case 'UI_TOGGLE_SIDEBAR':
                newState.ui = {
                    ...state.ui,
                    sidebar: {
                        ...state.ui.sidebar,
                        collapsed: !state.ui.sidebar.collapsed
                    }
                };
                break;

            case 'UI_SET_THEME':
                newState.ui = {
                    ...state.ui,
                    theme: action.payload
                };
                break;

            // Data actions
            case 'DATA_SET_LOADING':
                newState.data = this.updateDataSlice(state.data, action.payload.path, { loading: action.payload.loading });
                break;

            case 'DATA_SET_ERROR':
                newState.data = this.updateDataSlice(state.data, action.payload.path, {
                    error: action.payload.error,
                    loading: false
                });
                break;

            case 'DATA_SET_PATIENTS':
                newState.data = {
                    ...state.data,
                    patients: {
                        ...state.data.patients,
                        list: action.payload.patients,
                        pagination: action.payload.pagination,
                        loading: false,
                        error: null
                    }
                };
                break;

            case 'DATA_ADD_PATIENT':
                newState.data = {
                    ...state.data,
                    patients: {
                        ...state.data.patients,
                        list: [action.payload, ...state.data.patients.list],
                        pagination: {
                            ...state.data.patients.pagination,
                            total: state.data.patients.pagination.total + 1
                        }
                    }
                };
                break;

            case 'DATA_UPDATE_PATIENT':
                newState.data = {
                    ...state.data,
                    patients: {
                        ...state.data.patients,
                        list: state.data.patients.list.map(p =>
                            p.id === action.payload.id ? { ...p, ...action.payload } : p
                        ),
                        current: state.data.patients.current?.id === action.payload.id
                            ? { ...state.data.patients.current, ...action.payload }
                            : state.data.patients.current
                    }
                };
                break;

            case 'DATA_SET_APPOINTMENTS':
                newState.data = {
                    ...state.data,
                    appointments: {
                        ...state.data.appointments,
                        list: action.payload.appointments,
                        pagination: action.payload.pagination,
                        loading: false,
                        error: null
                    }
                };
                break;

            case 'DATA_ADD_APPOINTMENT':
                newState.data = {
                    ...state.data,
                    appointments: {
                        ...state.data.appointments,
                        list: [action.payload, ...state.data.appointments.list],
                        pagination: {
                            ...state.data.appointments.pagination,
                            total: state.data.appointments.pagination.total + 1
                        }
                    }
                };
                break;

            case 'DATA_UPDATE_APPOINTMENT':
                newState.data = {
                    ...state.data,
                    appointments: {
                        ...state.data.appointments,
                        list: state.data.appointments.list.map(a =>
                            a.id === action.payload.id ? { ...a, ...action.payload } : a
                        ),
                        current: state.data.appointments.current?.id === action.payload.id
                            ? { ...state.data.appointments.current, ...action.payload }
                            : state.data.appointments.current
                    }
                };
                break;

            case 'DATA_SET_MEDICAL_RECORDS':
                newState.data = {
                    ...state.data,
                    medicalRecords: {
                        ...state.data.medicalRecords,
                        list: action.payload.records,
                        pagination: action.payload.pagination,
                        loading: false,
                        error: null
                    }
                };
                break;

            case 'DATA_SET_INVENTORY':
                newState.data = {
                    ...state.data,
                    inventory: {
                        ...state.data.inventory,
                        list: action.payload.items,
                        pagination: action.payload.pagination,
                        loading: false,
                        error: null
                    }
                };
                break;

            case 'DATA_SET_ANALYTICS':
                newState.data = {
                    ...state.data,
                    analytics: {
                        ...state.data.analytics,
                        dashboard: action.payload.dashboard,
                        reports: { ...state.data.analytics.reports, ...action.payload.reports },
                        loading: false,
                        error: null
                    }
                };
                break;

            // Cache actions
            case 'CACHE_UPDATE_STATS':
                newState.cache = {
                    ...state.cache,
                    stats: { ...state.cache.stats, ...action.payload }
                };
                break;

            case 'CACHE_TOGGLE':
                newState.cache = {
                    ...state.cache,
                    enabled: action.payload
                };
                break;

            default:
                console.warn(`Unknown action type: ${action.type}`);
        }

        return newState;
    }

    /**
     * Subscribe to state changes
     */
    subscribe(path, callback) {
        if (!this.subscribers[path]) {
            this.subscribers[path] = [];
        }
        this.subscribers[path].push(callback);

        // Return unsubscribe function
        return () => {
            this.subscribers[path] = this.subscribers[path].filter(cb => cb !== callback);
        };
    }

    /**
     * Notify subscribers of state changes
     */
    notifySubscribers(action) {
        // Notify global subscribers
        if (this.subscribers['*']) {
            this.subscribers['*'].forEach(callback => {
                try {
                    callback(this.state, action);
                } catch (error) {
                    console.error('Subscriber error:', error);
                }
            });
        }

        // Notify specific path subscribers
        const actionPath = this.getActionPath(action.type);
        if (this.subscribers[actionPath]) {
            this.subscribers[actionPath].forEach(callback => {
                try {
                    const stateSlice = this.getNestedValue(this.state, actionPath);
                    callback(stateSlice, action);
                } catch (error) {
                    console.error('Subscriber error:', error);
                }
            });
        }
    }

    /**
     * Add middleware
     */
    addMiddleware(middleware) {
        this.middleware.push(middleware);
    }

    /**
     * Get action path from action type
     */
    getActionPath(actionType) {
        const pathMap = {
            'AUTH_LOGIN': 'auth',
            'AUTH_LOGOUT': 'auth',
            'AUTH_UPDATE_PROFILE': 'auth',
            'UI_SET_LOADING': 'ui',
            'UI_ADD_NOTIFICATION': 'ui',
            'UI_REMOVE_NOTIFICATION': 'ui',
            'UI_CLEAR_NOTIFICATIONS': 'ui',
            'UI_OPEN_MODAL': 'ui',
            'UI_CLOSE_MODAL': 'ui',
            'UI_TOGGLE_SIDEBAR': 'ui',
            'UI_SET_THEME': 'ui',
            'DATA_SET_PATIENTS': 'data.patients',
            'DATA_ADD_PATIENT': 'data.patients',
            'DATA_UPDATE_PATIENT': 'data.patients',
            'DATA_SET_APPOINTMENTS': 'data.appointments',
            'DATA_ADD_APPOINTMENT': 'data.appointments',
            'DATA_UPDATE_APPOINTMENT': 'data.appointments',
            'DATA_SET_MEDICAL_RECORDS': 'data.medicalRecords',
            'DATA_SET_INVENTORY': 'data.inventory',
            'DATA_SET_ANALYTICS': 'data.analytics',
            'CACHE_UPDATE_STATS': 'cache',
            'CACHE_TOGGLE': 'cache'
        };
        return pathMap[actionType] || '*';
    }

    /**
     * Get nested value from object
     */
    getNestedValue(obj, path) {
        return path.split('.').reduce((current, key) => current?.[key], obj);
    }

    /**
     * Update data slice
     */
    updateDataSlice(data, path, updates) {
        const newData = { ...data };
        const keys = path.split('.');
        let current = newData;

        for (let i = 0; i < keys.length - 1; i++) {
            current[keys[i]] = { ...current[keys[i]] };
            current = current[keys[i]];
        }

        current[keys[keys.length - 1]] = { ...current[keys[keys.length - 1]], ...updates };
        return newData;
    }

    /**
     * Get initial data state
     */
    getInitialDataState() {
        return {
            patients: {
                list: [],
                current: null,
                pagination: { page: 1, limit: 10, total: 0 },
                filters: {},
                loading: false,
                error: null
            },
            appointments: {
                list: [],
                current: null,
                pagination: { page: 1, limit: 10, total: 0 },
                filters: {},
                loading: false,
                error: null
            },
            medicalRecords: {
                list: [],
                current: null,
                pagination: { page: 1, limit: 10, total: 0 },
                loading: false,
                error: null
            },
            inventory: {
                list: [],
                current: null,
                pagination: { page: 1, limit: 10, total: 0 },
                filters: {},
                loading: false,
                error: null
            },
            analytics: {
                dashboard: null,
                reports: {},
                loading: false,
                error: null
            }
        };
    }

    /**
     * Save to history
     */
    saveToHistory() {
        this.history.push(JSON.parse(JSON.stringify(this.state)));
        if (this.history.length > this.maxHistorySize) {
            this.history.shift();
        }
    }

    /**
     * Undo last action
     */
    undo() {
        if (this.history.length > 0) {
            this.state = this.history.pop();
            this.saveToStorage();
            this.notifySubscribers({ type: 'UNDO' });
        }
    }

    /**
     * Save state to localStorage
     */
    saveToStorage() {
        try {
            const stateToSave = {
                auth: this.state.auth,
                ui: {
                    ...this.state.ui,
                    notifications: [] // Don't persist notifications
                },
                cache: this.state.cache
            };
            localStorage.setItem('hmis-state', JSON.stringify(stateToSave));
        } catch (error) {
            console.warn('Failed to save state to localStorage:', error);
        }
    }

    /**
     * Load state from localStorage
     */
    loadFromStorage() {
        try {
            const savedState = localStorage.getItem('hmis-state');
            if (savedState) {
                const parsed = JSON.parse(savedState);
                this.state = {
                    ...this.state,
                    ...parsed,
                    data: this.getInitialDataState() // Always start with fresh data
                };
            }
        } catch (error) {
            console.warn('Failed to load state from localStorage:', error);
        }
    }

    /**
     * Setup auto-save
     */
    setupAutoSave() {
        // Auto-save every 30 seconds
        setInterval(() => {
            this.saveToStorage();
        }, 30000);

        // Auto-save on page unload
        window.addEventListener('beforeunload', () => {
            this.saveToStorage();
        });
    }

    /**
     * Reset state to initial
     */
    reset() {
        this.state = {
            ...this.getInitialState(),
            ui: {
                ...this.getInitialState().ui,
                theme: this.state.ui.theme // Preserve theme
            }
        };
        this.history = [];
        this.saveToStorage();
        this.notifySubscribers({ type: 'RESET' });
    }

    /**
     * Get initial state
     */
    getInitialState() {
        return {
            auth: {
                isAuthenticated: false,
                user: null,
                token: null,
                role: null,
                permissions: []
            },
            ui: {
                loading: false,
                notifications: [],
                modals: {
                    active: null,
                    data: null
                },
                sidebar: {
                    collapsed: false
                },
                theme: 'light'
            },
            data: this.getInitialDataState(),
            cache: {
                enabled: true,
                stats: {
                    hits: 0,
                    misses: 0,
                    size: 0
                }
            }
        };
    }
}

// Make StateManager available globally
window.StateManager = StateManager;
