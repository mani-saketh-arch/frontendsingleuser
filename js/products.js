/**
 * Products Management - COMPLETE CRUD
 * List, search, filter, delete, toggle status
 */

let state = {
    products: [],
    categories: [],
    currentPage: 1,
    totalProducts: 0,
    filters: {
        search: '',
        category: null,
        status: null,
        lowStock: false
    }
};

document.addEventListener('DOMContentLoaded', async () => {
    console.log('📦 Products management loaded');
    
    // Load initial data
    await loadCategories();
    await loadProducts();
    await loadStats();
    
    // Setup event listeners
    setupEventListeners();
});

/**
 * Setup event listeners
 */
function setupEventListeners() {
    // Search with debounce
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
        searchInput.addEventListener('input', Utils.debounce(() => {
            state.filters.search = searchInput.value.trim();
            state.currentPage = 1;
            loadProducts();
        }, 500));
    }
    
    // Category filter
    const categoryFilter = document.getElementById('category-filter');
    if (categoryFilter) {
        categoryFilter.addEventListener('change', () => {
            state.filters.category = categoryFilter.value || null;
            state.currentPage = 1;
            loadProducts();
        });
    }
    
    // Status filter
    const statusFilter = document.getElementById('status-filter');
    if (statusFilter) {
        statusFilter.addEventListener('change', () => {
            state.filters.status = statusFilter.value || null;
            state.currentPage = 1;
            loadProducts();
        });
    }
    
    // Stock filter
    const stockFilter = document.getElementById('stock-filter');
    if (stockFilter) {
        stockFilter.addEventListener('change', () => {
            state.filters.lowStock = stockFilter.value === 'low';
            state.currentPage = 1;
            loadProducts();
        });
    }
}

/**
 * Load categories for filter
 */
async function loadCategories() {
    try {
        // Load categories from public API
        const categoriesResponse = await fetch(`${Config.API_BASE_URL}/public/categories`);
        const categories = await categoriesResponse.json();
        
        state.categories = categories;
        
        // Populate category filter
        const categoryFilter = document.getElementById('category-filter');
        if (categoryFilter) {
            categoryFilter.innerHTML = '<option value="">All Categories</option>' + 
                categories.map(cat => `<option value="${cat.id}">${cat.name}</option>`).join('');
        }
        
        console.log('✅ Categories loaded:', categories.length);
        
    } catch (error) {
        console.error('Failed to load categories:', error);
    }
}

/**
 * Load products
 */
async function loadProducts() {
    const container = document.getElementById('products-container');
    Utils.showLoading(container, 'Loading products...');
    
    try {
        // Build query params
        const params = new URLSearchParams();
        params.append('skip', (state.currentPage - 1) * 50);
        params.append('limit', 50);
        
        if (state.filters.search) {
            params.append('search', state.filters.search);
        }
        
        if (state.filters.category) {
            params.append('category_id', state.filters.category);
        }
        
        if (state.filters.status !== null) {
            params.append('is_active', state.filters.status);
        }
        
        if (state.filters.lowStock) {
            params.append('low_stock_only', 'true');
        }
        
        const response = await fetch(`${Config.API_BASE_URL}/admin/products?${params.toString()}`, {
            headers: Auth.getAuthHeaders()
        });
        
        if (!response.ok) {
            throw new Error('Failed to load products');
        }
        
        const data = await response.json();
        state.products = data.products || [];
        state.totalProducts = data.total || 0;
        
        console.log('✅ Products loaded:', state.products.length);
        console.log('📸 First product images:', state.products[0]?.images);
        
        renderProducts();
        renderPagination();
        
    } catch (error) {
        console.error('❌ Failed to load products:', error);
        Utils.showError(container, 'Failed to load products. Please try again.');
    }
}

/**
 * Render products table
 */
function renderProducts() {
    const container = document.getElementById('products-container');
    
    if (state.products.length === 0) {
        Utils.showEmptyState(container, 'No products found', 'fa-box-open');
        return;
    }
    
    container.innerHTML = `
        <table class="w-full">
            <thead class="bg-gray-50 border-b">
                <tr>
                    <th class="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Product</th>
                    <th class="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Category</th>
                    <th class="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Price</th>
                    <th class="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Stock</th>
                    <th class="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Status</th>
                    <th class="px-6 py-3 text-right text-xs font-semibold text-gray-700 uppercase">Actions</th>
                </tr>
            </thead>
            <tbody class="divide-y divide-gray-200">
                ${state.products.map(product => renderProductRow(product)).join('')}
            </tbody>
        </table>
    `;
    
    // Add event listeners
    attachProductEventListeners();
}

/**
 * Render single product row - PROFESSIONAL UI
 */
function renderProductRow(product) {
    const category = state.categories.find(c => c.id === product.category_id);
    const price = product.sale_price || product.price;
    const isLowStock = product.stock_quantity <= product.low_stock_threshold;
    
    // Get primary image with better null checking
    let imageUrl = null;
    if (product.images && Array.isArray(product.images) && product.images.length > 0) {
        const primaryImage = product.images.find(img => img.is_primary);
        imageUrl = primaryImage ? primaryImage.image_url : product.images[0].image_url;
    }
    
    return `
        <tr class="hover:bg-gray-50 transition-colors">
            <td class="px-4 sm:px-6 py-4">
                <div class="flex items-center gap-3">
                    ${imageUrl ? `
                        <img src="${imageUrl}" 
                             alt="${product.name}" 
                             class="w-12 h-12 sm:w-14 sm:h-14 object-cover rounded-lg shadow-sm border border-gray-200"
                             onerror="this.onerror=null; this.parentElement.innerHTML='<div class=\\'w-12 h-12 sm:w-14 sm:h-14 bg-gray-100 rounded-lg flex items-center justify-center border border-gray-200\\'><i class=\\'fas fa-image text-gray-400\\'></i></div>';">
                    ` : `
                        <div class="w-12 h-12 sm:w-14 sm:h-14 bg-gray-100 rounded-lg flex items-center justify-center border border-gray-200">
                            <i class="fas fa-image text-gray-400"></i>
                        </div>
                    `}
                    <div class="min-w-0 flex-1">
                        <div class="font-semibold text-gray-900 text-sm sm:text-base truncate">${product.name}</div>
                        <div class="text-xs sm:text-sm text-gray-500 font-mono">${product.sku}</div>
                    </div>
                </div>
            </td>
            <td class="px-4 sm:px-6 py-4 text-xs sm:text-sm text-gray-600">
                ${category ? `<span class="px-2 py-1 bg-gray-100 rounded-md text-xs font-medium">${category.name}</span>` : 'N/A'}
            </td>
            <td class="px-4 sm:px-6 py-4">
                <div class="font-bold text-gray-900 text-sm sm:text-base">₹${parseFloat(price).toFixed(2)}</div>
                ${product.sale_price ? `
                    <div class="text-xs text-gray-500 line-through">₹${parseFloat(product.price).toFixed(2)}</div>
                ` : ''}
            </td>
            <td class="px-4 sm:px-6 py-4">
                <div class="flex items-center gap-2">
                    <span class="font-bold text-sm sm:text-base ${isLowStock ? 'text-red-600' : 'text-gray-900'}">
                        ${product.stock_quantity}
                    </span>
                    ${isLowStock ? `
                        <i class="fas fa-exclamation-triangle text-red-500 text-xs" title="Low stock!"></i>
                    ` : ''}
                </div>
            </td>
            <td class="px-4 sm:px-6 py-4">
                <div class="flex flex-col gap-1">
                    <span class="inline-flex items-center px-2.5 py-1 text-xs font-semibold rounded-full ${product.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-700'}">
                        ${product.is_active ? '<i class="fas fa-check-circle mr-1"></i> Active' : '<i class="fas fa-times-circle mr-1"></i> Inactive'}
                    </span>
                    ${product.is_featured ? `
                        <span class="inline-flex items-center px-2.5 py-1 text-xs font-semibold rounded-full bg-amber-100 text-amber-700">
                            <i class="fas fa-star mr-1"></i> Featured
                        </span>
                    ` : ''}
                </div>
            </td>
            <td class="px-4 sm:px-6 py-4">
                <div class="flex items-center justify-end gap-2">
                    <a href="product-form.html?id=${product.id}" 
                       class="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition" 
                       title="Edit">
                        <i class="fas fa-edit"></i>
                    </a>
                    <button 
                        class="toggle-active-btn p-2 text-${product.is_active ? 'red' : 'emerald'}-600 hover:bg-${product.is_active ? 'red' : 'emerald'}-50 rounded-lg transition" 
                        data-product-id="${product.id}"
                        data-is-active="${product.is_active}"
                        title="${product.is_active ? 'Deactivate' : 'Activate'}">
                        <i class="fas fa-${product.is_active ? 'eye-slash' : 'eye'}"></i>
                    </button>
                    <button 
                        class="toggle-featured-btn p-2 text-amber-600 hover:bg-amber-50 rounded-lg transition" 
                        data-product-id="${product.id}"
                        data-is-featured="${product.is_featured}"
                        title="${product.is_featured ? 'Unmark Featured' : 'Mark Featured'}">
                        <i class="${product.is_featured ? 'fas fa-star' : 'far fa-star'}"></i>
                    </button>
                    <button 
                        class="delete-btn p-2 text-red-600 hover:bg-red-50 rounded-lg transition" 
                        data-product-id="${product.id}"
                        data-product-name="${product.name}"
                        title="Delete">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        </tr>
    `;
}
/**
 * Attach event listeners to product actions
 */
function attachProductEventListeners() {
    // Toggle active
    document.querySelectorAll('.toggle-active-btn').forEach(btn => {
        btn.addEventListener('click', handleToggleActive);
    });
    
    // Toggle featured
    document.querySelectorAll('.toggle-featured-btn').forEach(btn => {
        btn.addEventListener('click', handleToggleFeatured);
    });
    
    // Delete
    document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', handleDelete);
    });
}

/**
 * Toggle product active status
 */
async function handleToggleActive(e) {
    const btn = e.currentTarget;
    const productId = parseInt(btn.dataset.productId);
    const isActive = btn.dataset.isActive === 'true';
    
    const action = isActive ? 'deactivate' : 'activate';
    
    // ✅ FIXED: Changed awaitUtils to Utils
    const confirmed = confirm(`Are you sure you want to ${action} this product?`);
    
    if (!confirmed) return;
    
    try {
        const response = await fetch(`${Config.API_BASE_URL}/admin/products/${productId}/toggle-active`, {
            method: 'PATCH',
            headers: Auth.getAuthHeaders()
        });
        
        if (!response.ok) {
            throw new Error('Failed to update product');
        }
        
        Utils.showToast(`Product ${action}d successfully`, 'success');
        loadProducts();
        loadStats();
        
    } catch (error) {
        console.error('Failed to toggle active:', error);
        Utils.showToast('Failed to update product', 'error');
    }
}

/**
 * Toggle product featured status
 */
async function handleToggleFeatured(e) {
    const btn = e.currentTarget;
    const productId = parseInt(btn.dataset.productId);
    
    try {
        const response = await fetch(`${Config.API_BASE_URL}/admin/products/${productId}/toggle-featured`, {
            method: 'PATCH',
            headers: Auth.getAuthHeaders()
        });
        
        if (!response.ok) {
            throw new Error('Failed to update product');
        }
        
        Utils.showToast('Featured status updated', 'success');
        loadProducts();
        loadStats();
        
    } catch (error) {
        console.error('Failed to toggle featured:', error);
        Utils.showToast('Failed to update product', 'error');
    }
}

/**
 * Delete product
 */
async function handleDelete(e) {
    const btn = e.currentTarget;
    const productId = parseInt(btn.dataset.productId);
    const productName = btn.dataset.productName;
    
    // ✅ FIXED: Changed awaitUtils to confirm
    const confirmed = confirm(`Are you sure you want to delete "${productName}"? This action cannot be undone.`);
    
    if (!confirmed) return;
    
    try {
        const response = await fetch(`${Config.API_BASE_URL}/admin/products/${productId}`, {
            method: 'DELETE',
            headers: Auth.getAuthHeaders()
        });
        
        if (!response.ok) {
            throw new Error('Failed to delete product');
        }
        
        Utils.showToast('Product deleted successfully', 'success');
        loadProducts();
        loadStats();
        
    } catch (error) {
        console.error('Failed to delete product:', error);
        Utils.showToast('Failed to delete product', 'error');
    }
}

/**
 * Render pagination
 */
function renderPagination() {
    const container = document.getElementById('pagination');
    const totalPages = Math.ceil(state.totalProducts / 50);
    
    if (totalPages <= 1) {
        container.innerHTML = '';
        return;
    }
    
    let html = '<div class="flex items-center space-x-2">';
    
    // Previous
    html += `
        <button 
            class="px-4 py-2 rounded ${state.currentPage === 1 ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-white text-blue-600 hover:bg-blue-50 border'}"
            ${state.currentPage === 1 ? 'disabled' : ''}
            onclick="changePage(${state.currentPage - 1})"
        >
            <i class="fas fa-chevron-left"></i>
        </button>
    `;
    
    // Page numbers (show max 5 pages)
    const startPage = Math.max(1, state.currentPage - 2);
    const endPage = Math.min(totalPages, startPage + 4);
    
    for (let i = startPage; i <= endPage; i++) {
        html += `
            <button 
                class="px-4 py-2 rounded ${i === state.currentPage ? 'bg-blue-600 text-white' : 'bg-white text-blue-600 hover:bg-blue-50 border'}"
                onclick="changePage(${i})"
            >
                ${i}
            </button>
        `;
    }
    
    // Next
    html += `
        <button 
            class="px-4 py-2 rounded ${state.currentPage === totalPages ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-white text-blue-600 hover:bg-blue-50 border'}"
            ${state.currentPage === totalPages ? 'disabled' : ''}
            onclick="changePage(${state.currentPage + 1})"
        >
            <i class="fas fa-chevron-right"></i>
        </button>
    `;
    
    html += '</div>';
    
    container.innerHTML = html;
}

/**
 * Change page
 */
function changePage(page) {
    state.currentPage = page;
    loadProducts();
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

/**
 * Load stats
 */
async function loadStats() {
    try {
        const response = await fetch(`${Config.API_BASE_URL}/admin/products?limit=1000`, {
            headers: Auth.getAuthHeaders()
        });
        
        const data = await response.json();
        const products = data.products || [];
        
        document.getElementById('total-products').textContent = products.length;
        document.getElementById('active-products').textContent = products.filter(p => p.is_active).length;
        document.getElementById('featured-count').textContent = products.filter(p => p.is_featured).length;
        
        const lowStock = products.filter(p => p.stock_quantity <= p.low_stock_threshold).length;
        document.getElementById('low-stock-count').textContent = lowStock;
        
    } catch (error) {
        console.error('Failed to load stats:', error);
    }
}

console.log('✅ Products management script loaded');