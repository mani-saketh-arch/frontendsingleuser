/**
 * PRODUCT FORM - FINAL WORKING VERSION
 * Properly handles FormData for image uploads with correct data types
 */

// Global state
let currentProduct = null;
let uploadedImages = [];
let pendingImageFiles = [];
let variants = [];
let categories = [];
let isEditMode = false;

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
    console.log('🎯 Product Form - Starting...');
    
    if (!Auth.isAuthenticated()) {
        window.location.href = 'login.html';
        return;
    }
    
    await loadCategories();
    
    const urlParams = new URLSearchParams(window.location.search);
    const productId = urlParams.get('id');
    
    if (productId) {
        isEditMode = true;
        await loadProductForEdit(productId);
    } else {
        isEditMode = false;
        setupNewProductForm();
    }
    
    setupEventListeners();
    console.log('✅ Product Form Ready!', { isEditMode, productId });
});

async function loadCategories() {
    try {
        const response = await fetch(`${Config.API_BASE_URL}/public/categories`);
        if (!response.ok) throw new Error('Failed to load categories');
        
        categories = await response.json();
        
        const categorySelect = document.getElementById('category_id');
        categorySelect.innerHTML = '<option value="">Select Category</option>';
        
        categories.forEach(cat => {
            if (cat.is_active) {
                categorySelect.innerHTML += `<option value="${cat.id}">${cat.name}</option>`;
            }
        });
        
        console.log('✅ Categories loaded:', categories.length);
    } catch (error) {
        console.error('Error loading categories:', error);
        Utils.showToast('Failed to load categories', 'error');
    }
}

async function loadProductForEdit(productId) {
    try {
        Utils.showLoading('Loading product...');
        
        const response = await fetch(`${Config.API_BASE_URL}/admin/products/${productId}`, {
            headers: Auth.getAuthHeaders()
        });
        
        if (!response.ok) throw new Error('Failed to load product');
        
        currentProduct = await response.json();
        
        console.log('📦 Product loaded:', currentProduct);
        
        document.getElementById('pageTitle').textContent = 'Edit Product';
        document.getElementById('formTitle').textContent = 'Edit Product';
        document.getElementById('submitBtn').innerHTML = '<i class="fas fa-save mr-2"></i>Update Product';
        
        populateForm(currentProduct);
        
        if (currentProduct.images && currentProduct.images.length > 0) {
            uploadedImages = currentProduct.images.map(img => ({
                id: img.id,
                url: img.image_url,
                cloudinary_public_id: img.cloudinary_public_id,
                is_primary: img.is_primary,
                display_order: img.display_order
            }));
            renderImageGallery();
        }
        
        if (currentProduct.variants && currentProduct.variants.length > 0) {
            // ✅ PARSE additional_price to number AND keep the ID
            variants = currentProduct.variants.map(v => ({
                id: v.id,  // ✅ CRITICAL: This must be here
                size: v.size,
                color: v.color,
                additional_price: parseFloat(v.additional_price || 0),  // ✅ Parse to number
                stock_quantity: v.stock_quantity,
                sku: v.sku
            }));
            
            console.log('✅ Variants loaded with IDs:', variants);
            renderVariantsTable();
        }
        
        Utils.hideLoading();
    } catch (error) {
        console.error('Error loading product:', error);
        Utils.hideLoading();
        Utils.showToast('Failed to load product', 'error');
        setTimeout(() => window.location.href = 'products.html', 2000);
    }
}

function populateForm(product) {
    document.getElementById('name').value = product.name || '';
    document.getElementById('slug').value = product.slug || '';
    document.getElementById('description').value = product.description || '';
    document.getElementById('category_id').value = product.category_id || '';
    document.getElementById('price').value = product.price || '';
    document.getElementById('sale_price').value = product.sale_price || '';
    document.getElementById('sku').value = product.sku || '';
    document.getElementById('stock_quantity').value = product.stock_quantity || '';
    document.getElementById('low_stock_threshold').value = product.low_stock_threshold || 10;
    document.getElementById('is_featured').checked = product.is_featured || false;
    document.getElementById('is_active').checked = product.is_active !== false;
}

function setupNewProductForm() {
    const randomSKU = 'SKU' + Date.now().toString().slice(-8);
    document.getElementById('sku').placeholder = `e.g., ${randomSKU}`;
}

function setupEventListeners() {
    const form = document.getElementById('productForm');
    if (form) form.addEventListener('submit', handleFormSubmit);
    
    const imageInput = document.getElementById('imageInput');
    if (imageInput) imageInput.addEventListener('change', handleImageUpload);
    
    const uploadBtn = document.getElementById('uploadImagesBtn');
    if (uploadBtn) uploadBtn.addEventListener('click', () => imageInput.click());
    
    const addVariantBtn = document.getElementById('addVariantBtn');
    if (addVariantBtn) addVariantBtn.addEventListener('click', handleAddVariant);
    
    const cancelBtn = document.getElementById('cancelBtn');
    if (cancelBtn) {
        cancelBtn.addEventListener('click', () => {
            if (confirm('Are you sure? All unsaved changes will be lost.')) {
                window.location.href = 'products.html';
            }
        });
    }

    if (!isEditMode) {
        const nameInput = document.getElementById('name');
        if (nameInput) {
            nameInput.addEventListener('input', (e) => {
                document.getElementById('slug').value = Utils.slugify(e.target.value);
            });
        }
    }

    // ✅ NEW: Update stock info when main stock changes
    const stockInput = document.getElementById('stock_quantity');
    if (stockInput) {
        stockInput.addEventListener('input', () => {
            if (variants.length > 0) {
                updateStockInfo();
            }
        });
    }
}

async function handleImageUpload(event) {
    const files = Array.from(event.target.files);
    if (files.length === 0) return;

    console.log('📸 Image upload:', { fileCount: files.length, isEditMode });

    for (const file of files) {
        if (!file.type.startsWith('image/')) {
            Utils.showToast('Only image files allowed', 'error');
            return;
        }
        if (file.size > 5 * 1024 * 1024) {
            Utils.showToast('Image must be < 5MB', 'error');
            return;
        }
    }

    try {
        if (isEditMode && currentProduct?.id) {
            console.log('✅ EDIT MODE - Uploading immediately');
            Utils.showLoading(`Uploading ${files.length} image(s)...`);
            for (const file of files) {
                await uploadSingleImage(file);
            }
            Utils.hideLoading();
            Utils.showToast(`${files.length} image(s) uploaded!`, 'success');
        } else {
            console.log('✅ ADD MODE - Storing files');
            
            for (const file of files) {
                const previewUrl = URL.createObjectURL(file);
                pendingImageFiles.push(file);
                
                uploadedImages.push({
                    id: null,
                    url: previewUrl,
                    cloudinary_public_id: null,
                    is_primary: uploadedImages.length === 0,
                    display_order: uploadedImages.length,
                    isPending: true
                });
            }
            
            renderImageGallery();
            Utils.showToast(`${files.length} image(s) ready to upload when you save`, 'success');
        }
    } catch (error) {
        Utils.hideLoading();
        Utils.showToast('Failed to process images', 'error');
        console.error('Image upload error:', error);
    }

    event.target.value = '';
}

async function uploadSingleImage(file) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('product_id', String(currentProduct.id));
    formData.append('is_primary', uploadedImages.length === 0 ? 'true' : 'false');
    formData.append('display_order', String(uploadedImages.length));
    
    console.log('📦 Upload params:', {
        productId: String(currentProduct.id),
        isPrimary: uploadedImages.length === 0 ? 'true' : 'false',
        displayOrder: String(uploadedImages.length)
    });

    try {
        const token = localStorage.getItem('admin_auth_token');
        
        if (!token) {
            throw new Error('Not authenticated - no token found');
        }

        const response = await fetch(`${Config.API_BASE_URL}/admin/upload/product-image`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            },
            body: formData
        });

        if (!response.ok) {
            const err = await response.json();
            console.error('Upload failed:', err);
            const message = Array.isArray(err.detail)
                ? err.detail.map(e => e.msg || JSON.stringify(e)).join(', ')
                : err.detail || 'Upload failed';
            throw new Error(message);
        }

        const result = await response.json();

        uploadedImages.push({
            id: result.image_id,
            url: result.url,
            cloudinary_public_id: result.public_id,
            is_primary: uploadedImages.length === 0,
            display_order: uploadedImages.length,
            isPending: false
        });

        renderImageGallery();
    } catch (error) {
        throw error;
    }
}

function renderImageGallery() {
    const gallery = document.getElementById('imageGallery');
    if (!gallery) return;

    if (uploadedImages.length === 0) {
        gallery.innerHTML = `
            <div class="col-span-full text-center py-8 text-gray-400">
                <i class="fas fa-images text-4xl mb-2"></i>
                <p>No images uploaded yet</p>
            </div>
        `;
        return;
    }

    gallery.innerHTML = uploadedImages.map((img, i) => `
        <div class="relative group">
            <img src="${img.url}" class="w-full h-48 object-cover rounded-lg border-2 ${img.is_primary ? 'border-green-500' : 'border-gray-300'}">
            
            ${img.is_primary ? `<div class="absolute top-2 left-2 bg-green-500 text-white px-2 py-1 rounded text-xs font-bold">PRIMARY</div>` : ''}
            
            ${img.isPending ? `<div class="absolute top-2 right-2 bg-yellow-500 text-white px-2 py-1 rounded text-xs font-bold">PENDING</div>` : ''}
            
            <div class="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                ${!img.is_primary ? `<button onclick="setPrimaryImage(${i})" class="bg-blue-600 text-white p-2 rounded" title="Set Primary"><i class="fas fa-star"></i></button>` : ''}
                <button onclick="deleteImage(${i})" class="bg-red-600 text-white p-2 rounded" title="Delete"><i class="fas fa-trash"></i></button>
            </div>
            
            <div class="absolute bottom-2 right-2 bg-black bg-opacity-70 text-white px-2 py-1 rounded text-xs">#${i + 1}</div>
        </div>
    `).join('');
}

window.setPrimaryImage = async function(index) {
    uploadedImages.forEach((img, i) => img.is_primary = i === index);
    
    if (isEditMode && uploadedImages[index].id) {
        try {
            await fetch(`${Config.API_BASE_URL}/admin/images/${uploadedImages[index].id}/set-primary`, {
                method: 'PATCH',
                headers: Auth.getAuthHeaders()
            });
        } catch (e) {
            Utils.showToast('Failed to set primary', 'error');
        }
    }
    renderImageGallery();
};

window.deleteImage = async function(index) {
    if (!confirm('Delete this image?')) return;

    const img = uploadedImages[index];
    
    if (isEditMode && img.id) {
        try {
            await fetch(`${Config.API_BASE_URL}/admin/images/${img.id}`, {
                method: 'DELETE',
                headers: Auth.getAuthHeaders()
            });
        } catch (e) {
            Utils.showToast('Failed to delete', 'error');
            return;
        }
    } else if (img.isPending) {
        const fileIndex = uploadedImages.slice(0, index).filter(i => i.isPending).length;
        pendingImageFiles.splice(fileIndex, 1);
        URL.revokeObjectURL(img.url);
    }

    uploadedImages.splice(index, 1);
    uploadedImages.forEach((img, i) => img.display_order = i);
    
    if (uploadedImages.length > 0 && !uploadedImages.some(i => i.is_primary)) {
        uploadedImages[0].is_primary = true;
    }
    
    renderImageGallery();
};

// ✅ NEW: Validate variant stock doesn't exceed main stock
function validateVariantStock() {
    const mainStock = parseInt(document.getElementById('stock_quantity').value) || 0;
    const variantStockTotal = variants.reduce((sum, v) => sum + (parseInt(v.stock_quantity) || 0), 0);
    
    if (variantStockTotal > mainStock) {
        return {
            valid: false,
            message: `Total variant stock (${variantStockTotal}) exceeds main product stock (${mainStock})`
        };
    }
    
    return { valid: true };
}

// ✅ NEW: Update stock info display
function updateStockInfo() {
    const mainStock = parseInt(document.getElementById('stock_quantity').value) || 0;
    const variantStockTotal = variants.reduce((sum, v) => sum + (parseInt(v.stock_quantity) || 0), 0);
    const remaining = mainStock - variantStockTotal;
    
    // Find or create info display element
    let stockInfo = document.getElementById('stockInfo');
    if (!stockInfo) {
        stockInfo = document.createElement('div');
        stockInfo.id = 'stockInfo';
        stockInfo.className = 'mt-2 p-3 rounded-lg text-sm';
        const variantsSection = document.getElementById('variantsTableBody');
        if (variantsSection && variantsSection.closest('div')) {
            variantsSection.closest('div').appendChild(stockInfo);
        }
    }
    
    if (variants.length > 0) {
        stockInfo.innerHTML = `
            <div class="flex justify-between items-center">
                <span>Main Stock: <strong>${mainStock}</strong></span>
                <span>Variant Total: <strong>${variantStockTotal}</strong></span>
                <span class="${remaining < 0 ? 'text-red-600' : 'text-green-600'}">
                    Remaining: <strong>${remaining}</strong>
                </span>
            </div>
        `;
        stockInfo.className = `mt-2 p-3 rounded-lg text-sm ${
            remaining < 0 ? 'bg-red-50 border border-red-200' : 'bg-blue-50 border border-blue-200'
        }`;
    } else {
        stockInfo.innerHTML = '';
    }
}

function handleAddVariant() {
    const size = document.getElementById('variant_size').value.trim();
    const color = document.getElementById('variant_color').value.trim();
    const addPrice = parseFloat(document.getElementById('variant_additional_price').value) || 0;
    const stock = parseInt(document.getElementById('variant_stock').value) || 0;
    const sku = document.getElementById('variant_sku').value.trim();

    if (!size && !color) {
        Utils.showToast('Enter size or color', 'error');
        return;
    }
    if (!sku) {
        Utils.showToast('Enter variant SKU', 'error');
        return;
    }
    if (variants.some(v => v.sku === sku)) {
        Utils.showToast('SKU already exists', 'error');
        return;
    }

    // ✅ NEW: Validate variant stock before adding
    const mainStock = parseInt(document.getElementById('stock_quantity').value) || 0;
    const currentVariantTotal = variants.reduce((sum, v) => sum + (parseInt(v.stock_quantity) || 0), 0);
    const newTotal = currentVariantTotal + stock;
    
    if (newTotal > mainStock) {
        Utils.showToast(
            `Cannot add variant! Total would be ${newTotal}, but main stock is only ${mainStock}`, 
            'error'
        );
        return;
    }

    variants.push({ id: null, size, color, additional_price: addPrice, stock_quantity: stock, sku });
    renderVariantsTable();
    clearVariantInputs();
    Utils.showToast('Variant added', 'success');
    
    // ✅ NEW: Show stock info after adding
    updateStockInfo();
}

function clearAllVariants() {
    if (!confirm('Delete all variants? This cannot be undone.')) return;
    
    variants = [];
    renderVariantsTable();
    Utils.showToast('All variants cleared', 'success');
}

function clearVariantInputs() {
    document.getElementById('variant_size').value = '';
    document.getElementById('variant_color').value = '';
    document.getElementById('variant_additional_price').value = '0';
    document.getElementById('variant_stock').value = '0';
    document.getElementById('variant_sku').value = '';
}

function renderVariantsTable() {
    const tbody = document.getElementById('variantsTableBody');
    if (!tbody) return;

    if (variants.length === 0) {
        tbody.innerHTML = `
            <tr><td colspan="6" class="text-center py-8 text-gray-400">
                <i class="fas fa-box-open text-3xl mb-2"></i><p>No variants yet</p>
            </td></tr>
        `;
        // ✅ NEW: Clear stock info when no variants
        const stockInfo = document.getElementById('stockInfo');
        if (stockInfo) stockInfo.innerHTML = '';
        return;
    }

    tbody.innerHTML = variants.map((v, i) => `
        <tr>
            <td class="px-4 py-2">${v.size || '-'}</td>
            <td class="px-4 py-2">${v.color || '-'}</td>
            <td class="px-4 py-2">₹${parseFloat(v.additional_price || 0).toFixed(2)}</td>
            <td class="px-4 py-2">${v.stock_quantity}</td>
            <td class="px-4 py-2"><code class="text-xs bg-gray-100 px-2 py-1 rounded">${v.sku}</code></td>
            <td class="px-4 py-2"><button onclick="deleteVariant(${i})" class="text-red-600 hover:text-red-800"><i class="fas fa-trash"></i></button></td>
        </tr>
    `).join('');
    
    // ✅ NEW: Update stock info display
    updateStockInfo();
}

window.deleteVariant = function(index) {
    if (confirm('Delete variant?')) {
        variants.splice(index, 1);
        renderVariantsTable();
    }
};

async function handleFormSubmit(event) {
    event.preventDefault();

    console.log('🎯 Form submit');
    console.log('🔍 Edit mode:', isEditMode);
    console.log('🔍 Current variants array:', variants);

    if (uploadedImages.length === 0) {
        Utils.showToast('Upload at least one image', 'error');
        return;
    }

    // ✅ NEW: Validate variant stock before submission
    if (variants.length > 0) {
        const validation = validateVariantStock();
        if (!validation.valid) {
            Utils.showToast(validation.message, 'error');
            return;
        }
    }

    const baseFormData = {
        name: document.getElementById('name').value.trim(),
        slug: document.getElementById('slug').value.trim(),
        description: document.getElementById('description').value.trim(),
        category_id: parseInt(document.getElementById('category_id').value),
        price: parseFloat(document.getElementById('price').value),
        sale_price: document.getElementById('sale_price').value ? parseFloat(document.getElementById('sale_price').value) : null,
        sku: document.getElementById('sku').value.trim(),
        stock_quantity: parseInt(document.getElementById('stock_quantity').value),
        low_stock_threshold: parseInt(document.getElementById('low_stock_threshold').value),
        is_featured: document.getElementById('is_featured').checked,
        is_active: document.getElementById('is_active').checked,
        variants: variants.map(v => {
            const mappedVariant = {};
            
            if (v.id) {
                mappedVariant.id = v.id;
            }
            
            mappedVariant.size = v.size || null;
            mappedVariant.color = v.color || null;
            mappedVariant.additional_price = parseFloat(v.additional_price || 0);
            mappedVariant.stock_quantity = parseInt(v.stock_quantity || 0);
            mappedVariant.sku = v.sku;
            
            console.log('🔍 Original variant:', v);
            console.log('📦 Mapped variant:', mappedVariant);
            console.log('✅ ID included?', 'id' in mappedVariant, mappedVariant.id);
            
            return mappedVariant;
        })
    };
    
    console.log('📤 Payload to send:', baseFormData);
    console.log('📤 Variants in payload:', baseFormData.variants);

    if (!baseFormData.name || !baseFormData.slug || !baseFormData.sku || !baseFormData.category_id) {
        Utils.showToast('Fill all required fields', 'error');
        return;
    }
    if (baseFormData.price <= 0) {
        Utils.showToast('Price must be > 0', 'error');
        return;
    }
    if (baseFormData.sale_price && baseFormData.sale_price >= baseFormData.price) {
        Utils.showToast('Sale price must be < regular price', 'error');
        return;
    }

    let successCount = 0;
    let failCount = 0;

    try {
        let productId = currentProduct?.id;
        let url = `${Config.API_BASE_URL}/admin/products`;
        let method = 'POST';

        if (isEditMode) {
            url += `/${currentProduct.id}`;
            method = 'PUT';
            console.log('🔄 UPDATE mode - URL:', url);
        } else {
            console.log('➕ CREATE mode - URL:', url);
        }

        Utils.showLoading(isEditMode ? 'Updating product...' : 'Creating product...');
        
        const productResponse = await fetch(url, {
            method,
            headers: Auth.getAuthHeaders(),
            body: JSON.stringify(baseFormData)
        });

        if (!productResponse.ok) {
            const err = await productResponse.json();
            console.error('❌ Server error:', err);
            throw new Error(err.detail?.[0]?.msg || err.detail || 'Failed to save product');
        }

        const savedProduct = await productResponse.json();
        productId = savedProduct.id;
        console.log('✅ Product saved:', productId);

        // Upload pending images (only for CREATE mode)
        if (!isEditMode && pendingImageFiles.length > 0) {
            console.log(`📤 Uploading ${pendingImageFiles.length} images...`);
            Utils.showLoading(`Uploading ${pendingImageFiles.length} image(s)...`);
            
            const token = localStorage.getItem('admin_auth_token');
            
            if (!token) {
                throw new Error('Not authenticated - no token found');
            }
            
            for (let i = 0; i < pendingImageFiles.length; i++) {
                const file = pendingImageFiles[i];
                
                const uploadForm = new FormData();
                uploadForm.append('file', file);
                uploadForm.append('product_id', String(productId));
                uploadForm.append('is_primary', i === 0 ? 'true' : 'false');
                uploadForm.append('display_order', String(i));
                
                console.log(`📦 Uploading image ${i + 1}`);

                try {
                    const uploadRes = await fetch(`${Config.API_BASE_URL}/admin/upload/product-image`, {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${token}`
                        },
                        body: uploadForm
                    });

                    if (!uploadRes.ok) {
                        const err = await uploadRes.json();
                        console.error(`❌ Image ${i + 1} failed:`, err);
                        failCount++;
                    } else {
                        const result = await uploadRes.json();
                        console.log(`✅ Image ${i + 1} uploaded:`, result.url);
                        successCount++;
                    }
                } catch (err) {
                    console.error(`Image ${i + 1} error:`, err);
                    failCount++;
                }
            }
            
            console.log('📊 Upload results:', { successCount, failCount });
            
            if (failCount > 0) {
                Utils.showToast(`Product saved! ${successCount} images uploaded, ${failCount} failed`, 'warning');
            } else {
                Utils.showToast(`Product created with ${successCount} images!`, 'success');
            }
        }

        Utils.hideLoading();
        
        if (isEditMode || (!isEditMode && pendingImageFiles.length === 0) || (successCount === pendingImageFiles.length && failCount === 0)) {
            if (!(!isEditMode && pendingImageFiles.length > 0)) {
                Utils.showToast(isEditMode ? 'Product updated!' : 'Product created!', 'success');
            }
        }
        
        if (!isEditMode) {
            uploadedImages.forEach(img => {
                if (img.isPending) {
                    URL.revokeObjectURL(img.url);
                }
            });
        }
        
        setTimeout(() => window.location.href = 'products.html', 1500);

    } catch (error) {
        Utils.hideLoading();
        Utils.showToast(error.message, 'error');
        console.error('Submit error:', error);
    }
}

if (!Utils.slugify) {
    Utils.slugify = (text) => text
        .toLowerCase()
        .trim()
        .replace(/\s+/g, '-')
        .replace(/[^\w\-]+/g, '')
        .replace(/\-\-+/g, '-')
        .replace(/^-+|-+$/g, '');
}

console.log('✅ Product Form JS Loaded! 🎯');