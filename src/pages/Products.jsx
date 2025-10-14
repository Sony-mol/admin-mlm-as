// src/pages/Products.jsx
import React, { useEffect, useState } from 'react';
import { API_ENDPOINTS } from '../config/api';
import { useAuth } from '../context/AuthContext';
import { 
  Package, 
  Plus, 
  Edit, 
  Trash2, 
  Search, 
  Filter, 
  Upload, 
  Eye,
  EyeOff,
  Star,
  TrendingUp,
  DollarSign,
  ShoppingCart,
  Image as ImageIcon,
  Camera,
  Crop,
  RotateCw,
  Download,
  Share,
  MoreVertical,
  Grid,
  List,
  Tag,
  AlertCircle,
  CheckCircle,
  Loader2
} from 'lucide-react';

// Canonical API base (same as backend). Prefer env if provided.
const API_BASE = import.meta.env.VITE_API_BASE_URL || 'https://asmlmbackend-production.up.railway.app';

// Resolve a sensible default image based on product name
const getDefaultImage = (productName) => {
  const defaults = {
    'Watch': 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&h=400&fit=crop&crop=center',
    'Growth Package': 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=400&h=400&fit=crop&crop=center',
    'Eliteeeee Package': 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400&h=400&fit=crop&crop=center',
    'Cap': 'https://images.unsplash.com/photo-1588850561407-ed78c282e89b?w=400&h=400&fit=crop&crop=center',
    'car': 'https://images.unsplash.com/photo-1549317336-206569e8475c?w=400&h=400&fit=crop&crop=center',
    'Bag': 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400&h=400&fit=crop&crop=center',
    'AC': 'https://images.unsplash.com/photo-1631679706909-1844bbd07221?w=400&h=400&fit=crop&crop=center'
  };
  return defaults[productName] || 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=400&h=400&fit=crop&crop=center';
};

// Build ordered candidate URLs from what is stored in DB (to support legacy shapes)
const buildProductImageCandidates = (product) => {
  // Prefer fields similar to the mobile app first
  const rawValues = [
    product?.imageUrl,         // used by mobile app
    product?.image,            // legacy/admin
    product?.image_path,       // possible backend field
  ].filter(Boolean).map(v => String(v).trim()).filter(v => v.length > 0);

  const candidates = [];
  if (rawValues.length === 0) return candidates;

  for (const value of rawValues) {
    // Absolute URL stored in DB
    if (value.startsWith('http')) {
      candidates.push(value);
      continue;
    }

    // If already an API image path
    if (value.startsWith('/api/products/image/')) {
      candidates.push(`${API_BASE}${value}`);
    }

    // If relative path like /uploads/products/<file>
    if (value.startsWith('/uploads/')) {
      const file = value.split('/').pop();
      candidates.push(`${API_BASE}/api/products/image/${file}`); // preferred served endpoint
      candidates.push(`${API_BASE}${value}`); // direct static path (if exposed)
    }

    // Bare filename or uuid
    if (!value.includes('/')) {
      const file = value;
      candidates.push(`${API_BASE}/api/products/image/${file}`);
      candidates.push(`${API_BASE}/uploads/products/${file}`);
    }

    // Safety: last attempt, prefix as-is
    if (!value.startsWith('/')) {
      candidates.push(`${API_BASE}/${value}`);
    }
  }

  // Remove duplicates while preserving order
  const seen = new Set();
  return candidates.filter((u) => (seen.has(u) ? false : (seen.add(u), true)));
};

// Product Card Component
const ProductCard = ({ product, onEdit, onDelete, onView }) => (
  <div className="rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-6 hover:shadow-lg transition-all duration-300 group">
    <div className="relative">
      <div className="aspect-square rounded-lg overflow-hidden mb-4 bg-[rgba(var(--fg),0.06)]">
        {(() => {
          const candidates = buildProductImageCandidates(product);
          const cacheKey = product?.updatedAt || product?.id || '';
          let attemptIndex = 0;
          const pick = (idx) => {
            const base = candidates[idx] || getDefaultImage(product.name);
            return cacheKey ? `${base}?v=${encodeURIComponent(cacheKey)}` : base;
          };
          const initial = pick(0);
          return (
            <img
              src={initial}
              alt={product.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              onError={(e) => {
                // Try next candidate; fallback to default at the end
                attemptIndex += 1;
                if (attemptIndex < candidates.length) {
                  const next = pick(attemptIndex);
                  console.warn('Retrying product image with:', next);
                  e.currentTarget.src = next;
                } else {
                  const fallback = getDefaultImage(product.name);
                  console.error('All image candidates failed. Falling back to default.', candidates);
                  e.currentTarget.src = fallback;
                }
              }}
              onLoad={(e) => console.log('Image loaded successfully:', e.currentTarget.src)}
            />
          );
        })()}
      </div>
      
      {/* Product Status Badge (kept accent colors) */}
      <div className="absolute top-2 right-2">
        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
          product.status === 'active' ? 'bg-green-100 text-green-800' :
          product.status === 'inactive' ? 'bg-gray-200 text-gray-900' :
          'bg-red-100 text-red-800'
        }`}>
          {product.status}
        </span>
      </div>
    </div>

    <div className="space-y-3">
      <div>
        <h3 className="font-semibold text-lg text-[rgb(var(--fg))]">{product.name}</h3>
        <p className="text-sm text-[rgba(var(--fg),0.7)] line-clamp-2">{product.description}</p>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <div className="text-2xl font-bold text-[rgb(var(--fg))]">₹{product.price}</div>
          <div className="text-sm text-[rgba(var(--fg),0.6)]">Stock: {product.stock}</div>
        </div>
        <div className="flex items-center space-x-1">
          <Star className="w-4 h-4 text-yellow-400 fill-current" />
          <span className="text-sm text-[rgba(var(--fg),0.7)]">{product.rating || '4.5'}</span>
        </div>
      </div>

      <div className="flex items-center justify-between pt-3 border-t border-[rgb(var(--border))]">
        <div className="flex items-center space-x-2">
          <button
            onClick={() => onView(product)}
            className="p-2 rounded-lg transition-colors text-[rgba(var(--fg),0.6)] hover:text-blue-600 hover:bg-[rgba(37,99,235,0.12)]"
          >
            <Eye className="w-4 h-4" />
          </button>
          <button
            onClick={() => onEdit(product)}
            className="p-2 rounded-lg transition-colors text-[rgba(var(--fg),0.6)] hover:text-green-600 hover:bg-[rgba(22,163,74,0.12)]"
          >
            <Edit className="w-4 h-4" />
          </button>
          <button
            onClick={() => onDelete(product)}
            className="p-2 rounded-lg transition-colors text-[rgba(var(--fg),0.6)] hover:text-red-600 hover:bg-[rgba(220,38,38,0.12)]"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
        <div className="flex items-center space-x-1 text-sm text-[rgba(var(--fg),0.6)]">
          <ShoppingCart className="w-4 h-4" />
          <span>{product.sales || 0}</span>
        </div>
      </div>
    </div>
  </div>
);

// Photo Editor Component
const PhotoEditor = ({ image, onSave, onCancel }) => {
  const [editedImage, setEditedImage] = useState(image);
  const [filters, setFilters] = useState({
    brightness: 100,
    contrast: 100,
    saturation: 100,
    blur: 0,
    sepia: 0
  });

  const applyFilters = (img, filterValues) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const imgElement = new Image();
    
    imgElement.onload = () => {
      canvas.width = imgElement.width;
      canvas.height = imgElement.height;
      
      ctx.filter = `
        brightness(${filterValues.brightness}%) 
        contrast(${filterValues.contrast}%) 
        saturate(${filterValues.saturation}%) 
        blur(${filterValues.blur}px) 
        sepia(${filterValues.sepia}%)
      `;
      
      ctx.drawImage(imgElement, 0, 0);
      setEditedImage(canvas.toDataURL());
    };
    
    imgElement.src = img;
  };

  const handleFilterChange = (filter, value) => {
    const newFilters = { ...filters, [filter]: value };
    setFilters(newFilters);
    applyFilters(image, newFilters);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="rounded-xl p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto border border-[rgb(var(--border))] bg-[rgb(var(--card))]">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold text-[rgb(var(--fg))]">Photo Editor</h3>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => onSave(editedImage)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Save
            </button>
            <button
              onClick={onCancel}
              className="px-4 py-2 border border-[rgb(var(--border))] rounded-lg hover:bg-[rgba(var(--fg),0.05)] text-[rgb(var(--fg))]"
            >
              Cancel
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Image Preview */}
          <div className="space-y-4">
            <div className="aspect-square rounded-lg overflow-hidden bg-[rgba(var(--fg),0.06)]">
              <img 
                src={editedImage} 
                alt="Edited"
                className="w-full h-full object-cover"
              />
            </div>
            
            {/* Quick Actions */}
            <div className="flex items-center space-x-2">
              <button className="flex items-center space-x-2 px-3 py-2 border border-[rgb(var(--border))] rounded-lg hover:bg-[rgba(var(--fg),0.05)]">
                <Crop className="w-4 h-4" />
                <span>Crop</span>
              </button>
              <button className="flex items-center space-x-2 px-3 py-2 border border-[rgb(var(--border))] rounded-lg hover:bg-[rgba(var(--fg),0.05)]">
                <RotateCw className="w-4 h-4" />
                <span>Rotate</span>
              </button>
              <button className="flex items-center space-x-2 px-3 py-2 border border-[rgb(var(--border))] rounded-lg hover:bg-[rgba(var(--fg),0.05)]">
                <Download className="w-4 h-4" />
                <span>Download</span>
              </button>
            </div>
          </div>

          {/* Filters Panel */}
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-[rgb(var(--fg))] mb-2">Brightness</label>
              <input
                type="range"
                min="0"
                max="200"
                value={filters.brightness}
                onChange={(e) => handleFilterChange('brightness', e.target.value)}
                className="w-full"
              />
              <div className="text-xs text-[rgba(var(--fg),0.6)]">{filters.brightness}%</div>
            </div>

            <div>
              <label className="block text-sm font-medium text-[rgb(var(--fg))] mb-2">Contrast</label>
              <input
                type="range"
                min="0"
                max="200"
                value={filters.contrast}
                onChange={(e) => handleFilterChange('contrast', e.target.value)}
                className="w-full"
              />
              <div className="text-xs text-[rgba(var(--fg),0.6)]">{filters.contrast}%</div>
            </div>

            <div>
              <label className="block text-sm font-medium text-[rgb(var(--fg))] mb-2">Saturation</label>
              <input
                type="range"
                min="0"
                max="200"
                value={filters.saturation}
                onChange={(e) => handleFilterChange('saturation', e.target.value)}
                className="w-full"
              />
              <div className="text-xs text-[rgba(var(--fg),0.6)]">{filters.saturation}%</div>
            </div>

            <div>
              <label className="block text-sm font-medium text-[rgb(var(--fg))] mb-2">Blur</label>
              <input
                type="range"
                min="0"
                max="10"
                value={filters.blur}
                onChange={(e) => handleFilterChange('blur', e.target.value)}
                className="w-full"
              />
              <div className="text-xs text-[rgba(var(--fg),0.6)]">{filters.blur}px</div>
            </div>

            <div>
              <label className="block text-sm font-medium text-[rgb(var(--fg))] mb-2">Sepia</label>
              <input
                type="range"
                min="0"
                max="100"
                value={filters.sepia}
                onChange={(e) => handleFilterChange('sepia', e.target.value)}
                className="w-full"
              />
              <div className="text-xs text-[rgba(var(--fg),0.6)]">{filters.sepia}%</div>
            </div>

            {/* Preset Filters */}
            <div>
              <label className="block text-sm font-medium text-[rgb(var(--fg))] mb-2">Preset Filters</label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { name: 'Original', filters: { brightness: 100, contrast: 100, saturation: 100, blur: 0, sepia: 0 }},
                  { name: 'Vintage', filters: { brightness: 90, contrast: 110, saturation: 80, blur: 0, sepia: 20 }},
                  { name: 'Bright', filters: { brightness: 120, contrast: 90, saturation: 110, blur: 0, sepia: 0 }},
                  { name: 'Dark', filters: { brightness: 80, contrast: 120, saturation: 90, blur: 0, sepia: 0 }}
                ].map((preset) => (
                  <button
                    key={preset.name}
                    onClick={() => {
                      setFilters(preset.filters);
                      applyFilters(image, preset.filters);
                    }}
                    className="px-3 py-2 text-sm border border-[rgb(var(--border))] rounded-lg hover:bg-[rgba(var(--fg),0.05)]"
                  >
                    {preset.name}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Product Form Component
const ProductForm = ({ product, onSave, onCancel, authFetch }) => {
  const [formData, setFormData] = useState({
    name: product?.name || '',
    description: product?.description || '',
    price: product?.price || '',
    stock: product?.stock || '',
    category: product?.category || '',
    status: product?.status || 'active',
    image: product?.image || null
  });

  const [showPhotoEditor, setShowPhotoEditor] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (file) {
      try {
        // Validate file type - support all common image formats
        const supportedTypes = [
          'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 
          'image/webp', 'image/bmp', 'image/svg+xml', 'image/tiff'
        ];
        
        const isValidType = supportedTypes.includes(file.type.toLowerCase()) || 
                           /\.(jpg|jpeg|png|gif|webp|bmp|svg|tiff)$/i.test(file.name);
        
        if (!isValidType) {
          alert('Unsupported file type. Supported formats: JPG, JPEG, PNG, GIF, WebP, BMP, SVG, TIFF');
          return;
        }
        
        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
          alert('Image size must be less than 5MB');
          return;
        }
        
        // Create FormData for file upload
        const formData = new FormData();
        formData.append('image', file);
        
        // Upload image to backend
        const response = await authFetch(API_ENDPOINTS.UPLOAD_PRODUCT_IMAGE, {
          method: 'POST',
          body: formData
        });
        
        if (response.ok) {
          const result = await response.json();
          console.log('✅ Image uploaded successfully:', result);
          
          // Update form data with the uploaded image URL
          setFormData(prev => ({ 
            ...prev, 
            image: result.imageUrl 
          }));
          
          // Show success message
          alert('Image uploaded successfully!');
        } else {
          const errorData = await response.json();
          console.error('❌ Image upload failed:', errorData);
          alert('Failed to upload image: ' + (errorData.error || 'Unknown error'));
        }
      } catch (error) {
        console.error('❌ Error uploading image:', error);
        alert('Failed to upload image: ' + error.message);
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="rounded-xl p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto border border-[rgb(var(--border))] bg-[rgb(var(--card))]">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold text-[rgb(var(--fg))]">
            {product ? 'Edit Product' : 'Add New Product'}
          </h3>
          <button
            onClick={onCancel}
            className="rounded-lg px-2 py-1 text-[rgba(var(--fg),0.6)] hover:bg-[rgba(var(--fg),0.05)]"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Product Image */}
          <div>
            <label className="block text-sm font-medium text-[rgb(var(--fg))] mb-2">Product Image</label>
            <div className="flex items-center space-x-4">
              <div className="w-24 h-24 rounded-lg overflow-hidden bg-[rgba(var(--fg),0.06)]">
                {formData.image ? (
                  <img src={formData.image} alt="Product" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <ImageIcon className="w-8 h-8 opacity-40" />
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <input
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/gif,image/webp,image/bmp,image/svg+xml,image/tiff,.jpg,.jpeg,.png,.gif,.webp,.bmp,.svg,.tiff"
                  onChange={handleImageUpload}
                  className="hidden"
                  id="image-upload"
                />
                <label
                  htmlFor="image-upload"
                  className="flex items-center space-x-2 px-4 py-2 border border-[rgb(var(--border))] rounded-lg hover:bg-[rgba(var(--fg),0.05)] cursor-pointer"
                >
                  <Upload className="w-4 h-4" />
                  <span>Upload Image</span>
                </label>
                {formData.image && (
                  <button
                    type="button"
                    onClick={() => setShowPhotoEditor(true)}
                    className="flex items-center space-x-2 px-4 py-2 text-blue-600 border border-blue-300 rounded-lg hover:bg-[rgba(37,99,235,0.12)]"
                  >
                    <Crop className="w-4 h-4" />
                    <span>Edit Image</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Product Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[rgb(var(--fg))] mb-2">Product Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-[rgb(var(--border))] focus:ring-2 focus:ring-blue-500 bg-[rgb(var(--card))] text-[rgb(var(--fg))]"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[rgb(var(--fg))] mb-2">Price (₹)</label>
              <input
                type="number"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-[rgb(var(--border))] focus:ring-2 focus:ring-blue-500 bg-[rgb(var(--card))] text-[rgb(var(--fg))]"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-[rgb(var(--fg))] mb-2">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 rounded-lg border border-[rgb(var(--border))] focus:ring-2 focus:ring-blue-500 bg-[rgb(var(--card))] text-[rgb(var(--fg))]"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-[rgb(var(--fg))] mb-2">Stock</label>
              <input
                type="number"
                value={formData.stock}
                onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-[rgb(var(--border))] focus:ring-2 focus:ring-blue-500 bg-[rgb(var(--card))] text-[rgb(var(--fg))]"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[rgb(var(--fg))] mb-2">Category</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-[rgb(var(--border))] focus:ring-2 focus:ring-blue-500 bg-[rgb(var(--card))] text-[rgb(var(--fg))]"
              >
                <option value="">Select Category</option>
                <option value="electronics">Electronics</option>
                <option value="clothing">Clothing</option>
                <option value="accessories">Accessories</option>
                <option value="home">Home & Garden</option>
                <option value="beauty">Beauty & Health</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-[rgb(var(--fg))] mb-2">Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-[rgb(var(--border))] focus:ring-2 focus:ring-blue-500 bg-[rgb(var(--card))] text-[rgb(var(--fg))]"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="draft">Draft</option>
              </select>
            </div>
          </div>

          <div className="flex items-center justify-end space-x-4 pt-6 border-t border-[rgb(var(--border))]">
            <button
              type="button"
              onClick={onCancel}
              className="px-6 py-2 rounded-lg border border-[rgb(var(--border))] hover:bg-[rgba(var(--fg),0.05)] text-[rgb(var(--fg))]"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              {product ? 'Update Product' : 'Create Product'}
            </button>
          </div>
        </form>

        {showPhotoEditor && (
          <PhotoEditor
            image={formData.image}
            onSave={(editedImage) => {
              setFormData({ ...formData, image: editedImage });
              setShowPhotoEditor(false);
            }}
            onCancel={() => setShowPhotoEditor(false)}
          />
        )}
      </div>
    </div>
  );
};

export default function Products() {
  const { authFetch } = useAuth();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [viewMode, setViewMode] = useState('grid');
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);

  // Fetch products from backend
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        
        console.log('🛍️ Fetching products from backend...');
        
        const response = await authFetch(API_ENDPOINTS.PRODUCTS, {
          headers: {
            'Content-Type': 'application/json'
          }
        });
        
        console.log('📦 Products API Response Status:', response.status);
        
        if (response.ok) {
          const productsData = await response.json();
          console.log('✅ Products fetched successfully:', productsData);
          
          // Transform backend data to match frontend expectations
          const transformedProducts = productsData.map(product => ({
            ...product,
            stock: product.stockQuantity, // Map 'stockQuantity' to 'stock'
            status: product.isActive ? 'active' : 'inactive', // Map 'isActive' to 'status'
            image: product.imageUrl // Map 'imageUrl' to 'image'
          }));
          
          setProducts(transformedProducts);
        } else {
          console.log('❌ Products API Failed:', response.status, await response.text());
          // Fallback to mock data if API fails
          setProducts([
            {
              id: 1,
              name: 'Premium Wireless Headphones',
              description: 'High-quality wireless headphones with noise cancellation',
              price: 2999,
              stock: 50,
              category: 'electronics',
              status: 'active',
              image: '/api/placeholder/300/300',
              rating: 4.5,
              sales: 25
            }
          ]);
        }
      } catch (error) {
        console.error('❌ Error fetching products:', error);
        // Fallback to mock data on error
        setProducts([
          {
            id: 1,
            name: 'Premium Wireless Headphones',
            description: 'High-quality wireless headphones with noise cancellation',
            price: 2999,
            stock: 50,
            category: 'electronics',
            status: 'active',
            image: '/api/placeholder/300/300',
            rating: 4.5,
            sales: 25
          }
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !filterCategory || product.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  const handleEdit = (product) => {
    setEditingProduct(product);
    setShowForm(true);
  };

  const handleDelete = async (product) => {
    if (window.confirm(`Are you sure you want to delete "${product.name}"?`)) {
      try {
        console.log('🗑️ Deleting product:', product.id);
        const response = await authFetch(`${API_ENDPOINTS.PRODUCTS}/${product.id}`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json'
          }
        });
        
        if (response.ok) {
          console.log('✅ Product deleted successfully');
          setProducts(products.filter(p => p.id !== product.id));
        } else {
          console.log('❌ Product deletion failed:', response.status, await response.text());
          // Fallback to local deletion
          setProducts(products.filter(p => p.id !== product.id));
        }
      } catch (error) {
        console.error('❌ Error deleting product:', error);
        // Fallback to local deletion
        setProducts(products.filter(p => p.id !== product.id));
      }
    }
  };

  const handleSave = async (productData) => {
    try {
      console.log('💾 Saving product...');
      
      if (editingProduct) {
        // Update existing product
        console.log('📝 Updating product:', editingProduct.id);
        // Transform frontend data to match backend DTO
        const backendData = {
          name: productData.name,
          description: productData.description,
          category: productData.category,
          price: productData.price,
          stockQuantity: productData.stock, // Map 'stock' to 'stockQuantity'
          imageUrl: productData.image
        };
        
        console.log('📝 Sending to backend:', backendData);
        
        const response = await authFetch(`${API_ENDPOINTS.PRODUCTS}/${editingProduct.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(backendData)
        });
        
        if (response.ok) {
          const updatedProduct = await response.json();
          console.log('✅ Product updated successfully:', updatedProduct);
          setProducts(products.map(p => 
            p.id === editingProduct.id ? updatedProduct : p
          ));
        } else {
          console.log('❌ Product update failed:', response.status, await response.text());
          // Fallback to local update
          setProducts(products.map(p => 
            p.id === editingProduct.id ? { ...p, ...productData } : p
          ));
        }
      } else {
        // Create new product
        console.log('➕ Creating new product...');
        
        // Transform frontend data to match backend DTO
        const backendData = {
          name: productData.name,
          description: productData.description,
          category: productData.category,
          price: productData.price,
          stockQuantity: productData.stock, // Map 'stock' to 'stockQuantity'
          imageUrl: productData.image
        };
        
        console.log('➕ Sending to backend:', backendData);
        
        const response = await authFetch(API_ENDPOINTS.PRODUCTS, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(backendData)
        });
        
        if (response.ok) {
          const newProduct = await response.json();
          console.log('✅ Product created successfully:', newProduct);
          setProducts([...products, newProduct]);
        } else {
          console.log('❌ Product creation failed:', response.status, await response.text());
          // Fallback to local creation
          const newProduct = {
            ...productData,
            id: Date.now(),
            rating: 0,
            sales: 0
          };
          setProducts([...products, newProduct]);
        }
      }
    } catch (error) {
      console.error('❌ Error saving product:', error);
      // Fallback to local save
      if (editingProduct) {
        setProducts(products.map(p => 
          p.id === editingProduct.id ? { ...p, ...productData } : p
        ));
      } else {
        const newProduct = {
          ...productData,
          id: Date.now(),
          rating: 0,
          sales: 0
        };
        setProducts([...products, newProduct]);
      }
    } finally {
      setShowForm(false);
      setEditingProduct(null);
    }
  };

  const handleView = (product) => {
    // Implement product view functionality
    console.log('Viewing product:', product);
  };

  return (
    <div className="min-h-screen bg-[rgb(var(--bg))] text-[rgb(var(--fg))] p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-[rgb(var(--fg))]">Product Management</h1>
              <p className="text-[rgba(var(--fg),0.7)] mt-2">Manage your product catalog with photos and details</p>
            </div>
            <button
              onClick={() => setShowForm(true)}
              className="flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-5 h-5" />
              <span>Add Product</span>
            </button>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-6 mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 opacity-50" />
                <input
                  type="text"
                  placeholder="Search products..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 rounded-lg border border-[rgb(var(--border))] focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-[rgb(var(--card))] text-[rgb(var(--fg))]"
                />
              </div>
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="px-4 py-2 rounded-lg border border-[rgb(var(--border))] focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-[rgb(var(--card))] text-[rgb(var(--fg))]"
              >
                <option value="">All Categories</option>
                <option value="electronics">Electronics</option>
                <option value="clothing">Clothing</option>
                <option value="accessories">Accessories</option>
                <option value="home">Home & Garden</option>
                <option value="beauty">Beauty & Health</option>
              </select>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-lg ${
                  viewMode === 'grid' 
                    ? 'bg-[rgba(37,99,235,0.12)] text-blue-600' 
                    : 'text-[rgba(var(--fg),0.6)] hover:bg-[rgba(var(--fg),0.05)]'
                }`}
              >
                <Grid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-lg ${
                  viewMode === 'list' 
                    ? 'bg-[rgba(37,99,235,0.12)] text-blue-600' 
                    : 'text-[rgba(var(--fg),0.6)] hover:bg-[rgba(var(--fg),0.05)]'
                }`}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Products Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        ) : (
          <div className={`grid gap-6 ${
            viewMode === 'grid' 
              ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' 
              : 'grid-cols-1'
          }`}>
            {filteredProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onView={handleView}
              />
            ))}
          </div>
        )}

        {filteredProducts.length === 0 && !loading && (
          <div className="text-center py-12">
            <Package className="w-12 h-12 mx-auto mb-4 opacity-30" />
            <h3 className="text-lg font-medium text-[rgb(var(--fg))] mb-2">No products found</h3>
            <p className="text-[rgba(var(--fg),0.6)]">Try adjusting your search or filter criteria</p>
          </div>
        )}

        {/* Product Form Modal */}
        {showForm && (
          <ProductForm
            product={editingProduct}
            onSave={handleSave}
            onCancel={() => {
              setShowForm(false);
              setEditingProduct(null);
            }}
            authFetch={authFetch}
          />
        )}
      </div>
    </div>
  );
}
