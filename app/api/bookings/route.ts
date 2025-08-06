import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';
import { db } from '@/lib/database/config';
import { bookings, applications, properties, users } from '@/lib/database/schema';
import { eq } from 'drizzle-orm';
import { queueEmail, NotificationType } from '@/lib/notifications';
import { ApplicationFormData } from '@/lib/types/database';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const formData: ApplicationFormData = body;

    // Validate required fields
    if (!formData.propertyId) {
      return NextResponse.json(
        { error: 'Property ID is required' },
        { status: 400 }
      );
    }

    // Get property and landlord information
    const property = await db
      .select({
        id: properties.id,
        title: properties.title,
        landlordId: properties.landlordId,
        monthlyRent: properties.monthlyRent,
        minimumStayMonths: properties.minimumStayMonths,
        status: properties.status,
      })
      .from(properties)
      .where(eq(properties.id, formData.propertyId))
      .limit(1);

    if (!property[0]) {
      return NextResponse.json(
        { error: 'Property not found' },
        { status: 404 }
      );
    }

    if (property[0].status !== 'available') {
      return NextResponse.json(
        { error: 'Property is not available for booking' },
        { status: 400 }
      );
    }

    // Get landlord information
    const landlord = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
      })
      .from(users)
      .where(eq(users.id, property[0].landlordId))
      .limit(1);

    if (!landlord[0]) {
      return NextResponse.json(
        { error: 'Landlord not found' },
        { status: 404 }
      );
    }

    // Get tenant information
    const tenant = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
      })
      .from(users)
      .where(eq(users.id, session.user.id))
      .limit(1);

    if (!tenant[0]) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    if (formData.type === 'viewing') {
      // Handle viewing booking
      if (!formData.viewingDate || !formData.viewingTime) {
        return NextResponse.json(
          { error: 'Viewing date and time are required' },
          { status: 400 }
        );
      }

      // Create booking record
      const newBooking = await db.insert(bookings).values({
        propertyId: formData.propertyId,
        tenantId: session.user.id,
        landlordId: property[0].landlordId,
        type: 'viewing',
        status: 'pending',
        viewingDate: formData.viewingDate,
        viewingTime: formData.viewingTime,
        message: formData.message || null,
      }).returning();

      // Send notification email to landlord
      try {
        await queueEmail(
          NotificationType.BOOKING_REQUEST,
          landlord[0].email,
          landlord[0].name,
          {
            propertyTitle: property[0].title,
            requestedDate: formData.viewingDate.toLocaleDateString(),
            viewingTime: formData.viewingTime,
            tenantName: tenant[0].name,
            tenantMessage: formData.message,
          },
          {
            priority: 'high',
            language: 'en', // TODO: Detect user language preference
          }
        );
      } catch (emailError) {
        console.error('Failed to send booking notification email:', emailError);
        // Don't fail the request if email fails
      }

      return NextResponse.json({
        success: true,
        data: {
          booking: newBooking[0],
          message: 'Viewing request submitted successfully',
        },
      });

    } else {
      // Handle rental application
      if (!formData.moveInDate || !formData.leaseDuration) {
        return NextResponse.json(
          { error: 'Move-in date and lease duration are required' },
          { status: 400 }
        );
      }

      if (formData.leaseDuration < property[0].minimumStayMonths) {
        return NextResponse.json(
          { error: `Minimum lease duration is ${property[0].minimumStayMonths} months` },
          { status: 400 }
        );
      }

      // Validate income requirement (should be at least 2.5x rent)
      if (formData.monthlyIncome && formData.monthlyIncome < Number(property[0].monthlyRent) * 2.5) {
        return NextResponse.json(
          { error: 'Monthly income should be at least 2.5 times the monthly rent' },
          { status: 400 }
        );
      }

      // Create application record
      const newApplication = await db.insert(applications).values({
        propertyId: formData.propertyId,
        tenantId: session.user.id,
        landlordId: property[0].landlordId,
        status: 'submitted',
        moveInDate: formData.moveInDate,
        leaseDuration: formData.leaseDuration,
        monthlyIncome: formData.monthlyIncome?.toString() || null,
        hasGuarantor: formData.hasGuarantor || false,
        guarantorInfo: formData.guarantorInfo ? JSON.stringify(formData.guarantorInfo) : null,
        previousRentalHistory: formData.previousRentalHistory ? JSON.stringify(formData.previousRentalHistory) : null,
        references: formData.references ? JSON.stringify(formData.references) : null,
        coverLetter: formData.coverLetter || null,
        additionalInfo: formData.additionalInfo || null,
      }).returning();

      // Also create a booking record for tracking
      await db.insert(bookings).values({
        propertyId: formData.propertyId,
        tenantId: session.user.id,
        landlordId: property[0].landlordId,
        type: 'application',
        status: 'pending',
        moveInDate: formData.moveInDate,
        leaseDuration: formData.leaseDuration,
        message: formData.coverLetter || null,
      });

      // Send notification email to landlord
      try {
        await queueEmail(
          NotificationType.APPLICATION_RECEIVED,
          landlord[0].email,
          landlord[0].name,
          {
            propertyTitle: property[0].title,
            tenantName: tenant[0].name,
            moveInDate: formData.moveInDate.toLocaleDateString(),
            leaseDuration: formData.leaseDuration,
            monthlyIncome: formData.monthlyIncome,
            hasGuarantor: formData.hasGuarantor,
          },
          {
            priority: 'high',
            language: 'en',
          }
        );
      } catch (emailError) {
        console.error('Failed to send application notification email:', emailError);
      }

      return NextResponse.json({
        success: true,
        data: {
          application: newApplication[0],
          message: 'Rental application submitted successfully',
        },
      });
    }

  } catch (error) {
    console.error('Booking submission error:', error);
    return NextResponse.json(
      { error: 'Failed to submit booking request' },
      { status: 500 }
    );
  }
}

// Get user's bookings
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
    const type = searchParams.get('type'); // 'viewing' | 'application'
    const status = searchParams.get('status');
    const userType = searchParams.get('userType'); // 'tenant' | 'landlord'

    // Build query conditions
    const conditions = [];

    if (userType === 'landlord') {
      conditions.push(eq(bookings.landlordId, session.user.id));
    } else {
      conditions.push(eq(bookings.tenantId, session.user.id));
    }

    if (type) {
      conditions.push(eq(bookings.type, type as any));
    }

    if (status) {
      conditions.push(eq(bookings.status, status as any));
    }

    // Get bookings with property and user details
    const userBookings = await db
      .select({
        id: bookings.id,
        type: bookings.type,
        status: bookings.status,
        viewingDate: bookings.viewingDate,
        viewingTime: bookings.viewingTime,
        moveInDate: bookings.moveInDate,
        leaseDuration: bookings.leaseDuration,
        message: bookings.message,
        confirmedAt: bookings.confirmedAt,
        completedAt: bookings.completedAt,
        cancelledAt: bookings.cancelledAt,
        createdAt: bookings.createdAt,
        property: {
          id: properties.id,
          title: properties.title,
          address: properties.address,
          city: properties.city,
          monthlyRent: properties.monthlyRent,
          mainImage: properties.mainImage,
        },
        tenant: {
          id: users.id,
          name: users.name,
          email: users.email,
        },
      })
      .from(bookings)
      .leftJoin(properties, eq(bookings.propertyId, properties.id))
      .leftJoin(users, userType === 'landlord'
        ? eq(bookings.tenantId, users.id)
        : eq(bookings.landlordId, users.id)
      )
      .where(conditions.length > 0 ? conditions.reduce((acc, condition) => acc && condition) : undefined)
      .orderBy(bookings.createdAt);

    return NextResponse.json({
      success: true,
      data: {
        bookings: userBookings,
      },
    });

  } catch (error) {
    console.error('Get bookings error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch bookings' },
      { status: 500 }
    );
  }
}
