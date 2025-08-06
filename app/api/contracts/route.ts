import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';
import { db } from '@/lib/database/config';
import { contracts, applications, properties, users } from '@/lib/database/schema';
import { eq, and } from 'drizzle-orm';
import { createContractFromApplication, validateContractData } from '@/lib/contracts';
import { queueEmail, NotificationType } from '@/lib/notifications';

// Create a new contract
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
    const { applicationId, propertyId } = body;

    if (!applicationId && !propertyId) {
      return NextResponse.json(
        { error: 'Application ID or Property ID is required' },
        { status: 400 }
      );
    }

    // Get application details if applicationId provided
    if (applicationId) {
      const application = await db
        .select({
          id: applications.id,
          propertyId: applications.propertyId,
          tenantId: applications.tenantId,
          landlordId: applications.landlordId,
          status: applications.status,
          moveInDate: applications.moveInDate,
          leaseDuration: applications.leaseDuration,
          monthlyIncome: applications.monthlyIncome,
        })
        .from(applications)
        .where(eq(applications.id, applicationId))
        .limit(1);

      if (!application[0]) {
        return NextResponse.json(
          { error: 'Application not found' },
          { status: 404 }
        );
      }

      if (application[0].status !== 'approved') {
        return NextResponse.json(
          { error: 'Application must be approved before generating contract' },
          { status: 400 }
        );
      }

      // Get property details
      const property = await db
        .select()
        .from(properties)
        .where(eq(properties.id, application[0].propertyId))
        .limit(1);

      if (!property[0]) {
        return NextResponse.json(
          { error: 'Property not found' },
          { status: 404 }
        );
      }

      // Get tenant and landlord details
      const [tenant, landlord] = await Promise.all([
        db.select().from(users).where(eq(users.id, application[0].tenantId)).limit(1),
        db.select().from(users).where(eq(users.id, application[0].landlordId)).limit(1)
      ]);

      if (!tenant[0] || !landlord[0]) {
        return NextResponse.json(
          { error: 'User details not found' },
          { status: 404 }
        );
      }

      // Generate contract data
      const contractData = createContractFromApplication(
        application[0],
        property[0],
        tenant[0],
        landlord[0]
      );

      // Validate contract data
      const validation = validateContractData(contractData);
      if (!validation.isValid) {
        return NextResponse.json(
          { error: 'Invalid contract data', details: validation.errors },
          { status: 400 }
        );
      }

      // Save contract to database
      const newContract = await db.insert(contracts).values({
        id: contractData.contractId,
        applicationId: applicationId,
        propertyId: property[0].id,
        tenantId: tenant[0].id,
        landlordId: landlord[0].id,
        status: 'draft',
        contractData: JSON.stringify(contractData),
        monthlyRent: contractData.monthlyRent.toString(),
        securityDeposit: contractData.securityDeposit.toString(),
        leaseStartDate: contractData.leaseStartDate,
        leaseEndDate: contractData.leaseEndDate,
        leaseDuration: contractData.leaseDuration,
        platformFee: contractData.platformFee?.toString() || null,
      }).returning();

      // Send notifications to both parties
      try {
        await Promise.all([
          queueEmail(
            NotificationType.CONTRACT_READY,
            tenant[0].email!,
            tenant[0].name!,
            {
              contractId: contractData.contractId,
              propertyTitle: property[0].title,
              moveInDate: contractData.leaseStartDate.toLocaleDateString(),
              monthlyRent: contractData.monthlyRent,
            },
            { priority: 'high', language: 'en' }
          ),
          queueEmail(
            NotificationType.CONTRACT_READY,
            landlord[0].email!,
            landlord[0].name!,
            {
              contractId: contractData.contractId,
              propertyTitle: property[0].title,
              moveInDate: contractData.leaseStartDate.toLocaleDateString(),
              monthlyRent: contractData.monthlyRent,
            },
            { priority: 'high', language: 'en' }
          )
        ]);
      } catch (emailError) {
        console.error('Failed to send contract notification emails:', emailError);
      }

      return NextResponse.json({
        success: true,
        data: {
          contract: newContract[0],
          contractData: contractData,
        },
      });
    }

    return NextResponse.json(
      { error: 'Not implemented for direct property contracts yet' },
      { status: 501 }
    );

  } catch (error) {
    console.error('Contract creation error:', error);
    return NextResponse.json(
      { error: 'Failed to create contract' },
      { status: 500 }
    );
  }
}

// Get contracts for user
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
    const userType = searchParams.get('userType');

    // Build query conditions
    const conditions = [];

    if (userType === 'landlord') {
      conditions.push(eq(contracts.landlordId, session.user.id));
    } else {
      conditions.push(eq(contracts.tenantId, session.user.id));
    }

    if (status) {
      conditions.push(eq(contracts.status, status as any));
    }

    // Get contracts with related data
    const userContracts = await db
      .select({
        id: contracts.id,
        status: contracts.status,
        monthlyRent: contracts.monthlyRent,
        securityDeposit: contracts.securityDeposit,
        leaseStartDate: contracts.leaseStartDate,
        leaseEndDate: contracts.leaseEndDate,
        leaseDuration: contracts.leaseDuration,
        platformFee: contracts.platformFee,
        tenantSignedAt: contracts.tenantSignedAt,
        landlordSignedAt: contracts.landlordSignedAt,
        completedAt: contracts.completedAt,
        createdAt: contracts.createdAt,
        property: {
          id: properties.id,
          title: properties.title,
          address: properties.address,
          city: properties.city,
          mainImage: properties.mainImage,
        },
        tenant: {
          id: users.id,
          name: users.name,
          email: users.email,
        },
      })
      .from(contracts)
      .leftJoin(properties, eq(contracts.propertyId, properties.id))
      .leftJoin(users, userType === 'landlord'
        ? eq(contracts.tenantId, users.id)
        : eq(contracts.landlordId, users.id)
      )
      .where(conditions.length > 0 ? conditions.reduce((acc, condition) => and(acc, condition)) : undefined)
      .orderBy(contracts.createdAt);

    return NextResponse.json({
      success: true,
      data: {
        contracts: userContracts,
      },
    });

  } catch (error) {
    console.error('Get contracts error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch contracts' },
      { status: 500 }
    );
  }
}
