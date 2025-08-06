import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';
import { uploadUserDocument, validateFile } from '@/lib/cloudinary';

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
    const file = formData.get('document') as File;
    const documentType = formData.get('documentType') as string;

    if (!file) {
      return NextResponse.json(
        { error: 'No document provided' },
        { status: 400 }
      );
    }

    if (!documentType) {
      return NextResponse.json(
        { error: 'Document type is required' },
        { status: 400 }
      );
    }

    // Validate document type
    const validDocumentTypes = [
      'id_card',
      'passport',
      'income_proof',
      'employment_letter',
      'bank_statement',
      'guarantor_document',
      'property_deed',
      'business_registration'
    ];

    if (!validDocumentTypes.includes(documentType)) {
      return NextResponse.json(
        { error: 'Invalid document type' },
        { status: 400 }
      );
    }

    // Validate file
    const validation = validateFile(
      { size: file.size, mimetype: file.type },
      'DOCUMENTS'
    );

    if (!validation.isValid) {
      return NextResponse.json(
        {
          error: 'File validation failed',
          details: validation.errors
        },
        { status: 400 }
      );
    }

    // Convert file to buffer format
    const processedFile = {
      buffer: Buffer.from(await file.arrayBuffer()),
      filename: file.name,
      mimetype: file.type,
    };

    // Upload to Cloudinary
    const uploadedFile = await uploadUserDocument(
      processedFile,
      session.user.id,
      documentType
    );

    // TODO: Save document record to database with verification status
    // TODO: Send notification to admin for verification

    return NextResponse.json({
      success: true,
      data: {
        file: uploadedFile,
        documentType,
        verificationStatus: 'pending',
      },
    });

  } catch (error) {
    console.error('Document upload error:', error);
    return NextResponse.json(
      { error: 'Failed to upload document' },
      { status: 500 }
    );
  }
}

// Get user documents
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // TODO: Get user documents from database
    // For now, return empty array
    const documents: any[] = [];

    return NextResponse.json({
      success: true,
      data: { documents },
    });

  } catch (error) {
    console.error('Get user documents error:', error);
    return NextResponse.json(
      { error: 'Failed to get user documents' },
      { status: 500 }
    );
  }
}
