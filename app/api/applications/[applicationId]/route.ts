import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';
import { db } from '@/lib/database/config';
import { applications, properties, users } from '@/lib/database/schema';
import { eq } from 'drizzle-orm';
import { queueEmail, NotificationType } from '@/lib/notifications';

interface RouteContext {
  params: {
    applicationId: string;
  };
}

// Get specific application
export async function GET(request: NextRequest, { params }: RouteContext) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const applicationId = params.applicationId;

    // Get application with related data
    const application = await db
      .select({
        id: applications.id,
        status: applications.status,
        moveInDate: applications.moveInDate,
        leaseDuration: applications.leaseDuration,
        monthlyIncome: applications.monthlyIncome,
        hasGuarantor: applications.hasGuarantor,
        guarantorInfo: applications.guarantorInfo,
        previousRentalHistory: applications.previousRentalHistory,
        references: applications.references,
        coverLetter: applications.coverLetter,
        additionalInfo: applications.additionalInfo,
        reviewedAt: applications.reviewedAt,
        approvedAt: applications.approvedAt,
        rejectedAt: applications.rejectedAt,
        rejectionReason: applications.rejectionReason,
        createdAt: applications.createdAt,
        tenantId: applications.tenantId,
        landlordId: applications.landlordId,
        propertyId: applications.propertyId,
        property: {
          id: properties.id,
          title: properties.title,
          address: properties.address,
          city: properties.city,
          monthlyRent: properties.monthlyRent,
          securityDeposit: properties.securityDeposit,
          mainImage: properties.mainImage,
        },
        tenant: {
          id: users.id,
          name: users.name,
          email: users.email,
          phone: users.phone,
        },
      })
      .from(applications)
      .leftJoin(properties, eq(applications.propertyId, properties.id))
      .leftJoin(users, eq(applications.tenantId, users.id))
      .where(eq(applications.id, applicationId))
      .limit(1);

    if (!application[0]) {
      return NextResponse.json(
        { error: 'Application not found' },
        { status: 404 }
      );
    }

    // Check if user has access to this application
    if (application[0].tenantId !== session.user.id && application[0].landlordId !== session.user.id) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    // Get landlord info separately if user is tenant
    let landlord = null;
    if (application[0].tenantId === session.user.id) {
      const landlordData = await db
        .select({
          id: users.id,
          name: users.name,
          email: users.email,
        })
        .from(users)
        .where(eq(users.id, application[0].landlordId))
        .limit(1);
      landlord = landlordData[0] || null;
    }

    return NextResponse.json({
      success: true,
      data: {
        application: {
          ...application[0],
          landlord,
        },
      },
    });

  } catch (error) {
    console.error('Get application error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch application' },
      { status: 500 }
    );
  }
}

// Update application (approve/reject)
export async function PATCH(request: NextRequest, { params }: RouteContext) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const applicationId = params.applicationId;
    const body = await request.json();
    const { action, rejectionReason, nextSteps } = body;

    // Get application
    const application = await db
      .select()
      .from(applications)
      .where(eq(applications.id, applicationId))
      .limit(1);

    if (!application[0]) {
      return NextResponse.json(
        { error: 'Application not found' },
        { status: 404 }
      );
    }

    // Only landlord can approve/reject applications
    if (application[0].landlordId !== session.user.id) {
      return NextResponse.json(
        { error: 'Only the landlord can approve or reject applications' },
        { status: 403 }
      );
    }

    // Check if application is in valid state for this action
    if (application[0].status !== 'submitted' && application[0].status !== 'under_review') {
      return NextResponse.json(
        { error: 'Application is not in a valid state for this action' },
        { status: 400 }
      );
    }

    let updateData: any = {
      reviewedAt: new Date(),
    };

    if (action === 'approve') {
      updateData.status = 'approved';
      updateData.approvedAt = new Date();
    } else if (action === 'reject') {
      if (!rejectionReason) {
        return NextResponse.json(
          { error: 'Rejection reason is required' },
          { status: 400 }
        );
      }
      updateData.status = 'rejected';
      updateData.rejectedAt = new Date();
      updateData.rejectionReason = rejectionReason;
    } else if (action === 'review') {
      updateData.status = 'under_review';
    } else {
      return NextResponse.json(
        { error: 'Invalid action' },
        { status: 400 }
      );
    }

    // Update application
    const updatedApplication = await db
      .update(applications)
      .set(updateData)
      .where(eq(applications.id, applicationId))
      .returning();

    // Get related data for notifications
    const [property, tenant, landlord] = await Promise.all([
      db.select().from(properties).where(eq(properties.id, application[0].propertyId)).limit(1),
      db.select().from(users).where(eq(users.id, application[0].tenantId)).limit(1),
      db.select().from(users).where(eq(users.id, application[0].landlordId)).limit(1)
    ]);

    // Send notification emails
    try {
      if (action === 'approve') {
        await queueEmail(
          NotificationType.APPLICATION_ACCEPTED,
          tenant[0].email!,
          tenant[0].name!,
          {
            propertyTitle: property[0].title,
            landlordName: landlord[0].name,
            nextSteps: nextSteps || 'We will send you the rental contract shortly. Please review and sign it to complete the rental process.',
            moveInDate: application[0].moveInDate?.toLocaleDateString(),
            monthlyRent: property[0].monthlyRent,
          },
          { priority: 'high', language: 'en' }
        );
      } else if (action === 'reject') {
        await queueEmail(
          NotificationType.APPLICATION_REJECTED,
          tenant[0].email!,
          tenant[0].name!,
          {
            propertyTitle: property[0].title,
            landlordName: landlord[0].name,
            rejectionReason: rejectionReason,
          },
          { priority: 'high', language: 'en' }
        );
      }
    } catch (emailError) {
      console.error('Failed to send application status notification:', emailError);
    }

    return NextResponse.json({
      success: true,
      data: {
        application: updatedApplication[0],
        message: `Application ${action}d successfully`,
      },
    });

  } catch (error) {
    console.error('Application update error:', error);
    return NextResponse.json(
      { error: 'Failed to update application' },
      { status: 500 }
    );
  }
}
