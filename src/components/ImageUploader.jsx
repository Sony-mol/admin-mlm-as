import React, { useState, useRef } from 'react';
import { Upload, X, Image as ImageIcon, Loader2, Check, AlertCircle, Eye, Trash2 } from 'lucide-react';
import CloudinaryService from '../services/cloudinaryService';

const ImageUploader = ({ 
  onImageUploaded, 
  currentImageUrl, 
  productName = 'product',
  disabled = false 
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(currentImageUrl);
  const [showPreview, setShowPreview] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileSelect = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    await uploadImage(file);
  };

  const uploadImage = async (file) => {
    setIsUploading(true);
    setUploadError(null);
    setUploadSuccess(false);
    setUploadProgress(0);

    try {
      // Show preview immediately
      const preview = URL.createObjectURL(file);
      setPreviewUrl(preview);

      // Simulate progress (Cloudinary doesn't provide real progress)
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      // Upload to Cloudinary
      const result = await CloudinaryService.uploadImage(file, productName);

      clearInterval(progressInterval);
      setUploadProgress(100);

      if (result.success) {
        setPreviewUrl(result.url);
        setUploadSuccess(true);
        onImageUploaded && onImageUploaded(result.url, result.publicId);
        
        // Reset success state after 3 seconds
        setTimeout(() => setUploadSuccess(false), 3000);
      } else {
        throw new Error(result.error);
      }

    } catch (error) {
      console.error('Upload error:', error);
      setUploadError(error.message);
      setPreviewUrl(currentImageUrl); // Revert to current image
    } finally {
      setIsUploading(false);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      uploadImage(files[0]);
    }
  };

  const clearImage = () => {
    setPreviewUrl(null);
    setUploadError(null);
    setUploadSuccess(false);
    onImageUploaded && onImageUploaded(null);
  };

  const openFileDialog = () => {
    if (!disabled) {
      fileInputRef.current?.click();
    }
  };

  return (
    <div className="space-y-4">
      {/* Upload Area */}
      <div
        className={`relative border-2 border-dashed rounded-lg p-6 transition-all duration-200 ${
          disabled 
            ? 'border-gray-300 bg-gray-50 cursor-not-allowed' 
            : 'border-blue-300 bg-blue-50 hover:border-blue-400 hover:bg-blue-100 cursor-pointer'
        } ${uploadSuccess ? 'border-green-300 bg-green-50' : ''} ${uploadError ? 'border-red-300 bg-red-50' : ''}`}
        onDragOver={handleDragOver}
        onDragEnter={handleDragEnter}
        onDrop={handleDrop}
        onClick={openFileDialog}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
          onChange={handleFileSelect}
          className="hidden"
          disabled={disabled}
        />

        <div className="text-center">
          {isUploading ? (
            <div className="space-y-3">
              <Loader2 className="w-8 h-8 mx-auto animate-spin text-blue-500" />
              <div className="text-sm text-gray-600">Uploading...</div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
              <div className="text-xs text-gray-500">{uploadProgress}%</div>
            </div>
          ) : uploadSuccess ? (
            <div className="space-y-2">
              <Check className="w-8 h-8 mx-auto text-green-500" />
              <div className="text-sm text-green-600">Upload successful!</div>
            </div>
          ) : uploadError ? (
            <div className="space-y-2">
              <AlertCircle className="w-8 h-8 mx-auto text-red-500" />
              <div className="text-sm text-red-600">Upload failed</div>
              <div className="text-xs text-red-500">{uploadError}</div>
            </div>
          ) : previewUrl ? (
            <div className="space-y-2">
              <ImageIcon className="w-8 h-8 mx-auto text-blue-500" />
              <div className="text-sm text-blue-600">Click to change image</div>
            </div>
          ) : (
            <div className="space-y-2">
              <Upload className="w-8 h-8 mx-auto text-gray-400" />
              <div className="text-sm text-gray-600">Drop image here or click to upload</div>
              <div className="text-xs text-gray-500">JPG, PNG, GIF, WebP (max 10MB)</div>
            </div>
          )}
        </div>
      </div>

      {/* Preview and Actions */}
      {previewUrl && (
        <div className="space-y-3">
          {/* Image Preview */}
          <div className="relative group">
            <img
              src={previewUrl}
              alt="Product preview"
              className="w-full h-48 object-cover rounded-lg border border-gray-200"
            />
            
            {/* Overlay Actions */}
            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-200 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100">
              <div className="flex space-x-2">
                <button
                  onClick={() => setShowPreview(true)}
                  className="p-2 bg-white bg-opacity-90 hover:bg-opacity-100 rounded-full transition-all duration-200"
                  title="Preview full size"
                >
                  <Eye className="w-4 h-4 text-gray-700" />
                </button>
                {!disabled && (
                  <button
                    onClick={clearImage}
                    className="p-2 bg-white bg-opacity-90 hover:bg-opacity-100 rounded-full transition-all duration-200"
                    title="Remove image"
                  >
                    <Trash2 className="w-4 h-4 text-red-600" />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Image Info */}
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>Current image</span>
            <span className="flex items-center space-x-1">
              <ImageIcon className="w-3 h-3" />
              <span>400×400 optimized</span>
            </span>
          </div>
        </div>
      )}

      {/* Full Size Preview Modal */}
      {showPreview && previewUrl && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
          <div className="relative max-w-4xl max-h-full p-4">
            <img
              src={previewUrl}
              alt="Full size preview"
              className="max-w-full max-h-full object-contain rounded-lg"
            />
            <button
              onClick={() => setShowPreview(false)}
              className="absolute top-4 right-4 p-2 bg-white bg-opacity-90 hover:bg-opacity-100 rounded-full"
            >
              <X className="w-5 h-5 text-gray-700" />
            </button>
          </div>
        </div>
      )}

      {/* Upload Tips */}
      {!previewUrl && (
        <div className="text-xs text-gray-500 space-y-1">
          <div>💡 <strong>Tips:</strong></div>
          <div>• Use high-quality images for better results</div>
          <div>• Recommended size: 800×800px or larger</div>
          <div>• Images will be automatically optimized</div>
        </div>
      )}
    </div>
  );
};

export default ImageUploader;
