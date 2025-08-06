import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';
import { db } from '@/lib/database/config';
import { contracts, properties, users, signatures } from '@/lib/database/schema';
import { eq, and } from 'drizzle-orm';
import { queueEmail, NotificationType } from '@/lib/notifications';

interface RouteContext {
  params: {
    contractId: string;
  };
}

// Get specific contract
export async function GET(request: NextRequest, { params }: RouteContext) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const contractId = params.contractId;

    // Get contract with related data
    const contract = await db
      .select({
        id: contracts.id,
        status: contracts.status,
        contractData: contracts.contractData,
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
        tenantId: contracts.tenantId,
        landlordId: contracts.landlordId,
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
      .leftJoin(users, eq(contracts.tenantId, users.id))
      .where(eq(contracts.id, contractId))
      .limit(1);

    if (!contract[0]) {
      return NextResponse.json(
        { error: 'Contract not found' },
        { status: 404 }
      );
    }

    // Check if user has access to this contract
    if (contract[0].tenantId !== session.user.id && contract[0].landlordId !== session.user.id) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    // Get landlord info separately
    const landlord = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
      })
      .from(users)
      .where(eq(users.id, contract[0].landlordId))
      .limit(1);

    // Get contract signatures
    const contractSignatures = await db
      .select()
      .from(signatures)
      .where(eq(signatures.contractId, contractId));

    return NextResponse.json({
      success: true,
      data: {
        contract: {
          ...contract[0],
          landlord: landlord[0] || null,
        },
        signatures: contractSignatures,
      },
    });

  } catch (error) {
    console.error('Get contract error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch contract' },
      { status: 500 }
    );
  }
}

// Update contract (mainly for signing)
export async function PATCH(request: NextRequest, { params }: RouteContext) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const contractId = params.contractId;
    const body = await request.json();
    const { action, signatureData } = body;

    // Get contract
    const contract = await db
      .select()
      .from(contracts)
      .where(eq(contracts.id, contractId))
      .limit(1);

    if (!contract[0]) {
      return NextResponse.json(
        { error: 'Contract not found' },
        { status: 404 }
      );
    }

    // Check if user has access to this contract
    if (contract[0].tenantId !== session.user.id && contract[0].landlordId !== session.user.id) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    if (action === 'sign') {
      const userType = contract[0].tenantId === session.user.id ? 'tenant' : 'landlord';

      // Check if user already signed
      const existingSignature = await db
        .select()
        .from(signatures)
        .where(and(
          eq(signatures.contractId, contractId),
          eq(signatures.signerId, session.user.id)
        ))
        .limit(1);

      if (existingSignature[0]) {
        return NextResponse.json(
          { error: 'You have already signed this contract' },
          { status: 400 }
        );
      }

      // Save signature
      const newSignature = await db.insert(signatures).values({
        contractId: contractId,
        signerId: session.user.id,
        signerName: session.user.name || '',
        signerType: userType,
        signatureData: signatureData || null,
        signedAt: new Date(),
      }).returning();

      // Update contract with signature timestamp
      const updateData: any = {};
      if (userType === 'tenant') {
        updateData.tenantSignedAt = new Date();
      } else {
        updateData.landlordSignedAt = new Date();
      }

      // Check if this completes the contract (both parties signed)
      const allSignatures = await db
        .select()
        .from(signatures)
        .where(eq(signatures.contractId, contractId));

      const hasTenantSignature = allSignatures.some(s => s.signerType === 'tenant');
      const hasLandlordSignature = allSignatures.some(s => s.signerType === 'landlord');

      if (hasTenantSignature && hasLandlordSignature) {
        updateData.status = 'signed';
        updateData.completedAt = new Date();
      }

      const updatedContract = await db
        .update(contracts)
        .set(updateData)
        .where(eq(contracts.id, contractId))
        .returning();

      // Send notifications
      try {
        // Get property and user details for notifications
        const [property, tenant, landlord] = await Promise.all([
          db.select().from(properties).where(eq(properties.id, contract[0].propertyId)).limit(1),
          db.select().from(users).where(eq(users.id, contract[0].tenantId)).limit(1),
          db.select().from(users).where(eq(users.id, contract[0].landlordId)).limit(1)
        ]);

        if (updatedContract[0].status === 'signed') {
          // Contract is fully signed - notify both parties
          await Promise.all([
            queueEmail(
              NotificationType.CONTRACT_SIGNED,
              tenant[0].email!,
              tenant[0].name!,
              {
                contractId: contractId,
                propertyTitle: property[0].title,
                moveInDate: contract[0].leaseStartDate.toLocaleDateString(),
              },
              { priority: 'high', language: 'en' }
            ),
            queueEmail(
              NotificationType.CONTRACT_SIGNED,
              landlord[0].email!,
              landlord[0].name!,
              {
                contractId: contractId,
                propertyTitle: property[0].title,
                moveInDate: contract[0].leaseStartDate.toLocaleDateString(),
              },
              { priority: 'high', language: 'en' }
            )
          ]);
        } else {
          // Partial signing - notify the other party
          const otherParty = userType === 'tenant' ? landlord[0] : tenant[0];
          const signerName = session.user.name || '';

          await queueEmail(
            NotificationType.CONTRACT_READY,
            otherParty.email!,
            otherParty.name!,
            {
              contractId: contractId,
              propertyTitle: property[0].title,
              signerName: signerName,
              waitingFor: userType === 'tenant' ? 'landlord' : 'tenant',
            },
            { priority: 'high', language: 'en' }
          );
        }
      } catch (emailError) {
        console.error('Failed to send contract signing notification:', emailError);
      }

      return NextResponse.json({
        success: true,
        data: {
          signature: newSignature[0],
          contract: updatedContract[0],
          isFullySigned: updatedContract[0].status === 'signed',
        },
      });
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    );

  } catch (error) {
    console.error('Contract update error:', error);
    return NextResponse.json(
      { error: 'Failed to update contract' },
      { status: 500 }
    );
  }
}
