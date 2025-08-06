import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/database/config';
import { properties, users, bookings, propertyAmenities } from '@/lib/database/schema';
import { sampleProperties, sampleUsers, sampleBookings } from '@/lib/sample-data';

export async function POST(request: NextRequest) {
  try {
    // Only allow seeding in development
    if (process.env.NODE_ENV === 'production') {
      return NextResponse.json(
        { error: 'Seeding is not allowed in production' },
        { status: 403 }
      );
    }

    console.log('🌱 Starting database seeding...');

    // Clear existing sample data
    console.log('🧹 Clearing existing sample data...');
    await db.delete(bookings).where();
    await db.delete(properties).where();
    await db.delete(users).where();

    // Insert sample users
    console.log('👥 Inserting sample users...');
    for (const user of sampleUsers) {
      await db.insert(users).values({
        id: user.id,
        name: user.name,
        email: user.email,
        userType: user.userType as 'tenant' | 'landlord' | 'admin',
        phone: user.phone,
        image: user.image,
        isVerified: true,
        emailVerified: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }

    // Insert sample landlords (property owners)
    console.log('🏠 Inserting sample landlords...');
    for (const property of sampleProperties) {
      const landlord = property.landlord;

      // Insert landlord if not exists
      try {
        await db.insert(users).values({
          id: landlord.id,
          name: landlord.name,
          email: landlord.email,
          userType: 'landlord',
          phone: landlord.phone,
          image: landlord.image,
          isVerified: true,
          emailVerified: new Date(),
          createdAt: new Date(),
          updatedAt: new Date()
        });
      } catch (error) {
        // Landlord might already exist, continue
        console.log(`Landlord ${landlord.id} already exists`);
      }
    }

    // Insert sample properties
    console.log('🏢 Inserting sample properties...');
    for (const property of sampleProperties) {
      await db.insert(properties).values({
        id: property.id,
        landlordId: property.landlord.id,
        title: property.title,
        description: property.description,
        type: property.type,
        address: property.address,
        city: property.city,
        region: property.region,
        postalCode: property.postalCode,
        country: property.country,
        latitude: property.latitude.toString(),
        longitude: property.longitude.toString(),
        bedrooms: property.bedrooms,
        bathrooms: property.bathrooms,
        area: property.area,
        monthlyRent: property.monthlyRent,
        securityDeposit: property.securityDeposit,
        availableFrom: property.availableFrom,
        leaseDuration: property.leaseDuration,
        petFriendly: property.petFriendly,
        smokingAllowed: property.smokingAllowed,
        furnished: property.furnished,
        utilities: property.utilities,
        images: JSON.stringify(property.images),
        amenities: JSON.stringify(property.amenities),
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date()
      });

      // Insert property amenities
      for (const amenity of property.amenities) {
        await db.insert(propertyAmenities).values({
          id: `${property.id}-${amenity.id}`,
          name: amenity.name,
          category: amenity.category,
          description: `${amenity.name} available at this property`,
          icon: amenity.icon,
          isActive: true,
          createdAt: new Date()
        });
      }
    }

    // Insert sample bookings
    console.log('📅 Inserting sample bookings...');
    for (const booking of sampleBookings) {
      await db.insert(bookings).values({
        id: booking.id,
        propertyId: booking.propertyId,
        tenantId: booking.tenantId,
        landlordId: booking.landlordId,
        type: booking.type,
        status: booking.status,
        moveInDate: booking.moveInDate,
        leaseDuration: booking.leaseDuration,
        message: booking.message,
        createdAt: booking.createdAt,
        updatedAt: new Date()
      });
    }

    console.log('✅ Database seeding completed successfully!');

    return NextResponse.json(
      {
        success: true,
        message: 'Database seeded successfully with sample data',
        data: {
          users: sampleUsers.length + sampleProperties.length, // users + landlords
          properties: sampleProperties.length,
          bookings: sampleBookings.length
        }
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('❌ Database seeding failed:', error);

    return NextResponse.json(
      {
        error: 'Failed to seed database',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json(
    {
      message: 'Seed endpoint available. Use POST to seed database with sample data.',
      warning: 'Only works in development environment.'
    },
    { status: 200 }
  );
}
