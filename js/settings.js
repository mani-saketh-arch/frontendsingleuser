/**
 * SETTINGS MANAGEMENT
 * Configure site settings - shipping, tax, payments, etc.
 * THE FINAL PREY! 🎯⚙️
 */

// Global state
let originalSettings = {};

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
    console.log('🎯 Settings - Final Hunt Started!');
    
    // Check authentication
    if (!Auth.isAuthenticated()) {
        window.location.href = 'login.html';
        return;
    }
    
    // Load settings
    await loadSettings();
    
    // Setup event listeners
    setupEventListeners();
    
    console.log('✅ Settings Ready!');
});


/**
 * SETUP EVENT LISTENERS
 */
function setupEventListeners() {
    // Logout
    document.getElementById('logoutBtn').addEventListener('click', () => {
        Auth.logout();
        window.location.href = 'login.html';
    });
    
    // COD toggle - update label
    document.getElementById('cod_enabled').addEventListener('change', (e) => {
        console.log('COD enabled:', e.target.checked);
    });
}


/**
 * LOAD SETTINGS
 */
async function loadSettings() {
    try {
        document.getElementById('loadingState').classList.remove('hidden');
        document.getElementById('settingsContent').classList.add('hidden');
        
        const response = await fetch(`${Config.API_BASE_URL}/admin/settings`, {
            method: 'GET',
            headers: Auth.getAuthHeaders()
        });
        
        if (!response.ok) throw new Error('Failed to load settings');
        
        const settings = await response.json();
        
        // Convert array to object for easier access
        const settingsObj = {};
        settings.forEach(setting => {
            settingsObj[setting.setting_key] = {
                value: setting.setting_value,
                data_type: setting.data_type
            };
        });
        
        originalSettings = settingsObj;
        
        // Populate form
        populateForm(settingsObj);
        
        document.getElementById('loadingState').classList.add('hidden');
        document.getElementById('settingsContent').classList.remove('hidden');
        
        console.log('✅ Settings loaded:', settingsObj);
        
    } catch (error) {
        console.error('❌ Error loading settings:', error);
        document.getElementById('loadingState').innerHTML = `
            <div class="text-center">
                <i class="fas fa-exclamation-triangle text-error text-6xl mb-4"></i>
                <p class="text-xl text-error">Failed to load settings</p>
                <button onclick="location.reload()" class="btn btn-primary mt-4">
                    <i class="fas fa-redo"></i> Retry
                </button>
            </div>
        `;
    }
}


/**
 * POPULATE FORM
 */
function populateForm(settings) {
    // Store Information
    if (settings.site_name) {
        document.getElementById('site_name').value = settings.site_name.value;
    }
    if (settings.site_email) {
        document.getElementById('site_email').value = settings.site_email.value;
    }
    if (settings.site_phone) {
        document.getElementById('site_phone').value = settings.site_phone.value;
    }
    
    // Pricing & Charges
    if (settings.shipping_charges) {
        document.getElementById('shipping_charges').value = settings.shipping_charges.value;
    }
    if (settings.tax_rate) {
        document.getElementById('tax_rate').value = settings.tax_rate.value;
    }
    if (settings.free_shipping_threshold) {
        document.getElementById('free_shipping_threshold').value = settings.free_shipping_threshold.value;
    }
    if (settings.min_order_amount) {
        document.getElementById('min_order_amount').value = settings.min_order_amount.value;
    }
    
    // Inventory
    if (settings.low_stock_threshold) {
        document.getElementById('low_stock_threshold').value = settings.low_stock_threshold.value;
    }
    
    // Payment Methods
    if (settings.cod_enabled) {
        document.getElementById('cod_enabled').checked = settings.cod_enabled.value === 'true';
    }
}


/**
 * RESET FORM
 */
window.resetForm = function() {
    if (!confirm('Reset all changes?')) return;
    populateForm(originalSettings);
    Utils.showToast('Settings reset', 'info');
};


/**
 * SAVE SETTINGS
 */
window.saveSettings = async function() {
    try {
        Utils.showLoading('Saving settings...');
        
        // Collect all settings
        const updates = {
            site_name: document.getElementById('site_name').value.trim(),
            site_email: document.getElementById('site_email').value.trim(),
            site_phone: document.getElementById('site_phone').value.trim(),
            shipping_charges: document.getElementById('shipping_charges').value,
            tax_rate: document.getElementById('tax_rate').value,
            free_shipping_threshold: document.getElementById('free_shipping_threshold').value,
            min_order_amount: document.getElementById('min_order_amount').value,
            low_stock_threshold: document.getElementById('low_stock_threshold').value,
            cod_enabled: document.getElementById('cod_enabled').checked ? 'true' : 'false'
        };
        
        // Validate
        if (!updates.site_name) {
            Utils.hideLoading();
            Utils.showToast('Store name is required', 'error');
            return;
        }
        
        if (!updates.site_email) {
            Utils.hideLoading();
            Utils.showToast('Contact email is required', 'error');
            return;
        }
        
        // Validate numbers
        const numericFields = ['shipping_charges', 'tax_rate', 'free_shipping_threshold', 'min_order_amount', 'low_stock_threshold'];
        for (const field of numericFields) {
            if (updates[field] && isNaN(parseFloat(updates[field]))) {
                Utils.hideLoading();
                Utils.showToast(`${field.replace('_', ' ')} must be a valid number`, 'error');
                return;
            }
        }
        
        // Send bulk update request
        const response = await fetch(`${Config.API_BASE_URL}/admin/settings/bulk-update`, {
            method: 'POST',
            headers: Auth.getAuthHeaders(),
            body: JSON.stringify(updates)
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'Failed to save settings');
        }
        
        const result = await response.json();
        
        Utils.hideLoading();
        
        if (result.errors && result.errors.length > 0) {
            Utils.showToast(`Settings saved with ${result.errors.length} error(s)`, 'warning');
            console.warn('Errors:', result.errors);
        } else {
            Utils.showToast('Settings saved successfully!', 'success');
        }
        
        // Reload settings to get fresh data
        await loadSettings();
        
    } catch (error) {
        console.error('❌ Error saving settings:', error);
        Utils.hideLoading();
        Utils.showToast(error.message, 'error');
    }
};


/**
 * UPDATE INDIVIDUAL SETTING (Alternative approach)
 */
async function updateSetting(key, value) {
    try {
        const response = await fetch(`${Config.API_BASE_URL}/admin/settings/${key}`, {
            method: 'PUT',
            headers: Auth.getAuthHeaders(),
            body: JSON.stringify({
                setting_value: value
            })
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'Failed to update setting');
        }
        
        return true;
        
    } catch (error) {
        console.error(`❌ Error updating ${key}:`, error);
        throw error;
    }
}


console.log('✅ Settings JS Loaded - Final Prey Captured! 🎯⚙️');