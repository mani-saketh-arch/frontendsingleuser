/**
 * Admin Panel Utility Functions
 * Helper functions for common tasks
 */

const Utils = {
    /**
     * Format currency
     */
    formatCurrency(amount) {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 2
        }).format(amount);
    },

    /**
     * Format date
     */
    formatDate(dateString) {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
    },

    /**
     * Format datetime
     */
    formatDateTime(dateString) {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return date.toLocaleString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    },

    /**
     * Format relative time (e.g., "2 hours ago")
     */
    formatRelativeTime(dateString) {
        if (!dateString) return 'N/A';
        
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now - date;
        const diffSecs = Math.floor(diffMs / 1000);
        const diffMins = Math.floor(diffSecs / 60);
        const diffHours = Math.floor(diffMins / 60);
        const diffDays = Math.floor(diffHours / 24);
        
        if (diffSecs < 60) return 'Just now';
        if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
        if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
        if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
        
        return this.formatDate(dateString);
    },

    /**
     * Show toast notification
     */
    showToast(message, type = 'info') {
        const container = document.getElementById('toast-container') || document.body;
        
        const colors = {
            success: 'bg-green-500',
            error: 'bg-red-500',
            warning: 'bg-yellow-500',
            info: 'bg-blue-500'
        };
        
        const icons = {
            success: 'fa-check-circle',
            error: 'fa-exclamation-circle',
            warning: 'fa-exclamation-triangle',
            info: 'fa-info-circle'
        };
        
        const toast = document.createElement('div');
        toast.className = `${colors[type]} text-white px-6 py-4 rounded-lg shadow-lg mb-4 flex items-center transform transition-all duration-300 translate-x-full`;
        toast.innerHTML = `
            <i class="fas ${icons[type]} mr-3"></i>
            <span>${message}</span>
        `;
        
        container.appendChild(toast);
        
        // Animate in
        setTimeout(() => {
            toast.classList.remove('translate-x-full');
        }, 10);
        
        // Auto remove after 3 seconds
        setTimeout(() => {
            toast.classList.add('translate-x-full');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    },



    /**
     * Global loading overlay (used across pages)
     */
    showLoading(message = 'Loading...') {
        let loader = document.getElementById('globalLoader');
        
        if (!loader) {
            loader = document.createElement('div');
            loader.id = 'globalLoader';
            loader.className = 'fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50';
            loader.innerHTML = `
                <div class="bg-white p-6 rounded-lg shadow-lg flex flex-col items-center space-y-3">
                    <div class="animate-spin h-10 w-10 border-4 border-blue-500 border-t-transparent rounded-full"></div>
                    <p class="text-gray-700 font-medium">${message}</p>
                </div>
            `;
            document.body.appendChild(loader);
        } else {
            loader.querySelector('p').textContent = message;
            loader.classList.remove('hidden');
        }
    },

    hideLoading() {
        const loader = document.getElementById('globalLoader');
        if (loader) loader.classList.add('hidden');
    },



    /**
     * Show loading spinner
     */
    showLoading(container, message = 'Loading...') {
        if (typeof container === 'string') {
            container = document.getElementById(container);
        }
        
        if (!container) return;
        
        container.innerHTML = `
            <div class="flex flex-col items-center justify-center py-12">
                <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
                <p class="text-gray-600">${message}</p>
            </div>
        `;
    },

    /**
     * Show error message
     */
    showError(container, message) {
        if (typeof container === 'string') {
            container = document.getElementById(container);
        }
        
        if (!container) return;
        
        container.innerHTML = `
            <div class="bg-red-50 border-l-4 border-red-500 p-4 rounded">
                <div class="flex items-center">
                    <i class="fas fa-exclamation-circle text-red-500 mr-3 text-xl"></i>
                    <p class="text-red-700">${message}</p>
                </div>
            </div>
        `;
    },

    /**
     * Show empty state
     */
    showEmptyState(container, message, icon = 'fa-inbox') {
        if (typeof container === 'string') {
            container = document.getElementById(container);
        }
        
        if (!container) return;
        
        container.innerHTML = `
            <div class="text-center py-12">
                <i class="fas ${icon} text-gray-400 text-6xl mb-4"></i>
                <p class="text-gray-600 text-lg">${message}</p>
            </div>
        `;
    },

    /**
     * Convert string to URL-friendly slug
     */
    slugify(text) {
        if (!text) return '';
        return text
            .toString()
            .toLowerCase()
            .trim()
            .replace(/\s+/g, '-')      // Replace spaces with -
            .replace(/[^\w-]+/g, '') // Remove all non-word chars
            .replace(/--+/g, '-');     // Replace multiple - with single -
    },

    /**
     * Escape HTML to prevent XSS
     */
    escapeHtml(str) {
        if (!str) return '';
        return str.replace(/[&<>"']/g, function(m) {
            const map = {
                '&': '&amp;',
                '<': '&lt;',
                '>': '&gt;',
                '"': '&quot;',
                "'": '&#039;'
            };
            return map[m];
        });
    },

    // ... (rest of your functions like truncate, formatCurrency, etc.)

    /**
     * Confirm dialog
     */
    async confirm(message, title = 'Confirm Action') {
        return new Promise((resolve) => {
            const modal = document.createElement('div');
            modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
            modal.innerHTML = `
                <div class="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 transform transition-all">
                    <div class="p-6">
                        <h3 class="text-xl font-bold text-gray-800 mb-4">${title}</h3>
                        <p class="text-gray-600 mb-6">${message}</p>
                        <div class="flex justify-end space-x-3">
                            <button id="cancel-btn" class="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition">
                                Cancel
                            </button>
                            <button id="confirm-btn" class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
                                Confirm
                            </button>
                        </div>
                    </div>
                </div>
            `;
            
            document.body.appendChild(modal);
            
            modal.querySelector('#confirm-btn').addEventListener('click', () => {
                modal.remove();
                resolve(true);
            });
            
            modal.querySelector('#cancel-btn').addEventListener('click', () => {
                modal.remove();
                resolve(false);
            });
            
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    modal.remove();
                    resolve(false);
                }
            });
        });
    },

    /**
     * Get order status badge HTML
     */
    getOrderStatusBadge(status) {
        const colorClass = ADMIN_CONFIG.ORDER_STATUS_COLORS[status] || 'bg-gray-100 text-gray-800';
        const statusText = status.charAt(0).toUpperCase() + status.slice(1);
        return `<span class="px-3 py-1 rounded-full text-xs font-semibold ${colorClass}">${statusText}</span>`;
    },

    /**
     * Get payment status badge HTML
     */
    getPaymentStatusBadge(status) {
        const colorClass = ADMIN_CONFIG.PAYMENT_STATUS_COLORS[status] || 'bg-gray-100 text-gray-800';
        const statusText = status.charAt(0).toUpperCase() + status.slice(1);
        return `<span class="px-3 py-1 rounded-full text-xs font-semibold ${colorClass}">${statusText}</span>`;
    },

    /**
     * Debounce function
     */
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },

    /**
     * Handle API errors
     */
    handleApiError(error, defaultMessage = 'An error occurred') {
        console.error('API Error:', error);
        
        let message = defaultMessage;
        
        if (error.message) {
            message = error.message;
        }
        
        this.showToast(message, 'error');
    },

    /**
     * Get query parameter
     */
    getQueryParam(param) {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get(param);
    },

    /**
     * Truncate text
     */
    truncate(text, length = 50) {
        if (!text) return '';
        if (text.length <= length) return text;
        return text.substring(0, length) + '...';
    },

    /**
     * Number formatting
     */
    formatNumber(number) {
        return new Intl.NumberFormat('en-IN').format(number);
    },

    /**
     * Percentage formatting
     */
    formatPercentage(value, decimals = 1) {
        return `${value.toFixed(decimals)}%`;
    }
};

console.log('✅ Admin utils loaded');