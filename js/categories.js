/**
 * CATEGORIES MANAGEMENT - WAIT FOR UTILS VERSION
 * Simple CRUD for product categories
 */

console.log('📊 Categories.js loading...');

// Global state
let categories = [];
let currentCategory = null;
let isEditMode = false;
let initializationAttempts = 0;
const MAX_INIT_ATTEMPTS = 10;

/**
 * WAIT FOR DEPENDENCIES TO BE READY
 */
async function waitForDependencies() {
    return new Promise((resolve, reject) => {
        const checkInterval = setInterval(() => {
            initializationAttempts++;
            
            console.log(`🔍 Checking dependencies (attempt ${initializationAttempts})...`);
            
            // Check if all dependencies are loaded
            if (typeof Auth !== 'undefined' && typeof Utils !== 'undefined' && typeof Config !== 'undefined') {
                clearInterval(checkInterval);
                console.log('✅ All dependencies loaded!');
                resolve();
                return;
            }
            
            // Timeout after max attempts
            if (initializationAttempts >= MAX_INIT_ATTEMPTS) {
                clearInterval(checkInterval);
                console.error('❌ Dependencies failed to load after', MAX_INIT_ATTEMPTS, 'attempts');
                reject(new Error('Dependencies failed to load'));
            }
        }, 100); // Check every 100ms
    });
}

/**
 * INITIALIZE
 */
async function initialize() {
    console.log('🎯 Categories Management - Initializing...');
    
    try {
        // Wait for dependencies
        await waitForDependencies();
        
        // Check authentication
        if (!Auth.isAuthenticated()) {
            window.location.href = 'login.html';
            return;
        }
        
        console.log('✅ Authentication verified');
        
        // Load categories
        await loadCategories();
        
        // Setup event listeners
        setupEventListeners();
        
        console.log('✅ Categories Ready!');
        
    } catch (error) {
        console.error('❌ Initialization error:', error);
        
        // Show error in table
        const tbody = document.getElementById('categoriesTableBody');
        if (tbody) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="7" class="text-center py-8 text-error">
                        <i class="fas fa-exclamation-triangle text-4xl mb-2"></i>
                        <p class="font-semibold">Failed to initialize</p>
                        <p class="text-sm">${error.message}</p>
                        <button onclick="location.reload()" class="btn btn-sm btn-primary mt-2">
                            <i class="fas fa-redo"></i> Reload Page
                        </button>
                    </td>
                </tr>
            `;
        }
    }
}

// Start initialization when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialize);
} else {
    // DOM already loaded, initialize immediately
    initialize();
}


/**
 * SETUP EVENT LISTENERS
 */
function setupEventListeners() {
    // Search
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', filterCategories);
    }
    
    // Status filter
    const statusFilter = document.getElementById('statusFilter');
    if (statusFilter) {
        statusFilter.addEventListener('change', filterCategories);
    }
    
    // Form submission
    const categoryForm = document.getElementById('categoryForm');
    if (categoryForm) {
        categoryForm.addEventListener('submit', handleFormSubmit);
    }
    
    // Toggle status label
    const isActiveCheckbox = document.getElementById('isActive');
    if (isActiveCheckbox) {
        isActiveCheckbox.addEventListener('change', (e) => {
            const statusLabel = document.getElementById('statusLabel');
            if (statusLabel) {
                statusLabel.textContent = e.target.checked ? 'Active' : 'Inactive';
            }
        });
    }
    
    // Auto-generate slug from name
    const categoryName = document.getElementById('categoryName');
    if (categoryName) {
        categoryName.addEventListener('input', (e) => {
            const slugInput = document.getElementById('categorySlug');
            if (slugInput && (!isEditMode || !slugInput.value)) {
                slugInput.value = Utils.slugify(e.target.value);
            }
        });
    }
    
    // Logout
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            Auth.logout();
        });
    }
}


/**
 * LOAD CATEGORIES
 */
async function loadCategories() {
    try {
        console.log('📥 Loading categories...');
        
        // Show loading in table
        const tbody = document.getElementById('categoriesTableBody');
        if (tbody) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="7" class="text-center py-8">
                        <span class="loading loading-spinner loading-lg"></span>
                        <p class="mt-2">Loading categories...</p>
                    </td>
                </tr>
            `;
        }
        
        // ✅ CHANGE FROM /public/categories TO /admin/categories
        const response = await fetch(`${Config.API_BASE_URL}/admin/categories`, {
            method: 'GET',
            headers: Auth.getAuthHeaders()  // ✅ ADD AUTH HEADERS
        });
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        categories = await response.json();
        
        console.log('✅ Categories loaded:', categories.length);
        console.log('📊 First category:', categories[0]); // ✅ ADD THIS TO DEBUG
        
        renderCategories(categories);
        
    } catch (error) {
        console.error('❌ Error loading categories:', error);
        
        const tbody = document.getElementById('categoriesTableBody');
        if (tbody) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="7" class="text-center py-8 text-error">
                        <i class="fas fa-exclamation-triangle text-4xl mb-2"></i>
                        <p class="font-semibold">Failed to load categories</p>
                        <p class="text-sm">${error.message}</p>
                        <button onclick="location.reload()" class="btn btn-sm btn-primary mt-2">
                            <i class="fas fa-redo"></i> Retry
                        </button>
                    </td>
                </tr>
            `;
        }
        
        Utils.showToast('Failed to load categories', 'error');
    }
}


/**
 * RENDER CATEGORIES TABLE
 */
/**
 * RENDER CATEGORIES TABLE
 */
function renderCategories(categoriesToRender) {
    const tbody = document.getElementById('categoriesTableBody');
    const emptyState = document.getElementById('emptyState');
    
    if (!tbody) return;
    
    if (categoriesToRender.length === 0) {
        tbody.innerHTML = '';
        if (emptyState) emptyState.classList.remove('hidden');
        return;
    }
    
    if (emptyState) emptyState.classList.add('hidden');
    
    tbody.innerHTML = categoriesToRender.map(cat => `
        <tr class="hover:bg-gray-50 transition-colors">
            <td class="px-4 py-3">
                <div class="avatar">
                    <div class="w-12 h-12 rounded-lg overflow-hidden shadow-sm border border-gray-200">
                        ${cat.image_url ? 
                            `<img src="${cat.image_url}" alt="${cat.name}" class="w-full h-full object-cover">` :
                            `<div class="w-full h-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold text-lg">
                                ${cat.name.charAt(0).toUpperCase()}
                            </div>`
                        }
                    </div>
                </div>
            </td>
            <td class="px-4 py-3">
                <div class="font-semibold text-gray-900">${Utils.escapeHtml(cat.name)}</div>
                ${cat.description ? `<div class="text-sm text-gray-500">${Utils.truncate(cat.description, 50)}</div>` : ''}
            </td>
            <td class="px-4 py-3">
                <code class="text-xs bg-gray-100 px-2 py-1 rounded font-mono text-gray-700">${Utils.escapeHtml(cat.slug)}</code>
            </td>
            <td class="px-4 py-3">
                <span class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
                    (cat.product_count || 0) > 0 ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'
                }">
                    <i class="fas fa-box mr-1.5"></i>
                    ${cat.product_count || 0} ${(cat.product_count || 0) === 1 ? 'product' : 'products'}
                </span>
            </td>
            <td class="px-4 py-3">
                ${cat.is_active ? 
                    '<span class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700"><i class="fas fa-check-circle mr-1.5"></i>Active</span>' :
                    '<span class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700"><i class="fas fa-times-circle mr-1.5"></i>Inactive</span>'
                }
            </td>
            <td class="px-4 py-3">
                <span class="px-2 py-1 bg-gray-100 rounded text-xs font-medium text-gray-700">#${cat.display_order}</span>
            </td>
            <td class="px-4 py-3">
                <div class="flex gap-2">
                    <button onclick="editCategory(${cat.id})" 
                            class="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition" title="Edit">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button onclick="toggleCategoryStatus(${cat.id})" 
                            class="p-2 ${cat.is_active ? 'text-amber-600 hover:bg-amber-50' : 'text-emerald-600 hover:bg-emerald-50'} rounded-lg transition" 
                            title="${cat.is_active ? 'Deactivate' : 'Activate'}">
                        <i class="fas fa-${cat.is_active ? 'eye-slash' : 'eye'}"></i>
                    </button>
                    <button onclick="deleteCategory(${cat.id})" 
                            class="p-2 text-red-600 hover:bg-red-50 rounded-lg transition" title="Delete">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}


/**
 * FILTER CATEGORIES
 */
function filterCategories() {
    const searchInput = document.getElementById('searchInput');
    const statusFilter = document.getElementById('statusFilter');
    
    const searchTerm = searchInput ? searchInput.value.toLowerCase() : '';
    const statusValue = statusFilter ? statusFilter.value : '';
    
    let filtered = categories;
    
    // Search filter
    if (searchTerm) {
        filtered = filtered.filter(cat => 
            cat.name.toLowerCase().includes(searchTerm) ||
            cat.slug.toLowerCase().includes(searchTerm) ||
            (cat.description && cat.description.toLowerCase().includes(searchTerm))
        );
    }
    
    // Status filter
    if (statusValue === 'active') {
        filtered = filtered.filter(cat => cat.is_active);
    } else if (statusValue === 'inactive') {
        filtered = filtered.filter(cat => !cat.is_active);
    }
    
    renderCategories(filtered);
}


/**
 * RESET FILTERS
 */
window.resetFilters = function() {
    const searchInput = document.getElementById('searchInput');
    const statusFilter = document.getElementById('statusFilter');
    
    if (searchInput) searchInput.value = '';
    if (statusFilter) statusFilter.value = '';
    
    renderCategories(categories);
};


/**
 * OPEN ADD MODAL
 */
window.openAddModal = function() {
    isEditMode = false;
    currentCategory = null;
    
    const modalTitle = document.getElementById('modalTitle');
    const submitBtn = document.getElementById('submitBtn');
    const categoryForm = document.getElementById('categoryForm');
    const isActiveCheckbox = document.getElementById('isActive');
    const statusLabel = document.getElementById('statusLabel');
    const displayOrder = document.getElementById('displayOrder');
    
    if (modalTitle) {
        modalTitle.innerHTML = '<i class="fas fa-plus"></i> Add Category';
    }
    
    if (submitBtn) {
        submitBtn.innerHTML = '<i class="fas fa-save"></i> Save Category';
    }
    
    // Reset form
    if (categoryForm) categoryForm.reset();
    if (isActiveCheckbox) isActiveCheckbox.checked = true;
    if (statusLabel) statusLabel.textContent = 'Active';
    if (displayOrder) displayOrder.value = categories.length;
    
    const modal = document.getElementById('categoryModal');
    if (modal) modal.showModal();
};


/**
 * EDIT CATEGORY
 */
window.editCategory = async function(categoryId) {
    try {
        // Find category
        currentCategory = categories.find(cat => cat.id === categoryId);
        
        if (!currentCategory) {
            Utils.showToast('Category not found', 'error');
            return;
        }
        
        isEditMode = true;
        
        const modalTitle = document.getElementById('modalTitle');
        const submitBtn = document.getElementById('submitBtn');
        
        if (modalTitle) {
            modalTitle.innerHTML = '<i class="fas fa-edit"></i> Edit Category';
        }
        
        if (submitBtn) {
            submitBtn.innerHTML = '<i class="fas fa-save"></i> Update Category';
        }
        
        // Populate form
        document.getElementById('categoryName').value = currentCategory.name;
        document.getElementById('categorySlug').value = currentCategory.slug;
        document.getElementById('categoryDescription').value = currentCategory.description || '';
        document.getElementById('categoryImage').value = currentCategory.image_url || '';
        document.getElementById('displayOrder').value = currentCategory.display_order;
        document.getElementById('isActive').checked = currentCategory.is_active;
        document.getElementById('statusLabel').textContent = currentCategory.is_active ? 'Active' : 'Inactive';
        
        const modal = document.getElementById('categoryModal');
        if (modal) modal.showModal();
        
    } catch (error) {
        console.error('❌ Error editing category:', error);
        Utils.showToast('Failed to load category', 'error');
    }
};


/**
 * CLOSE MODAL
 */
window.closeModal = function() {
    const modal = document.getElementById('categoryModal');
    const categoryForm = document.getElementById('categoryForm');
    
    if (modal) modal.close();
    if (categoryForm) categoryForm.reset();
    
    currentCategory = null;
    isEditMode = false;
};


/**
 * HANDLE FORM SUBMIT
 */
async function handleFormSubmit(event) {
    event.preventDefault();
    
    const formData = {
        name: document.getElementById('categoryName').value.trim(),
        slug: document.getElementById('categorySlug').value.trim(),
        description: document.getElementById('categoryDescription').value.trim() || null,
        image_url: document.getElementById('categoryImage').value.trim() || null,
        display_order: parseInt(document.getElementById('displayOrder').value),
        is_active: document.getElementById('isActive').checked
    };
    
    // Validation
    if (!formData.name || !formData.slug) {
        Utils.showToast('Please fill all required fields', 'error');
        return;
    }
    
    try {
        Utils.showLoading(isEditMode ? 'Updating category...' : 'Creating category...');
        
        let response;
        
        if (isEditMode && currentCategory) {
            // Update existing category
            response = await fetch(`${Config.API_BASE_URL}/admin/categories/${currentCategory.id}`, {
                method: 'PUT',
                headers: Auth.getAuthHeaders(),
                body: JSON.stringify(formData)
            });
        } else {
            // Create new category
            response = await fetch(`${Config.API_BASE_URL}/admin/categories`, {
                method: 'POST',
                headers: Auth.getAuthHeaders(),
                body: JSON.stringify(formData)
            });
        }
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'Operation failed');
        }
        
        Utils.hideLoading();
        Utils.showToast(
            isEditMode ? 'Category updated successfully!' : 'Category created successfully!',
            'success'
        );
        
        closeModal();
        await loadCategories();
        
    } catch (error) {
        console.error('❌ Error saving category:', error);
        Utils.hideLoading();
        Utils.showToast(error.message, 'error');
    }
}


/**
 * TOGGLE CATEGORY STATUS
 */
window.toggleCategoryStatus = async function(categoryId) {
    const category = categories.find(cat => cat.id === categoryId);
    
    if (!category) return;
    
    const newStatus = !category.is_active;
    const action = newStatus ? 'activate' : 'deactivate';
    
    if (!confirm(`Are you sure you want to ${action} this category?`)) return;
    
    try {
        Utils.showLoading(`${action.charAt(0).toUpperCase() + action.slice(1)}ing category...`);
        
        const response = await fetch(`${Config.API_BASE_URL}/admin/categories/${categoryId}/toggle-active`, {
            method: 'PATCH',
            headers: Auth.getAuthHeaders()
        });
        
        if (!response.ok) throw new Error(`Failed to ${action} category`);
        
        Utils.hideLoading();
        Utils.showToast(`Category ${action}d successfully!`, 'success');
        
        await loadCategories();
        
    } catch (error) {
        console.error(`❌ Error ${action}ing category:`, error);
        Utils.hideLoading();
        Utils.showToast(error.message, 'error');
    }
};


/**
 * DELETE CATEGORY
 */
window.deleteCategory = async function(categoryId) {
    const category = categories.find(cat => cat.id === categoryId);
    
    if (!category) return;
    
    if (!confirm(`Delete "${category.name}"?\n\nThis action cannot be undone!`)) return;
    
    try {
        Utils.showLoading('Deleting category...');
        
        const response = await fetch(`${Config.API_BASE_URL}/admin/categories/${categoryId}`, {
            method: 'DELETE',
            headers: Auth.getAuthHeaders()
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'Failed to delete category');
        }
        
        Utils.hideLoading();
        Utils.showToast('Category deleted successfully!', 'success');
        
        await loadCategories();
        
    } catch (error) {
        console.error('❌ Error deleting category:', error);
        Utils.hideLoading();
        Utils.showToast(error.message, 'error');
    }
};


console.log('✅ Categories.js loaded!');