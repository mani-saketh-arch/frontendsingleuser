/**
 * DASHBOARD - PROFESSIONAL UI VERSION
 * CSS-based visualizations with enhanced styling
 * NO DUMMY DATA - All data from API only
 */

console.log('📊 Dashboard.js loading (Professional UI)...');

let dashboardInitialized = false;

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', async () => {
    if (dashboardInitialized) return;
    dashboardInitialized = true;
    
    console.log('🎯 Dashboard - Initializing...');
    
    try {
        // Check Auth
        if (typeof Auth === 'undefined' || !Auth.isAuthenticated()) {
            window.location.href = 'login.html';
            return;
        }
        
        // Display admin info - Support multiple ID patterns
        const adminData = Auth.getAdminData();
        if (adminData) {
            const nameElements = ['adminName', 'headerAdminName', 'welcomeName'];
            const roleElements = ['adminRole', 'headerAdminRole'];
            
            nameElements.forEach(id => {
                const elem = document.getElementById(id);
                if (elem) elem.textContent = adminData.username || 'Admin';
            });
            
            roleElements.forEach(id => {
                const elem = document.getElementById(id);
                if (elem) elem.textContent = adminData.role || 'Admin';
            });
        }
        
        // Setup logout - Multiple logout buttons support
        const logoutButtons = ['logoutBtn', 'logoutBtnSidebar'];
        logoutButtons.forEach(id => {
            const btn = document.getElementById(id);
            if (btn) {
                btn.addEventListener('click', (e) => {
                    e.preventDefault();
                    Auth.logout();
                });
            }
        });
        
        // Load dashboard data
        await loadAllData();
        
        console.log('✅ Dashboard Ready!');
        
    } catch (error) {
        console.error('❌ Dashboard error:', error);
        showError('Failed to load dashboard');
    }
});

/**
 * SHOW ERROR - PROFESSIONAL STYLING
 */
function showError(message) {
    document.getElementById('loadingState').innerHTML = `
        <div class="text-center py-12">
            <div class="inline-flex items-center justify-center w-20 h-20 bg-red-100 rounded-full mb-4">
                <i class="fas fa-exclamation-triangle text-red-500 text-4xl"></i>
            </div>
            <h3 class="text-2xl font-bold text-gray-900 mb-2">Oops! Something went wrong</h3>
            <p class="text-gray-600 mb-6">${message}</p>
            <button onclick="location.reload()" class="bg-gradient-to-r from-black to-gray-800 hover:from-gray-800 hover:to-black text-white px-6 py-3 rounded-lg font-semibold shadow-lg hover:shadow-xl transition-all">
                <i class="fas fa-redo mr-2"></i> Retry
            </button>
        </div>
    `;
}

/**
 * LOAD ALL DATA - NO CHANGES
 */
async function loadAllData() {
    try {
        console.log('📊 Loading dashboard data...');
        
        await Promise.all([
            loadStats(),
            loadOrderStatusBreakdown(),
            loadPopularProducts(),
            loadRecentOrders(),
            checkLowStock()
        ]);
        
        // Show dashboard
        document.getElementById('loadingState').classList.add('hidden');
        document.getElementById('dashboardContent').classList.remove('hidden');
        
        console.log('✅ All data loaded!');
    } catch (error) {
        console.error('❌ Error loading data:', error);
        throw error;
    }
}

/**
 * LOAD STATS - ENHANCED DISPLAY
 */
async function loadStats() {
    try {
        const response = await fetch(`${Config.API_BASE_URL}/admin/dashboard/stats`, {
            headers: Auth.getAuthHeaders()
        });
        
        if (!response.ok) return;
        
        const stats = await response.json();
        
        // Format numbers with Indian locale
        document.getElementById('totalSales').textContent = `₹${stats.total_sales.toLocaleString('en-IN')}`;
        document.getElementById('totalOrders').textContent = stats.total_orders.toLocaleString('en-IN');
        document.getElementById('todaySales').textContent = `₹${stats.today_sales.toLocaleString('en-IN')}`;
        document.getElementById('todayOrdersCount').textContent = `${stats.today_orders} orders today`;
        document.getElementById('pendingOrders').textContent = stats.pending_orders.toLocaleString('en-IN');
        
        console.log('✅ Stats loaded:', stats);
    } catch (error) {
        console.error('Stats error:', error);
    }
}

/**
 * LOAD ORDER STATUS BREAKDOWN - PROFESSIONAL BARS
 */
async function loadOrderStatusBreakdown() {
    try {
        console.log('📊 Loading order status breakdown...');
        
        const response = await fetch(`${Config.API_BASE_URL}/admin/dashboard/order-status-breakdown`, {
            headers: Auth.getAuthHeaders()
        });
        
        if (!response.ok) return;
        
        const data = await response.json();
        console.log('Order status data:', data);
        
        // Calculate total
        const total = data.pending + data.confirmed + data.processing + data.shipped + data.delivered + data.cancelled;
        
        if (total === 0) {
            document.getElementById('orderStatusChart').innerHTML = `
                <div class="flex flex-col items-center justify-center py-12 text-gray-400">
                    <div class="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                        <i class="fas fa-inbox text-4xl"></i>
                    </div>
                    <p class="text-lg font-medium">No orders yet</p>
                    <p class="text-sm mt-1">Orders will appear here once customers start placing them</p>
                </div>
            `;
            return;
        }
        
        // Status configuration with professional colors
        const statusConfig = [
            { name: 'Pending', count: data.pending, color: '#f97316', bgColor: '#fff7ed', icon: 'clock' },
            { name: 'Confirmed', count: data.confirmed, color: '#3b82f6', bgColor: '#eff6ff', icon: 'check-circle' },
            { name: 'Processing', count: data.processing, color: '#a855f7', bgColor: '#faf5ff', icon: 'cog' },
            { name: 'Shipped', count: data.shipped, color: '#6366f1', bgColor: '#eef2ff', icon: 'shipping-fast' },
            { name: 'Delivered', count: data.delivered, color: '#10b981', bgColor: '#ecfdf5', icon: 'check-double' },
            { name: 'Cancelled', count: data.cancelled, color: '#ef4444', bgColor: '#fef2f2', icon: 'times-circle' }
        ];
        
        // Create professional progress bars
        let html = '<div class="space-y-4">';
        
        statusConfig.forEach(status => {
            const percentage = total > 0 ? ((status.count / total) * 100).toFixed(1) : 0;
            
            html += `
                <div class="space-y-2">
                    <div class="flex justify-between items-center">
                        <div class="flex items-center gap-3">
                            <div class="w-8 h-8 rounded-lg flex items-center justify-center" style="background-color: ${status.bgColor}">
                                <i class="fas fa-${status.icon} text-sm" style="color: ${status.color}"></i>
                            </div>
                            <span class="font-semibold text-gray-700">${status.name}</span>
                        </div>
                        <div class="flex items-center gap-4">
                            <span class="px-3 py-1 rounded-full text-xs font-bold" style="background-color: ${status.bgColor}; color: ${status.color}">
                                ${status.count} ${status.count === 1 ? 'order' : 'orders'}
                            </span>
                            <span class="text-sm font-semibold text-gray-500 w-12 text-right">${percentage}%</span>
                        </div>
                    </div>
                    <div class="w-full bg-gray-100 rounded-full h-3 overflow-hidden shadow-inner">
                        <div class="h-full rounded-full transition-all duration-500 ease-out shadow-sm" 
                             style="width: ${percentage}%; background: linear-gradient(90deg, ${status.color} 0%, ${status.color}dd 100%)">
                        </div>
                    </div>
                </div>
            `;
        });
        
        html += '</div>';
        
        document.getElementById('orderStatusChart').innerHTML = html;
        console.log('✅ Order status visualization created');
        
    } catch (error) {
        console.error('Order status error:', error);
    }
}

/**
 * LOAD POPULAR PRODUCTS - ENHANCED TABLE
 */
async function loadPopularProducts() {
    try {
        const response = await fetch(`${Config.API_BASE_URL}/admin/dashboard/popular-products?limit=5`, {
            headers: Auth.getAuthHeaders()
        });
        
        if (!response.ok) return;
        
        const data = await response.json();
        const tbody = document.getElementById('popularProductsTable');
        
        if (data.popular_products.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="3" class="text-center py-8">
                        <div class="flex flex-col items-center text-gray-400">
                            <i class="fas fa-box-open text-3xl mb-2"></i>
                            <p class="font-medium">No products sold yet</p>
                            <p class="text-xs mt-1">Popular products will appear here</p>
                        </div>
                    </td>
                </tr>
            `;
        } else {
            tbody.innerHTML = data.popular_products.map((p, index) => `
                <tr class="hover:bg-gray-50 transition-colors">
                    <td>
                        <div class="flex items-center gap-3">
                            <div class="flex-shrink-0">
                                <div class="w-8 h-8 rounded-lg bg-gradient-to-br from-yellow-400 to-yellow-500 flex items-center justify-center text-white font-bold text-sm">
                                    ${index + 1}
                                </div>
                            </div>
                            <div>
                                <div class="font-semibold text-gray-900">${p.product_name}</div>
                                <div class="text-xs text-gray-500 font-mono">${p.sku}</div>
                            </div>
                        </div>
                    </td>
                    <td>
                        <span class="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">
                            <i class="fas fa-shopping-cart mr-1.5"></i>
                            ${p.total_ordered}
                        </span>
                    </td>
                    <td>
                        <div class="font-bold text-gray-900">₹${p.total_revenue.toLocaleString('en-IN')}</div>
                    </td>
                </tr>
            `).join('');
        }
        
        console.log('✅ Popular products loaded');
    } catch (error) {
        console.error('Popular products error:', error);
    }
}

/**
 * LOAD RECENT ORDERS - ENHANCED TABLE
 */
async function loadRecentOrders() {
    try {
        const response = await fetch(`${Config.API_BASE_URL}/admin/dashboard/recent-orders?limit=5`, {
            headers: Auth.getAuthHeaders()
        });
        
        if (!response.ok) return;
        
        const data = await response.json();
        const tbody = document.getElementById('recentOrdersTable');
        
        if (data.recent_orders.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="4" class="text-center py-8">
                        <div class="flex flex-col items-center text-gray-400">
                            <i class="fas fa-receipt text-3xl mb-2"></i>
                            <p class="font-medium">No orders yet</p>
                            <p class="text-xs mt-1">Recent orders will appear here</p>
                        </div>
                    </td>
                </tr>
            `;
        } else {
            tbody.innerHTML = data.recent_orders.map(o => {
                // Status badge configuration
                const statusStyles = {
                    pending: { bg: 'bg-orange-100', text: 'text-orange-700', icon: 'clock' },
                    confirmed: { bg: 'bg-blue-100', text: 'text-blue-700', icon: 'check-circle' },
                    processing: { bg: 'bg-purple-100', text: 'text-purple-700', icon: 'cog' },
                    shipped: { bg: 'bg-indigo-100', text: 'text-indigo-700', icon: 'shipping-fast' },
                    delivered: { bg: 'bg-green-100', text: 'text-green-700', icon: 'check-double' },
                    cancelled: { bg: 'bg-red-100', text: 'text-red-700', icon: 'times-circle' }
                };
                
                const statusStyle = statusStyles[o.order_status] || { bg: 'bg-gray-100', text: 'text-gray-700', icon: 'circle' };
                
                return `
                    <tr class="hover:bg-gray-50 transition-colors cursor-pointer" onclick="window.location.href='order-detail.html?id=${o.id}'">
                        <td>
                            <div class="font-mono text-sm font-bold text-blue-600 hover:text-blue-700">
                                ${o.order_number}
                            </div>
                        </td>
                        <td>
                            <div class="flex items-center gap-2">
                                <div class="w-8 h-8 rounded-full bg-gradient-to-br from-gray-600 to-gray-700 flex items-center justify-center text-white font-semibold text-xs">
                                    ${o.customer_name.charAt(0).toUpperCase()}
                                </div>
                                <div class="text-sm font-medium text-gray-900">${o.customer_name}</div>
                            </div>
                        </td>
                        <td>
                            <div class="font-bold text-gray-900">₹${o.final_amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                        </td>
                        <td>
                            <span class="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${statusStyle.bg} ${statusStyle.text}">
                                <i class="fas fa-${statusStyle.icon} mr-1.5"></i>
                                ${o.order_status.charAt(0).toUpperCase() + o.order_status.slice(1)}
                            </span>
                        </td>
                    </tr>
                `;
            }).join('');
        }
        
        console.log('✅ Recent orders loaded');
    } catch (error) {
        console.error('Recent orders error:', error);
    }
}

/**
 * CHECK LOW STOCK - NO CHANGES
 */
async function checkLowStock() {
    try {
        const response = await fetch(`${Config.API_BASE_URL}/admin/products/low-stock/alert`, {
            headers: Auth.getAuthHeaders()
        });
        
        if (!response.ok) return;
        
        const data = await response.json();
        
        if (data.count > 0) {
            document.getElementById('lowStockAlert')?.classList.remove('hidden');
            document.getElementById('lowStockCount').textContent = data.count;
        }
        
        console.log('✅ Low stock checked');
    } catch (error) {
        console.error('Low stock error:', error);
    }
}

console.log('✅ Dashboard.js loaded (Professional UI)!');