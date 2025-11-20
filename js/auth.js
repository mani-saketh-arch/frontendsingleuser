/**
 * Admin Authentication - v3 FIXED
 * Login, logout, token management, route protection
 * ⚠️ CRITICAL: Auth object MUST be defined FIRST before any DOMContentLoaded
 */

console.log('🔧 Auth.js loading...');

// ========================================
// STEP 1: IMMEDIATELY CREATE AUTH OBJECT
// This MUST happen before ANY DOMContentLoaded listeners
// ========================================
window.Auth = {
    isAuthenticated: function() {
        const token = localStorage.getItem(ADMIN_CONFIG.STORAGE_KEYS.AUTH_TOKEN);
        console.log('🔍 isAuthenticated check:', !!token);
        return !!token;
    },
    
    getCurrentAdmin: function() {
        const adminInfo = localStorage.getItem(ADMIN_CONFIG.STORAGE_KEYS.ADMIN_INFO);
        return adminInfo ? JSON.parse(adminInfo) : null;
    },
    
    getAdminData: function() {
        const adminInfo = localStorage.getItem(ADMIN_CONFIG.STORAGE_KEYS.ADMIN_INFO);
        return adminInfo ? JSON.parse(adminInfo) : null;
    },
    
    getAuthHeaders: function() {
        const token = localStorage.getItem(ADMIN_CONFIG.STORAGE_KEYS.AUTH_TOKEN);
        if (!token) {
            console.warn('⚠️ No auth token found!');
            return {};
        }
        return { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        };
    },
    
    logout: function() {
        console.log('👋 Logging out...');
        // Clear storage
        localStorage.removeItem(ADMIN_CONFIG.STORAGE_KEYS.AUTH_TOKEN);
        localStorage.removeItem(ADMIN_CONFIG.STORAGE_KEYS.ADMIN_INFO);
        localStorage.removeItem(ADMIN_CONFIG.STORAGE_KEYS.REMEMBER_ME);
        
        // Redirect to login
        window.location.href = 'index.html';
    }
};

console.log('✅ Auth object initialized and ready!');

// ========================================
// STEP 2: NOW HANDLE PAGE-SPECIFIC LOGIC
// ========================================
document.addEventListener('DOMContentLoaded', () => {
    console.log('🔐 Auth DOMContentLoaded - Setting up page handlers');
    
    // Check if already logged in (only on login page)
    if (window.location.pathname.includes('index.html')) {
        console.log('📄 Login page detected');
        checkExistingAuth();
        initLoginPage();
    } else {
        console.log('📄 Protected page detected');
        // Protect all other pages
        protectRoute();
    }
});

/**
 * Check if user is already logged in
 */
function checkExistingAuth() {
    const token = localStorage.getItem(ADMIN_CONFIG.STORAGE_KEYS.AUTH_TOKEN);
    
    if (token) {
        console.log('🔑 Existing token found, verifying...');
        // Verify token is still valid
        verifyToken().then(valid => {
            if (valid) {
                console.log('✅ Token valid, redirecting to dashboard...');
                window.location.href = 'dashboard.html';
            } else {
                console.log('❌ Token invalid, staying on login page');
            }
        });
    }
}

/**
 * Verify token is still valid
 */
async function verifyToken() {
    const token = localStorage.getItem(ADMIN_CONFIG.STORAGE_KEYS.AUTH_TOKEN);
    
    if (!token) return false;
    
    try {
        const response = await fetch(getApiUrl(ADMIN_CONFIG.ENDPOINTS.ME), {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        return response.ok;
    } catch (error) {
        console.error('❌ Token verification failed:', error);
        return false;
    }
}

/**
 * Initialize login page
 */
function initLoginPage() {
    console.log('🎨 Initializing login page UI...');
    
    const form = document.getElementById('login-form');
    const togglePassword = document.getElementById('toggle-password');
    const passwordInput = document.getElementById('password');
    const passwordIcon = document.getElementById('password-icon');
    
    // Toggle password visibility
    if (togglePassword) {
        togglePassword.addEventListener('click', () => {
            const type = passwordInput.type === 'password' ? 'text' : 'password';
            passwordInput.type = type;
            passwordIcon.className = type === 'password' ? 'fas fa-eye' : 'fas fa-eye-slash';
        });
    }
    
    // Handle form submission
    if (form) {
        form.addEventListener('submit', handleLogin);
        console.log('✅ Login form handler attached');
    }
}

/**
 * Handle login form submission
 */
async function handleLogin(e) {
    e.preventDefault();
    console.log('🔐 Login attempt starting...');
    
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value;
    const rememberMe = document.getElementById('remember-me').checked;
    
    const loginBtn = document.getElementById('login-btn');
    const loginBtnText = document.getElementById('login-btn-text');
    const errorMessage = document.getElementById('error-message');
    
    // Hide previous errors
    if (errorMessage) {
        errorMessage.classList.add('hidden');
    }
    
    // Validate inputs
    if (!username || !password) {
        showLoginError('Please enter both username and password');
        return;
    }
    
    // Disable button and show loading
    loginBtn.disabled = true;
    loginBtnText.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Logging in...';
    
    try {
        console.log('📡 Sending login request...');
        const response = await fetch(getApiUrl(ADMIN_CONFIG.ENDPOINTS.LOGIN), {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, password })
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'Login failed');
        }
        
        const data = await response.json();
        console.log('✅ Login successful!');
        
        // Store token and admin info
        localStorage.setItem(ADMIN_CONFIG.STORAGE_KEYS.AUTH_TOKEN, data.access_token);
        localStorage.setItem(ADMIN_CONFIG.STORAGE_KEYS.ADMIN_INFO, JSON.stringify({
            id: data.admin_id,
            username: data.username,
            role: data.role
        }));
        
        // Store remember me preference
        if (rememberMe) {
            localStorage.setItem(ADMIN_CONFIG.STORAGE_KEYS.REMEMBER_ME, 'true');
        }
        
        // Show success message
        if (typeof AdminUtils !== 'undefined' && AdminUtils.showToast) {
            AdminUtils.showToast('Login successful! Redirecting...', 'success');
        }
        
        // Redirect to dashboard
        setTimeout(() => {
            window.location.href = 'dashboard.html';
        }, 500);
        
    } catch (error) {
        console.error('❌ Login failed:', error);
        showLoginError(error.message || 'Invalid username or password');
        
        // Re-enable button
        loginBtn.disabled = false;
        loginBtnText.innerHTML = '<i class="fas fa-sign-in-alt mr-2"></i>Login to Dashboard';
    }
}

/**
 * Show login error
 */
function showLoginError(message) {
    const errorMessage = document.getElementById('error-message');
    const errorText = document.getElementById('error-text');
    
    if (errorMessage && errorText) {
        errorText.textContent = message;
        errorMessage.classList.remove('hidden');
        
        // Shake animation
        errorMessage.classList.add('animate-shake');
        setTimeout(() => {
            errorMessage.classList.remove('animate-shake');
        }, 500);
    }
}

/**
 * Protect routes - redirect to login if not authenticated
 */
function protectRoute() {
    const token = localStorage.getItem(ADMIN_CONFIG.STORAGE_KEYS.AUTH_TOKEN);
    
    if (!token) {
        console.log('🔒 No token found, redirecting to login...');
        window.location.href = 'index.html';
        return;
    }
    
    console.log('🔑 Token found, verifying in background...');
    
    // Verify token in background
    verifyToken().then(valid => {
        if (!valid) {
            console.log('🔒 Invalid token, logging out...');
            window.Auth.logout();
        } else {
            console.log('✅ Token verified, initializing page...');
            // Initialize page-specific functions
            initAdminPage();
        }
    }).catch(error => {
        console.error('❌ Token verification error:', error);
        window.Auth.logout();
    });
}

/**
 * Initialize admin page (called after authentication check)
 */
function initAdminPage() {
    console.log('🎨 Initializing admin page...');
    
    // Load admin info
    const adminInfo = JSON.parse(localStorage.getItem(ADMIN_CONFIG.STORAGE_KEYS.ADMIN_INFO) || '{}');
    
    // Update admin name in navbar if element exists
    const adminNameElement = document.getElementById('admin-name');
    if (adminNameElement) {
        adminNameElement.textContent = adminInfo.username || 'Admin';
    }
    
    // Setup logout button
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            console.log('🚪 Logout button clicked');
            window.Auth.logout();
        });
        console.log('✅ Logout button handler attached');
    } else {
        console.warn('⚠️ Logout button not found');
    }
    
    console.log('👤 Current admin:', adminInfo.username);
}

// Add shake animation style
const style = document.createElement('style');
style.textContent = `
    @keyframes shake {
        0%, 100% { transform: translateX(0); }
        25% { transform: translateX(-10px); }
        75% { transform: translateX(10px); }
    }
    .animate-shake {
        animation: shake 0.5s;
    }
`;
document.head.appendChild(style);

console.log('✅ Auth script fully loaded and initialized!');