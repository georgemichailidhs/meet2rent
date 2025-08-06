import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';
import { uploadPropertyImages, validateMultipleFiles } from '@/lib/cloudinary';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get form data
    const formData = await request.formData();
    const files = formData.getAll('images') as File[];
    const propertyId = formData.get('propertyId') as string;

    if (!propertyId) {
      return NextResponse.json(
        { error: 'Property ID is required' },
        { status: 400 }
      );
    }

    if (!files || files.length === 0) {
      return NextResponse.json(
        { error: 'No images provided' },
        { status: 400 }
      );
    }

    // Validate files
    const fileData = files.map(file => ({
      size: file.size,
      mimetype: file.type,
    }));

    const validation = validateMultipleFiles(fileData, 'IMAGES');
    if (!validation.isValid) {
      return NextResponse.json(
        {
          error: 'File validation failed',
          details: validation.errors
        },
        { status: 400 }
      );
    }

    // Convert files to buffer format
    const processedFiles = await Promise.all(
      files.map(async (file) => ({
        buffer: Buffer.from(await file.arrayBuffer()),
        filename: file.name,
        mimetype: file.type,
      }))
    );

    // Upload to Cloudinary
    const uploadedFiles = await uploadPropertyImages(processedFiles, propertyId);

    // TODO: Save file records to database
    // TODO: Update property with new image URLs

    return NextResponse.json({
      success: true,
      data: {
        files: uploadedFiles,
        count: uploadedFiles.length,
      },
    });

  } catch (error) {
    console.error('Property images upload error:', error);
    return NextResponse.json(
      { error: 'Failed to upload images' },
      { status: 500 }
    );
  }
}

// Get property images
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const propertyId = searchParams.get('propertyId');

    if (!propertyId) {
      return NextResponse.json(
        { error: 'Property ID is required' },
        { status: 400 }
      );
    }

    // TODO: Get property images from database
    // For now, return empty array
    const images: any[] = [];

    return NextResponse.json({
      success: true,
      data: { images },
    });

  } catch (error) {
    console.error('Get property images error:', error);
    return NextResponse.json(
      { error: 'Failed to get property images' },
      { status: 500 }
    );
  }
}
