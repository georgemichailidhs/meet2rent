import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';
import { db } from '@/lib/database/config';
import { properties, users } from '@/lib/database/schema';
import { eq, and, desc, asc, sql, ilike, gte, lte, inArray } from 'drizzle-orm';
import { PropertyFormData, PropertySearchFilters, PropertyListItem } from '@/lib/types/database';

// Create new property
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if user is landlord
    const user = await db.select().from(users).where(eq(users.id, session.user.id)).limit(1);
    if (!user[0] || user[0].userType !== 'landlord') {
      return NextResponse.json(
        { error: 'Only landlords can create properties' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const propertyData: PropertyFormData = body;

    // Validate required fields
    const requiredFields = [
      'title', 'description', 'type', 'address', 'city', 'region',
      'bedrooms', 'bathrooms', 'area', 'monthlyRent', 'securityDeposit', 'maximumOccupants'
    ];

    for (const field of requiredFields) {
      if (!propertyData[field as keyof PropertyFormData]) {
        return NextResponse.json(
          { error: `${field} is required` },
          { status: 400 }
        );
      }
    }

    // Generate slug from title
    const slug = propertyData.title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();

    // Create property
    const newProperty = await db.insert(properties).values({
      landlordId: session.user.id,
      title: propertyData.title,
      description: propertyData.description,
      type: propertyData.type,
      address: propertyData.address,
      city: propertyData.city,
      region: propertyData.region,
      postalCode: propertyData.postalCode,
      country: 'Greece',
      bedrooms: propertyData.bedrooms,
      bathrooms: propertyData.bathrooms,
      area: propertyData.area.toString(),
      floor: propertyData.floor,
      totalFloors: propertyData.totalFloors,
      yearBuilt: propertyData.yearBuilt,
      furnished: propertyData.furnished,
      monthlyRent: propertyData.monthlyRent.toString(),
      securityDeposit: propertyData.securityDeposit.toString(),
      utilityDeposit: propertyData.utilityDeposit?.toString() || '0',
      petsAllowed: propertyData.petsAllowed,
      smokingAllowed: propertyData.smokingAllowed,
      minimumStayMonths: propertyData.minimumStayMonths,
      maximumOccupants: propertyData.maximumOccupants,
      amenities: JSON.stringify(propertyData.amenities || []),
      features: JSON.stringify(propertyData.features || []),
      images: JSON.stringify(propertyData.images || []),
      mainImage: propertyData.mainImage,
      virtualTourUrl: propertyData.virtualTourUrl,
      slug: `${slug}-${Date.now()}`,
      status: 'draft',
      isPublished: false,
      availableFrom: propertyData.availableFrom || null,
    }).returning();

    return NextResponse.json({
      success: true,
      data: {
        property: newProperty[0],
        message: 'Property created successfully',
      },
    });

  } catch (error) {
    console.error('Property creation error:', error);
    return NextResponse.json(
      { error: 'Failed to create property' },
      { status: 500 }
    );
  }
}

// Get properties with search and filters
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // Parse search filters
    const filters: PropertySearchFilters = {
      query: searchParams.get('query') || undefined,
      city: searchParams.get('city') || undefined,
      region: searchParams.get('region') || undefined,
      minPrice: searchParams.get('minPrice') ? Number(searchParams.get('minPrice')) : undefined,
      maxPrice: searchParams.get('maxPrice') ? Number(searchParams.get('maxPrice')) : undefined,
      bedrooms: searchParams.get('bedrooms') ? Number(searchParams.get('bedrooms')) : undefined,
      bathrooms: searchParams.get('bathrooms') ? Number(searchParams.get('bathrooms')) : undefined,
      propertyType: searchParams.get('propertyType') || undefined,
      furnished: searchParams.get('furnished') || undefined,
      petsAllowed: searchParams.get('petsAllowed') ? searchParams.get('petsAllowed') === 'true' : undefined,
      minArea: searchParams.get('minArea') ? Number(searchParams.get('minArea')) : undefined,
      maxArea: searchParams.get('maxArea') ? Number(searchParams.get('maxArea')) : undefined,
      amenities: searchParams.get('amenities')?.split(',') || undefined,
      sortBy: (searchParams.get('sortBy') as any) || 'date_desc',
      page: Number(searchParams.get('page')) || 1,
      limit: Number(searchParams.get('limit')) || 20,
    };

    // Build query conditions
    const conditions = [];

    // Only show published properties
    conditions.push(eq(properties.isPublished, true));
    conditions.push(eq(properties.status, 'available'));

    // Text search
    if (filters.query) {
      conditions.push(
        sql`(${properties.title} ILIKE ${`%${filters.query}%`} OR ${properties.description} ILIKE ${`%${filters.query}%`})`
      );
    }

    // Location filters
    if (filters.city) {
      conditions.push(ilike(properties.city, `%${filters.city}%`));
    }
    if (filters.region) {
      conditions.push(ilike(properties.region, `%${filters.region}%`));
    }

    // Price filters
    if (filters.minPrice) {
      conditions.push(gte(properties.monthlyRent, filters.minPrice.toString()));
    }
    if (filters.maxPrice) {
      conditions.push(lte(properties.monthlyRent, filters.maxPrice.toString()));
    }

    // Property details
    if (filters.bedrooms) {
      conditions.push(eq(properties.bedrooms, filters.bedrooms));
    }
    if (filters.bathrooms) {
      conditions.push(gte(properties.bathrooms, filters.bathrooms));
    }
    if (filters.propertyType) {
      conditions.push(eq(properties.type, filters.propertyType));
    }
    if (filters.furnished) {
      conditions.push(eq(properties.furnished, filters.furnished));
    }
    if (filters.petsAllowed !== undefined) {
      conditions.push(eq(properties.petsAllowed, filters.petsAllowed));
    }

    // Area filters
    if (filters.minArea) {
      conditions.push(gte(properties.area, filters.minArea.toString()));
    }
    if (filters.maxArea) {
      conditions.push(lte(properties.area, filters.maxArea.toString()));
    }

    // Build sort order
    let orderBy;
    switch (filters.sortBy) {
      case 'price_asc':
        orderBy = asc(properties.monthlyRent);
        break;
      case 'price_desc':
        orderBy = desc(properties.monthlyRent);
        break;
      case 'date_desc':
        orderBy = desc(properties.createdAt);
        break;
      case 'relevance':
        // TODO: Implement relevance scoring
        orderBy = desc(properties.viewCount);
        break;
      default:
        orderBy = desc(properties.createdAt);
    }

    // Calculate pagination
    const offset = (filters.page! - 1) * filters.limit!;

    // Execute query with join to get landlord info
    const propertiesWithLandlord = await db
      .select({
        id: properties.id,
        title: properties.title,
        description: properties.description,
        type: properties.type,
        address: properties.address,
        city: properties.city,
        region: properties.region,
        bedrooms: properties.bedrooms,
        bathrooms: properties.bathrooms,
        area: properties.area,
        monthlyRent: properties.monthlyRent,
        securityDeposit: properties.securityDeposit,
        furnished: properties.furnished,
        petsAllowed: properties.petsAllowed,
        smokingAllowed: properties.smokingAllowed,
        minimumStayMonths: properties.minimumStayMonths,
        maximumOccupants: properties.maximumOccupants,
        amenities: properties.amenities,
        features: properties.features,
        images: properties.images,
        mainImage: properties.mainImage,
        slug: properties.slug,
        viewCount: properties.viewCount,
        availableFrom: properties.availableFrom,
        createdAt: properties.createdAt,
        updatedAt: properties.updatedAt,
        landlord: {
          id: users.id,
          name: users.name,
          image: users.image,
        },
      })
      .from(properties)
      .leftJoin(users, eq(properties.landlordId, users.id))
      .where(and(...conditions))
      .orderBy(orderBy)
      .limit(filters.limit!)
      .offset(offset);

    // Get total count for pagination
    const totalCount = await db
      .select({ count: sql<number>`count(*)` })
      .from(properties)
      .where(and(...conditions));

    const total = totalCount[0]?.count || 0;
    const totalPages = Math.ceil(total / filters.limit!);

    // Format response
    const propertyList: PropertyListItem[] = propertiesWithLandlord.map(p => ({
      ...p,
      monthlyRent: p.monthlyRent,
      securityDeposit: p.securityDeposit,
      area: p.area,
      amenities: JSON.parse(p.amenities as string || '[]'),
      features: JSON.parse(p.features as string || '[]'),
      images: JSON.parse(p.images as string || '[]'),
      landlord: p.landlord!,
    }));

    return NextResponse.json({
      success: true,
      data: {
        properties: propertyList,
        total,
        page: filters.page,
        totalPages,
        hasNext: filters.page! < totalPages,
        hasPrev: filters.page! > 1,
        filters,
      },
    });

  } catch (error) {
    console.error('Properties fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch properties' },
      { status: 500 }
    );
  }
}
