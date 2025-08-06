import { v2 as cloudinary } from 'cloudinary';
import { UploadedFile } from './types/database';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

// Upload result interface
export interface CloudinaryUploadResult {
  public_id: string;
  secure_url: string;
  url: string;
  width: number;
  height: number;
  format: string;
  bytes: number;
  resource_type: string;
  folder?: string;
  original_filename: string;
  created_at: string;
}

// Upload options
export interface UploadOptions {
  folder?: string;
  transformation?: any[];
  tags?: string[];
  context?: Record<string, string>;
  quality?: 'auto' | number;
  format?: 'auto' | 'jpg' | 'png' | 'webp';
  public_id?: string;
  overwrite?: boolean;
  unique_filename?: boolean;
}

// Predefined folders for organization
export const UPLOAD_FOLDERS = {
  PROPERTY_IMAGES: 'meet2rent/properties',
  USER_DOCUMENTS: 'meet2rent/documents',
  PROFILE_PHOTOS: 'meet2rent/profiles',
  MESSAGE_ATTACHMENTS: 'meet2rent/messages',
  SYSTEM: 'meet2rent/system',
} as const;

// Image transformations for different use cases
export const IMAGE_TRANSFORMATIONS = {
  PROPERTY_MAIN: [
    { width: 1200, height: 800, crop: 'fill', quality: 'auto', format: 'auto' },
  ],
  PROPERTY_THUMBNAIL: [
    { width: 400, height: 300, crop: 'fill', quality: 'auto', format: 'auto' },
  ],
  PROPERTY_GALLERY: [
    { width: 800, height: 600, crop: 'fill', quality: 'auto', format: 'auto' },
  ],
  PROFILE_AVATAR: [
    { width: 200, height: 200, crop: 'fill', gravity: 'face', quality: 'auto', format: 'auto' },
  ],
  DOCUMENT_PREVIEW: [
    { width: 600, height: 800, crop: 'fit', quality: 'auto', format: 'jpg' },
  ],
} as const;

// File validation
export const FILE_VALIDATION = {
  IMAGES: {
    maxSize: 10 * 1024 * 1024, // 10MB
    allowedTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
    maxCount: 20,
  },
  DOCUMENTS: {
    maxSize: 5 * 1024 * 1024, // 5MB
    allowedTypes: ['application/pdf', 'image/jpeg', 'image/png'],
    maxCount: 10,
  },
  PROFILE: {
    maxSize: 2 * 1024 * 1024, // 2MB
    allowedTypes: ['image/jpeg', 'image/png', 'image/webp'],
    maxCount: 1,
  },
} as const;

// Upload file to Cloudinary
export async function uploadFile(
  file: Buffer | string,
  options: UploadOptions = {}
): Promise<CloudinaryUploadResult> {
  try {
    const defaultOptions = {
      resource_type: 'auto' as const,
      quality: 'auto' as const,
      format: 'auto' as const,
      unique_filename: true,
      ...options,
    };

    const result = await cloudinary.uploader.upload(file as string, defaultOptions);

    return result as CloudinaryUploadResult;
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    throw new Error('Failed to upload file to Cloudinary');
  }
}

// Upload multiple files
export async function uploadMultipleFiles(
  files: Array<{ buffer: Buffer; filename: string; mimetype: string }>,
  options: UploadOptions = {}
): Promise<CloudinaryUploadResult[]> {
  try {
    const uploadPromises = files.map(async (file) => {
      const base64 = `data:${file.mimetype};base64,${file.buffer.toString('base64')}`;
      return uploadFile(base64, {
        ...options,
        original_filename: file.filename,
      });
    });

    return await Promise.all(uploadPromises);
  } catch (error) {
    console.error('Multiple upload error:', error);
    throw new Error('Failed to upload multiple files');
  }
}

// Upload property images with optimizations
export async function uploadPropertyImages(
  images: Array<{ buffer: Buffer; filename: string; mimetype: string }>,
  propertyId: string
): Promise<UploadedFile[]> {
  try {
    const uploadOptions: UploadOptions = {
      folder: `${UPLOAD_FOLDERS.PROPERTY_IMAGES}/${propertyId}`,
      transformation: IMAGE_TRANSFORMATIONS.PROPERTY_GALLERY,
      tags: ['property', propertyId],
      context: {
        property_id: propertyId,
        upload_type: 'property_image',
      },
    };

    const results = await uploadMultipleFiles(images, uploadOptions);

    return results.map((result) => ({
      id: result.public_id,
      fileName: result.original_filename,
      originalName: result.original_filename,
      mimeType: `image/${result.format}`,
      size: result.bytes,
      url: result.secure_url,
      publicId: result.public_id,
      folder: result.folder,
      uploadedAt: new Date(result.created_at),
    }));
  } catch (error) {
    console.error('Property images upload error:', error);
    throw new Error('Failed to upload property images');
  }
}

// Upload user documents
export async function uploadUserDocument(
  file: { buffer: Buffer; filename: string; mimetype: string },
  userId: string,
  documentType: string
): Promise<UploadedFile> {
  try {
    const base64 = `data:${file.mimetype};base64,${file.buffer.toString('base64')}`;

    const uploadOptions: UploadOptions = {
      folder: `${UPLOAD_FOLDERS.USER_DOCUMENTS}/${userId}`,
      tags: ['document', userId, documentType],
      context: {
        user_id: userId,
        document_type: documentType,
        upload_type: 'user_document',
      },
      public_id: `${userId}_${documentType}_${Date.now()}`,
    };

    // Apply document-specific transformations
    if (file.mimetype.startsWith('image/')) {
      uploadOptions.transformation = IMAGE_TRANSFORMATIONS.DOCUMENT_PREVIEW;
    }

    const result = await uploadFile(base64, uploadOptions);

    return {
      id: result.public_id,
      fileName: result.original_filename,
      originalName: result.original_filename,
      mimeType: file.mimetype,
      size: result.bytes,
      url: result.secure_url,
      publicId: result.public_id,
      folder: result.folder,
      uploadedAt: new Date(result.created_at),
    };
  } catch (error) {
    console.error('Document upload error:', error);
    throw new Error('Failed to upload document');
  }
}

// Upload profile photo
export async function uploadProfilePhoto(
  file: { buffer: Buffer; filename: string; mimetype: string },
  userId: string
): Promise<UploadedFile> {
  try {
    const base64 = `data:${file.mimetype};base64,${file.buffer.toString('base64')}`;

    const uploadOptions: UploadOptions = {
      folder: `${UPLOAD_FOLDERS.PROFILE_PHOTOS}`,
      transformation: IMAGE_TRANSFORMATIONS.PROFILE_AVATAR,
      tags: ['profile', userId],
      context: {
        user_id: userId,
        upload_type: 'profile_photo',
      },
      public_id: `profile_${userId}`,
      overwrite: true,
    };

    const result = await uploadFile(base64, uploadOptions);

    return {
      id: result.public_id,
      fileName: result.original_filename,
      originalName: result.original_filename,
      mimeType: file.mimetype,
      size: result.bytes,
      url: result.secure_url,
      publicId: result.public_id,
      folder: result.folder,
      uploadedAt: new Date(result.created_at),
    };
  } catch (error) {
    console.error('Profile photo upload error:', error);
    throw new Error('Failed to upload profile photo');
  }
}

// Delete file from Cloudinary
export async function deleteFile(publicId: string): Promise<boolean> {
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    return result.result === 'ok';
  } catch (error) {
    console.error('Cloudinary delete error:', error);
    throw new Error('Failed to delete file from Cloudinary');
  }
}

// Delete multiple files
export async function deleteMultipleFiles(publicIds: string[]): Promise<{ deleted: string[]; failed: string[] }> {
  try {
    const results = await Promise.allSettled(
      publicIds.map(publicId => cloudinary.uploader.destroy(publicId))
    );

    const deleted: string[] = [];
    const failed: string[] = [];

    results.forEach((result, index) => {
      if (result.status === 'fulfilled' && result.value.result === 'ok') {
        deleted.push(publicIds[index]);
      } else {
        failed.push(publicIds[index]);
      }
    });

    return { deleted, failed };
  } catch (error) {
    console.error('Multiple delete error:', error);
    throw new Error('Failed to delete multiple files');
  }
}

// Generate optimized URL with transformations
export function generateOptimizedUrl(
  publicId: string,
  transformations: any[] = []
): string {
  try {
    return cloudinary.url(publicId, {
      transformation: transformations,
      secure: true,
      quality: 'auto',
      format: 'auto',
    });
  } catch (error) {
    console.error('URL generation error:', error);
    return '';
  }
}

// Generate multiple size variants
export function generateImageVariants(publicId: string): Record<string, string> {
  return {
    thumbnail: generateOptimizedUrl(publicId, IMAGE_TRANSFORMATIONS.PROPERTY_THUMBNAIL),
    gallery: generateOptimizedUrl(publicId, IMAGE_TRANSFORMATIONS.PROPERTY_GALLERY),
    main: generateOptimizedUrl(publicId, IMAGE_TRANSFORMATIONS.PROPERTY_MAIN),
    original: generateOptimizedUrl(publicId, []),
  };
}

// Validate file before upload
export function validateFile(
  file: { size: number; mimetype: string },
  validationType: keyof typeof FILE_VALIDATION
): { isValid: boolean; errors: string[] } {
  const validation = FILE_VALIDATION[validationType];
  const errors: string[] = [];

  // Check file size
  if (file.size > validation.maxSize) {
    const maxSizeMB = Math.round(validation.maxSize / (1024 * 1024));
    errors.push(`File size must be less than ${maxSizeMB}MB`);
  }

  // Check file type
  if (!validation.allowedTypes.includes(file.mimetype)) {
    errors.push(`File type ${file.mimetype} is not allowed`);
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

// Validate multiple files
export function validateMultipleFiles(
  files: Array<{ size: number; mimetype: string }>,
  validationType: keyof typeof FILE_VALIDATION
): { isValid: boolean; errors: string[] } {
  const validation = FILE_VALIDATION[validationType];
  const errors: string[] = [];

  // Check file count
  if (files.length > validation.maxCount) {
    errors.push(`Maximum ${validation.maxCount} files allowed`);
  }

  // Validate each file
  files.forEach((file, index) => {
    const fileValidation = validateFile(file, validationType);
    if (!fileValidation.isValid) {
      errors.push(`File ${index + 1}: ${fileValidation.errors.join(', ')}`);
    }
  });

  return {
    isValid: errors.length === 0,
    errors,
  };
}

// Get file info from Cloudinary
export async function getFileInfo(publicId: string): Promise<CloudinaryUploadResult | null> {
  try {
    const result = await cloudinary.api.resource(publicId);
    return result as CloudinaryUploadResult;
  } catch (error) {
    console.error('Get file info error:', error);
    return null;
  }
}

// Search files by tags
export async function searchFilesByTags(
  tags: string[],
  options: { maxResults?: number; nextCursor?: string } = {}
): Promise<{ resources: CloudinaryUploadResult[]; nextCursor?: string }> {
  try {
    const result = await cloudinary.search
      .expression(`tags:${tags.join(' AND tags:')}`)
      .max_results(options.maxResults || 50)
      .next_cursor(options.nextCursor)
      .execute();

    return {
      resources: result.resources,
      nextCursor: result.next_cursor,
    };
  } catch (error) {
    console.error('Search files error:', error);
    throw new Error('Failed to search files');
  }
}

// Get folder contents
export async function getFolderContents(
  folder: string,
  options: { maxResults?: number; nextCursor?: string } = {}
): Promise<{ resources: CloudinaryUploadResult[]; nextCursor?: string }> {
  try {
    const result = await cloudinary.search
      .expression(`folder:${folder}`)
      .max_results(options.maxResults || 50)
      .next_cursor(options.nextCursor)
      .sort_by([['created_at', 'desc']])
      .execute();

    return {
      resources: result.resources,
      nextCursor: result.next_cursor,
    };
  } catch (error) {
    console.error('Get folder contents error:', error);
    throw new Error('Failed to get folder contents');
  }
}

// Cleanup old files (for maintenance)
export async function cleanupOldFiles(
  folder: string,
  olderThanDays: number = 30
): Promise<{ deleted: number; errors: string[] }> {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

    const result = await cloudinary.search
      .expression(`folder:${folder} AND created_at<${cutoffDate.toISOString()}`)
      .max_results(500)
      .execute();

    if (result.resources.length === 0) {
      return { deleted: 0, errors: [] };
    }

    const publicIds = result.resources.map((resource: any) => resource.public_id);
    const deleteResult = await deleteMultipleFiles(publicIds);

    return {
      deleted: deleteResult.deleted.length,
      errors: deleteResult.failed,
    };
  } catch (error) {
    console.error('Cleanup error:', error);
    throw new Error('Failed to cleanup old files');
  }
}

// Export cloudinary instance
export { cloudinary };

export default {
  uploadFile,
  uploadMultipleFiles,
  uploadPropertyImages,
  uploadUserDocument,
  uploadProfilePhoto,
  deleteFile,
  deleteMultipleFiles,
  generateOptimizedUrl,
  generateImageVariants,
  validateFile,
  validateMultipleFiles,
  getFileInfo,
  searchFilesByTags,
  getFolderContents,
  cleanupOldFiles,
};
