/**
 * ORDERS MANAGEMENT
 * View, filter, and manage customer orders
 * THE MONEY MAKER! 💰🎯
 */

// Global state
let orders = [];
let filteredOrders = [];
let currentOrderId = null;
let currentPage = 1;
const ordersPerPage = 20;

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
    console.log('🎯 Orders Management - Hunt Started!');
    
    // Check authentication
    if (!Auth.isAuthenticated()) {
        window.location.href = 'login.html';
        return;
    }
    
    // Load orders and stats
    await Promise.all([
        loadOrders(),
        loadOrderStats()
    ]);
    
    // Setup event listeners
    setupEventListeners();
    
    console.log('✅ Orders Ready!');
});


/**
 * SETUP EVENT LISTENERS
 */
function setupEventListeners() {
    // Search
    document.getElementById('searchInput').addEventListener('input', filterOrders);
    
    // Filters
    document.getElementById('orderStatusFilter').addEventListener('change', filterOrders);
    document.getElementById('paymentStatusFilter').addEventListener('change', filterOrders);
    
    // Logout
    document.getElementById('logoutBtn').addEventListener('click', () => {
        Auth.logout();
        window.location.href = 'login.html';
    });
}


/**
 * LOAD ORDER STATS
 */
async function loadOrderStats() {
    try {
        const response = await fetch(`${Config.API_BASE_URL}/admin/orders/stats/summary`, {
            method: 'GET',
            headers: Auth.getAuthHeaders()
        });
        
        if (!response.ok) throw new Error('Failed to load stats');
        
        const stats = await response.json();
        
        // Update stats display
        document.getElementById('totalOrders').textContent = stats.total_orders;
        document.getElementById('pendingOrders').textContent = stats.by_status.pending;
        document.getElementById('processingOrders').textContent = 
            stats.by_status.processing + stats.by_status.confirmed;
        document.getElementById('shippedOrders').textContent = stats.by_status.shipped;
        document.getElementById('deliveredOrders').textContent = stats.by_status.delivered;
        
        console.log('✅ Stats loaded:', stats);
        
    } catch (error) {
        console.error('❌ Error loading stats:', error);
    }
}


/**
 * LOAD ORDERS
 */
async function loadOrders() {
    try {
        Utils.showLoading('Loading orders...');
        
        const response = await fetch(`${Config.API_BASE_URL}/admin/orders?limit=500`, {
            method: 'GET',
            headers: Auth.getAuthHeaders()
        });
        
        if (!response.ok) throw new Error('Failed to load orders');
        
        orders = await response.json();
        filteredOrders = orders;
        
        renderOrders();
        Utils.hideLoading();
        
        console.log('✅ Orders loaded:', orders.length);
        
    } catch (error) {
        console.error('❌ Error loading orders:', error);
        Utils.hideLoading();
        Utils.showToast('Failed to load orders', 'error');
    }
}


/**
 * FILTER ORDERS
 */
function filterOrders() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const orderStatus = document.getElementById('orderStatusFilter').value;
    const paymentStatus = document.getElementById('paymentStatusFilter').value;
    
    filteredOrders = orders;
    
    // Search filter
    if (searchTerm) {
        filteredOrders = filteredOrders.filter(order => 
            order.order_number.toLowerCase().includes(searchTerm) ||
            order.customer_name.toLowerCase().includes(searchTerm) ||
            order.customer_email.toLowerCase().includes(searchTerm)
        );
    }
    
    // Order status filter
    if (orderStatus) {
        filteredOrders = filteredOrders.filter(order => 
            order.order_status === orderStatus
        );
    }
    
    // Payment status filter
    if (paymentStatus) {
        filteredOrders = filteredOrders.filter(order => 
            order.payment_status === paymentStatus
        );
    }
    
    currentPage = 1;
    renderOrders();
}


/**
 * RESET FILTERS
 */
window.resetFilters = function() {
    document.getElementById('searchInput').value = '';
    document.getElementById('orderStatusFilter').value = '';
    document.getElementById('paymentStatusFilter').value = '';
    filteredOrders = orders;
    currentPage = 1;
    renderOrders();
};


/**
 * RENDER ORDERS TABLE - PROFESSIONAL VERSION WITH PAYMENT BUTTON
 */
function renderOrders() {
    const tbody = document.getElementById('ordersTableBody');
    const emptyState = document.getElementById('emptyState');
    
    if (filteredOrders.length === 0) {
        tbody.innerHTML = '';
        emptyState.classList.remove('hidden');
        document.getElementById('paginationContainer').innerHTML = '';
        return;
    }
    
    emptyState.classList.add('hidden');
    
    // Pagination
    const startIndex = (currentPage - 1) * ordersPerPage;
    const endIndex = startIndex + ordersPerPage;
    const ordersToShow = filteredOrders.slice(startIndex, endIndex);
    
    tbody.innerHTML = ordersToShow.map(order => `
        <tr class="hover:bg-gray-50 transition-colors border-b border-gray-100">
            <td class="px-6 py-4">
                <div class="font-mono font-bold text-blue-600 text-sm">
                    ${order.order_number}
                </div>
                <div class="text-xs text-gray-500 mt-1">
                    ${Utils.formatDate(order.created_at)}
                </div>
            </td>
            <td class="px-6 py-4">
                <div class="flex items-start gap-3">
                    <div class="w-10 h-10 rounded-full bg-gradient-to-br from-gray-600 to-gray-700 flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
                        ${order.customer_name.charAt(0).toUpperCase()}
                    </div>
                    <div class="min-w-0 flex-1">
                        <div class="font-semibold text-gray-900 text-sm">${order.customer_name}</div>
                        <div class="text-xs text-gray-500 truncate">${order.customer_email}</div>
                        <div class="text-xs text-gray-500 mt-0.5">
                            <i class="fas fa-phone text-gray-400 text-xs"></i> ${order.customer_phone}
                        </div>
                    </div>
                </div>
            </td>
            <td class="px-6 py-4">
                <span class="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-semibold bg-gray-100 text-gray-700 whitespace-nowrap">
                    <i class="fas fa-box mr-2 text-xs"></i>
                    ${order.order_items?.length || 0} ${(order.order_items?.length || 0) === 1 ? 'item' : 'items'}
                </span>
            </td>
            <td class="px-6 py-4">
                <div class="font-bold text-gray-900 text-base">₹${parseFloat(order.final_amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                <div class="text-xs text-gray-500 mt-1">
                    ${order.payment_method === 'cod' ? 
                        '<i class="fas fa-money-bill-wave text-emerald-600 text-xs"></i> COD' : 
                        '<i class="fas fa-credit-card text-blue-600 text-xs"></i> Online'
                    }
                </div>
            </td>
            <td class="px-6 py-4">
                ${getPaymentStatusBadge(order.payment_status)}
            </td>
            <td class="px-6 py-4">
                ${getOrderStatusBadge(order.order_status)}
            </td>
            <td class="px-6 py-4">
                <div class="text-sm text-gray-600 whitespace-nowrap">
                    ${Utils.formatDate(order.created_at, 'short')}
                </div>
            </td>
            <td class="px-6 py-4">
                <div class="flex gap-2">
                    <button onclick="viewOrder(${order.id})" 
                            class="p-2.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-all" title="View Details">
                        <i class="fas fa-eye text-base"></i>
                    </button>
                    <button onclick="openStatusModal(${order.id})" 
                            class="p-2.5 text-purple-600 hover:bg-purple-50 rounded-lg transition-all" title="Update Status">
                        <i class="fas fa-edit text-base"></i>
                    </button>
                    ${order.payment_method === 'cod' && order.payment_status === 'pending' ? `
                        <button onclick="markPaymentReceived(${order.id})" 
                                class="p-2.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all" 
                                title="Mark Payment Received">
                            <i class="fas fa-money-bill-wave text-base"></i>
                        </button>
                    ` : ''}
                </div>
            </td>
        </tr>
    `).join('');
    
    renderPagination();
}

/**
 * GET PAYMENT STATUS BADGE - PROFESSIONAL COLORS
 */
function getPaymentStatusBadge(status) {
    const badges = {
        pending: '<span class="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-semibold bg-orange-50 text-orange-700 border border-orange-200"><i class="fas fa-clock mr-2"></i>Pending</span>',
        completed: '<span class="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200"><i class="fas fa-check-circle mr-2"></i>Completed</span>',
        failed: '<span class="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-semibold bg-red-50 text-red-700 border border-red-200"><i class="fas fa-times-circle mr-2"></i>Failed</span>',
        refunded: '<span class="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200"><i class="fas fa-undo mr-2"></i>Refunded</span>'
    };
    return badges[status] || '<span class="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-semibold bg-gray-50 text-gray-600 border border-gray-200">Unknown</span>';
}

/**
 * GET ORDER STATUS BADGE - PROFESSIONAL COLORS
 */
function getOrderStatusBadge(status) {
    const badges = {
        pending: '<span class="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-semibold bg-orange-50 text-orange-700 border border-orange-200"><i class="fas fa-clock mr-2"></i>Pending</span>',
        confirmed: '<span class="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200"><i class="fas fa-check-circle mr-2"></i>Confirmed</span>',
        processing: '<span class="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200"><i class="fas fa-cog mr-2"></i>Processing</span>',
        shipped: '<span class="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200"><i class="fas fa-shipping-fast mr-2"></i>Shipped</span>',
        delivered: '<span class="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200"><i class="fas fa-check-double mr-2"></i>Delivered</span>',
        cancelled: '<span class="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-semibold bg-red-50 text-red-700 border border-red-200"><i class="fas fa-ban mr-2"></i>Cancelled</span>'
    };
    return badges[status] || '<span class="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-semibold bg-gray-50 text-gray-600 border border-gray-200">Unknown</span>';
}

/**
 * RENDER PAGINATION
 */
function renderPagination() {
    const container = document.getElementById('paginationContainer');
    const totalPages = Math.ceil(filteredOrders.length / ordersPerPage);
    
    if (totalPages <= 1) {
        container.innerHTML = '';
        return;
    }
    
    let paginationHTML = '<div class="flex items-center gap-2">';
    
    // Previous button
    paginationHTML += `
        <button class="px-4 py-2 rounded-lg font-semibold text-sm transition ${
            currentPage === 1 
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                : 'bg-white border-2 border-gray-300 text-gray-700 hover:bg-gray-50'
        }" 
                onclick="changePage(${currentPage - 1})"
                ${currentPage === 1 ? 'disabled' : ''}>
            <i class="fas fa-chevron-left"></i>
        </button>
    `;
    
    // Page numbers
    for (let i = 1; i <= totalPages; i++) {
        if (i === 1 || i === totalPages || (i >= currentPage - 1 && i <= currentPage + 1)) {
            paginationHTML += `
                <button class="px-4 py-2 rounded-lg font-semibold text-sm transition ${
                    i === currentPage 
                        ? 'bg-gradient-to-r from-black to-gray-800 text-white shadow-lg' 
                        : 'bg-white border-2 border-gray-300 text-gray-700 hover:bg-gray-50'
                }" 
                        onclick="changePage(${i})">
                    ${i}
                </button>
            `;
        } else if (i === currentPage - 2 || i === currentPage + 2) {
            paginationHTML += '<span class="px-2 text-gray-400">...</span>';
        }
    }
    
    // Next button
    paginationHTML += `
        <button class="px-4 py-2 rounded-lg font-semibold text-sm transition ${
            currentPage === totalPages 
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                : 'bg-white border-2 border-gray-300 text-gray-700 hover:bg-gray-50'
        }" 
                onclick="changePage(${currentPage + 1})"
                ${currentPage === totalPages ? 'disabled' : ''}>
            <i class="fas fa-chevron-right"></i>
        </button>
    `;
    
    paginationHTML += '</div>';
    container.innerHTML = paginationHTML;
}

/**
 * CHANGE PAGE
 */
window.changePage = function(page) {
    const totalPages = Math.ceil(filteredOrders.length / ordersPerPage);
    if (page < 1 || page > totalPages) return;
    
    currentPage = page;
    renderOrders();
    window.scrollTo({ top: 0, behavior: 'smooth' });
};


/**
 * VIEW ORDER DETAILS
 */
window.viewOrder = function(orderId) {
    window.location.href = `order-detail.html?id=${orderId}`;
};


/**
 * OPEN STATUS UPDATE MODAL
 */
window.openStatusModal = function(orderId) {
    const order = orders.find(o => o.id === orderId);
    
    if (!order) {
        Utils.showToast('Order not found', 'error');
        return;
    }
    
    currentOrderId = orderId;
    
    document.getElementById('modalOrderNumber').textContent = order.order_number;
    document.getElementById('newStatus').value = order.order_status;
    document.getElementById('statusNotes').value = '';
    
    document.getElementById('statusModal').showModal();
};


/**
 * CLOSE STATUS MODAL
 */
window.closeStatusModal = function() {
    document.getElementById('statusModal').close();
    currentOrderId = null;
};


/**
 * CONFIRM STATUS UPDATE
 */
window.confirmStatusUpdate = async function() {
    if (!currentOrderId) return;
    
    const newStatus = document.getElementById('newStatus').value;
    const notes = document.getElementById('statusNotes').value.trim();
    
    try {
        Utils.showLoading('Updating order status...');
        
        const response = await fetch(`${Config.API_BASE_URL}/admin/orders/${currentOrderId}/status`, {
            method: 'PATCH',
            headers: Auth.getAuthHeaders(),
            body: JSON.stringify({
                new_status: newStatus,
                notes: notes || null
            })
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'Failed to update status');
        }
        
        Utils.hideLoading();
        Utils.showToast('Order status updated successfully!', 'success');
        
        closeStatusModal();
        await loadOrders();
        await loadOrderStats();
        
    } catch (error) {
        console.error('❌ Error updating status:', error);
        Utils.hideLoading();
        Utils.showToast(error.message, 'error');
    }
};



/**
 * EXPORT ORDERS TO CSV
 * Downloads filtered orders as CSV file
 * THIS MUST BE AT GLOBAL SCOPE (not inside any function/block)
 */
window.exportOrdersCSV = async function() {
    try {
        // Show loading
        Utils.showLoading('Generating CSV export...');
        
        // Get current filter values
        const searchTerm = document.getElementById('searchInput').value;
        const orderStatus = document.getElementById('orderStatusFilter').value;
        const paymentStatus = document.getElementById('paymentStatusFilter').value;
        
        // Build query params with same filters
        const params = new URLSearchParams();
        if (searchTerm) params.append('search', searchTerm);
        if (orderStatus) params.append('order_status', orderStatus);
        if (paymentStatus) params.append('payment_status', paymentStatus);
        
        // Call export endpoint
        const response = await fetch(
            `${Config.API_BASE_URL}/admin/orders/export/csv?${params.toString()}`,
            {
                method: 'GET',
                headers: Auth.getAuthHeaders()
            }
        );
        
        if (!response.ok) {
            throw new Error('Failed to export orders');
        }
        
        // Get the CSV blob
        const blob = await response.blob();
        
        // Create download link
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        
        // Get filename from response header or use default
        const contentDisposition = response.headers.get('Content-Disposition');
        let filename = 'orders_export.csv';
        if (contentDisposition) {
            const filenameMatch = contentDisposition.match(/filename="?(.+)"?/);
            if (filenameMatch) {
                filename = filenameMatch[1];
            }
        }
        
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        
        // Cleanup
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        Utils.hideLoading();
        Utils.showToast(`✅ Exported ${filteredOrders.length} orders to CSV!`, 'success');
        
        console.log('✅ CSV export successful:', filename);
        
    } catch (error) {
        console.error('❌ Error exporting CSV:', error);
        Utils.hideLoading();
        Utils.showToast('Failed to export orders to CSV', 'error');
    }
}

/**
 * MARK PAYMENT AS RECEIVED (for COD orders)
 */
window.markPaymentReceived = async function(orderId) {
    const order = orders.find(o => o.id === orderId);
    
    if (!order) {
        Utils.showToast('Order not found', 'error');
        return;
    }
    
    // Confirm action
    if (!confirm(`Mark payment as received for Order ${order.order_number}?\n\nThis will update payment status to "Completed".`)) {
        return;
    }
    
    try {
        Utils.showLoading('Updating payment status...');
        
        const response = await fetch(
            `${Config.API_BASE_URL}/admin/orders/${orderId}/payment-status?payment_status=completed`, 
            {
                method: 'PATCH',
                headers: Auth.getAuthHeaders()
            }
        );
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'Failed to update payment status');
        }
        
        const result = await response.json();
        
        Utils.hideLoading();
        Utils.showToast('💰 Payment marked as received!', 'success');
        
        // Reload orders to show updated status
        await loadOrders();
        await loadOrderStats();
        
        console.log('✅ Payment status updated:', result);
        
    } catch (error) {
        console.error('❌ Error updating payment status:', error);
        Utils.hideLoading();
        Utils.showToast(error.message, 'error');
    }
};




console.log('✅ Orders JS Loaded - Ready to Hunt! 🎯💰');