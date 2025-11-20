/**
 * ORDER DETAIL PAGE - PROFESSIONAL VERSION
 * Manage individual order - update status, add tracking, view history
 */

console.log('📦 Order Detail JS - Loading...');

// Global state
let currentOrder = null;
let orderId = null;

/**
 * INITIALIZE
 */
async function initOrderDetail() {
    console.log('🎯 Order Detail - Initializing...');
    
    // Check authentication
    if (typeof Auth === 'undefined' || !Auth.isAuthenticated()) {
        console.error('❌ Not authenticated, redirecting to login');
        window.location.href = 'login.html';
        return;
    }
    
    console.log('✅ Authentication verified');
    
    // Get order ID from URL
    const urlParams = new URLSearchParams(window.location.search);
    const orderIdParam = urlParams.get('id');
    
    console.log('🔍 URL params:', window.location.search);
    console.log('🔍 Order ID param:', orderIdParam);
    
    orderId = parseInt(orderIdParam);
    
    if (!orderId || isNaN(orderId)) {
        console.error('❌ Invalid order ID:', orderIdParam);
        showError('Invalid order ID. Please select an order from the orders page.');
        return;
    }
    
    console.log('📋 Order ID:', orderId);
    
    // Load order details
    await loadOrderDetails();
    
    console.log('✅ Order Detail Ready!');
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initOrderDetail);
} else {
    // DOM already loaded
    initOrderDetail();
}


/**
 * SHOW ERROR STATE
 */
function showError(message) {
    console.log('⚠️ Showing error:', message);
    document.getElementById('loadingState').classList.add('hidden');
    document.getElementById('orderDetailContent').classList.add('hidden');
    
    const errorState = document.getElementById('errorState');
    if (errorState) {
        errorState.classList.remove('hidden');
        const errorMsg = document.getElementById('errorMessage');
        if (errorMsg) {
            errorMsg.textContent = message;
        }
    }
}


/**
 * LOAD ORDER DETAILS
 */
async function loadOrderDetails() {
    try {
        const url = `${Config.API_BASE_URL}/admin/orders/${orderId}`;
        console.log('📥 Fetching order from:', url);
        console.log('🔑 Headers:', Auth.getAuthHeaders());
        
        const response = await fetch(url, {
            method: 'GET',
            headers: Auth.getAuthHeaders()
        });
        
        console.log('📡 Response status:', response.status);
        console.log('📡 Response OK:', response.ok);
        
        if (!response.ok) {
            let errorMessage = `Failed to load order (HTTP ${response.status})`;
            try {
                const errorData = await response.json();
                console.error('❌ API Error response:', errorData);
                errorMessage = errorData.detail || errorMessage;
            } catch (e) {
                console.error('❌ Could not parse error response');
            }
            throw new Error(errorMessage);
        }
        
        currentOrder = await response.json();
        console.log('✅ Order loaded successfully:', currentOrder);
        console.log('📦 Order number:', currentOrder.order_number);
        console.log('📦 Order items:', currentOrder.order_items?.length || 0);
        
        renderOrderDetails();
        
        document.getElementById('loadingState').classList.add('hidden');
        document.getElementById('errorState').classList.add('hidden');
        document.getElementById('orderDetailContent').classList.remove('hidden');
        
    } catch (error) {
        console.error('❌ Error loading order:', error);
        console.error('❌ Error stack:', error.stack);
        showError(error.message || 'Failed to load order details. Please try again.');
    }
}


/**
 * RENDER ORDER DETAILS - SAFE VERSION WITH PAYMENT BUTTON
 */
function renderOrderDetails() {
    console.log('🎨 Rendering order details...');
    
    try {
        // Header
        document.getElementById('orderNumber').textContent = currentOrder.order_number || 'N/A';
        document.getElementById('orderDate').textContent = currentOrder.created_at ? Utils.formatDate(currentOrder.created_at) : 'N/A';
        
        // Status badges
        document.getElementById('orderStatusBadge').innerHTML = getOrderStatusBadge(currentOrder.order_status);
        document.getElementById('paymentStatusBadge').innerHTML = getPaymentStatusBadge(currentOrder.payment_status);
        document.getElementById('paymentMethod').textContent = currentOrder.payment_method === 'cod' ? 'Cash on Delivery (COD)' : 'Online Payment';
        
        // ✅ Show/hide mark payment button (COD + pending only)
        const markPaymentBtn = document.getElementById('markPaymentBtn');
        if (markPaymentBtn) {
            if (currentOrder.payment_method === 'cod' && currentOrder.payment_status === 'pending') {
                markPaymentBtn.classList.remove('hidden');
            } else {
                markPaymentBtn.classList.add('hidden');
            }
        }
        
        // Amounts - parseFloat() converts strings to numbers
        const finalAmount = parseFloat(currentOrder.final_amount) || 0;
        const subtotal = parseFloat(currentOrder.subtotal_amount) || 0;
        const shipping = parseFloat(currentOrder.shipping_charges) || 0;
        const tax = parseFloat(currentOrder.tax_amount) || 0;
        
        // Format currency helper
        const fmt = (n) => `₹${n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        
        document.getElementById('totalAmount').textContent = fmt(finalAmount);
        document.getElementById('subtotalAmount').textContent = fmt(subtotal);
        document.getElementById('shippingAmount').textContent = fmt(shipping);
        document.getElementById('taxAmount').textContent = fmt(tax);
        document.getElementById('finalAmount').textContent = fmt(finalAmount);
        
        // Customer info
        document.getElementById('customerName').textContent = currentOrder.customer_name || 'N/A';
        document.getElementById('customerEmail').textContent = currentOrder.customer_email || 'N/A';
        document.getElementById('customerPhone').textContent = currentOrder.customer_phone || 'N/A';
        
        // Shipping address
        const addr = [
            currentOrder.shipping_address_line1,
            currentOrder.shipping_address_line2,
            currentOrder.shipping_city,
            currentOrder.shipping_state,
            currentOrder.shipping_pincode,
            currentOrder.shipping_country
        ].filter(x => x && x.trim());
        
        document.getElementById('shippingAddress').innerHTML = addr.join('<br>') || 'No address';
        
        // Tracking
        if (currentOrder.tracking_number) {
            document.getElementById('trackingInfo').classList.remove('hidden');
            document.getElementById('trackingNumber').textContent = currentOrder.tracking_number;
            document.getElementById('courierName').textContent = currentOrder.courier_name || 'N/A';
        } else {
            document.getElementById('trackingInfo').classList.add('hidden');
        }
        
        // Notes
        if (currentOrder.order_notes && currentOrder.order_notes.trim()) {
            document.getElementById('orderNotes').textContent = currentOrder.order_notes;
            document.getElementById('orderNotesCard').classList.remove('hidden');
        } else {
            document.getElementById('orderNotesCard').classList.add('hidden');
        }
        
        renderOrderItems();
        renderOrderTimeline();
        
        console.log('✅ Rendered successfully');
        
    } catch (error) {
        console.error('❌ Render error:', error);
        showError('Error displaying order');
    }
}

/**
 * RENDER ORDER ITEMS - PROFESSIONAL
 */
function renderOrderItems() {
    const tbody = document.getElementById('orderItemsTable');
    
    if (!currentOrder.order_items || currentOrder.order_items.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" class="text-center py-8 text-gray-500">No items found</td></tr>';
        return;
    }
    
    tbody.innerHTML = currentOrder.order_items.map(item => `
        <tr class="hover:bg-gray-50 transition-colors border-b border-gray-100">
            <td class="px-4 py-4">
                <div class="flex items-start gap-3">
                    ${item.product_image ? 
                        `<img src="${item.product_image}" alt="${item.product_name}" class="w-16 h-16 rounded-lg object-cover border border-gray-200 flex-shrink-0">` : 
                        `<div class="w-16 h-16 rounded-lg bg-gray-100 flex items-center justify-center border border-gray-200 flex-shrink-0">
                            <i class="fas fa-image text-gray-400 text-2xl"></i>
                        </div>`
                    }
                    <div class="min-w-0 flex-1">
                        <div class="font-semibold text-gray-900 text-sm">${item.product_name || 'Unknown Product'}</div>
                        ${item.size || item.color ? 
                            `<div class="text-xs text-gray-500 mt-1 flex gap-1 flex-wrap">
                                ${item.size ? `<span class="inline-flex items-center px-2 py-0.5 rounded bg-gray-100">Size: ${item.size}</span>` : ''} 
                                ${item.color ? `<span class="inline-flex items-center px-2 py-0.5 rounded bg-gray-100">Color: ${item.color}</span>` : ''}
                            </div>` : ''
                        }
                        <div class="text-xs text-gray-500 mt-1">SKU: <span class="font-mono">${item.sku || 'N/A'}</span></div>
                    </div>
                </div>
            </td>
            <td class="px-4 py-4 text-sm font-semibold text-gray-900 whitespace-nowrap">₹${parseFloat(item.product_price || 0).toFixed(2)}</td>
            <td class="px-4 py-4 text-sm font-semibold text-gray-900 whitespace-nowrap">×${item.quantity || 0}</td>
            <td class="px-4 py-4 text-sm font-bold text-gray-900 whitespace-nowrap">₹${parseFloat(item.subtotal || 0).toFixed(2)}</td>
        </tr>
    `).join('');
}


/**
 * RENDER ORDER TIMELINE
 */
function renderOrderTimeline() {
    const timeline = document.getElementById('orderTimeline');
    
    // Check if status_history exists
    const history = currentOrder.status_history || [];
    
    if (history.length === 0) {
        timeline.innerHTML = '<li class="text-sm text-gray-500 py-2">No status updates yet</li>';
        return;
    }
    
    timeline.innerHTML = history.map((entry, index) => `
        <li>
            <div class="timeline-start text-xs text-gray-500 font-medium">${Utils.formatDate(entry.created_at, 'short')}</div>
            <div class="timeline-middle">
                <div class="w-3 h-3 rounded-full bg-blue-600 border-2 border-white shadow"></div>
            </div>
            <div class="timeline-end timeline-box bg-gray-50 border border-gray-200 shadow-sm">
                <div class="font-semibold text-sm text-gray-900">${formatStatusText(entry.new_status)}</div>
                ${entry.old_status ? `<div class="text-xs text-gray-500 mt-0.5">From: ${formatStatusText(entry.old_status)}</div>` : ''}
                ${entry.notes ? `<div class="text-sm mt-2 text-gray-700 bg-white p-2 rounded border border-gray-100">${entry.notes}</div>` : ''}
            </div>
            ${index < history.length - 1 ? '<hr class="bg-gray-300"/>' : ''}
        </li>
    `).join('');
}


/**
 * FORMAT STATUS TEXT
 */
function formatStatusText(status) {
    if (!status) return 'Unknown';
    return status.charAt(0).toUpperCase() + status.slice(1).replace(/_/g, ' ');
}


/**
 * GET ORDER STATUS BADGE - PROFESSIONAL
 */
function getOrderStatusBadge(status) {
    const badges = {
        pending: '<span class="inline-flex items-center px-4 py-2 rounded-lg text-sm font-semibold bg-orange-50 text-orange-700 border border-orange-200"><i class="fas fa-clock mr-2"></i>Pending</span>',
        confirmed: '<span class="inline-flex items-center px-4 py-2 rounded-lg text-sm font-semibold bg-blue-50 text-blue-700 border border-blue-200"><i class="fas fa-check-circle mr-2"></i>Confirmed</span>',
        processing: '<span class="inline-flex items-center px-4 py-2 rounded-lg text-sm font-semibold bg-purple-50 text-purple-700 border border-purple-200"><i class="fas fa-cog mr-2"></i>Processing</span>',
        shipped: '<span class="inline-flex items-center px-4 py-2 rounded-lg text-sm font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200"><i class="fas fa-shipping-fast mr-2"></i>Shipped</span>',
        delivered: '<span class="inline-flex items-center px-4 py-2 rounded-lg text-sm font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200"><i class="fas fa-check-double mr-2"></i>Delivered</span>',
        cancelled: '<span class="inline-flex items-center px-4 py-2 rounded-lg text-sm font-semibold bg-red-50 text-red-700 border border-red-200"><i class="fas fa-ban mr-2"></i>Cancelled</span>'
    };
    return badges[status] || '<span class="inline-flex items-center px-4 py-2 rounded-lg text-sm font-semibold bg-gray-50 text-gray-600 border border-gray-200">Unknown</span>';
}


/**
 * GET PAYMENT STATUS BADGE - PROFESSIONAL
 */
function getPaymentStatusBadge(status) {
    const badges = {
        pending: '<span class="inline-flex items-center px-4 py-2 rounded-lg text-sm font-semibold bg-orange-50 text-orange-700 border border-orange-200"><i class="fas fa-clock mr-2"></i>Pending</span>',
        completed: '<span class="inline-flex items-center px-4 py-2 rounded-lg text-sm font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200"><i class="fas fa-check-circle mr-2"></i>Completed</span>',
        failed: '<span class="inline-flex items-center px-4 py-2 rounded-lg text-sm font-semibold bg-red-50 text-red-700 border border-red-200"><i class="fas fa-times-circle mr-2"></i>Failed</span>',
        refunded: '<span class="inline-flex items-center px-4 py-2 rounded-lg text-sm font-semibold bg-blue-50 text-blue-700 border border-blue-200"><i class="fas fa-undo mr-2"></i>Refunded</span>'
    };
    return badges[status] || '<span class="inline-flex items-center px-4 py-2 rounded-lg text-sm font-semibold bg-gray-50 text-gray-600 border border-gray-200">Unknown</span>';
}


/**
 * OPEN STATUS MODAL
 */
window.openStatusModal = function() {
    if (!currentOrder) {
        console.warn('⚠️ No current order loaded');
        return;
    }
    document.getElementById('newStatus').value = currentOrder.order_status;
    document.getElementById('statusNotes').value = '';
    document.getElementById('statusModal').showModal();
};


/**
 * CLOSE STATUS MODAL
 */
window.closeStatusModal = function() {
    document.getElementById('statusModal').close();
};


/**
 * CONFIRM STATUS UPDATE
 */
window.confirmStatusUpdate = async function() {
    const newStatus = document.getElementById('newStatus').value;
    const notes = document.getElementById('statusNotes').value.trim();
    
    try {
        Utils.showLoading('Updating order status...');
        
        const response = await fetch(`${Config.API_BASE_URL}/admin/orders/${orderId}/status`, {
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
        await loadOrderDetails();
        
    } catch (error) {
        console.error('❌ Error updating status:', error);
        Utils.hideLoading();
        Utils.showToast(error.message, 'error');
    }
};


/**
 * OPEN TRACKING MODAL
 */
window.openTrackingModal = function() {
    if (!currentOrder) {
        console.warn('⚠️ No current order loaded');
        return;
    }
    document.getElementById('trackingNumberInput').value = currentOrder.tracking_number || '';
    document.getElementById('courierNameInput').value = currentOrder.courier_name || '';
    document.getElementById('trackingModal').showModal();
};


/**
 * CLOSE TRACKING MODAL
 */
window.closeTrackingModal = function() {
    document.getElementById('trackingModal').close();
};


/**
 * CONFIRM TRACKING UPDATE
 */
window.confirmTrackingUpdate = async function() {
    const trackingNumber = document.getElementById('trackingNumberInput').value.trim();
    const courierName = document.getElementById('courierNameInput').value.trim();
    
    if (!trackingNumber || !courierName) {
        Utils.showToast('Please fill all required fields', 'error');
        return;
    }
    
    try {
        Utils.showLoading('Adding tracking information...');
        
        const response = await fetch(`${Config.API_BASE_URL}/admin/orders/${orderId}/tracking`, {
            method: 'PATCH',
            headers: Auth.getAuthHeaders(),
            body: JSON.stringify({
                tracking_number: trackingNumber,
                courier_name: courierName
            })
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'Failed to add tracking');
        }
        
        Utils.hideLoading();
        Utils.showToast('Tracking information added successfully!', 'success');
        
        closeTrackingModal();
        await loadOrderDetails();
        
    } catch (error) {
        console.error('❌ Error adding tracking:', error);
        Utils.hideLoading();
        Utils.showToast(error.message, 'error');
    }
};


/**
 * CANCEL ORDER
 */
window.cancelOrder = async function() {
    if (!currentOrder) {
        console.warn('⚠️ No current order loaded');
        return;
    }
    
    if (currentOrder.order_status === 'cancelled') {
        Utils.showToast('Order is already cancelled', 'info');
        return;
    }
    
    if (currentOrder.order_status === 'delivered') {
        Utils.showToast('Cannot cancel delivered order', 'error');
        return;
    }
    
    const reason = prompt('Enter cancellation reason (optional):');
    if (reason === null) return; // User clicked cancel
    
    if (!confirm('Are you sure you want to cancel this order?')) return;
    
    try {
        Utils.showLoading('Cancelling order...');
        
        const response = await fetch(`${Config.API_BASE_URL}/admin/orders/${orderId}/cancel`, {
            method: 'PATCH',
            headers: Auth.getAuthHeaders(),
            body: JSON.stringify({
                reason: reason || null
            })
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'Failed to cancel order');
        }
        
        Utils.hideLoading();
        Utils.showToast('Order cancelled successfully!', 'success');
        
        await loadOrderDetails();
        
    } catch (error) {
        console.error('❌ Error cancelling order:', error);
        Utils.hideLoading();
        Utils.showToast(error.message, 'error');
    }
};



/**
 * MARK PAYMENT AS RECEIVED (for COD orders)
 */
window.markPaymentReceived = async function() {
    if (!currentOrder) {
        console.warn('⚠️ No current order loaded');
        return;
    }
    
    // Check if it's a COD order with pending payment
    if (currentOrder.payment_method !== 'cod') {
        Utils.showToast('This is not a COD order', 'info');
        return;
    }
    
    if (currentOrder.payment_status === 'completed') {
        Utils.showToast('Payment already marked as received', 'info');
        return;
    }
    
    // Confirm action
    if (!confirm(`Mark payment as received for Order ${currentOrder.order_number}?\n\nThis will update payment status to "Completed".`)) {
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
        
        // Reload order details
        await loadOrderDetails();
        
        console.log('✅ Payment status updated:', result);
        
    } catch (error) {
        console.error('❌ Error updating payment status:', error);
        Utils.hideLoading();
        Utils.showToast(error.message, 'error');
    }
};

/**
 * PRINT ORDER
 */
window.printOrder = function() {
    window.print();
};


console.log('✅ Order Detail JS Loaded!');