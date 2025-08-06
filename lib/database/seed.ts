import { db } from './config';
import { users, properties, applications, contracts, bookings, messages, reviews } from './schema';
import bcrypt from 'bcryptjs';

async function seed() {
  try {
    console.log('🌱 Starting database seed...');

    // Clear existing data (in reverse order of dependencies)
    await db.delete(reviews);
    await db.delete(messages);
    await db.delete(bookings);
    await db.delete(contracts);
    await db.delete(applications);
    await db.delete(properties);
    await db.delete(users);

    console.log('🗑️  Cleared existing data');

    // Create sample users
    const sampleUsers = [
      // Landlords
      {
        id: 'landlord1',
        email: 'maria@landlord.com',
        name: 'Maria Konstantinou',
        userType: 'landlord',
        phone: '+30 210 555 0201',
        isVerified: true,
        emailVerified: new Date(),
        image: 'https://images.unsplash.com/photo-1494790108755-2616b612b1e5?w=150&h=150&fit=crop&crop=face',
      },
      {
        id: 'landlord2',
        email: 'dimitris@landlord.com',
        name: 'Dimitris Papadopoulos',
        userType: 'landlord',
        phone: '+30 210 555 0202',
        isVerified: true,
        emailVerified: new Date(),
        image: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
      },
      // Tenants
      {
        id: 'tenant1',
        email: 'anna@tenant.com',
        name: 'Anna Papadopoulos',
        userType: 'tenant',
        phone: '+30 210 555 0101',
        isVerified: true,
        emailVerified: new Date(),
        image: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face',
      },
      {
        id: 'tenant2',
        email: 'nikos@tenant.com',
        name: 'Nikos Georgiou',
        userType: 'tenant',
        phone: '+30 210 555 0102',
        isVerified: true,
        emailVerified: new Date(),
        image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
      },
      {
        id: 'tenant3',
        email: 'sofia@tenant.com',
        name: 'Sofia Michailidou',
        userType: 'tenant',
        phone: '+30 210 555 0103',
        isVerified: false,
        emailVerified: new Date(),
        image: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&h=150&fit=crop&crop=face',
      },
      // Admin
      {
        id: 'admin1',
        email: 'admin@meet2rent.com',
        name: 'Meet2Rent Admin',
        userType: 'admin',
        phone: '+30 210 555 0001',
        isVerified: true,
        emailVerified: new Date(),
        image: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
      },
    ];

    await db.insert(users).values(sampleUsers);
    console.log('👥 Created sample users');

    // Create sample properties
    const sampleProperties = [
      {
        id: 'prop1',
        landlordId: 'landlord1',
        title: 'Modern 2BR Apartment with Stunning City Views',
        description: 'Experience luxury living in this beautifully renovated 2-bedroom apartment located in the heart of Kolonaki. This stunning property features high ceilings, hardwood floors, and floor-to-ceiling windows that flood the space with natural light.',
        type: 'apartment',
        address: 'Kolonaki Street 123',
        city: 'Athens',
        region: 'Attica',
        postalCode: '10676',
        country: 'Greece',
        latitude: '37.9779',
        longitude: '23.7348',
        bedrooms: 2,
        bathrooms: 2,
        area: '75',
        floor: 4,
        totalFloors: 6,
        yearBuilt: 2018,
        furnished: 'furnished',
        monthlyRent: '1200',
        securityDeposit: '1200',
        utilityDeposit: '200',
        currency: 'EUR',
        petsAllowed: false,
        smokingAllowed: false,
        minimumStayMonths: 6,
        maximumOccupants: 3,
        amenities: JSON.stringify(['wifi', 'ac', 'heating', 'balcony', 'elevator', 'security', 'city_view']),
        features: JSON.stringify(['modern', 'renovated', 'high_ceilings', 'hardwood_floors']),
        nearbyFacilities: JSON.stringify(['metro', 'restaurants', 'shopping', 'parks', 'hospital']),
        images: JSON.stringify([
          'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&h=600&fit=crop',
          'https://images.unsplash.com/photo-1560448075-bb485b067938?w=800&h=600&fit=crop',
          'https://images.unsplash.com/photo-1560449752-3fd4bdfc6d9a?w=800&h=600&fit=crop',
          'https://images.unsplash.com/photo-1560448205-a3bb06bc9399?w=800&h=600&fit=crop',
        ]),
        mainImage: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&h=600&fit=crop',
        virtualTourUrl: 'https://example.com/tour1',
        slug: 'modern-2br-apartment-kolonaki',
        status: 'available',
        isPublished: true,
        publishedAt: new Date(),
        viewCount: 248,
        availableFrom: new Date('2024-04-01'),
      },
      {
        id: 'prop2',
        landlordId: 'landlord1',
        title: 'Cozy Studio Near University Campus',
        description: 'Perfect for students! This comfortable studio apartment is located just minutes from the University of Athens. Fully furnished with modern amenities and high-speed internet.',
        type: 'studio',
        address: 'Exarchia Square 45',
        city: 'Athens',
        region: 'Attica',
        postalCode: '10683',
        country: 'Greece',
        latitude: '37.9870',
        longitude: '23.7344',
        bedrooms: 1,
        bathrooms: 1,
        area: '35',
        floor: 2,
        totalFloors: 4,
        yearBuilt: 2015,
        furnished: 'furnished',
        monthlyRent: '650',
        securityDeposit: '650',
        utilityDeposit: '100',
        currency: 'EUR',
        petsAllowed: false,
        smokingAllowed: false,
        minimumStayMonths: 1,
        maximumOccupants: 2,
        amenities: JSON.stringify(['wifi', 'ac', 'heating', 'laundry']),
        features: JSON.stringify(['student_friendly', 'furnished', 'compact']),
        nearbyFacilities: JSON.stringify(['university', 'metro', 'cafes', 'bookstores']),
        images: JSON.stringify([
          'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&h=600&fit=crop',
          'https://images.unsplash.com/photo-1554995207-c18c203602cb?w=800&h=600&fit=crop',
          'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800&h=600&fit=crop',
        ]),
        mainImage: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&h=600&fit=crop',
        slug: 'cozy-studio-exarchia',
        status: 'available',
        isPublished: true,
        publishedAt: new Date(),
        viewCount: 156,
        availableFrom: new Date('2024-03-15'),
      },
      {
        id: 'prop3',
        landlordId: 'landlord2',
        title: 'Luxury 3BR House with Sea View',
        description: 'Stunning 3-bedroom house with panoramic sea views in Glyfada. Features include a large terrace, garden, parking, and direct beach access.',
        type: 'house',
        address: 'Poseidonos Avenue 78',
        city: 'Glyfada',
        region: 'Attica',
        postalCode: '16675',
        country: 'Greece',
        latitude: '37.8746',
        longitude: '23.7492',
        bedrooms: 3,
        bathrooms: 2,
        area: '120',
        floor: null,
        totalFloors: 2,
        yearBuilt: 2020,
        furnished: 'semi_furnished',
        monthlyRent: '2200',
        securityDeposit: '2200',
        utilityDeposit: '300',
        currency: 'EUR',
        petsAllowed: true,
        smokingAllowed: false,
        minimumStayMonths: 12,
        maximumOccupants: 6,
        amenities: JSON.stringify(['wifi', 'ac', 'heating', 'parking', 'terrace', 'garden', 'sea_view', 'pool']),
        features: JSON.stringify(['luxury', 'sea_view', 'garden', 'beach_access']),
        nearbyFacilities: JSON.stringify(['beach', 'marina', 'restaurants', 'shopping_center']),
        images: JSON.stringify([
          'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800&h=600&fit=crop',
          'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&h=600&fit=crop',
          'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=800&h=600&fit=crop',
          'https://images.unsplash.com/photo-1571055107559-3e67626fa8be?w=800&h=600&fit=crop',
        ]),
        mainImage: 'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800&h=600&fit=crop',
        virtualTourUrl: 'https://example.com/tour3',
        slug: 'luxury-3br-house-glyfada',
        status: 'available',
        isPublished: true,
        publishedAt: new Date(),
        viewCount: 89,
        availableFrom: new Date('2024-05-01'),
      },
    ];

    await db.insert(properties).values(sampleProperties);
    console.log('🏠 Created sample properties');

    // Create sample applications
    const sampleApplications = [
      {
        id: 'app1',
        propertyId: 'prop1',
        tenantId: 'tenant1',
        landlordId: 'landlord1',
        status: 'approved',
        moveInDate: new Date('2024-04-15'),
        leaseDuration: 12,
        monthlyIncome: '3500',
        hasGuarantor: false,
        coverLetter: 'I am a responsible professional looking for a long-term rental. I have stable income and excellent references.',
        approvedAt: new Date(),
      },
      {
        id: 'app2',
        propertyId: 'prop2',
        tenantId: 'tenant2',
        landlordId: 'landlord1',
        status: 'submitted',
        moveInDate: new Date('2024-04-01'),
        leaseDuration: 6,
        monthlyIncome: '1800',
        hasGuarantor: true,
        guarantorInfo: JSON.stringify({
          name: 'Georgios Georgiou',
          email: 'georgios@example.com',
          phone: '+30 210 555 0199',
          relationship: 'Father',
        }),
        coverLetter: 'I am a university student seeking accommodation near campus. My father will act as guarantor.',
      },
      {
        id: 'app3',
        propertyId: 'prop3',
        tenantId: 'tenant3',
        landlordId: 'landlord2',
        status: 'under_review',
        moveInDate: new Date('2024-05-15'),
        leaseDuration: 24,
        monthlyIncome: '4500',
        hasGuarantor: false,
        coverLetter: 'Looking for a family home with sea access. We are a quiet family with excellent rental history.',
        previousRentalHistory: JSON.stringify([
          {
            address: 'Previous Address 123, Athens',
            landlordName: 'Previous Landlord',
            landlordContact: '+30 210 555 0199',
            rentAmount: 1800,
            duration: '2 years',
            reason: 'Relocated for work',
          },
        ]),
      },
    ];

    await db.insert(applications).values(sampleApplications);
    console.log('📝 Created sample applications');

    // Create sample bookings
    const sampleBookings = [
      {
        id: 'book1',
        propertyId: 'prop1',
        tenantId: 'tenant1',
        landlordId: 'landlord1',
        type: 'viewing',
        status: 'confirmed',
        viewingDate: new Date('2024-04-10'),
        viewingTime: '14:00',
        message: 'Looking forward to viewing this beautiful apartment.',
        confirmedAt: new Date(),
      },
      {
        id: 'book2',
        propertyId: 'prop2',
        tenantId: 'tenant2',
        landlordId: 'landlord1',
        type: 'viewing',
        status: 'pending',
        viewingDate: new Date('2024-04-08'),
        viewingTime: '16:30',
        message: 'Would like to see the studio apartment.',
      },
    ];

    await db.insert(bookings).values(sampleBookings);
    console.log('📅 Created sample bookings');

    // Create sample contracts
    const sampleContracts = [
      {
        id: 'CNT-2024-001',
        applicationId: 'app1',
        propertyId: 'prop1',
        tenantId: 'tenant1',
        landlordId: 'landlord1',
        status: 'signed',
        contractData: JSON.stringify({
          propertyId: 'prop1',
          propertyTitle: 'Modern 2BR Apartment with Stunning City Views',
          propertyAddress: 'Kolonaki Street 123',
          propertyCity: 'Athens',
          propertyArea: 75,
          tenantId: 'tenant1',
          tenantName: 'Anna Papadopoulos',
          tenantEmail: 'anna@tenant.com',
          tenantPhone: '+30 210 555 0101',
          tenantAddress: 'Previous Address 456, Athens',
          tenantIdNumber: 'AB123456',
          landlordId: 'landlord1',
          landlordName: 'Maria Konstantinou',
          landlordEmail: 'maria@landlord.com',
          landlordPhone: '+30 210 555 0201',
          landlordAddress: 'Landlord Address 789, Athens',
          landlordIdNumber: 'CD789012',
          monthlyRent: 1200,
          securityDeposit: 1200,
          leaseStartDate: new Date('2024-04-15'),
          leaseEndDate: new Date('2025-04-15'),
          leaseDuration: 12,
          contractId: 'CNT-2024-001',
          generatedDate: new Date(),
          platformFee: 50,
          utilitiesIncluded: false,
          petsAllowed: false,
          smokingAllowed: false,
          furnishedType: 'furnished',
          specialTerms: ['Internet WiFi included in rent', 'Cleaning service provided monthly'],
        }),
        monthlyRent: '1200',
        securityDeposit: '1200',
        leaseStartDate: new Date('2024-04-15'),
        leaseEndDate: new Date('2025-04-15'),
        leaseDuration: 12,
        platformFee: '50',
        tenantSignedAt: new Date(),
        landlordSignedAt: new Date(),
        completedAt: new Date(),
      },
    ];

    await db.insert(contracts).values(sampleContracts);
    console.log('📄 Created sample contracts');

    // Create sample messages
    const sampleMessages = [
      {
        id: 'msg1',
        senderId: 'tenant1',
        receiverId: 'landlord1',
        content: 'Hello! I am interested in viewing your apartment in Kolonaki.',
        propertyId: 'prop1',
        conversationId: 'tenant1-landlord1',
        isRead: true,
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
      },
      {
        id: 'msg2',
        senderId: 'landlord1',
        receiverId: 'tenant1',
        content: 'Hello Anna! I would be happy to show you the apartment. When would be a good time for you?',
        propertyId: 'prop1',
        conversationId: 'tenant1-landlord1',
        isRead: true,
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 + 30 * 60 * 1000), // 2 days ago + 30 min
      },
      {
        id: 'msg3',
        senderId: 'tenant1',
        receiverId: 'landlord1',
        content: 'How about tomorrow at 2 PM? That would work well for me.',
        propertyId: 'prop1',
        conversationId: 'tenant1-landlord1',
        isRead: true,
        createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
      },
      {
        id: 'msg4',
        senderId: 'landlord1',
        receiverId: 'tenant1',
        content: 'Perfect! See you tomorrow at 2 PM at the property. I will bring the keys.',
        propertyId: 'prop1',
        conversationId: 'tenant1-landlord1',
        isRead: false,
        createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000), // 12 hours ago
      },
    ];

    await db.insert(messages).values(sampleMessages);
    console.log('💬 Created sample messages');

    // Create sample reviews
    const sampleReviews = [
      {
        id: 'rev1',
        contractId: 'CNT-2024-001',
        propertyId: 'prop1',
        reviewerId: 'tenant1',
        revieweeId: 'landlord1',
        reviewerType: 'tenant',
        rating: 5,
        comment: 'Excellent landlord! Very responsive and the apartment is exactly as described. Highly recommended.',
        categories: JSON.stringify({
          communication: 5,
          cleanliness: 5,
          accuracy: 5,
          location: 5,
          value: 4,
        }),
        isPublic: true,
      },
    ];

    await db.insert(reviews).values(sampleReviews);
    console.log('⭐ Created sample reviews');

    console.log('✅ Database seeding completed successfully!');
    console.log('\n📊 Sample data created:');
    console.log(`   👥 Users: ${sampleUsers.length}`);
    console.log(`   🏠 Properties: ${sampleProperties.length}`);
    console.log(`   📝 Applications: ${sampleApplications.length}`);
    console.log(`   📅 Bookings: ${sampleBookings.length}`);
    console.log(`   📄 Contracts: ${sampleContracts.length}`);
    console.log(`   💬 Messages: ${sampleMessages.length}`);
    console.log(`   ⭐ Reviews: ${sampleReviews.length}`);

  } catch (error) {
    console.error('❌ Error seeding database:', error);
    throw error;
  }
}

// Run the seed function
if (require.main === module) {
  seed().then(() => {
    console.log('🎉 Seeding completed!');
    process.exit(0);
  }).catch((error) => {
    console.error('💥 Seeding failed:', error);
    process.exit(1);
  });
}

export { seed };
