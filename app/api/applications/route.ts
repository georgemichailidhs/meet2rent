import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';
import { db } from '@/lib/database/config';
import { applications, properties, users } from '@/lib/database/schema';
import { eq, and } from 'drizzle-orm';
import { queueEmail, NotificationType } from '@/lib/notifications';

// Get applications for user
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const userType = searchParams.get('userType'); // 'tenant' | 'landlord'
    const propertyId = searchParams.get('propertyId');

    // Build query conditions
    const conditions = [];

    if (userType === 'landlord') {
      conditions.push(eq(applications.landlordId, session.user.id));
    } else {
      conditions.push(eq(applications.tenantId, session.user.id));
    }

    if (status) {
      conditions.push(eq(applications.status, status as any));
    }

    if (propertyId) {
      conditions.push(eq(applications.propertyId, propertyId));
    }

    // Get applications with related data
    const userApplications = await db
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
        property: {
          id: properties.id,
          title: properties.title,
          address: properties.address,
          city: properties.city,
          monthlyRent: properties.monthlyRent,
          securityDeposit: properties.securityDeposit,
          mainImage: properties.mainImage,
        },
        applicant: {
          id: users.id,
          name: users.name,
          email: users.email,
          phone: users.phone,
        },
      })
      .from(applications)
      .leftJoin(properties, eq(applications.propertyId, properties.id))
      .leftJoin(users, userType === 'landlord'
        ? eq(applications.tenantId, users.id)
        : eq(applications.landlordId, users.id)
      )
      .where(conditions.length > 0 ? conditions.reduce((acc, condition) => and(acc, condition)) : undefined)
      .orderBy(applications.createdAt);

    return NextResponse.json({
      success: true,
      data: {
        applications: userApplications,
      },
    });

  } catch (error) {
    console.error('Get applications error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch applications' },
      { status: 500 }
    );
  }
}
