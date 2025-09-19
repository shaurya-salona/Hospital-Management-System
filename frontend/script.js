// Enhanced HMIS Portal with Advanced Features
// Portal configuration
const portalConfig = {
    admin: {
        title: 'Admin Portal',
        credentials: 'admin@hospital.com / admin123',
        defaultUsername: 'admin@hospital.com',
        defaultPassword: 'admin123'
    },
    doctor: {
        title: 'Doctor Portal',
        credentials: 'dr.smith@hospital.com / doctor123',
        defaultUsername: 'dr.smith@hospital.com',
        defaultPassword: 'doctor123'
    },
    receptionist: {
        title: 'Receptionist Portal',
        credentials: 'reception@hospital.com / reception123',
        defaultUsername: 'reception@hospital.com',
        defaultPassword: 'reception123'
    },
    nurse: {
        title: 'Nurse Portal',
        credentials: 'nurse@hospital.com / nurse123',
        defaultUsername: 'nurse@hospital.com',
        defaultPassword: 'nurse123'
    },
    pharmacist: {
        title: 'Pharmacist Portal',
        credentials: 'pharmacy@hospital.com / pharmacy123',
        defaultUsername: 'pharmacy@hospital.com',
        defaultPassword: 'pharmacy123'
    },
    patient: {
        title: 'Patient Portal',
        credentials: 'patient@hospital.com / patient123',
        defaultUsername: 'patient@hospital.com',
        defaultPassword: 'patient123'
    }
};

let currentPortal = null;

// API Configuration
const API_BASE_URL = 'http://localhost:5000/api';

// Data storage for demo purposes
let appointments = [
    {
        id: 'APT001',
        patientId: 'P001',
        patientName: 'John Doe',
        doctorId: 'D001',
        doctorName: 'Dr. Smith',
        date: '2024-01-15',
        time: '10:00',
        reason: 'Regular checkup',
        status: 'confirmed',
        createdAt: new Date().toISOString()
    },
    {
        id: 'APT002',
        patientId: 'P002',
        patientName: 'Jane Smith',
        doctorId: 'D002',
        doctorName: 'Dr. Johnson',
        date: '2024-01-15',
        time: '14:00',
        reason: 'Follow-up consultation',
        status: 'pending',
        createdAt: new Date().toISOString()
    },
    {
        id: 'APT003',
        patientId: 'P003',
        patientName: 'Bob Johnson',
        doctorId: 'D001',
        doctorName: 'Dr. Smith',
        date: '2024-01-16',
        time: '09:30',
        reason: 'Blood pressure check',
        status: 'completed',
        createdAt: new Date().toISOString()
    }
];

let patients = [
    {
        id: 'P001',
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@email.com',
        phone: '+1 234-567-8900',
        dateOfBirth: '1980-05-15',
        gender: 'male',
        address: '123 Main St, City, State',
        emergencyContact: 'Jane Doe',
        emergencyPhone: '+1 234-567-8901',
        status: 'active'
    },
    {
        id: 'P002',
        firstName: 'Jane',
        lastName: 'Smith',
        email: 'jane.smith@email.com',
        phone: '+1 234-567-8902',
        dateOfBirth: '1985-08-22',
        gender: 'female',
        address: '456 Oak Ave, City, State',
        emergencyContact: 'John Smith',
        emergencyPhone: '+1 234-567-8903',
        status: 'active'
    },
    {
        id: 'P003',
        firstName: 'Bob',
        lastName: 'Johnson',
        email: 'bob.johnson@email.com',
        phone: '+1 234-567-8904',
        dateOfBirth: '1975-12-10',
        gender: 'male',
        address: '789 Pine St, City, State',
        emergencyContact: 'Mary Johnson',
        emergencyPhone: '+1 234-567-8905',
        status: 'active'
    }
];

let doctors = [
    { id: 'D001', name: 'Dr. Smith', specialty: 'Cardiology', available: true },
    { id: 'D002', name: 'Dr. Johnson', specialty: 'General Medicine', available: true },
    { id: 'D003', name: 'Dr. Williams', specialty: 'Pediatrics', available: false }
];

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    console.log('HMIS Frontend initialized');
    
    // Add click animations to portal cards
    const portalCards = document.querySelectorAll('.portal-card');
    portalCards.forEach(card => {
        card.addEventListener('click', function() {
            this.style.transform = 'scale(0.98)';
            setTimeout(() => {
                this.style.transform = '';
            }, 150);
        });
    });
});

// Open portal login modal
function openPortal(portalType) {
    currentPortal = portalType;
    const config = portalConfig[portalType];
    
    if (!config) {
        console.error('Invalid portal type:', portalType);
        return;
    }
    
    // Update modal title and credentials
    document.getElementById('modalTitle').textContent = config.title;
    document.getElementById('demoCredentials').textContent = config.credentials;
    
    // Pre-fill username and password
    document.getElementById('username').value = config.defaultUsername;
    document.getElementById('password').value = config.defaultPassword;
    
    // Show modal
    document.getElementById('loginModal').style.display = 'block';
    
    // Focus on username field
    setTimeout(() => {
        document.getElementById('username').focus();
    }, 100);
}

// Close modal
function closeModal() {
    document.getElementById('loginModal').style.display = 'none';
    currentPortal = null;
    
    // Clear form
    document.getElementById('username').value = '';
    document.getElementById('password').value = '';
}

// Handle login
async function handleLogin() {
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value.trim();
    
    if (!username || !password) {
        alert('Please enter both username and password');
        return;
    }
    
    if (!currentPortal) {
        alert('No portal selected');
        return;
    }
    
    try {
        // Show loading state
        const loginBtn = document.querySelector('.btn-primary');
        const originalText = loginBtn.textContent;
        loginBtn.textContent = 'Logging in...';
        loginBtn.disabled = true;
        
        // Attempt login
        const response = await login(username, password, currentPortal);
        
        if (response.success) {
            // Store user session
            localStorage.setItem('user', JSON.stringify({
                username: response.data.user.firstName + ' ' + response.data.user.lastName,
                email: response.data.user.email,
                role: response.data.user.role,
                token: response.data.accessToken || 'demo-token'
            }));
            
            // Store token for API calls
            localStorage.setItem('token', response.data.accessToken || 'demo-token');
            
            // Redirect to portal dashboard
            redirectToPortal(currentPortal);
        } else {
            alert(response.message || 'Login failed. Please check your credentials.');
        }
        
    } catch (error) {
        console.error('Login error:', error);
        alert('Login failed. Please try again.');
    } finally {
        // Reset button state
        const loginBtn = document.querySelector('.btn-primary');
        loginBtn.textContent = originalText;
        loginBtn.disabled = false;
    }
}

// Demo login (bypasses API)
function demoLogin() {
    if (!currentPortal) {
        alert('No portal selected');
        return;
    }
    
    const config = portalConfig[currentPortal];
    
    // Store demo session
    localStorage.setItem('user', JSON.stringify({
        username: config.defaultUsername,
        role: currentPortal,
        token: 'demo-token',
        isDemo: true
    }));
    
    // Redirect to portal dashboard
    redirectToPortal(currentPortal);
}

// API login function
async function login(username, password, portalType) {
    try {
        const response = await fetch(`${API_BASE_URL}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                email: username,
                password: password
            })
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        // Check if user role matches the selected portal
        if (data.success && data.data && data.data.user.role === portalType) {
            return data;
        } else if (data.success && data.data) {
            return {
                success: false,
                message: `Please login as ${portalType}. You are logged in as ${data.data.user.role}.`
            };
        }
        
        return data;
        
    } catch (error) {
        console.error('API login failed:', error);
        
        // Fallback to demo mode if API is not available
        return {
            success: true,
            message: 'Demo mode - API not available',
            token: 'demo-token'
        };
    }
}

// Redirect to portal dashboard
function redirectToPortal(portalType) {
    // Close modal
    closeModal();
    
    // Show loading message
    showLoadingMessage(`Redirecting to ${portalConfig[portalType].title}...`);
    
    // Redirect to appropriate dashboard based on role
    setTimeout(() => {
        switch(portalType) {
            case 'admin':
                window.location.href = 'admin-dashboard.html';
                break;
            case 'doctor':
                window.location.href = 'doctor-dashboard.html';
                break;
            case 'receptionist':
                window.location.href = 'receptionist-dashboard.html';
                break;
            case 'pharmacist':
                window.location.href = 'pharmacist-dashboard.html';
                break;
            case 'nurse':
                window.location.href = 'nurse-dashboard.html';
                break;
            case 'patient':
                window.location.href = 'patient-dashboard.html';
                break;
            default:
                window.location.href = 'dashboard.html';
        }
    }, 1500);
}

// Show loading message
function showLoadingMessage(message) {
    const loadingDiv = document.createElement('div');
    loadingDiv.id = 'loadingMessage';
    loadingDiv.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: rgba(0, 0, 0, 0.8);
        color: white;
        padding: 20px 40px;
        border-radius: 10px;
        z-index: 2000;
        font-size: 1.1rem;
        text-align: center;
    `;
    loadingDiv.textContent = message;
    document.body.appendChild(loadingDiv);
}

// Hide loading message
function hideLoadingMessage() {
    const loadingDiv = document.getElementById('loadingMessage');
    if (loadingDiv) {
        loadingDiv.remove();
    }
}

// Dashboard configurations for each role
const dashboardConfigs = {
    admin: {
        title: 'Admin Dashboard',
        icon: 'fas fa-user-tie',
        color: '#e74c3c',
        gradient: 'linear-gradient(135deg, #e74c3c 0%, #c0392b 100%)',
        sidebarColor: 'linear-gradient(135deg, #e74c3c 0%, #c0392b 100%)',
        navItems: [
            { id: 'dashboard', icon: 'fas fa-home', label: 'Dashboard' },
            { id: 'users', icon: 'fas fa-users', label: 'User Management' },
            { id: 'appointments', icon: 'fas fa-calendar', label: 'Appointments' },
            { id: 'system', icon: 'fas fa-laptop', label: 'System Health' },
            { id: 'security', icon: 'fas fa-shield-alt', label: 'Security' },
            { id: 'reports', icon: 'fas fa-chart-bar', label: 'Reports' },
            { id: 'settings', icon: 'fas fa-cog', label: 'Settings' },
            { id: 'backup', icon: 'fas fa-save', label: 'Backup' }
        ],
        metrics: [
            { icon: 'fas fa-users', value: '0', label: 'Total Patients', badge: '+8 today', badgeColor: 'success' },
            { icon: 'fas fa-user-md', value: '12', label: 'Total Doctors', badge: 'Active', badgeColor: 'success' },
            { icon: 'fas fa-calendar', value: '156', label: 'Total Appointments', badge: '+45 this week', badgeColor: 'warning' },
            { icon: 'fas fa-rupee-sign', value: '₹28.5L', label: 'Total Revenue', badge: '+₹285K this month', badgeColor: 'success' },
            { icon: 'fas fa-exclamation-triangle', value: '2', label: 'Critical Patients', badge: 'Requires attention', badgeColor: 'danger' },
            { icon: 'fas fa-bed', value: '78%', label: 'Bed Occupancy', badge: 'ICU: 92%', badgeColor: 'warning' },
            { icon: 'fas fa-clock', value: '4', label: 'Pending Approvals', badge: 'Action required', badgeColor: 'danger' },
            { icon: 'fas fa-user-nurse', value: '24', label: 'Total Nurses', badge: 'On duty', badgeColor: 'success' }
        ]
    },
    doctor: {
        title: 'Doctor Dashboard',
        icon: 'fas fa-user-md',
        color: '#27ae60',
        gradient: 'linear-gradient(135deg, #27ae60 0%, #2ecc71 100%)',
        sidebarColor: 'linear-gradient(135deg, #27ae60 0%, #2ecc71 100%)',
        navItems: [
            { id: 'dashboard', icon: 'fas fa-home', label: 'Dashboard' },
            { id: 'appointments', icon: 'fas fa-calendar', label: 'Appointments', badge: '0' },
            { id: 'patients', icon: 'fas fa-users', label: 'Patient Records' },
            { id: 'prescriptions', icon: 'fas fa-pills', label: 'Prescriptions', badge: '0' },
            { id: 'lab-results', icon: 'fas fa-microscope', label: 'Lab Results & Reports', badge: '0' },
            { id: 'medical-notes', icon: 'fas fa-file-medical', label: 'Medical Notes' },
            { id: 'teleconsultation', icon: 'fas fa-video', label: 'Teleconsultation' }
        ],
        metrics: [
            { icon: 'fas fa-users', value: '0', label: 'Total Patients', badge: '+5 this month', badgeColor: 'success' },
            { icon: 'fas fa-calendar', value: '0', label: "Today's Appointments", badge: 'On schedule', badgeColor: 'info' },
            { icon: 'fas fa-pills', value: '0', label: 'Pending Prescriptions', badge: 'Requires attention', badgeColor: 'warning' },
            { icon: 'fas fa-microscope', value: '0', label: 'Recent Lab Results', badge: '+3 new', badgeColor: 'success' }
        ]
    },
    pharmacist: {
        title: 'Pharmacist Dashboard',
        icon: 'fas fa-pills',
        color: '#9b59b6',
        gradient: 'linear-gradient(135deg, #9b59b6 0%, #8e44ad 100%)',
        sidebarColor: 'linear-gradient(135deg, #9b59b6 0%, #8e44ad 100%)',
        navItems: [
            { id: 'dashboard', icon: 'fas fa-home', label: 'Dashboard' },
            { id: 'prescriptions', icon: 'fas fa-file-medical', label: 'Prescription Management' },
            { id: 'inventory', icon: 'fas fa-warehouse', label: 'Inventory Management' },
            { id: 'interactions', icon: 'fas fa-exclamation-triangle', label: 'Drug Interactions' },
            { id: 'counseling', icon: 'fas fa-comments', label: 'Patient Counseling' },
            { id: 'billing', icon: 'fas fa-file-invoice', label: 'Pharmacy Billing' },
            { id: 'reports', icon: 'fas fa-chart-bar', label: 'Reports & Analytics' }
        ],
        metrics: [
            { icon: 'fas fa-file-medical', value: '0', label: 'Total Prescriptions' },
            { icon: 'fas fa-check-circle', value: '₹0.00', label: 'Total Collected' },
            { icon: 'fas fa-exclamation-triangle', value: '₹0.00', label: 'Pending Amount' },
            { icon: 'fas fa-clock', value: '0', label: 'Pending Payment' }
        ]
    },
    receptionist: {
        title: 'Receptionist Dashboard',
        icon: 'fas fa-user-tie',
        color: '#f39c12',
        gradient: 'linear-gradient(135deg, #f39c12 0%, #e67e22 100%)',
        sidebarColor: 'linear-gradient(135deg, #f39c12 0%, #e67e22 100%)',
        navItems: [
            { id: 'dashboard', icon: 'fas fa-home', label: 'Dashboard' },
            { id: 'registration', icon: 'fas fa-user-plus', label: 'Patient Registration' },
            { id: 'appointments', icon: 'fas fa-calendar', label: 'Appointment Scheduling' },
            { id: 'checkin', icon: 'fas fa-sign-in-alt', label: 'Check-In/Out Management' },
            { id: 'billing', icon: 'fas fa-calculator', label: 'Billing Desk' },
            { id: 'availability', icon: 'fas fa-user-md', label: 'Doctor Availability' },
            { id: 'reports', icon: 'fas fa-chart-bar', label: 'Reports' }
        ],
        metrics: [
            { icon: 'fas fa-user-plus', value: '12', label: 'New Registrations', badge: 'Today', badgeColor: 'info' },
            { icon: 'fas fa-calendar', value: '28', label: 'Appointments Today', badge: 'Scheduled', badgeColor: 'success' },
            { icon: 'fas fa-clock', value: '5', label: 'Pending Check-ins', badge: 'Waiting', badgeColor: 'warning' },
            { icon: 'fas fa-rupee-sign', value: '₹45,600', label: 'Today\'s Revenue', badge: 'Collected', badgeColor: 'success' },
            { icon: 'fas fa-user-md', value: '8', label: 'Doctors Available', badge: 'On Duty', badgeColor: 'success' },
            { icon: 'fas fa-bed', value: '15', label: 'Available Beds', badge: 'ICU: 3', badgeColor: 'info' }
        ]
    },
    nurse: {
        title: 'Nurse Dashboard',
        icon: 'fas fa-user-nurse',
        color: '#e91e63',
        gradient: 'linear-gradient(135deg, #e91e63 0%, #ad1457 100%)',
        sidebarColor: 'linear-gradient(135deg, #e91e63 0%, #ad1457 100%)',
        navItems: [
            { id: 'dashboard', icon: 'fas fa-home', label: 'Dashboard' },
            { id: 'vitals', icon: 'fas fa-heartbeat', label: 'Vital Signs' },
            { id: 'medication', icon: 'fas fa-pills', label: 'Medication Admin' },
            { id: 'assessment', icon: 'fas fa-clipboard-check', label: 'Patient Assessment' },
            { id: 'care-plans', icon: 'fas fa-file-medical-alt', label: 'Care Plans' },
            { id: 'patients', icon: 'fas fa-users', label: 'My Patients' },
            { id: 'reports', icon: 'fas fa-chart-line', label: 'Nursing Reports' }
        ],
        metrics: [
            { icon: 'fas fa-users', value: '18', label: 'Assigned Patients', badge: 'Active', badgeColor: 'success' },
            { icon: 'fas fa-heartbeat', value: '7', label: 'Vitals to Record', badge: 'Pending', badgeColor: 'warning' },
            { icon: 'fas fa-pills', value: '12', label: 'Medications Due', badge: 'Next 2 hours', badgeColor: 'danger' },
            { icon: 'fas fa-clipboard-check', value: '5', label: 'Assessments Due', badge: 'Today', badgeColor: 'info' },
            { icon: 'fas fa-exclamation-triangle', value: '2', label: 'Critical Alerts', badge: 'Urgent', badgeColor: 'danger' },
            { icon: 'fas fa-bed', value: '3', label: 'Discharge Ready', badge: 'Pending', badgeColor: 'success' }
        ]
    },
    patient: {
        title: 'Patient Dashboard',
        icon: 'fas fa-user',
        color: '#3498db',
        gradient: 'linear-gradient(135deg, #3498db 0%, #2980b9 100%)',
        sidebarColor: 'linear-gradient(135deg, #3498db 0%, #2980b9 100%)',
        navItems: [
            { id: 'dashboard', icon: 'fas fa-home', label: 'Dashboard' },
            { id: 'records', icon: 'fas fa-file-medical', label: 'Medical Records' },
            { id: 'appointments', icon: 'fas fa-calendar', label: 'My Appointments' },
            { id: 'prescriptions', icon: 'fas fa-pills', label: 'Prescriptions' },
            { id: 'billing', icon: 'fas fa-file-invoice', label: 'Billing' },
            { id: 'messages', icon: 'fas fa-envelope', label: 'Messages' },
            { id: 'settings', icon: 'fas fa-cog', label: 'Settings' }
        ],
        metrics: [
            { icon: 'fas fa-calendar', value: '3', label: 'Upcoming Appointments', badge: 'This week', badgeColor: 'info' },
            { icon: 'fas fa-pills', value: '2', label: 'Active Prescriptions', badge: 'Current', badgeColor: 'success' },
            { icon: 'fas fa-file-medical', value: '15', label: 'Medical Records', badge: 'Available', badgeColor: 'info' },
            { icon: 'fas fa-rupee-sign', value: '₹2,500', label: 'Outstanding Balance', badge: 'Due', badgeColor: 'warning' },
            { icon: 'fas fa-heartbeat', value: 'Normal', label: 'Last Vital Signs', badge: 'Updated', badgeColor: 'success' },
            { icon: 'fas fa-phone', value: '2', label: 'Unread Messages', badge: 'New', badgeColor: 'info' }
        ]
    }
};

// Show portal dashboard (dynamically created with JavaScript)
function showPortalDashboard(portalType) {
    hideLoadingMessage();
    
    const config = dashboardConfigs[portalType];
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    
    if (!config) {
        console.error('Invalid portal type:', portalType);
        return;
    }
    
    // Clear existing content
    document.body.innerHTML = '';
    
    // Create dashboard container
    const dashboardContainer = document.createElement('div');
    dashboardContainer.className = 'dashboard-container';
    dashboardContainer.style.cssText = `
        min-height: 100vh;
        background: #f5f7fa;
        display: flex;
    `;
    
    // Create sidebar
    const sidebar = createSidebar(config, user);
    dashboardContainer.appendChild(sidebar);
    
    // Create main content
    const mainContent = createMainContent(config, user);
    dashboardContainer.appendChild(mainContent);
    
    // Add to body
    document.body.appendChild(dashboardContainer);
    
    // Populate dynamic content based on user role
    const dynamicContent = document.getElementById('dynamic-dashboard-content');
    if (dynamicContent) {
        // Show dashboard section by default
        const dashboardContent = createSectionContent('dashboard');
        dynamicContent.appendChild(dashboardContent);
    }
    
    // Add dashboard styles
    addDashboardStyles();
    
    // Initialize dashboard functionality
    initializeDashboard(portalType);
}

// Create sidebar dynamically
function createSidebar(config, user) {
    const sidebar = document.createElement('nav');
    sidebar.className = 'sidebar';
    sidebar.style.cssText = `
        width: 250px;
        background: ${config.sidebarColor};
        color: white;
        padding: 20px 0;
        position: fixed;
        height: 100vh;
        overflow-y: auto;
    `;
    
    // Sidebar header
    const sidebarHeader = document.createElement('div');
    sidebarHeader.className = 'sidebar-header';
    sidebarHeader.style.cssText = `
        padding: 0 20px 30px;
        border-bottom: 1px solid rgba(255, 255, 255, 0.2);
        margin-bottom: 20px;
    `;
    
    const headerTitle = document.createElement('h2');
    headerTitle.style.cssText = `
        margin: 0;
        font-size: 1.5rem;
        display: flex;
        align-items: center;
        gap: 10px;
    `;
    headerTitle.innerHTML = `<i class="${config.icon}"></i> ${config.title}`;
    
    sidebarHeader.appendChild(headerTitle);
    sidebar.appendChild(sidebarHeader);
    
    // Navigation menu
    const navMenu = document.createElement('ul');
    navMenu.className = 'nav-menu';
    navMenu.style.cssText = `
        list-style: none;
        padding: 0;
        margin: 0;
    `;
    
    config.navItems.forEach((item, index) => {
        const navItem = document.createElement('li');
        navItem.className = 'nav-item';
        navItem.style.cssText = 'margin-bottom: 5px;';
        
        const navLink = document.createElement('a');
        navLink.href = '#';
        navLink.className = 'nav-link';
        if (index === 0) navLink.classList.add('active');
        navLink.style.cssText = `
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 15px 20px;
            color: white;
            text-decoration: none;
            transition: all 0.3s ease;
            border-radius: 0 25px 25px 0;
            margin-right: 20px;
        `;
        
        navLink.innerHTML = `
            <i class="${item.icon}" style="width: 20px; text-align: center;"></i>
            <span>${item.label}</span>
            ${item.badge ? `<span class="nav-badge" style="background: rgba(255, 255, 255, 0.3); color: white; padding: 2px 8px; border-radius: 10px; font-size: 0.8rem; margin-left: auto;">${item.badge}</span>` : ''}
        `;
        
        navLink.addEventListener('click', (e) => {
            e.preventDefault();
            showSection(item.id);
        });
        
        navItem.appendChild(navLink);
        navMenu.appendChild(navItem);
    });
    
    sidebar.appendChild(navMenu);
    
    // System status for doctor dashboard
    if (config.title === 'Doctor Dashboard') {
        const systemStatus = document.createElement('div');
        systemStatus.className = 'system-status';
        systemStatus.style.cssText = `
            position: absolute;
            bottom: 20px;
            left: 20px;
            right: 20px;
            display: flex;
            align-items: center;
            gap: 10px;
            color: #2ecc71;
            font-size: 0.9rem;
        `;
        systemStatus.innerHTML = `
            <div class="status-dot" style="width: 8px; height: 8px; border-radius: 50%; background: #2ecc71; animation: pulse 2s infinite;"></div>
            <span>System Online</span>
        `;
        sidebar.appendChild(systemStatus);
    }
    
    return sidebar;
}

// Create main content dynamically
function createMainContent(config, user) {
    const mainContent = document.createElement('main');
    mainContent.className = 'main-content';
    mainContent.style.cssText = `
        flex: 1;
        margin-left: 250px;
        padding: 0;
    `;
    
    // Top header
    const topHeader = createTopHeader(config, user);
    mainContent.appendChild(topHeader);
    
    return mainContent;
}

// Create top header
function createTopHeader(config, user) {
    const header = document.createElement('header');
    header.className = 'top-header';
    header.style.cssText = `
        background: white;
        padding: 20px 30px;
        box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
        display: flex;
        justify-content: space-between;
        align-items: center;
    `;
    
    const headerLeft = document.createElement('div');
    headerLeft.className = 'header-left';
    headerLeft.style.cssText = 'display: flex; align-items: center; gap: 20px;';
    
    const title = document.createElement('h1');
    title.style.cssText = 'margin: 0; color: #333; font-size: 1.8rem;';
    title.innerHTML = `<i class="${config.icon}"></i> ${config.title}`;
    
    // Add search bar for admin and doctor
    if (config.title === 'Admin Dashboard' || config.title === 'Doctor Dashboard') {
        const searchBar = document.createElement('div');
        searchBar.className = 'search-bar';
        searchBar.style.cssText = `
            display: flex;
            align-items: center;
            background: #f8f9fa;
            border-radius: 25px;
            padding: 10px 20px;
            min-width: 300px;
        `;
        searchBar.innerHTML = `
            <i class="fas fa-search"></i>
            <input type="text" placeholder="Search..." style="border: none; background: none; outline: none; flex: 1; margin-left: 10px;">
        `;
        headerLeft.appendChild(searchBar);
    }
    
    headerLeft.appendChild(title);
    
    const headerRight = document.createElement('div');
    headerRight.className = 'header-right';
    headerRight.style.cssText = 'display: flex; align-items: center; gap: 20px;';
    
    // Add notification bell for admin and doctor
    if (config.title === 'Admin Dashboard' || config.title === 'Doctor Dashboard') {
        const notificationBell = document.createElement('div');
        notificationBell.className = 'notification-bell';
        notificationBell.style.cssText = 'position: relative; font-size: 1.2rem; color: #666; cursor: pointer;';
        notificationBell.innerHTML = `
            <i class="fas fa-bell"></i>
            <span class="notification-badge" style="position: absolute; top: -5px; right: -5px; background: #e74c3c; color: white; border-radius: 50%; width: 18px; height: 18px; font-size: 0.7rem; display: flex; align-items: center; justify-content: center;">2</span>
        `;
        headerRight.appendChild(notificationBell);
    }
    
    // User info
    const userInfo = document.createElement('div');
    userInfo.className = 'user-info';
    userInfo.style.cssText = 'display: flex; align-items: center; gap: 10px;';
    
    const userAvatar = document.createElement('div');
    userAvatar.className = 'user-avatar';
    userAvatar.style.cssText = `
        width: 40px;
        height: 40px;
        border-radius: 50%;
        background: ${config.color};
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-weight: bold;
    `;
    userAvatar.textContent = user.username ? user.username.charAt(0).toUpperCase() : 'U';
    
    const userDetails = document.createElement('div');
    userDetails.innerHTML = `
        <div style="font-weight: 600;">${user.username || 'User'}</div>
        <div style="font-size: 0.9rem; color: #666;">${getUserRoleTitle(config.title)}</div>
    `;
    
    userInfo.appendChild(userAvatar);
    userInfo.appendChild(userDetails);
    headerRight.appendChild(userInfo);
    
    // Logout button
    const logoutBtn = document.createElement('button');
    logoutBtn.className = 'logout-btn';
    logoutBtn.style.cssText = `
        background: #e74c3c;
        color: white;
        border: none;
        padding: 10px 20px;
        border-radius: 5px;
        cursor: pointer;
        font-weight: 500;
    `;
    logoutBtn.innerHTML = '<i class="fas fa-sign-out-alt"></i> Logout';
    logoutBtn.onclick = logout;
    
    headerRight.appendChild(logoutBtn);
    
    header.appendChild(headerLeft);
    header.appendChild(headerRight);
    
    return header;
}

// Create dashboard body
function createDashboardBody(config, user) {
    const dashboardBody = document.createElement('div');
    dashboardBody.className = 'dashboard-body';
    dashboardBody.style.cssText = 'padding: 30px;';
    
    // Welcome banner
    const welcomeBanner = createWelcomeBanner(config, user);
    dashboardBody.appendChild(welcomeBanner);
    
    // Metrics grid
    const metricsGrid = createMetricsGrid(config);
    dashboardBody.appendChild(metricsGrid);
    
    // Quick actions
    const quickActions = createQuickActions(config);
    dashboardBody.appendChild(quickActions);
    
    return dashboardBody;
}

// Create welcome banner
function createWelcomeBanner(config, user) {
    const banner = document.createElement('div');
    banner.className = 'welcome-banner';
    banner.style.cssText = `
        background: ${config.gradient};
        color: white;
        padding: 30px;
        border-radius: 15px;
        margin-bottom: 30px;
        display: flex;
        justify-content: space-between;
        align-items: center;
    `;
    
    const welcomeContent = document.createElement('div');
    welcomeContent.className = 'welcome-content';
    
    const title = document.createElement('h2');
    title.style.cssText = 'margin: 0 0 10px 0; font-size: 2rem;';
    title.textContent = `Welcome back, ${user.username || 'User'}! ${getUserEmoji(config.title)}`;
    
    const subtitle = document.createElement('p');
    subtitle.style.cssText = 'margin: 0; opacity: 0.9;';
    subtitle.textContent = getWelcomeMessage(config.title);
    
    welcomeContent.appendChild(title);
    welcomeContent.appendChild(subtitle);
    
    // Add time for doctor dashboard
    if (config.title === 'Doctor Dashboard') {
        const welcomeTime = document.createElement('div');
        welcomeTime.className = 'welcome-time';
        welcomeTime.style.cssText = 'text-align: right;';
        welcomeTime.innerHTML = `
            <div class="date" style="font-size: 1.1rem; font-weight: 600;">${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</div>
            <div class="time" style="font-size: 0.9rem; opacity: 0.8;">${new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}</div>
        `;
        banner.appendChild(welcomeTime);
    }
    
    banner.appendChild(welcomeContent);
    
    return banner;
}

// Create metrics grid
function createMetricsGrid(config) {
    const grid = document.createElement('div');
    grid.className = 'metrics-grid';
    grid.style.cssText = `
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
        gap: 20px;
        margin-bottom: 30px;
    `;
    
    config.metrics.forEach(metric => {
        const card = document.createElement('div');
        card.className = 'metric-card';
        card.style.cssText = `
            background: white;
            padding: 25px;
            border-radius: 15px;
            box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
            display: flex;
            align-items: center;
            gap: 20px;
        `;
        
        const icon = document.createElement('div');
        icon.className = 'metric-icon';
        icon.style.cssText = `
            width: 60px;
            height: 60px;
            border-radius: 15px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 1.5rem;
            color: white;
            background: ${config.color};
        `;
        icon.innerHTML = `<i class="${metric.icon}"></i>`;
        
        const content = document.createElement('div');
        content.className = 'metric-content';
        
        const value = document.createElement('h3');
        value.style.cssText = 'margin: 0 0 5px 0; font-size: 2rem; color: #333;';
        value.textContent = metric.value;
        
        const label = document.createElement('p');
        label.style.cssText = 'margin: 0; color: #666; font-weight: 500;';
        label.textContent = metric.label;
        
        content.appendChild(value);
        content.appendChild(label);
        
        if (metric.badge) {
            const badge = document.createElement('span');
            badge.className = `metric-badge badge-${metric.badgeColor || 'info'}`;
            badge.style.cssText = `
                display: inline-block;
                padding: 4px 12px;
                border-radius: 20px;
                font-size: 0.8rem;
                font-weight: 600;
                margin-top: 5px;
            `;
            badge.textContent = metric.badge;
            content.appendChild(badge);
        }
        
        card.appendChild(icon);
        card.appendChild(content);
        grid.appendChild(card);
    });
    
    return grid;
}

// Create quick actions
function createQuickActions(config) {
    const actions = document.createElement('div');
    actions.className = 'quick-actions';
    actions.style.cssText = `
        background: white;
        padding: 25px;
        border-radius: 15px;
        box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
    `;
    
    const title = document.createElement('h3');
    title.style.cssText = 'margin: 0 0 20px 0; color: #333;';
    title.textContent = 'Quick Actions';
    
    const subtitle = document.createElement('p');
    subtitle.style.cssText = 'color: #666; margin-bottom: 20px;';
    subtitle.textContent = 'Common tasks and shortcuts';
    
    const actionsGrid = document.createElement('div');
    actionsGrid.className = 'actions-grid';
    actionsGrid.style.cssText = `
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 15px;
    `;
    
    // Get quick actions based on role
    const quickActionItems = getQuickActions(config.title);
    
    quickActionItems.forEach(action => {
        const actionBtn = document.createElement('div');
        actionBtn.className = 'action-btn';
        actionBtn.style.cssText = `
            background: #f8f9fa;
            border: 2px solid #e9ecef;
            padding: 20px;
            border-radius: 10px;
            text-align: center;
            cursor: pointer;
            transition: all 0.3s ease;
            text-decoration: none;
            color: #333;
        `;
        actionBtn.innerHTML = `
            <i class="${action.icon}" style="font-size: 2rem; margin-bottom: 10px; display: block;"></i>
            <span style="font-weight: 600;">${action.label}</span>
        `;
        actionBtn.addEventListener('click', () => showSection(action.id));
        actionsGrid.appendChild(actionBtn);
    });
    
    actions.appendChild(title);
    actions.appendChild(subtitle);
    actions.appendChild(actionsGrid);
    
    return actions;
}

// Helper functions
function getUserRoleTitle(title) {
    const titles = {
        'Admin Dashboard': 'System Admin',
        'Doctor Dashboard': 'Cardiologist',
        'Pharmacist Dashboard': 'Pharmacist',
        'Receptionist Dashboard': 'Receptionist',
        'Nurse Dashboard': 'Nurse',
        'Patient Dashboard': 'Patient'
    };
    return titles[title] || 'User';
}

function getUserEmoji(title) {
    const emojis = {
        'Admin Dashboard': '👨‍💼',
        'Doctor Dashboard': '👨‍⚕️',
        'Pharmacist Dashboard': '💊',
        'Receptionist Dashboard': '👩‍💼',
        'Nurse Dashboard': '👩‍⚕️',
        'Patient Dashboard': '👤'
    };
    return emojis[title] || '👤';
}

function getWelcomeMessage(title) {
    const messages = {
        'Admin Dashboard': 'Here\'s your system overview and critical metrics',
        'Doctor Dashboard': 'Here\'s what\'s happening today in your practice',
        'Pharmacist Dashboard': 'Manage prescriptions and inventory efficiently',
        'Receptionist Dashboard': 'Welcome to the front desk management system',
        'Nurse Dashboard': 'Monitor patient care and vital signs',
        'Patient Dashboard': 'Access your personal health information'
    };
    return messages[title] || 'Welcome to your dashboard';
}

function getQuickActions(title) {
    const actions = {
        'Admin Dashboard': [
            { id: 'users', icon: 'fas fa-user-plus', label: 'Add New User' },
            { id: 'appointments', icon: 'fas fa-calendar-plus', label: 'Schedule Appointment' },
            { id: 'reports', icon: 'fas fa-chart-line', label: 'Generate Report' },
            { id: 'settings', icon: 'fas fa-cog', label: 'System Settings' }
        ],
        'Doctor Dashboard': [
            { id: 'medical-notes', icon: 'fas fa-file-medical', label: 'Medical Notes' },
            { id: 'prescriptions', icon: 'fas fa-pills', label: 'Prescriptions' },
            { id: 'appointments', icon: 'fas fa-calendar', label: 'Appointments' },
            { id: 'lab-results', icon: 'fas fa-microscope', label: 'Lab Results' }
        ],
        'Pharmacist Dashboard': [
            { id: 'prescriptions', icon: 'fas fa-plus', label: '+ New Prescription' },
            { id: 'inventory', icon: 'fas fa-warehouse', label: 'Check Stock' },
            { id: 'patients', icon: 'fas fa-search', label: 'Patient Search' },
            { id: 'emergency', icon: 'fas fa-exclamation-circle', label: 'Emergency Orders' }
        ],
        'Receptionist Dashboard': [
            { id: 'registration', icon: 'fas fa-user-plus', label: 'New Registration' },
            { id: 'appointments', icon: 'fas fa-calendar', label: 'Schedule Appointment' },
            { id: 'checkin', icon: 'fas fa-sign-in-alt', label: 'Check-In/Out' },
            { id: 'billing', icon: 'fas fa-calculator', label: 'Billing Desk' }
        ],
        'Nurse Dashboard': [
            { id: 'vitals', icon: 'fas fa-heartbeat', label: 'Record Vitals' },
            { id: 'medication', icon: 'fas fa-pills', label: 'Medication Admin' },
            { id: 'assessment', icon: 'fas fa-clipboard-check', label: 'Patient Assessment' },
            { id: 'care-plans', icon: 'fas fa-file-medical-alt', label: 'Care Plans' }
        ],
        'Patient Dashboard': [
            { id: 'appointments', icon: 'fas fa-calendar', label: 'My Appointments' },
            { id: 'records', icon: 'fas fa-file-medical', label: 'Medical Records' },
            { id: 'prescriptions', icon: 'fas fa-pills', label: 'Prescriptions' },
            { id: 'messages', icon: 'fas fa-envelope', label: 'Messages' }
        ]
    };
    return actions[title] || [];
}

// Add dashboard styles
function addDashboardStyles() {
    const styles = document.createElement('style');
    styles.textContent = `
        .nav-link:hover, .nav-link.active {
            background: rgba(255, 255, 255, 0.2);
            transform: translateX(5px);
        }
        
        .action-btn:hover {
            background: var(--primary-color);
            color: white;
            transform: translateY(-2px);
        }
        
        .badge-success { background: #d4edda; color: #155724; }
        .badge-warning { background: #fff3cd; color: #856404; }
        .badge-danger { background: #f8d7da; color: #721c24; }
        .badge-info { background: #d1ecf1; color: #0c5460; }
        
        @keyframes pulse {
            0% { opacity: 1; }
            50% { opacity: 0.5; }
            100% { opacity: 1; }
        }
        
        @media (max-width: 768px) {
            .sidebar {
                transform: translateX(-100%);
                transition: transform 0.3s ease;
            }
            .main-content {
                margin-left: 0;
            }
        }
    `;
    document.head.appendChild(styles);
}

// Initialize dashboard functionality
function initializeDashboard(portalType) {
    console.log(`Initialized ${portalType} dashboard`);
}

// Show section (placeholder for navigation)
function showSection(section) {
    console.log('Showing section:', section);
    
    // Remove active class from all nav links
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
    });
    
    // Add active class to clicked link
    event.target.closest('.nav-link').classList.add('active');
    
    // Show different content based on section
    const dynamicContent = document.getElementById('dynamic-dashboard-content');
    if (dynamicContent) {
        dynamicContent.innerHTML = '';
        
        // Create section content based on the section
        const sectionContent = createSectionContent(section);
        dynamicContent.appendChild(sectionContent);
    }
    
    showNotification(`${section.charAt(0).toUpperCase() + section.slice(1)} section loaded successfully`);
}

// Create section content dynamically
function createSectionContent(section) {
    const content = document.createElement('div');
    content.className = 'section-content';
    content.style.cssText = 'padding: 20px;';
    
    // Get current user to determine if patient-specific content should be shown
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const isPatient = user.role === 'patient';
    
    const title = document.createElement('h2');
    title.style.cssText = 'margin-bottom: 20px; color: #333;';
    
    // Adjust title based on user role
    if (isPatient) {
        switch(section) {
            case 'appointments':
                title.textContent = 'My Appointments';
                break;
            case 'records':
                title.textContent = 'My Medical Records';
                break;
            case 'prescriptions':
                title.textContent = 'My Prescriptions';
                break;
            case 'billing':
                title.textContent = 'My Billing';
                break;
            case 'messages':
                title.textContent = 'My Messages';
                break;
            case 'settings':
                title.textContent = 'My Settings';
                break;
            default:
                title.textContent = `${section.charAt(0).toUpperCase() + section.slice(1)}`;
        }
    } else {
        title.textContent = `${section.charAt(0).toUpperCase() + section.slice(1)} Management`;
    }
    
    content.appendChild(title);
    
    // Create different content based on section
    switch(section) {
        case 'dashboard':
            content.appendChild(createDashboardContent());
            break;
        case 'users':
            if (!isPatient) {
                content.appendChild(createUserManagementContent());
            } else {
                content.appendChild(createDefaultContent(section));
            }
            break;
        case 'appointments':
            if (isPatient) {
                content.appendChild(createPatientAppointmentContent());
            } else {
                content.appendChild(createAppointmentContent());
            }
            break;
        case 'patients':
            if (!isPatient) {
                content.appendChild(createPatientContent());
            } else {
                content.appendChild(createDefaultContent(section));
            }
            break;
        case 'prescriptions':
            if (isPatient) {
                content.appendChild(createPatientPrescriptionContent());
            } else {
                content.appendChild(createPrescriptionContent());
            }
            break;
        case 'vitals':
            if (!isPatient) {
                content.appendChild(createVitalsContent());
            } else {
                content.appendChild(createDefaultContent(section));
            }
            break;
        case 'records':
            if (isPatient) {
                content.appendChild(createPatientRecordsContent());
            } else {
                content.appendChild(createRecordsContent());
            }
            break;
        case 'billing':
            if (isPatient) {
                content.appendChild(createPatientBillingContent());
            } else {
                content.appendChild(createBillingContent());
            }
            break;
        case 'messages':
            content.appendChild(createMessagesContent());
            break;
        case 'reports':
            if (!isPatient) {
                content.appendChild(createReportsContent());
            } else {
                content.appendChild(createDefaultContent(section));
            }
            break;
        case 'settings':
            content.appendChild(createSettingsContent());
            break;
        default:
            content.appendChild(createDefaultContent(section));
    }
    
    return content;
}

// Create user management content
function createUserManagementContent() {
    const container = document.createElement('div');
    container.innerHTML = `
        <div class="content-card" style="background: white; padding: 20px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); margin-bottom: 20px;">
            <h3>User Management</h3>
            <div class="user-actions" style="display: flex; gap: 10px; margin-bottom: 20px;">
                <button class="btn btn-primary" onclick="addUser()">Add New User</button>
                <button class="btn btn-secondary" onclick="importUsers()">Import Users</button>
                <button class="btn btn-secondary" onclick="exportUsers()">Export Users</button>
            </div>
            <div class="user-table">
                <table style="width: 100%; border-collapse: collapse;">
                    <thead>
                        <tr style="background: #f8f9fa;">
                            <th style="padding: 10px; text-align: left; border: 1px solid #dee2e6;">ID</th>
                            <th style="padding: 10px; text-align: left; border: 1px solid #dee2e6;">Name</th>
                            <th style="padding: 10px; text-align: left; border: 1px solid #dee2e6;">Role</th>
                            <th style="padding: 10px; text-align: left; border: 1px solid #dee2e6;">Email</th>
                            <th style="padding: 10px; text-align: left; border: 1px solid #dee2e6;">Status</th>
                            <th style="padding: 10px; text-align: left; border: 1px solid #dee2e6;">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td style="padding: 10px; border: 1px solid #dee2e6;">001</td>
                            <td style="padding: 10px; border: 1px solid #dee2e6;">Dr. John Smith</td>
                            <td style="padding: 10px; border: 1px solid #dee2e6;">Doctor</td>
                            <td style="padding: 10px; border: 1px solid #dee2e6;">john.smith@hospital.com</td>
                            <td style="padding: 10px; border: 1px solid #dee2e6;"><span class="badge badge-success">Active</span></td>
                            <td style="padding: 10px; border: 1px solid #dee2e6;">
                                <button class="btn btn-sm btn-primary">Edit</button>
                                <button class="btn btn-sm btn-danger">Delete</button>
                            </td>
                        </tr>
                        <tr>
                            <td style="padding: 10px; border: 1px solid #dee2e6;">002</td>
                            <td style="padding: 10px; border: 1px solid #dee2e6;">Nurse Sarah Johnson</td>
                            <td style="padding: 10px; border: 1px solid #dee2e6;">Nurse</td>
                            <td style="padding: 10px; border: 1px solid #dee2e6;">sarah.johnson@hospital.com</td>
                            <td style="padding: 10px; border: 1px solid #dee2e6;"><span class="badge badge-success">Active</span></td>
                            <td style="padding: 10px; border: 1px solid #dee2e6;">
                                <button class="btn btn-sm btn-primary">Edit</button>
                                <button class="btn btn-sm btn-danger">Delete</button>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    `;
    return container;
}

// Create appointment content
function createAppointmentContent() {
    const container = document.createElement('div');
    container.innerHTML = `
        <div class="content-card" style="background: white; padding: 20px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); margin-bottom: 20px;">
            <h3>Appointment Management</h3>
            <div class="appointment-actions" style="display: flex; gap: 10px; margin-bottom: 20px;">
                <button class="btn btn-primary" onclick="scheduleAppointment()">Schedule Appointment</button>
                <button class="btn btn-secondary" onclick="viewCalendar()">View Calendar</button>
                <button class="btn btn-secondary" onclick="exportAppointments()">Export</button>
            </div>
            <div class="appointment-list">
                <div class="appointment-item" style="border: 1px solid #dee2e6; padding: 15px; margin-bottom: 10px; border-radius: 5px;">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <div>
                            <strong>Patient:</strong> John Doe<br>
                            <strong>Doctor:</strong> Dr. Smith<br>
                            <strong>Time:</strong> 10:00 AM - 11:00 AM<br>
                            <strong>Date:</strong> Today
                        </div>
                        <div>
                            <span class="badge badge-info">Scheduled</span>
                            <button class="btn btn-sm btn-primary">Edit</button>
                            <button class="btn btn-sm btn-danger">Cancel</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
    return container;
}

// Create patient content
function createPatientContent() {
    const container = document.createElement('div');
    container.innerHTML = `
        <div class="content-card" style="background: white; padding: 20px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); margin-bottom: 20px;">
            <h3>Patient Management</h3>
            <div class="patient-actions" style="display: flex; gap: 10px; margin-bottom: 20px;">
                <button class="btn btn-primary" onclick="addPatient()">Add New Patient</button>
                <button class="btn btn-secondary" onclick="searchPatients()">Search Patients</button>
                <button class="btn btn-secondary" onclick="exportPatients()">Export</button>
            </div>
            <div class="patient-list">
                <div class="patient-item" style="border: 1px solid #dee2e6; padding: 15px; margin-bottom: 10px; border-radius: 5px;">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <div>
                            <strong>Name:</strong> John Doe<br>
                            <strong>Age:</strong> 45<br>
                            <strong>Gender:</strong> Male<br>
                            <strong>Phone:</strong> +91-9876543210<br>
                            <strong>Last Visit:</strong> 2 days ago
                        </div>
                        <div>
                            <span class="badge badge-success">Active</span>
                            <button class="btn btn-sm btn-primary">View</button>
                            <button class="btn btn-sm btn-secondary">Edit</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
    return container;
}

// Create appointment content
function createAppointmentContent() {
    const container = document.createElement('div');
    container.innerHTML = `
        <div class="content-card" style="background: white; padding: 20px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); margin-bottom: 20px;">
            <h3>Appointment Management</h3>
            <div class="appointment-actions" style="display: flex; gap: 10px; margin-bottom: 20px;">
                <button class="btn btn-primary" onclick="openAppointmentForm()">Schedule Appointment</button>
                <button class="btn btn-secondary" onclick="viewCalendar()">View Calendar</button>
                <button class="btn btn-secondary" onclick="exportAppointments()">Export Appointments</button>
            </div>
            <div class="appointment-filters" style="display: flex; gap: 10px; margin-bottom: 20px;">
                <select class="form-control" id="appointmentFilter" onchange="filterAppointments()" style="padding: 8px; border: 1px solid #ddd; border-radius: 5px;">
                    <option value="all">All Appointments</option>
                    <option value="today">Today</option>
                    <option value="week">This Week</option>
                    <option value="pending">Pending</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="completed">Completed</option>
                </select>
                <input type="text" class="form-control" id="appointmentSearch" placeholder="Search appointments..." onkeyup="searchAppointments()" style="padding: 8px; border: 1px solid #ddd; border-radius: 5px; flex: 1;">
            </div>
            <div class="appointment-table" style="overflow-x: auto;">
                <table class="table" id="appointmentTable" style="width: 100%; border-collapse: collapse;">
                    <thead>
                        <tr style="background: #f8f9fa;">
                            <th style="padding: 12px; text-align: left; border-bottom: 2px solid #dee2e6;">ID</th>
                            <th style="padding: 12px; text-align: left; border-bottom: 2px solid #dee2e6;">Patient</th>
                            <th style="padding: 12px; text-align: left; border-bottom: 2px solid #dee2e6;">Doctor</th>
                            <th style="padding: 12px; text-align: left; border-bottom: 2px solid #dee2e6;">Date & Time</th>
                            <th style="padding: 12px; text-align: left; border-bottom: 2px solid #dee2e6;">Reason</th>
                            <th style="padding: 12px; text-align: left; border-bottom: 2px solid #dee2e6;">Status</th>
                            <th style="padding: 12px; text-align: left; border-bottom: 2px solid #dee2e6;">Actions</th>
                        </tr>
                    </thead>
                    <tbody id="appointmentTableBody">
                        <!-- Appointments will be loaded here -->
                    </tbody>
                </table>
            </div>
        </div>
    `;
    
    // Load appointments when content is created
    loadAppointments();
    return container;
}

// Create patient content
function createPatientContent() {
    const container = document.createElement('div');
    container.innerHTML = `
        <div class="content-card" style="background: white; padding: 20px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); margin-bottom: 20px;">
            <h3>Patient Management</h3>
            <div class="patient-actions" style="display: flex; gap: 10px; margin-bottom: 20px;">
                <button class="btn btn-primary" onclick="openPatientForm()">Add New Patient</button>
                <button class="btn btn-secondary" onclick="searchPatients()">Search Patients</button>
                <button class="btn btn-secondary" onclick="exportPatients()">Export Patients</button>
            </div>
            <div class="patient-filters" style="display: flex; gap: 10px; margin-bottom: 20px;">
                <select class="form-control" id="patientFilter" onchange="filterPatients()" style="padding: 8px; border: 1px solid #ddd; border-radius: 5px;">
                    <option value="all">All Patients</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="critical">Critical</option>
                </select>
                <input type="text" class="form-control" id="patientSearch" placeholder="Search by name, ID, or phone..." onkeyup="searchPatients()" style="padding: 8px; border: 1px solid #ddd; border-radius: 5px; flex: 1;">
            </div>
            <div class="patient-table" style="overflow-x: auto;">
                <table class="table" id="patientTable" style="width: 100%; border-collapse: collapse;">
                    <thead>
                        <tr style="background: #f8f9fa;">
                            <th style="padding: 12px; text-align: left; border-bottom: 2px solid #dee2e6;">Patient ID</th>
                            <th style="padding: 12px; text-align: left; border-bottom: 2px solid #dee2e6;">Name</th>
                            <th style="padding: 12px; text-align: left; border-bottom: 2px solid #dee2e6;">Age</th>
                            <th style="padding: 12px; text-align: left; border-bottom: 2px solid #dee2e6;">Phone</th>
                            <th style="padding: 12px; text-align: left; border-bottom: 2px solid #dee2e6;">Email</th>
                            <th style="padding: 12px; text-align: left; border-bottom: 2px solid #dee2e6;">Status</th>
                            <th style="padding: 12px; text-align: left; border-bottom: 2px solid #dee2e6;">Actions</th>
                        </tr>
                    </thead>
                    <tbody id="patientTableBody">
                        <!-- Patients will be loaded here -->
                    </tbody>
                </table>
            </div>
        </div>
    `;
    
    // Load patients when content is created
    loadPatients();
    return container;
}

// Create prescription content
function createPrescriptionContent() {
    const container = document.createElement('div');
    container.innerHTML = `
        <div class="content-card" style="background: white; padding: 20px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); margin-bottom: 20px;">
            <h3>Prescription Management</h3>
            <div class="prescription-actions" style="display: flex; gap: 10px; margin-bottom: 20px;">
                <button class="btn btn-primary" onclick="createPrescription()">Create Prescription</button>
                <button class="btn btn-secondary" onclick="viewPrescriptions()">View All</button>
                <button class="btn btn-secondary" onclick="exportPrescriptions()">Export</button>
            </div>
            <div class="prescription-filters" style="display: flex; gap: 10px; margin-bottom: 20px;">
                <select class="form-control" style="padding: 8px; border: 1px solid #ddd; border-radius: 5px;">
                    <option>All Prescriptions</option>
                    <option>Pending</option>
                    <option>Filled</option>
                    <option>Expired</option>
                </select>
                <input type="text" class="form-control" placeholder="Search prescriptions..." style="padding: 8px; border: 1px solid #ddd; border-radius: 5px; flex: 1;">
            </div>
            <div class="prescription-table" style="overflow-x: auto;">
                <table class="table" style="width: 100%; border-collapse: collapse;">
                    <thead>
                        <tr style="background: #f8f9fa;">
                            <th style="padding: 12px; text-align: left; border-bottom: 2px solid #dee2e6;">Prescription ID</th>
                            <th style="padding: 12px; text-align: left; border-bottom: 2px solid #dee2e6;">Patient</th>
                            <th style="padding: 12px; text-align: left; border-bottom: 2px solid #dee2e6;">Doctor</th>
                            <th style="padding: 12px; text-align: left; border-bottom: 2px solid #dee2e6;">Medication</th>
                            <th style="padding: 12px; text-align: left; border-bottom: 2px solid #dee2e6;">Status</th>
                            <th style="padding: 12px; text-align: left; border-bottom: 2px solid #dee2e6;">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td style="padding: 12px; border-bottom: 1px solid #dee2e6;">RX001</td>
                            <td style="padding: 12px; border-bottom: 1px solid #dee2e6;">John Doe</td>
                            <td style="padding: 12px; border-bottom: 1px solid #dee2e6;">Dr. Smith</td>
                            <td style="padding: 12px; border-bottom: 1px solid #dee2e6;">Amoxicillin 500mg</td>
                            <td style="padding: 12px; border-bottom: 1px solid #dee2e6;"><span class="badge badge-warning">Pending</span></td>
                            <td style="padding: 12px; border-bottom: 1px solid #dee2e6;">
                                <button class="btn btn-sm btn-primary">View</button>
                                <button class="btn btn-sm btn-success">Fill</button>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    `;
    return container;
}

// Create vitals content
function createVitalsContent() {
    const container = document.createElement('div');
    container.innerHTML = `
        <div class="content-card" style="background: white; padding: 20px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); margin-bottom: 20px;">
            <h3>Vital Signs Monitoring</h3>
            <div class="vitals-actions" style="display: flex; gap: 10px; margin-bottom: 20px;">
                <button class="btn btn-primary" onclick="recordVitals()">Record Vitals</button>
                <button class="btn btn-secondary" onclick="viewVitalsHistory()">View History</button>
                <button class="btn btn-secondary" onclick="exportVitals()">Export Data</button>
            </div>
            <div class="vitals-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; margin-bottom: 20px;">
                <div class="vital-card" style="background: #f8f9fa; padding: 20px; border-radius: 10px; text-align: center;">
                    <i class="fas fa-heartbeat" style="font-size: 2rem; color: #e74c3c; margin-bottom: 10px;"></i>
                    <h4>Heart Rate</h4>
                    <p style="font-size: 2rem; font-weight: bold; color: #333;">72 BPM</p>
                    <small style="color: #666;">Normal Range: 60-100</small>
                </div>
                <div class="vital-card" style="background: #f8f9fa; padding: 20px; border-radius: 10px; text-align: center;">
                    <i class="fas fa-thermometer-half" style="font-size: 2rem; color: #f39c12; margin-bottom: 10px;"></i>
                    <h4>Temperature</h4>
                    <p style="font-size: 2rem; font-weight: bold; color: #333;">98.6°F</p>
                    <small style="color: #666;">Normal Range: 97-99°F</small>
                </div>
                <div class="vital-card" style="background: #f8f9fa; padding: 20px; border-radius: 10px; text-align: center;">
                    <i class="fas fa-lungs" style="font-size: 2rem; color: #3498db; margin-bottom: 10px;"></i>
                    <h4>Blood Pressure</h4>
                    <p style="font-size: 2rem; font-weight: bold; color: #333;">120/80</p>
                    <small style="color: #666;">Normal Range: 90-140/60-90</small>
                </div>
                <div class="vital-card" style="background: #f8f9fa; padding: 20px; border-radius: 10px; text-align: center;">
                    <i class="fas fa-weight" style="font-size: 2rem; color: #9b59b6; margin-bottom: 10px;"></i>
                    <h4>Weight</h4>
                    <p style="font-size: 2rem; font-weight: bold; color: #333;">70 kg</p>
                    <small style="color: #666;">Last recorded: Today</small>
                </div>
            </div>
        </div>
    `;
    return container;
}

// Create records content
function createRecordsContent() {
    const container = document.createElement('div');
    container.innerHTML = `
        <div class="content-card" style="background: white; padding: 20px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); margin-bottom: 20px;">
            <h3>Medical Records</h3>
            <div class="records-actions" style="display: flex; gap: 10px; margin-bottom: 20px;">
                <button class="btn btn-primary" onclick="addRecord()">Add Record</button>
                <button class="btn btn-secondary" onclick="searchRecords()">Search Records</button>
                <button class="btn btn-secondary" onclick="exportRecords()">Export Records</button>
            </div>
            <div class="records-list" style="display: grid; gap: 15px;">
                <div class="record-item" style="background: #f8f9fa; padding: 15px; border-radius: 8px; border-left: 4px solid #3498db;">
                    <div style="display: flex; justify-content: between; align-items: center;">
                        <div>
                            <h5 style="margin: 0; color: #333;">Patient: John Doe</h5>
                            <p style="margin: 5px 0; color: #666;">Record Type: Diagnosis</p>
                            <p style="margin: 0; color: #666;">Date: 2024-01-15</p>
                        </div>
                        <div>
                            <button class="btn btn-sm btn-primary">View</button>
                            <button class="btn btn-sm btn-secondary">Edit</button>
                        </div>
                    </div>
                </div>
                <div class="record-item" style="background: #f8f9fa; padding: 15px; border-radius: 8px; border-left: 4px solid #e74c3c;">
                    <div style="display: flex; justify-content: between; align-items: center;">
                        <div>
                            <h5 style="margin: 0; color: #333;">Patient: Jane Smith</h5>
                            <p style="margin: 5px 0; color: #666;">Record Type: Lab Results</p>
                            <p style="margin: 0; color: #666;">Date: 2024-01-14</p>
                        </div>
                        <div>
                            <button class="btn btn-sm btn-primary">View</button>
                            <button class="btn btn-sm btn-secondary">Edit</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
    return container;
}

// Create billing content
function createBillingContent() {
    const container = document.createElement('div');
    container.innerHTML = `
        <div class="content-card" style="background: white; padding: 20px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); margin-bottom: 20px;">
            <h3>Billing Management</h3>
            <div class="billing-actions" style="display: flex; gap: 10px; margin-bottom: 20px;">
                <button class="btn btn-primary" onclick="createBill()">Create Bill</button>
                <button class="btn btn-secondary" onclick="viewBills()">View All Bills</button>
                <button class="btn btn-secondary" onclick="exportBills()">Export Bills</button>
            </div>
            <div class="billing-summary" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 20px;">
                <div class="summary-card" style="background: #e8f5e8; padding: 20px; border-radius: 10px; text-align: center;">
                    <h4 style="color: #27ae60; margin: 0;">Total Revenue</h4>
                    <p style="font-size: 2rem; font-weight: bold; color: #333; margin: 10px 0;">₹1,25,000</p>
                </div>
                <div class="summary-card" style="background: #fff3cd; padding: 20px; border-radius: 10px; text-align: center;">
                    <h4 style="color: #f39c12; margin: 0;">Pending Payments</h4>
                    <p style="font-size: 2rem; font-weight: bold; color: #333; margin: 10px 0;">₹15,000</p>
                </div>
                <div class="summary-card" style="background: #d1ecf1; padding: 20px; border-radius: 10px; text-align: center;">
                    <h4 style="color: #17a2b8; margin: 0;">Bills Today</h4>
                    <p style="font-size: 2rem; font-weight: bold; color: #333; margin: 10px 0;">25</p>
                </div>
            </div>
            <div class="billing-table" style="overflow-x: auto;">
                <table class="table" style="width: 100%; border-collapse: collapse;">
                    <thead>
                        <tr style="background: #f8f9fa;">
                            <th style="padding: 12px; text-align: left; border-bottom: 2px solid #dee2e6;">Bill ID</th>
                            <th style="padding: 12px; text-align: left; border-bottom: 2px solid #dee2e6;">Patient</th>
                            <th style="padding: 12px; text-align: left; border-bottom: 2px solid #dee2e6;">Amount</th>
                            <th style="padding: 12px; text-align: left; border-bottom: 2px solid #dee2e6;">Status</th>
                            <th style="padding: 12px; text-align: left; border-bottom: 2px solid #dee2e6;">Date</th>
                            <th style="padding: 12px; text-align: left; border-bottom: 2px solid #dee2e6;">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td style="padding: 12px; border-bottom: 1px solid #dee2e6;">B001</td>
                            <td style="padding: 12px; border-bottom: 1px solid #dee2e6;">John Doe</td>
                            <td style="padding: 12px; border-bottom: 1px solid #dee2e6;">₹2,500</td>
                            <td style="padding: 12px; border-bottom: 1px solid #dee2e6;"><span class="badge badge-success">Paid</span></td>
                            <td style="padding: 12px; border-bottom: 1px solid #dee2e6;">2024-01-15</td>
                            <td style="padding: 12px; border-bottom: 1px solid #dee2e6;">
                                <button class="btn btn-sm btn-primary">View</button>
                                <button class="btn btn-sm btn-secondary">Print</button>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    `;
    return container;
}

// Create reports content
function createReportsContent() {
    const container = document.createElement('div');
    container.innerHTML = `
        <div class="content-card" style="background: white; padding: 20px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); margin-bottom: 20px;">
            <h3>Reports & Analytics</h3>
            <div class="reports-actions" style="display: flex; gap: 10px; margin-bottom: 20px;">
                <button class="btn btn-primary" onclick="generateReport()">Generate Report</button>
                <button class="btn btn-secondary" onclick="viewAnalytics()">View Analytics</button>
                <button class="btn btn-secondary" onclick="exportReports()">Export Reports</button>
            </div>
            <div class="reports-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px;">
                <div class="report-card" style="background: #f8f9fa; padding: 20px; border-radius: 10px;">
                    <h4>Patient Statistics</h4>
                    <canvas id="patientChart" width="300" height="200"></canvas>
                </div>
                <div class="report-card" style="background: #f8f9fa; padding: 20px; border-radius: 10px;">
                    <h4>Revenue Analysis</h4>
                    <canvas id="revenueChart" width="300" height="200"></canvas>
                </div>
                <div class="report-card" style="background: #f8f9fa; padding: 20px; border-radius: 10px;">
                    <h4>Appointment Trends</h4>
                    <canvas id="appointmentChart" width="300" height="200"></canvas>
                </div>
            </div>
        </div>
    `;
    return container;
}

// Create settings content
function createSettingsContent() {
    const container = document.createElement('div');
    container.innerHTML = `
        <div class="content-card" style="background: white; padding: 20px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); margin-bottom: 20px;">
            <h3>System Settings</h3>
            <div class="settings-sections" style="display: grid; gap: 20px;">
                <div class="setting-section" style="background: #f8f9fa; padding: 20px; border-radius: 10px;">
                    <h4>General Settings</h4>
                    <div class="setting-item" style="margin-bottom: 15px;">
                        <label style="display: block; margin-bottom: 5px; font-weight: 600;">Hospital Name</label>
                        <input type="text" class="form-control" value="City General Hospital" style="padding: 8px; border: 1px solid #ddd; border-radius: 5px; width: 100%;">
                    </div>
                    <div class="setting-item" style="margin-bottom: 15px;">
                        <label style="display: block; margin-bottom: 5px; font-weight: 600;">Time Zone</label>
                        <select class="form-control" style="padding: 8px; border: 1px solid #ddd; border-radius: 5px; width: 100%;">
                            <option>UTC+5:30 (IST)</option>
                            <option>UTC+0 (GMT)</option>
                            <option>UTC-5 (EST)</option>
                        </select>
                    </div>
                </div>
                <div class="setting-section" style="background: #f8f9fa; padding: 20px; border-radius: 10px;">
                    <h4>Notification Settings</h4>
                    <div class="setting-item" style="margin-bottom: 15px;">
                        <label style="display: flex; align-items: center; gap: 10px;">
                            <input type="checkbox" checked>
                            <span>Email Notifications</span>
                        </label>
                    </div>
                    <div class="setting-item" style="margin-bottom: 15px;">
                        <label style="display: flex; align-items: center; gap: 10px;">
                            <input type="checkbox" checked>
                            <span>SMS Notifications</span>
                        </label>
                    </div>
                </div>
                <div class="setting-actions" style="text-align: right;">
                    <button class="btn btn-primary" onclick="saveSettings()">Save Settings</button>
                    <button class="btn btn-secondary" onclick="resetSettings()">Reset to Default</button>
                </div>
            </div>
        </div>
    `;
    return container;
}

// Create dashboard content (for patient dashboard)
function createDashboardContent() {
    const container = document.createElement('div');
    container.innerHTML = `
        <div class="content-card" style="background: white; padding: 20px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); margin-bottom: 20px;">
            <h3>Dashboard Overview</h3>
            <p>Welcome to your personal health dashboard. Here you can view your health summary and quick access to important information.</p>
            
            <div class="dashboard-widgets" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; margin-top: 20px;">
                <div class="widget" style="background: #f8f9fa; padding: 20px; border-radius: 10px; border-left: 4px solid #3498db;">
                    <h4 style="margin: 0 0 10px 0; color: #333;">Recent Appointments</h4>
                    <p style="margin: 0; color: #666;">View your upcoming and past appointments</p>
                    <button class="btn btn-primary btn-sm" onclick="showSection('appointments')" style="margin-top: 10px;">View Appointments</button>
                </div>
                
                <div class="widget" style="background: #f8f9fa; padding: 20px; border-radius: 10px; border-left: 4px solid #27ae60;">
                    <h4 style="margin: 0 0 10px 0; color: #333;">Medical Records</h4>
                    <p style="margin: 0; color: #666;">Access your medical history and test results</p>
                    <button class="btn btn-success btn-sm" onclick="showSection('records')" style="margin-top: 10px;">View Records</button>
                </div>
                
                <div class="widget" style="background: #f8f9fa; padding: 20px; border-radius: 10px; border-left: 4px solid #f39c12;">
                    <h4 style="margin: 0 0 10px 0; color: #333;">Prescriptions</h4>
                    <p style="margin: 0; color: #666;">View your current medications and prescriptions</p>
                    <button class="btn btn-warning btn-sm" onclick="showSection('prescriptions')" style="margin-top: 10px;">View Prescriptions</button>
                </div>
                
                <div class="widget" style="background: #f8f9fa; padding: 20px; border-radius: 10px; border-left: 4px solid #e74c3c;">
                    <h4 style="margin: 0 0 10px 0; color: #333;">Billing</h4>
                    <p style="margin: 0; color: #666;">Check your bills and payment history</p>
                    <button class="btn btn-danger btn-sm" onclick="showSection('billing')" style="margin-top: 10px;">View Billing</button>
                </div>
            </div>
        </div>
    `;
    return container;
}

// Create messages content
function createMessagesContent() {
    const container = document.createElement('div');
    container.innerHTML = `
        <div class="content-card" style="background: white; padding: 20px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); margin-bottom: 20px;">
            <h3>Messages</h3>
            <p>Communicate with your healthcare providers and receive important updates.</p>
            
            <div class="messages-actions" style="display: flex; gap: 10px; margin-bottom: 20px;">
                <button class="btn btn-primary" onclick="composeMessage()">Compose Message</button>
                <button class="btn btn-secondary" onclick="refreshMessages()">Refresh</button>
            </div>
            
            <div class="messages-list" style="max-height: 400px; overflow-y: auto;">
                <div class="message-item" style="border: 1px solid #e9ecef; border-radius: 8px; padding: 15px; margin-bottom: 10px;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                        <strong style="color: #333;">Dr. Smith</strong>
                        <span style="color: #666; font-size: 0.9rem;">2 hours ago</span>
                    </div>
                    <p style="margin: 0; color: #666;">Your test results are ready. Please schedule a follow-up appointment.</p>
                    <div style="margin-top: 10px;">
                        <span class="badge badge-info">Unread</span>
                    </div>
                </div>
                
                <div class="message-item" style="border: 1px solid #e9ecef; border-radius: 8px; padding: 15px; margin-bottom: 10px;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                        <strong style="color: #333;">Hospital Admin</strong>
                        <span style="color: #666; font-size: 0.9rem;">1 day ago</span>
                    </div>
                    <p style="margin: 0; color: #666;">Reminder: Your appointment is scheduled for tomorrow at 10:00 AM.</p>
                    <div style="margin-top: 10px;">
                        <span class="badge badge-success">Read</span>
                    </div>
                </div>
                
                <div class="message-item" style="border: 1px solid #e9ecef; border-radius: 8px; padding: 15px; margin-bottom: 10px;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                        <strong style="color: #333;">Pharmacy</strong>
                        <span style="color: #666; font-size: 0.9rem;">3 days ago</span>
                    </div>
                    <p style="margin: 0; color: #666;">Your prescription is ready for pickup.</p>
                    <div style="margin-top: 10px;">
                        <span class="badge badge-success">Read</span>
                    </div>
                </div>
            </div>
        </div>
    `;
    return container;
}

// Helper functions for messages
function composeMessage() {
    showNotification('Compose message functionality will be implemented soon!', 'info');
}

function refreshMessages() {
    showNotification('Messages refreshed!', 'success');
}

// Patient-specific content functions
function createPatientAppointmentContent() {
    const container = document.createElement('div');
    container.innerHTML = `
        <div class="content-card" style="background: white; padding: 20px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); margin-bottom: 20px;">
            <h3>My Appointments</h3>
            <p>View and manage your medical appointments.</p>
            
            <div class="appointment-actions" style="display: flex; gap: 10px; margin-bottom: 20px;">
                <button class="btn btn-primary" onclick="requestAppointment()">Request New Appointment</button>
                <button class="btn btn-secondary" onclick="loadPatientAppointments()">Refresh</button>
            </div>
            
            <div class="appointment-filters" style="display: flex; gap: 10px; margin-bottom: 20px;">
                <select id="appointment-status-filter" onchange="loadPatientAppointments()" style="padding: 8px; border: 1px solid #ddd; border-radius: 5px;">
                    <option value="">All Appointments</option>
                    <option value="scheduled">Scheduled</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                </select>
                </div>
                
            <div id="patient-appointments-list" class="appointment-list">
                <div style="text-align: center; padding: 40px; color: #666;">
                    <i class="fas fa-spinner fa-spin" style="font-size: 2rem; margin-bottom: 10px;"></i>
                    <p>Loading appointments...</p>
                </div>
            </div>
        </div>
    `;
    
    // Load appointments after creating the container
    setTimeout(() => loadPatientAppointments(), 100);
    
    return container;
}

function createPatientPrescriptionContent() {
    const container = document.createElement('div');
    container.innerHTML = `
        <div class="content-card" style="background: white; padding: 20px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); margin-bottom: 20px;">
            <h3>My Prescriptions</h3>
            <p>View your current medications and prescription history.</p>
            
            <div class="prescription-actions" style="display: flex; gap: 10px; margin-bottom: 20px;">
                <button class="btn btn-primary" onclick="requestRefill()">Request Refill</button>
                <button class="btn btn-secondary" onclick="loadPatientPrescriptions()">Refresh</button>
            </div>
            
            <div class="prescription-filters" style="display: flex; gap: 10px; margin-bottom: 20px;">
                <select id="prescription-status-filter" onchange="loadPatientPrescriptions()" style="padding: 8px; border: 1px solid #ddd; border-radius: 5px;">
                    <option value="active">Active Prescriptions</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                </select>
                </div>
                
            <div id="patient-prescriptions-list" class="prescription-list">
                <div style="text-align: center; padding: 40px; color: #666;">
                    <i class="fas fa-spinner fa-spin" style="font-size: 2rem; margin-bottom: 10px;"></i>
                    <p>Loading prescriptions...</p>
                </div>
            </div>
        </div>
    `;
    
    // Load prescriptions after creating the container
    setTimeout(() => loadPatientPrescriptions(), 100);
    
    return container;
}

function createPatientRecordsContent() {
    const container = document.createElement('div');
    container.innerHTML = `
        <div class="content-card" style="background: white; padding: 20px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); margin-bottom: 20px;">
            <h3>My Medical Records</h3>
            <p>Access your medical history, test results, and health information.</p>
            
            <div class="records-actions" style="display: flex; gap: 10px; margin-bottom: 20px;">
                <button class="btn btn-primary" onclick="downloadMedicalRecords()">Download Records</button>
                <button class="btn btn-secondary" onclick="viewTestResults()">View Test Results</button>
            </div>
            
            <div class="records-tabs" style="display: flex; gap: 10px; margin-bottom: 20px; border-bottom: 1px solid #e9ecef;">
                <button class="tab-btn active" onclick="showRecordTab('visits')" style="padding: 10px 20px; border: none; background: none; border-bottom: 2px solid #3498db; color: #3498db;">Recent Visits</button>
                <button class="tab-btn" onclick="showRecordTab('tests')" style="padding: 10px 20px; border: none; background: none; color: #666;">Test Results</button>
                <button class="tab-btn" onclick="showRecordTab('immunizations')" style="padding: 10px 20px; border: none; background: none; color: #666;">Immunizations</button>
            </div>
            
            <div class="records-content">
                <div class="record-item" style="border: 1px solid #e9ecef; border-radius: 8px; padding: 15px; margin-bottom: 10px; background: #f8f9fa;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                        <strong style="color: #333;">Annual Physical Exam</strong>
                        <span style="color: #666; font-size: 0.9rem;">January 10, 2024</span>
                    </div>
                    <p style="margin: 5px 0; color: #666;"><strong>Doctor:</strong> Dr. Michael Chen</p>
                    <p style="margin: 5px 0; color: #666;"><strong>Diagnosis:</strong> Healthy, no issues found</p>
                    <p style="margin: 5px 0; color: #666;"><strong>Notes:</strong> Blood pressure normal, weight stable</p>
                    <div style="margin-top: 10px;">
                        <button class="btn btn-sm btn-info" onclick="viewVisitDetails('VISIT001')">View Details</button>
                        <button class="btn btn-sm btn-secondary" onclick="downloadVisitSummary('VISIT001')">Download Summary</button>
                    </div>
                </div>
                
                <div class="record-item" style="border: 1px solid #e9ecef; border-radius: 8px; padding: 15px; margin-bottom: 10px; background: #f8f9fa;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                        <strong style="color: #333;">Follow-up Consultation</strong>
                        <span style="color: #666; font-size: 0.9rem;">December 15, 2023</span>
                    </div>
                    <p style="margin: 5px 0; color: #666;"><strong>Doctor:</strong> Dr. Sarah Johnson</p>
                    <p style="margin: 5px 0; color: #666;"><strong>Diagnosis:</strong> Diabetes management</p>
                    <p style="margin: 5px 0; color: #666;"><strong>Notes:</strong> Medication adjustment recommended</p>
                    <div style="margin-top: 10px;">
                        <button class="btn btn-sm btn-info" onclick="viewVisitDetails('VISIT002')">View Details</button>
                        <button class="btn btn-sm btn-secondary" onclick="downloadVisitSummary('VISIT002')">Download Summary</button>
                    </div>
                </div>
            </div>
        </div>
    `;
    return container;
}

function createPatientBillingContent() {
    const container = document.createElement('div');
    container.innerHTML = `
        <div class="content-card" style="background: white; padding: 20px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); margin-bottom: 20px;">
            <h3>My Billing</h3>
            <p>View your bills, payment history, and insurance information.</p>
            
            <div id="billing-summary" class="billing-summary" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin-bottom: 20px;">
                <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; text-align: center;">
                    <h4 style="margin: 0 0 5px 0; color: #333;">Outstanding Balance</h4>
                    <p id="outstanding-balance" style="margin: 0; font-size: 1.5rem; color: #e74c3c; font-weight: bold;">Loading...</p>
                </div>
                <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; text-align: center;">
                    <h4 style="margin: 0 0 5px 0; color: #333;">Last Payment</h4>
                    <p id="last-payment" style="margin: 0; font-size: 1.5rem; color: #27ae60; font-weight: bold;">Loading...</p>
                </div>
                <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; text-align: center;">
                    <h4 style="margin: 0 0 5px 0; color: #333;">Total Bills</h4>
                    <p id="total-bills" style="margin: 0; font-size: 1.2rem; color: #f39c12; font-weight: bold;">Loading...</p>
                </div>
            </div>
            
            <div class="billing-actions" style="display: flex; gap: 10px; margin-bottom: 20px;">
                <button class="btn btn-primary" onclick="makePayment()">Make Payment</button>
                <button class="btn btn-secondary" onclick="loadPatientBilling()">Refresh</button>
                <button class="btn btn-secondary" onclick="downloadInvoice()">Download Invoice</button>
            </div>
            
            <div class="billing-filters" style="display: flex; gap: 10px; margin-bottom: 20px;">
                <select id="billing-status-filter" onchange="loadPatientBilling()" style="padding: 8px; border: 1px solid #ddd; border-radius: 5px;">
                    <option value="">All Bills</option>
                    <option value="pending">Pending</option>
                    <option value="paid">Paid</option>
                    <option value="overdue">Overdue</option>
                </select>
            </div>
            
            <div id="patient-billing-list" class="billing-list">
                <div style="text-align: center; padding: 40px; color: #666;">
                    <i class="fas fa-spinner fa-spin" style="font-size: 2rem; margin-bottom: 10px;"></i>
                    <p>Loading billing records...</p>
                </div>
            </div>
        </div>
    `;
    
    // Load billing data after creating the container
    setTimeout(() => loadPatientBilling(), 100);
    
    return container;
}

// Patient-specific API functions
async function loadPatientAppointments() {
    try {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        const token = user.token;
        
        if (!token || user.isDemo) {
            // Use mock data for demo
            displayMockAppointments();
            return;
        }
        
        const statusFilter = document.getElementById('appointment-status-filter')?.value || '';
        const url = `${API_BASE_URL}/patient-portal/appointments${statusFilter ? `?status=${statusFilter}` : ''}`;
        
        const response = await fetch(url, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            throw new Error('Failed to load appointments');
        }
        
        const data = await response.json();
        displayAppointments(data.data);
        
    } catch (error) {
        console.error('Error loading appointments:', error);
        showNotification('Failed to load appointments. Using demo data.', 'warning');
        displayMockAppointments();
    }
}

async function loadPatientPrescriptions() {
    try {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        const token = user.token;
        
        if (!token || user.isDemo) {
            // Use mock data for demo
            displayMockPrescriptions();
            return;
        }
        
        const statusFilter = document.getElementById('prescription-status-filter')?.value || 'active';
        const url = `${API_BASE_URL}/patient-portal/prescriptions?status=${statusFilter}`;
        
        const response = await fetch(url, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            throw new Error('Failed to load prescriptions');
        }
        
        const data = await response.json();
        displayPrescriptions(data.data);
        
    } catch (error) {
        console.error('Error loading prescriptions:', error);
        showNotification('Failed to load prescriptions. Using demo data.', 'warning');
        displayMockPrescriptions();
    }
}

async function loadPatientBilling() {
    try {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        const token = user.token;
        
        if (!token || user.isDemo) {
            // Use mock data for demo
            displayMockBilling();
            return;
        }
        
        const url = `${API_BASE_URL}/patient-portal/billing`;
        
        const response = await fetch(url, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            throw new Error('Failed to load billing');
        }
        
        const data = await response.json();
        displayBilling(data.data);
        
    } catch (error) {
        console.error('Error loading billing:', error);
        showNotification('Failed to load billing. Using demo data.', 'warning');
        displayMockBilling();
    }
}

// Display functions
function displayAppointments(appointments) {
    const container = document.getElementById('patient-appointments-list');
    if (!container) return;
    
    if (appointments.length === 0) {
        container.innerHTML = `
            <div style="text-align: center; padding: 40px; color: #666;">
                <i class="fas fa-calendar-times" style="font-size: 3rem; margin-bottom: 15px; opacity: 0.3;"></i>
                <p>No appointments found</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = appointments.map(appointment => `
        <div class="appointment-item" style="border: 1px solid #e9ecef; border-radius: 8px; padding: 15px; margin-bottom: 10px; background: #f8f9fa;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                <strong style="color: #333;">Dr. ${appointment.doctor_first_name} ${appointment.doctor_last_name}</strong>
                <span class="badge badge-${getStatusColor(appointment.status)}">${appointment.status}</span>
                    </div>
            <p style="margin: 5px 0; color: #666;"><strong>Date:</strong> ${formatDate(appointment.appointment_date)}</p>
            <p style="margin: 5px 0; color: #666;"><strong>Time:</strong> ${appointment.appointment_time}</p>
            <p style="margin: 5px 0; color: #666;"><strong>Purpose:</strong> ${appointment.reason || 'General consultation'}</p>
                    <div style="margin-top: 10px;">
                ${appointment.status === 'scheduled' || appointment.status === 'confirmed' ? `
                    <button class="btn btn-sm btn-secondary" onclick="rescheduleAppointment('${appointment.id}')">Reschedule</button>
                    <button class="btn btn-sm btn-danger" onclick="cancelAppointment('${appointment.id}')">Cancel</button>
                ` : ''}
                <button class="btn btn-sm btn-info" onclick="viewAppointmentDetails('${appointment.id}')">View Details</button>
                    </div>
                </div>
    `).join('');
}

function displayPrescriptions(prescriptions) {
    const container = document.getElementById('patient-prescriptions-list');
    if (!container) return;
    
    if (prescriptions.length === 0) {
        container.innerHTML = `
            <div style="text-align: center; padding: 40px; color: #666;">
                <i class="fas fa-pills" style="font-size: 3rem; margin-bottom: 15px; opacity: 0.3;"></i>
                <p>No prescriptions found</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = prescriptions.map(prescription => `
        <div class="prescription-item" style="border: 1px solid #e9ecef; border-radius: 8px; padding: 15px; margin-bottom: 10px; background: #f8f9fa;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                <strong style="color: #333;">${prescription.medication_name}</strong>
                <span class="badge badge-${getStatusColor(prescription.status)}">${prescription.status}</span>
                    </div>
            <p style="margin: 5px 0; color: #666;"><strong>Prescribed by:</strong> Dr. ${prescription.doctor_first_name} ${prescription.doctor_last_name}</p>
            <p style="margin: 5px 0; color: #666;"><strong>Dosage:</strong> ${prescription.dosage}</p>
            <p style="margin: 5px 0; color: #666;"><strong>Instructions:</strong> ${prescription.instructions}</p>
            <p style="margin: 5px 0; color: #666;"><strong>Refills remaining:</strong> ${prescription.refills_remaining || 0}</p>
                    <div style="margin-top: 10px;">
                ${prescription.status === 'active' && prescription.refills_remaining > 0 ? `
                    <button class="btn btn-sm btn-warning" onclick="requestRefill('${prescription.id}')">Request Refill</button>
                ` : ''}
                <button class="btn btn-sm btn-info" onclick="viewPrescriptionDetails('${prescription.id}')">View Details</button>
                    </div>
                </div>
    `).join('');
}

function displayBilling(bills) {
    const container = document.getElementById('patient-billing-list');
    if (!container) return;
    
    // Update billing summary
    const outstandingBalance = bills.filter(bill => bill.status === 'pending').reduce((sum, bill) => sum + parseFloat(bill.amount), 0);
    const lastPayment = bills.filter(bill => bill.status === 'paid').reduce((sum, bill) => sum + parseFloat(bill.amount), 0);
    const totalBills = bills.length;
    
    const outstandingElement = document.getElementById('outstanding-balance');
    const lastPaymentElement = document.getElementById('last-payment');
    const totalBillsElement = document.getElementById('total-bills');
    
    if (outstandingElement) outstandingElement.textContent = `₹${outstandingBalance.toFixed(2)}`;
    if (lastPaymentElement) lastPaymentElement.textContent = `₹${lastPayment.toFixed(2)}`;
    if (totalBillsElement) totalBillsElement.textContent = totalBills;
    
    if (bills.length === 0) {
        container.innerHTML = `
            <div style="text-align: center; padding: 40px; color: #666;">
                <i class="fas fa-file-invoice" style="font-size: 3rem; margin-bottom: 15px; opacity: 0.3;"></i>
                <p>No billing records found</p>
        </div>
    `;
        return;
    }
    
    container.innerHTML = bills.map(bill => `
        <div class="bill-item" style="border: 1px solid #e9ecef; border-radius: 8px; padding: 15px; margin-bottom: 10px; background: #f8f9fa;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                <strong style="color: #333;">Bill #${bill.bill_number}</strong>
                <span class="badge badge-${getStatusColor(bill.status)}">${bill.status}</span>
            </div>
            <p style="margin: 5px 0; color: #666;"><strong>Date:</strong> ${formatDate(bill.created_at)}</p>
            <p style="margin: 5px 0; color: #666;"><strong>Service:</strong> ${bill.service_description || 'Medical service'}</p>
            <p style="margin: 5px 0; color: #666;"><strong>Amount:</strong> ₹${bill.amount}</p>
            <p style="margin: 5px 0; color: #666;"><strong>Due Date:</strong> ${formatDate(bill.due_date)}</p>
            <div style="margin-top: 10px;">
                ${bill.status === 'pending' ? `
                    <button class="btn btn-sm btn-primary" onclick="payBill('${bill.id}')">Pay Now</button>
                ` : ''}
                <button class="btn btn-sm btn-info" onclick="viewBillDetails('${bill.id}')">View Details</button>
                ${bill.status === 'paid' ? `
                    <button class="btn btn-sm btn-secondary" onclick="downloadReceipt('${bill.id}')">Download Receipt</button>
                ` : ''}
            </div>
        </div>
    `).join('');
}

// Mock data display functions for demo mode
function displayMockAppointments() {
    const mockAppointments = [
        {
            id: 'APT001',
            doctor_first_name: 'Sarah',
            doctor_last_name: 'Johnson',
            appointment_date: '2024-01-16',
            appointment_time: '14:00',
            reason: 'Follow-up consultation',
            status: 'scheduled'
        },
        {
            id: 'APT002',
            doctor_first_name: 'Michael',
            doctor_last_name: 'Chen',
            appointment_date: '2024-01-10',
            appointment_time: '10:00',
            reason: 'Annual checkup',
            status: 'completed'
        }
    ];
    displayAppointments(mockAppointments);
}

function displayMockPrescriptions() {
    const mockPrescriptions = [
        {
            id: 'RX001',
            medication_name: 'Metformin 500mg',
            doctor_first_name: 'Sarah',
            doctor_last_name: 'Johnson',
            dosage: '1 tablet twice daily',
            instructions: 'Take with food',
            refills_remaining: 2,
            status: 'active'
        },
        {
            id: 'RX002',
            medication_name: 'Lisinopril 10mg',
            doctor_first_name: 'Michael',
            doctor_last_name: 'Chen',
            dosage: '1 tablet daily',
            instructions: 'Take in the morning',
            refills_remaining: 1,
            status: 'active'
        }
    ];
    displayPrescriptions(mockPrescriptions);
}

function displayMockBilling() {
    const mockBills = [
        {
            id: 'BILL001',
            bill_number: 'INV-2024-001',
            created_at: '2024-01-10',
            service_description: 'Annual Physical Exam',
            amount: 1500,
            due_date: '2024-01-25',
            status: 'pending'
        },
        {
            id: 'BILL002',
            bill_number: 'INV-2024-002',
            created_at: '2023-12-15',
            service_description: 'Follow-up Consultation',
            amount: 800,
            due_date: '2023-12-30',
            status: 'paid'
        }
    ];
    displayBilling(mockBills);
}

// Helper functions
function getStatusColor(status) {
    const colors = {
        'scheduled': 'info',
        'confirmed': 'info',
        'completed': 'success',
        'cancelled': 'danger',
        'pending': 'warning',
        'paid': 'success',
        'active': 'success'
    };
    return colors[status] || 'secondary';
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

// Patient-specific helper functions
function requestAppointment() {
    showNotification('Appointment request functionality will be implemented soon!', 'info');
}

function rescheduleAppointment(appointmentId) {
    showNotification(`Rescheduling appointment ${appointmentId}...`, 'info');
}

async function cancelAppointment(appointmentId) {
    if (!confirm('Are you sure you want to cancel this appointment?')) {
        return;
    }
    
    try {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        const token = user.token;
        
        if (!token || user.isDemo) {
        showNotification(`Appointment ${appointmentId} cancelled successfully!`, 'success');
            loadPatientAppointments(); // Refresh the list
            return;
        }
        
        const response = await fetch(`${API_BASE_URL}/patient-portal/appointments/${appointmentId}/cancel`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            throw new Error('Failed to cancel appointment');
        }
        
        showNotification('Appointment cancelled successfully!', 'success');
        loadPatientAppointments(); // Refresh the list
        
    } catch (error) {
        console.error('Error cancelling appointment:', error);
        showNotification('Failed to cancel appointment', 'error');
    }
}

function viewAppointmentDetails(appointmentId) {
    showNotification(`Viewing details for appointment ${appointmentId}...`, 'info');
}

async function requestRefill(prescriptionId) {
    if (!prescriptionId) {
        showNotification('Refill request functionality will be implemented soon!', 'info');
        return;
    }
    
    try {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        const token = user.token;
        
        if (!token || user.isDemo) {
            showNotification(`Refill requested for prescription ${prescriptionId}...`, 'success');
            return;
        }
        
        const response = await fetch(`${API_BASE_URL}/patient-portal/prescriptions/${prescriptionId}/refill`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            throw new Error('Failed to request refill');
        }
        
        showNotification('Refill request submitted successfully!', 'success');
        
    } catch (error) {
        console.error('Error requesting refill:', error);
        showNotification('Failed to submit refill request', 'error');
    }
}

function viewPrescriptionDetails(prescriptionId) {
    showNotification(`Viewing details for prescription ${prescriptionId}...`, 'info');
}

function downloadMedicalRecords() {
    showNotification('Downloading medical records...', 'info');
}

function viewTestResults() {
    showNotification('Loading test results...', 'info');
}

function showRecordTab(tab) {
    showNotification(`Switching to ${tab} tab...`, 'info');
}

function viewVisitDetails(visitId) {
    showNotification(`Viewing details for visit ${visitId}...`, 'info');
}

function downloadVisitSummary(visitId) {
    showNotification(`Downloading summary for visit ${visitId}...`, 'info');
}

function makePayment() {
    showNotification('Payment functionality will be implemented soon!', 'info');
}

function viewPaymentHistory() {
    showNotification('Loading payment history...', 'info');
}

function downloadInvoice() {
    showNotification('Downloading invoice...', 'info');
}

function payBill(billId) {
    showNotification(`Processing payment for bill ${billId}...`, 'info');
}

function viewBillDetails(billId) {
    showNotification(`Viewing details for bill ${billId}...`, 'info');
}

function downloadReceipt(billId) {
    showNotification(`Downloading receipt for bill ${billId}...`, 'info');
}

// Create default content
function createDefaultContent(section) {
    const container = document.createElement('div');
    container.innerHTML = `
        <div class="content-card" style="background: white; padding: 20px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); margin-bottom: 20px;">
            <h3>${section.charAt(0).toUpperCase() + section.slice(1)} Management</h3>
            <p>This section is under development. More features will be added soon.</p>
            <div class="placeholder-content" style="text-align: center; padding: 40px; color: #666;">
                <i class="fas fa-cog" style="font-size: 3rem; margin-bottom: 20px; opacity: 0.3;"></i>
                <p>Coming Soon...</p>
            </div>
        </div>
    `;
    return container;
}

// Action functions for buttons
function addUser() { 
    const formFields = [
        { name: 'firstName', label: 'First Name', type: 'text', required: true, placeholder: 'Enter first name' },
        { name: 'lastName', label: 'Last Name', type: 'text', required: true, placeholder: 'Enter last name' },
        { name: 'email', label: 'Email', type: 'email', required: true, placeholder: 'Enter email address' },
        { name: 'role', label: 'Role', type: 'select', required: true, options: [
            { value: 'admin', label: 'Administrator' },
            { value: 'doctor', label: 'Doctor' },
            { value: 'nurse', label: 'Nurse' },
            { value: 'receptionist', label: 'Receptionist' },
            { value: 'pharmacist', label: 'Pharmacist' },
            { value: 'patient', label: 'Patient' }
        ]},
        { name: 'phone', label: 'Phone', type: 'tel', required: false, placeholder: 'Enter phone number' }
    ];
    
    const formHTML = createForm(formFields);
    showModal('Add New User', formHTML, () => {
        const form = document.getElementById('dynamicForm');
        const formData = new FormData(form);
        const userData = Object.fromEntries(formData);
        
        // Validate form
        const rules = {
            firstName: { label: 'First Name', required: true },
            lastName: { label: 'Last Name', required: true },
            email: { label: 'Email', required: true, pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Please enter a valid email address' },
            role: { label: 'Role', required: true }
        };
        
        const errors = validateForm(userData, rules);
        if (Object.keys(errors).length > 0) {
            showNotification('Please fix the form errors', 'error');
            return;
        }
        
        // Here you would typically send to API
        showNotification('User added successfully!', 'success');
        closeModal();
    });
}

function importUsers() { showNotification('Import Users functionality would be implemented here'); }
function exportUsers() { showNotification('Export Users functionality would be implemented here'); }

// Appointment Management Functions
function openAppointmentForm() {
    const formFields = [
        { name: 'patientId', label: 'Patient', type: 'select', required: true, options: patients.map(p => ({ value: p.id, label: `${p.firstName} ${p.lastName} (${p.id})` })) },
        { name: 'doctorId', label: 'Doctor', type: 'select', required: true, options: doctors.filter(d => d.available).map(d => ({ value: d.id, label: `${d.name} - ${d.specialty}` })) },
        { name: 'date', label: 'Date', type: 'date', required: true },
        { name: 'time', label: 'Time', type: 'time', required: true },
        { name: 'reason', label: 'Reason for Visit', type: 'textarea', required: false, placeholder: 'Enter reason for appointment' }
    ];
    
    const formHTML = createForm(formFields);
    showModal('Schedule Appointment', formHTML, () => {
        const form = document.getElementById('dynamicForm');
        const formData = new FormData(form);
        const appointmentData = Object.fromEntries(formData);
        
        // Validate form
        if (!appointmentData.patientId || !appointmentData.doctorId || !appointmentData.date || !appointmentData.time) {
            showNotification('Please fill in all required fields', 'error');
            return;
        }
        
        // Create new appointment
        const patient = patients.find(p => p.id === appointmentData.patientId);
        const doctor = doctors.find(d => d.id === appointmentData.doctorId);
        
        const newAppointment = {
            id: 'APT' + String(appointments.length + 1).padStart(3, '0'),
            patientId: appointmentData.patientId,
            patientName: `${patient.firstName} ${patient.lastName}`,
            doctorId: appointmentData.doctorId,
            doctorName: doctor.name,
            date: appointmentData.date,
            time: appointmentData.time,
            reason: appointmentData.reason || 'No reason provided',
            status: 'pending',
            createdAt: new Date().toISOString()
        };
        
        appointments.push(newAppointment);
        loadAppointments();
        showNotification('Appointment scheduled successfully!', 'success');
        closeModal();
    });
}

function loadAppointments() {
    const tbody = document.getElementById('appointmentTableBody');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    appointments.forEach(appointment => {
        const row = document.createElement('tr');
        const statusClass = appointment.status === 'confirmed' ? 'badge-success' : 
                           appointment.status === 'pending' ? 'badge-warning' : 
                           appointment.status === 'completed' ? 'badge-info' : 'badge-danger';
        
        row.innerHTML = `
            <td style="padding: 12px; border-bottom: 1px solid #dee2e6;">${appointment.id}</td>
            <td style="padding: 12px; border-bottom: 1px solid #dee2e6;">${appointment.patientName}</td>
            <td style="padding: 12px; border-bottom: 1px solid #dee2e6;">${appointment.doctorName}</td>
            <td style="padding: 12px; border-bottom: 1px solid #dee2e6;">${formatDate(appointment.date)} ${appointment.time}</td>
            <td style="padding: 12px; border-bottom: 1px solid #dee2e6;">${appointment.reason}</td>
            <td style="padding: 12px; border-bottom: 1px solid #dee2e6;"><span class="badge ${statusClass}">${appointment.status.toUpperCase()}</span></td>
            <td style="padding: 12px; border-bottom: 1px solid #dee2e6;">
                <button class="btn btn-sm btn-primary" onclick="editAppointment('${appointment.id}')">Edit</button>
                <button class="btn btn-sm btn-danger" onclick="cancelAppointment('${appointment.id}')">Cancel</button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

function filterAppointments() {
    const filter = document.getElementById('appointmentFilter').value;
    const tbody = document.getElementById('appointmentTableBody');
    if (!tbody) return;
    
    let filteredAppointments = appointments;
    
    if (filter === 'today') {
        const today = new Date().toISOString().split('T')[0];
        filteredAppointments = appointments.filter(apt => apt.date === today);
    } else if (filter === 'week') {
        const today = new Date();
        const weekFromNow = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
        filteredAppointments = appointments.filter(apt => {
            const aptDate = new Date(apt.date);
            return aptDate >= today && aptDate <= weekFromNow;
        });
    } else if (filter !== 'all') {
        filteredAppointments = appointments.filter(apt => apt.status === filter);
    }
    
    tbody.innerHTML = '';
    filteredAppointments.forEach(appointment => {
        const row = document.createElement('tr');
        const statusClass = appointment.status === 'confirmed' ? 'badge-success' : 
                           appointment.status === 'pending' ? 'badge-warning' : 
                           appointment.status === 'completed' ? 'badge-info' : 'badge-danger';
        
        row.innerHTML = `
            <td style="padding: 12px; border-bottom: 1px solid #dee2e6;">${appointment.id}</td>
            <td style="padding: 12px; border-bottom: 1px solid #dee2e6;">${appointment.patientName}</td>
            <td style="padding: 12px; border-bottom: 1px solid #dee2e6;">${appointment.doctorName}</td>
            <td style="padding: 12px; border-bottom: 1px solid #dee2e6;">${formatDate(appointment.date)} ${appointment.time}</td>
            <td style="padding: 12px; border-bottom: 1px solid #dee2e6;">${appointment.reason}</td>
            <td style="padding: 12px; border-bottom: 1px solid #dee2e6;"><span class="badge ${statusClass}">${appointment.status.toUpperCase()}</span></td>
            <td style="padding: 12px; border-bottom: 1px solid #dee2e6;">
                <button class="btn btn-sm btn-primary" onclick="editAppointment('${appointment.id}')">Edit</button>
                <button class="btn btn-sm btn-danger" onclick="cancelAppointment('${appointment.id}')">Cancel</button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

function searchAppointments() {
    const searchTerm = document.getElementById('appointmentSearch').value.toLowerCase();
    const rows = document.querySelectorAll('#appointmentTableBody tr');
    
    rows.forEach(row => {
        const text = row.textContent.toLowerCase();
        if (text.includes(searchTerm)) {
            row.style.display = '';
        } else {
            row.style.display = 'none';
        }
    });
}

function editAppointment(appointmentId) {
    const appointment = appointments.find(apt => apt.id === appointmentId);
    if (!appointment) return;
    
    const formFields = [
        { name: 'patientId', label: 'Patient', type: 'select', required: true, options: patients.map(p => ({ value: p.id, label: `${p.firstName} ${p.lastName} (${p.id})` })), value: appointment.patientId },
        { name: 'doctorId', label: 'Doctor', type: 'select', required: true, options: doctors.map(d => ({ value: d.id, label: `${d.name} - ${d.specialty}` })), value: appointment.doctorId },
        { name: 'date', label: 'Date', type: 'date', required: true, value: appointment.date },
        { name: 'time', label: 'Time', type: 'time', required: true, value: appointment.time },
        { name: 'reason', label: 'Reason for Visit', type: 'textarea', required: false, value: appointment.reason },
        { name: 'status', label: 'Status', type: 'select', required: true, options: [
            { value: 'pending', label: 'Pending' },
            { value: 'confirmed', label: 'Confirmed' },
            { value: 'completed', label: 'Completed' },
            { value: 'cancelled', label: 'Cancelled' }
        ], value: appointment.status }
    ];
    
    const formHTML = createForm(formFields);
    showModal('Edit Appointment', formHTML, () => {
        const form = document.getElementById('dynamicForm');
        const formData = new FormData(form);
        const appointmentData = Object.fromEntries(formData);
        
        // Update appointment
        const patient = patients.find(p => p.id === appointmentData.patientId);
        const doctor = doctors.find(d => d.id === appointmentData.doctorId);
        
        appointment.patientId = appointmentData.patientId;
        appointment.patientName = `${patient.firstName} ${patient.lastName}`;
        appointment.doctorId = appointmentData.doctorId;
        appointment.doctorName = doctor.name;
        appointment.date = appointmentData.date;
        appointment.time = appointmentData.time;
        appointment.reason = appointmentData.reason;
        appointment.status = appointmentData.status;
        
        loadAppointments();
        showNotification('Appointment updated successfully!', 'success');
        closeModal();
    });
}

function cancelAppointment(appointmentId) {
    if (confirm('Are you sure you want to cancel this appointment?')) {
        const appointment = appointments.find(apt => apt.id === appointmentId);
        if (appointment) {
            appointment.status = 'cancelled';
            loadAppointments();
            showNotification('Appointment cancelled successfully!', 'success');
        }
    }
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
    });
}

function viewCalendar() { showNotification('View Calendar functionality would be implemented here'); }
function exportAppointments() { showNotification('Export Appointments functionality would be implemented here'); }

// Patient Management Functions
function openPatientForm(patientId = null) {
    const isEdit = patientId !== null;
    const patient = isEdit ? patients.find(p => p.id === patientId) : null;
    
    const formFields = [
        { name: 'firstName', label: 'First Name', type: 'text', required: true, placeholder: 'Enter first name', value: patient?.firstName || '' },
        { name: 'lastName', label: 'Last Name', type: 'text', required: true, placeholder: 'Enter last name', value: patient?.lastName || '' },
        { name: 'dateOfBirth', label: 'Date of Birth', type: 'date', required: true, value: patient?.dateOfBirth || '' },
        { name: 'gender', label: 'Gender', type: 'select', required: true, options: [
            { value: 'male', label: 'Male' },
            { value: 'female', label: 'Female' },
            { value: 'other', label: 'Other' }
        ], value: patient?.gender || '' },
        { name: 'phone', label: 'Phone', type: 'tel', required: true, placeholder: 'Enter phone number', value: patient?.phone || '' },
        { name: 'email', label: 'Email', type: 'email', required: false, placeholder: 'Enter email address', value: patient?.email || '' },
        { name: 'address', label: 'Address', type: 'textarea', required: false, placeholder: 'Enter address', value: patient?.address || '' },
        { name: 'emergencyContact', label: 'Emergency Contact', type: 'text', required: false, placeholder: 'Enter emergency contact name', value: patient?.emergencyContact || '' },
        { name: 'emergencyPhone', label: 'Emergency Phone', type: 'tel', required: false, placeholder: 'Enter emergency contact phone', value: patient?.emergencyPhone || '' }
    ];
    
    const formHTML = createForm(formFields);
    showModal(isEdit ? 'Edit Patient' : 'Add New Patient', formHTML, () => {
        const form = document.getElementById('dynamicForm');
        const formData = new FormData(form);
        const patientData = Object.fromEntries(formData);
        
        // Validate form
        if (!patientData.firstName || !patientData.lastName || !patientData.dateOfBirth || !patientData.gender || !patientData.phone) {
            showNotification('Please fill in all required fields', 'error');
            return;
        }
        
        if (isEdit) {
            // Update existing patient
            Object.assign(patient, patientData);
            showNotification('Patient updated successfully!', 'success');
        } else {
            // Create new patient
            const newPatient = {
                id: 'P' + String(patients.length + 1).padStart(3, '0'),
                ...patientData,
                status: 'active',
                createdAt: new Date().toISOString()
            };
            patients.push(newPatient);
            showNotification('Patient added successfully!', 'success');
        }
        
        loadPatients();
        closeModal();
    });
}

function loadPatients() {
    const tbody = document.getElementById('patientTableBody');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    patients.forEach(patient => {
        const age = calculateAge(patient.dateOfBirth);
        const statusClass = patient.status === 'active' ? 'badge-success' : 
                           patient.status === 'inactive' ? 'badge-warning' : 
                           patient.status === 'critical' ? 'badge-danger' : 'badge-info';
        
        const row = document.createElement('tr');
        row.innerHTML = `
            <td style="padding: 12px; border-bottom: 1px solid #dee2e6;">${patient.id}</td>
            <td style="padding: 12px; border-bottom: 1px solid #dee2e6;">${patient.firstName} ${patient.lastName}</td>
            <td style="padding: 12px; border-bottom: 1px solid #dee2e6;">${age}</td>
            <td style="padding: 12px; border-bottom: 1px solid #dee2e6;">${patient.phone}</td>
            <td style="padding: 12px; border-bottom: 1px solid #dee2e6;">${patient.email || 'N/A'}</td>
            <td style="padding: 12px; border-bottom: 1px solid #dee2e6;"><span class="badge ${statusClass}">${patient.status.toUpperCase()}</span></td>
            <td style="padding: 12px; border-bottom: 1px solid #dee2e6;">
                <button class="btn btn-sm btn-primary" onclick="viewPatient('${patient.id}')">View</button>
                <button class="btn btn-sm btn-secondary" onclick="openPatientForm('${patient.id}')">Edit</button>
                <button class="btn btn-sm btn-danger" onclick="deletePatient('${patient.id}')">Delete</button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

function filterPatients() {
    const filter = document.getElementById('patientFilter').value;
    const tbody = document.getElementById('patientTableBody');
    if (!tbody) return;
    
    let filteredPatients = patients;
    
    if (filter !== 'all') {
        filteredPatients = patients.filter(patient => patient.status === filter);
    }
    
    tbody.innerHTML = '';
    filteredPatients.forEach(patient => {
        const age = calculateAge(patient.dateOfBirth);
        const statusClass = patient.status === 'active' ? 'badge-success' : 
                           patient.status === 'inactive' ? 'badge-warning' : 
                           patient.status === 'critical' ? 'badge-danger' : 'badge-info';
        
        const row = document.createElement('tr');
        row.innerHTML = `
            <td style="padding: 12px; border-bottom: 1px solid #dee2e6;">${patient.id}</td>
            <td style="padding: 12px; border-bottom: 1px solid #dee2e6;">${patient.firstName} ${patient.lastName}</td>
            <td style="padding: 12px; border-bottom: 1px solid #dee2e6;">${age}</td>
            <td style="padding: 12px; border-bottom: 1px solid #dee2e6;">${patient.phone}</td>
            <td style="padding: 12px; border-bottom: 1px solid #dee2e6;">${patient.email || 'N/A'}</td>
            <td style="padding: 12px; border-bottom: 1px solid #dee2e6;"><span class="badge ${statusClass}">${patient.status.toUpperCase()}</span></td>
            <td style="padding: 12px; border-bottom: 1px solid #dee2e6;">
                <button class="btn btn-sm btn-primary" onclick="viewPatient('${patient.id}')">View</button>
                <button class="btn btn-sm btn-secondary" onclick="openPatientForm('${patient.id}')">Edit</button>
                <button class="btn btn-sm btn-danger" onclick="deletePatient('${patient.id}')">Delete</button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

function searchPatients() {
    const searchTerm = document.getElementById('patientSearch').value.toLowerCase();
    const rows = document.querySelectorAll('#patientTableBody tr');
    
    rows.forEach(row => {
        const text = row.textContent.toLowerCase();
        if (text.includes(searchTerm)) {
            row.style.display = '';
        } else {
            row.style.display = 'none';
        }
    });
}

function viewPatient(patientId) {
    const patient = patients.find(p => p.id === patientId);
    if (!patient) return;
    
    const age = calculateAge(patient.dateOfBirth);
    const content = `
        <div style="background: #f8f9fa; padding: 20px; border-radius: 10px;">
            <h4>Patient Details</h4>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-top: 15px;">
                <div><strong>Patient ID:</strong> ${patient.id}</div>
                <div><strong>Name:</strong> ${patient.firstName} ${patient.lastName}</div>
                <div><strong>Age:</strong> ${age} years</div>
                <div><strong>Gender:</strong> ${patient.gender}</div>
                <div><strong>Phone:</strong> ${patient.phone}</div>
                <div><strong>Email:</strong> ${patient.email || 'N/A'}</div>
                <div><strong>Date of Birth:</strong> ${formatDate(patient.dateOfBirth)}</div>
                <div><strong>Status:</strong> <span class="badge ${patient.status === 'active' ? 'badge-success' : 'badge-warning'}">${patient.status.toUpperCase()}</span></div>
            </div>
            <div style="margin-top: 15px;">
                <strong>Address:</strong><br>
                ${patient.address || 'No address provided'}
            </div>
            <div style="margin-top: 15px;">
                <strong>Emergency Contact:</strong><br>
                ${patient.emergencyContact || 'N/A'} - ${patient.emergencyPhone || 'N/A'}
            </div>
        </div>
    `;
    
    showModal('Patient Information', content);
}

function deletePatient(patientId) {
    if (confirm('Are you sure you want to delete this patient? This action cannot be undone.')) {
        const index = patients.findIndex(p => p.id === patientId);
        if (index > -1) {
            patients.splice(index, 1);
            loadPatients();
            showNotification('Patient deleted successfully!', 'success');
        }
    }
}

function calculateAge(dateOfBirth) {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }
    
    return age;
}

function exportPatients() { showNotification('Export Patients functionality would be implemented here'); }

// New action functions for enhanced content
function createPrescription() { showNotification('Create Prescription functionality would be implemented here'); }
function viewPrescriptions() { showNotification('View Prescriptions functionality would be implemented here'); }
function exportPrescriptions() { showNotification('Export Prescriptions functionality would be implemented here'); }
function recordVitals() { showNotification('Record Vitals functionality would be implemented here'); }
function viewVitalsHistory() { showNotification('View Vitals History functionality would be implemented here'); }
function exportVitals() { showNotification('Export Vitals functionality would be implemented here'); }
function addRecord() { showNotification('Add Record functionality would be implemented here'); }
function searchRecords() { showNotification('Search Records functionality would be implemented here'); }
function exportRecords() { showNotification('Export Records functionality would be implemented here'); }
function createBill() { showNotification('Create Bill functionality would be implemented here'); }
function viewBills() { showNotification('View Bills functionality would be implemented here'); }
function exportBills() { showNotification('Export Bills functionality would be implemented here'); }
function generateReport() { showNotification('Generate Report functionality would be implemented here'); }
function viewAnalytics() { showNotification('View Analytics functionality would be implemented here'); }
function exportReports() { showNotification('Export Reports functionality would be implemented here'); }
function saveSettings() { showNotification('Settings saved successfully!'); }
function resetSettings() { showNotification('Settings reset to default values!'); }

// Show notification
function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    const bgColor = type === 'success' ? '#27ae60' : type === 'error' ? '#e74c3c' : type === 'warning' ? '#f39c12' : '#3498db';
    
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${bgColor};
        color: white;
        padding: 15px 20px;
        border-radius: 5px;
        box-shadow: 0 5px 15px rgba(0,0,0,0.2);
        z-index: 1000;
        animation: slideIn 0.3s ease;
        max-width: 300px;
    `;
    notification.textContent = message;
    
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideIn {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
    `;
    document.head.appendChild(style);
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

// Modal system for forms
function showModal(title, content, onConfirm = null) {
    const modal = document.createElement('div');
    modal.id = 'formModal';
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.5);
        z-index: 2000;
        display: flex;
        justify-content: center;
        align-items: center;
    `;
    
    modal.innerHTML = `
        <div style="background: white; border-radius: 10px; padding: 20px; max-width: 500px; width: 90%; max-height: 80vh; overflow-y: auto;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                <h3 style="margin: 0; color: #333;">${title}</h3>
                <button onclick="closeModal()" style="background: none; border: none; font-size: 1.5rem; cursor: pointer; color: #666;">&times;</button>
            </div>
            <div id="modalContent">${content}</div>
            <div style="display: flex; gap: 10px; justify-content: flex-end; margin-top: 20px;">
                <button onclick="closeModal()" class="btn btn-secondary">Cancel</button>
                ${onConfirm ? `<button onclick="confirmModal()" class="btn btn-primary">Confirm</button>` : ''}
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Store the confirm callback
    if (onConfirm) {
        window.confirmModal = onConfirm;
    }
}

function closeModal() {
    const modal = document.getElementById('formModal');
    if (modal) {
        modal.remove();
    }
}

// Form validation
function validateForm(formData, rules) {
    const errors = {};
    
    for (const field in rules) {
        const value = formData[field];
        const rule = rules[field];
        
        if (rule.required && (!value || value.trim() === '')) {
            errors[field] = `${rule.label} is required`;
        } else if (value && rule.pattern && !rule.pattern.test(value)) {
            errors[field] = rule.message || `${rule.label} format is invalid`;
        } else if (value && rule.minLength && value.length < rule.minLength) {
            errors[field] = `${rule.label} must be at least ${rule.minLength} characters`;
        } else if (value && rule.maxLength && value.length > rule.maxLength) {
            errors[field] = `${rule.label} must be no more than ${rule.maxLength} characters`;
        }
    }
    
    return errors;
}

// Enhanced form creation
function createForm(fields, onSubmit) {
    let formHTML = '<form id="dynamicForm">';
    
    fields.forEach(field => {
        const value = field.value ? `value="${field.value}"` : '';
        const placeholder = field.placeholder ? `placeholder="${field.placeholder}"` : '';
        
        formHTML += `
            <div style="margin-bottom: 15px;">
                <label style="display: block; margin-bottom: 5px; font-weight: 600; color: #333;">${field.label}</label>
                ${field.type === 'select' ? `
                    <select name="${field.name}" class="form-control" style="padding: 8px; border: 1px solid #ddd; border-radius: 5px; width: 100%;" ${field.required ? 'required' : ''}>
                        <option value="">Select ${field.label}</option>
                        ${field.options ? field.options.map(option => 
                            `<option value="${option.value}" ${field.value === option.value ? 'selected' : ''}>${option.label}</option>`
                        ).join('') : ''}
                    </select>
                ` : field.type === 'textarea' ? `
                    <textarea name="${field.name}" class="form-control" style="padding: 8px; border: 1px solid #ddd; border-radius: 5px; width: 100%; height: 100px;" ${field.required ? 'required' : ''} ${placeholder}>${field.value || ''}</textarea>
                ` : `
                    <input type="${field.type}" name="${field.name}" class="form-control" style="padding: 8px; border: 1px solid #ddd; border-radius: 5px; width: 100%;" ${field.required ? 'required' : ''} ${placeholder} ${value}>
                `}
                <div class="error-message" style="color: #e74c3c; font-size: 0.8rem; margin-top: 5px; display: none;"></div>
            </div>
        `;
    });
    
    formHTML += '</form>';
    
    return formHTML;
}

// Logout functionality
function logout() {
    if (confirm('Are you sure you want to logout?')) {
        localStorage.removeItem('user');
        window.location.href = 'index.html';
    }
}

// Close modal when clicking outside
window.onclick = function(event) {
    const modal = document.getElementById('loginModal');
    if (event.target === modal) {
        closeModal();
    }
}

// Handle Enter key in login form
document.addEventListener('keypress', function(event) {
    if (event.key === 'Enter' && document.getElementById('loginModal').style.display === 'block') {
        handleLogin();
    }
});

// Check if user is already logged in - DISABLED to show login page first
// document.addEventListener('DOMContentLoaded', function() {
//     const user = localStorage.getItem('user');
//     if (user) {
//         const userData = JSON.parse(user);
//         showPortalDashboard(userData.role);
//     }
// });