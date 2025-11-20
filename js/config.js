/**
 * Admin Panel Configuration
 * API endpoints and settings
 */

const ADMIN_CONFIG = {
    // API Base URL
    API_BASE_URL: 'https://ecommerce-backend-6hat.onrender.com/api',
    
    // Storage Keys
    STORAGE_KEYS: {
        AUTH_TOKEN: 'admin_auth_token',
        ADMIN_INFO: 'admin_info',
        REMEMBER_ME: 'admin_remember_me'
    },
    
    // API Endpoints
    ENDPOINTS: {
        // Auth
        LOGIN: '/admin/auth/login',
        ME: '/admin/auth/me',
        LOGOUT: '/admin/auth/logout',
        CHANGE_PASSWORD: '/admin/auth/change-password',
        
        // Products
        PRODUCTS: '/admin/products',
        PRODUCT_DETAIL: (id) => `/admin/products/${id}`,
        TOGGLE_ACTIVE: (id) => `/admin/products/${id}/toggle-active`,
        TOGGLE_FEATURED: (id) => `/admin/products/${id}/toggle-featured`,
        LOW_STOCK: '/admin/products/low-stock/alert',
        
        // Images
        UPLOAD_IMAGE: '/admin/upload/product-image',
        UPLOAD_BULK: '/admin/upload/product-images-bulk',
        DELETE_IMAGE: (id) => `/admin/images/${id}`,
        SET_PRIMARY: (id) => `/admin/images/${id}/set-primary`,
        
        // Orders
        ORDERS: '/admin/orders',
        ORDER_DETAIL: (id) => `/admin/orders/${id}`,
        UPDATE_STATUS: (id) => `/admin/orders/${id}/status`,
        ADD_TRACKING: (id) => `/admin/orders/${id}/tracking`,
        CANCEL_ORDER: (id) => `/admin/orders/${id}/cancel`,
        ORDERS_SUMMARY: '/admin/orders/stats/summary',
        
        // Analytics
        DASHBOARD_STATS: '/admin/dashboard/stats',
        SALES_CHART: '/admin/dashboard/sales-chart',
        POPULAR_PRODUCTS: '/admin/dashboard/popular-products',
        ORDER_STATUS_BREAKDOWN: '/admin/dashboard/order-status-breakdown',
        RECENT_ORDERS: '/admin/dashboard/recent-orders',
        REVENUE_ANALYTICS: '/admin/dashboard/revenue-analytics',
        
        // Settings
        SETTINGS: '/admin/settings',
        SETTING_DETAIL: (key) => `/admin/settings/${key}`,
        BULK_UPDATE_SETTINGS: '/admin/settings/bulk-update'
    },
    
    // Pagination
    ITEMS_PER_PAGE: 20,
    
    // Date Format
    DATE_FORMAT: 'DD/MM/YYYY',
    DATETIME_FORMAT: 'DD/MM/YYYY HH:mm',
    
    // Order Status Colors
    ORDER_STATUS_COLORS: {
        pending: 'bg-yellow-100 text-yellow-800',
        confirmed: 'bg-blue-100 text-blue-800',
        processing: 'bg-purple-100 text-purple-800',
        shipped: 'bg-indigo-100 text-indigo-800',
        delivered: 'bg-green-100 text-green-800',
        cancelled: 'bg-red-100 text-red-800'
    },
    
    // Payment Status Colors
    PAYMENT_STATUS_COLORS: {
        pending: 'bg-yellow-100 text-yellow-800',
        completed: 'bg-green-100 text-green-800',
        failed: 'bg-red-100 text-red-800',
        refunded: 'bg-gray-100 text-gray-800'
    }
};

/**
 * Get full API URL
 */
function getApiUrl(endpoint) {
    return ADMIN_CONFIG.API_BASE_URL + endpoint;
}

/**
 * Get authorization headers
 */
function getAuthHeaders() {
    const token = localStorage.getItem(ADMIN_CONFIG.STORAGE_KEYS.AUTH_TOKEN);
    return {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : ''
    };
}

/**
 * Make authenticated API request
 */
async function authenticatedFetch(endpoint, options = {}) {
    const token = localStorage.getItem(ADMIN_CONFIG.STORAGE_KEYS.AUTH_TOKEN);
    
    if (!token) {
        window.location.href = 'login.html';
        throw new Error('Not authenticated');
    }
    
    const defaultOptions = {
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        }
    };
    
    // Merge options
    const mergedOptions = {
        ...defaultOptions,
        ...options,
        headers: {
            ...defaultOptions.headers,
            ...options.headers
        }
    };
    
    try {
        const response = await fetch(getApiUrl(endpoint), mergedOptions);
        
        // Handle 401 Unauthorized
        if (response.status === 401) {
            localStorage.removeItem(ADMIN_CONFIG.STORAGE_KEYS.AUTH_TOKEN);
            localStorage.removeItem(ADMIN_CONFIG.STORAGE_KEYS.ADMIN_INFO);
            window.location.href = 'login.html';
            throw new Error('Session expired. Please login again.');
        }
        
        return response;
    } catch (error) {
        console.error('API Error:', error);
        throw error;
    }
}

// ✅ BACKWARD COMPATIBILITY - Export as both names
const Config = ADMIN_CONFIG;
window.Config = ADMIN_CONFIG;
window.ADMIN_CONFIG = ADMIN_CONFIG;

console.log('✅ Admin config loaded');
console.log('📋 Config object available:', typeof Config !== 'undefined');
console.log('🌐 API Base URL:', ADMIN_CONFIG.API_BASE_URL);