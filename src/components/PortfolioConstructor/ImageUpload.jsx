import { useState, useEffect } from 'react';
import { portfolioAPI } from '../../services/portfolioAPI';

/**
 * Image Upload Component
 * Handles image upload from device with preview and upload to server
 */
const ImageUpload = ({
  value = '',
  onChange,
  label = 'Upload Image',
  accept = 'image/*',
  maxSize = 5 * 1024 * 1024, // 5MB default
  aspectRatio = null, // e.g., '16/9' or null for any
  recommendedSize = null, // e.g., '1200x630'
  onUploadProgress = null,
}) => {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState(value || '');
  const [error, setError] = useState('');

  const handleFileSelect = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file');
      return;
    }

    // Validate file size
    if (file.size > maxSize) {
      setError(`File size must be less than ${(maxSize / 1024 / 1024).toFixed(1)}MB`);
      return;
    }

    setError('');
    setUploading(true);

    // Create preview
    const previewUrl = URL.createObjectURL(file);
    setPreview(previewUrl);

    try {
      // Upload to server
      let uploadResponse;
      let uploadError = null;
      
      try {
        // Try portfolio logo upload endpoint
        uploadResponse = await portfolioAPI.uploadLogo(file, (progress) => {
          if (onUploadProgress) {
            onUploadProgress(progress);
          }
        });
        console.log('Logo upload response:', uploadResponse);
      } catch (logoError) {
        console.warn('Logo upload failed, trying certificate upload:', logoError);
        uploadError = logoError;
        
        // If logo upload fails, try certificate upload
        try {
          uploadResponse = await portfolioAPI.uploadCertificate(file, (progress) => {
            if (onUploadProgress) {
              onUploadProgress(progress);
            }
          });
          console.log('Certificate upload response:', uploadResponse);
        } catch (certError) {
          // If both fail, show detailed error
          console.error('Both upload methods failed:', { logoError, certError });
          const errorMessage = 
            certError.response?.data?.message || 
            certError.message || 
            logoError.response?.data?.message || 
            logoError.message || 
            'Connection failed. Please try again.';
          setError(errorMessage);
          setUploading(false);
          return;
        }
      }

      // Handle different response formats
      // Check response structure: response.data might be the API response object
      const responseData = uploadResponse?.data || uploadResponse;
      
      const imageUrl =
        responseData?.data?.fileUrl || // API response: { success: true, data: { fileUrl: ... } }
        responseData?.data?.logoUrl ||
        responseData?.data?.certificateUrl ||
        responseData?.data?.url ||
        responseData?.fileUrl || // Direct response: { fileUrl: ... }
        responseData?.logoUrl ||
        responseData?.certificateUrl ||
        responseData?.url ||
        uploadResponse?.fileUrl ||
        uploadResponse?.logoUrl ||
        uploadResponse?.certificateUrl ||
        uploadResponse?.url;

      if (imageUrl) {
        // Clean up old preview URL
        if (preview && preview.startsWith('blob:')) {
          URL.revokeObjectURL(preview);
        }
        setPreview(imageUrl);
        onChange(imageUrl);
      } else {
        console.error('Upload response:', uploadResponse);
        throw new Error('Upload failed: No URL returned. Check console for details.');
      }
    } catch (uploadError) {
      console.error('Image upload error:', uploadError);
      setError(uploadError.response?.data?.message || uploadError.message || 'Failed to upload image. You can enter the URL manually.');
      // Keep preview for manual URL entry
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = () => {
    // Clean up blob URL if exists
    if (preview && preview.startsWith('blob:')) {
      URL.revokeObjectURL(preview);
    }
    setPreview('');
    onChange('');
    setError('');
  };

  const handleUrlChange = (e) => {
    const url = e.target.value;
    setPreview(url);
    if (url) {
      onChange(url);
    }
  };

  // Update preview when value prop changes externally
  useEffect(() => {
    if (value && value !== preview) {
      // Clean up old blob URL if exists
      if (preview && preview.startsWith('blob:')) {
        URL.revokeObjectURL(preview);
      }
      setPreview(value);
    }
  }, [value]);

  return (
    <div className="image-upload">
      <label>{label}</label>
      
      {error && (
        <div
          style={{
            padding: '0.75rem',
            backgroundColor: 'var(--error, rgba(255, 68, 68, 0.1))',
            color: 'var(--error, #cc0000)',
            borderRadius: '4px',
            marginBottom: '0.5rem',
            fontSize: '0.875rem',
          }}
        >
          {error}
        </div>
      )}

      <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start', flexWrap: 'wrap' }}>
        <div style={{ flex: '1 1 300px' }}>
          <div style={{ marginBottom: '0.5rem' }}>
            <input
              type="file"
              accept={accept}
              onChange={handleFileSelect}
              disabled={uploading}
              style={{
                width: '100%',
                padding: '0.5rem',
                border: '1px solid var(--border)',
                borderRadius: '4px',
                backgroundColor: 'var(--bg-primary)',
                color: 'var(--text-primary)',
                cursor: uploading ? 'not-allowed' : 'pointer',
              }}
            />
          </div>
          <input
            type="text"
            value={preview}
            onChange={handleUrlChange}
            placeholder="Or enter image URL directly"
            disabled={uploading}
            style={{
              width: '100%',
              padding: '0.5rem',
              border: '1px solid var(--border)',
              borderRadius: '4px',
              backgroundColor: 'var(--bg-primary)',
              color: 'var(--text-primary)',
            }}
          />
        </div>

        {preview && (
          <div
            style={{
              position: 'relative',
              width: '150px',
              height: '150px',
              border: '1px solid var(--border)',
              borderRadius: '8px',
              overflow: 'hidden',
              backgroundColor: 'var(--bg-secondary)',
            }}
          >
            <img
              src={preview}
              alt="Preview"
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
              }}
              onError={() => {
                setError('Failed to load image. Please check the URL.');
              }}
            />
            <button
              type="button"
              onClick={handleRemove}
              style={{
                position: 'absolute',
                top: '0.25rem',
                right: '0.25rem',
                backgroundColor: 'var(--error)',
                color: 'white',
                border: 'none',
                borderRadius: '50%',
                width: '24px',
                height: '24px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.875rem',
              }}
            >
              ×
            </button>
          </div>
        )}
      </div>

      {uploading && (
        <div style={{ marginTop: '0.5rem' }}>
          <div
            style={{
              width: '100%',
              height: '4px',
              backgroundColor: 'var(--bg-tertiary)',
              borderRadius: '2px',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                width: '100%',
                height: '100%',
                backgroundColor: 'var(--accent)',
                animation: 'pulse 1.5s ease-in-out infinite',
              }}
            />
          </div>
          <small style={{ color: 'var(--text-secondary)' }}>Uploading...</small>
        </div>
      )}

      {recommendedSize && (
        <small style={{ display: 'block', marginTop: '0.5rem', color: 'var(--text-secondary)' }}>
          Recommended size: {recommendedSize}
        </small>
      )}
    </div>
  );
};

export default ImageUpload;

