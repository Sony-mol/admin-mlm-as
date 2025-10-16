// Cloudinary Image Upload Service
// Handles reliable cloud storage for product images

const CLOUDINARY_CLOUD_NAME = 'dbwdqllsa'; // Your Cloudinary cloud name
const CLOUDINARY_UPLOAD_PRESET = 'mlm-products'; // Your upload preset

class CloudinaryService {
  static async uploadImage(file, productName = 'product') {
    try {
      console.log('📤 Uploading image to Cloudinary:', file.name);
      
      // Validate file
      if (!file || file.size === 0) {
        throw new Error('No file provided');
      }

      // Check file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        throw new Error('File size must be less than 10MB');
      }

      // Check file type
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        throw new Error('Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed');
      }

      // Create form data
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
      formData.append('folder', 'mlm-products'); // Organize images in a folder
      formData.append('public_id', `${productName.replace(/[^a-zA-Z0-9]/g, '-')}-${Date.now()}`); // Safe unique ID
      // Note: Transformation is handled by the upload preset, not in the request

      // Upload to Cloudinary
      const response = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`, {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Cloudinary upload error details:', {
          status: response.status,
          statusText: response.statusText,
          errorText: errorText,
          uploadPreset: CLOUDINARY_UPLOAD_PRESET,
          cloudName: CLOUDINARY_CLOUD_NAME
        });
        throw new Error(`Upload failed: ${response.statusText} - ${errorText}`);
      }

      const result = await response.json();
      
      console.log('✅ Image uploaded successfully:', result.secure_url);
      
      return {
        success: true,
        url: result.secure_url,
        publicId: result.public_id,
        width: result.width,
        height: result.height,
        size: result.bytes
      };

    } catch (error) {
      console.error('❌ Cloudinary upload error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  static async deleteImage(publicId) {
    try {
      console.log('🗑️ Deleting image from Cloudinary:', publicId);
      
      const response = await fetch(`/api/products/delete-image/${publicId}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error(`Delete failed: ${response.statusText}`);
      }

      console.log('✅ Image deleted successfully');
      return { success: true };

    } catch (error) {
      console.error('❌ Cloudinary delete error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  static generateOptimizedUrl(originalUrl, options = {}) {
    const {
      width = 400,
      height = 400,
      quality = 'auto',
      format = 'auto'
    } = options;

    if (!originalUrl || !originalUrl.includes('cloudinary.com')) {
      return originalUrl;
    }

    // Extract cloud name and public ID from URL
    const urlParts = originalUrl.split('/');
    const cloudNameIndex = urlParts.findIndex(part => part.includes('cloudinary.com')) + 1;
    const publicIdIndex = cloudNameIndex + 2;
    
    if (cloudNameIndex < urlParts.length && publicIdIndex < urlParts.length) {
      const cloudName = urlParts[cloudNameIndex];
      const publicId = urlParts[publicIdIndex].replace(/\.[^/.]+$/, ''); // Remove extension
      
      return `https://res.cloudinary.com/${cloudName}/image/upload/w_${width},h_${height},c_fill,f_${format},q_${quality}/${publicId}`;
    }

    return originalUrl;
  }
}

export default CloudinaryService;
