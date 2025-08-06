export const sampleProperties = [
  {
    id: "sample-1",
    title: "Modern Apartment in Athens Center",
    description: "Beautiful 2-bedroom apartment in the heart of Athens, walking distance to Acropolis and metro stations. Fully furnished with modern amenities.",
    type: "apartment",
    address: "Plaka, Athens",
    city: "Athens",
    region: "Attica",
    postalCode: "10558",
    country: "Greece",
    latitude: 37.9755,
    longitude: 23.7348,
    bedrooms: 2,
    bathrooms: 1,
    area: "75",
    monthlyRent: "850",
    securityDeposit: "1700",
    availableFrom: new Date("2024-02-01"),
    leaseDuration: 12,
    petFriendly: false,
    smokingAllowed: false,
    furnished: true,
    utilities: "not_included",
    images: [
      "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1554995207-c18c203602cb?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&h=600&fit=crop"
    ],
    amenities: [
      { id: "wifi", name: "WiFi", category: "connectivity", icon: "wifi" },
      { id: "ac", name: "Air Conditioning", category: "climate", icon: "snowflake" },
      { id: "heating", name: "Central Heating", category: "climate", icon: "flame" },
      { id: "balcony", name: "Balcony", category: "outdoor", icon: "home" },
      { id: "elevator", name: "Elevator", category: "building", icon: "arrow-up" },
      { id: "security", name: "Security System", category: "safety", icon: "shield" }
    ],
    landlord: {
      id: "landlord-1",
      name: "Maria Papadopoulos",
      email: "maria@example.com",
      phone: "+30 210 123 4567",
      image: "https://images.unsplash.com/photo-1494790108755-2616c0763a5b?w=150&h=150&fit=crop&crop=face",
      rating: 4.8,
      responseTime: "within 2 hours",
      verified: true
    }
  },
  {
    id: "sample-2",
    title: "Seaside Villa in Santorini",
    description: "Stunning 3-bedroom villa with breathtaking sunset views over the Aegean Sea. Private pool, terrace, and traditional Cycladic architecture.",
    type: "house",
    address: "Oia, Santorini",
    city: "Santorini",
    region: "South Aegean",
    postalCode: "84702",
    country: "Greece",
    latitude: 36.4618,
    longitude: 25.3753,
    bedrooms: 3,
    bathrooms: 2,
    area: "120",
    monthlyRent: "2500",
    securityDeposit: "5000",
    availableFrom: new Date("2024-03-15"),
    leaseDuration: 6,
    petFriendly: true,
    smokingAllowed: false,
    furnished: true,
    utilities: "included",
    images: [
      "https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1602343168117-bb8ffe3e2e9f?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800&h=600&fit=crop"
    ],
    amenities: [
      { id: "wifi", name: "WiFi", category: "connectivity", icon: "wifi" },
      { id: "pool", name: "Private Pool", category: "outdoor", icon: "waves" },
      { id: "sea_view", name: "Sea View", category: "view", icon: "eye" },
      { id: "terrace", name: "Large Terrace", category: "outdoor", icon: "home" },
      { id: "parking", name: "Private Parking", category: "parking", icon: "car" },
      { id: "garden", name: "Garden", category: "outdoor", icon: "flower" }
    ],
    landlord: {
      id: "landlord-2",
      name: "Dimitris Kouris",
      email: "dimitris@example.com",
      phone: "+30 228 123 4567",
      image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face",
      rating: 4.9,
      responseTime: "within 1 hour",
      verified: true
    }
  },
  {
    id: "sample-3",
    title: "Student Studio near University",
    description: "Compact and efficient studio apartment perfect for students. Located near University of Athens with easy access to public transport.",
    type: "studio",
    address: "Zografou, Athens",
    city: "Athens",
    region: "Attica",
    postalCode: "15784",
    country: "Greece",
    latitude: 37.9838,
    longitude: 23.7821,
    bedrooms: 0,
    bathrooms: 1,
    area: "35",
    monthlyRent: "450",
    securityDeposit: "900",
    availableFrom: new Date("2024-09-01"),
    leaseDuration: 10,
    petFriendly: false,
    smokingAllowed: false,
    furnished: true,
    utilities: "partially_included",
    images: [
      "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1536376072261-38c75010e6c9?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1574180045827-681f8a1a9622?w=800&h=600&fit=crop"
    ],
    amenities: [
      { id: "wifi", name: "WiFi", category: "connectivity", icon: "wifi" },
      { id: "study_desk", name: "Study Desk", category: "furniture", icon: "book" },
      { id: "metro", name: "Near Metro", category: "transport", icon: "train" },
      { id: "laundry", name: "Shared Laundry", category: "utilities", icon: "wash" },
      { id: "heating", name: "Central Heating", category: "climate", icon: "flame" }
    ],
    landlord: {
      id: "landlord-3",
      name: "Anna Georgiou",
      email: "anna@example.com",
      phone: "+30 210 987 6543",
      image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face",
      rating: 4.7,
      responseTime: "within 4 hours",
      verified: true
    }
  },
  {
    id: "sample-4",
    title: "Luxury Penthouse in Glyfada",
    description: "Exclusive penthouse with panoramic views of the Saronic Gulf. High-end finishes, private rooftop terrace, and premium location near the beach.",
    type: "apartment",
    address: "Glyfada, Athens",
    city: "Athens",
    region: "Attica",
    postalCode: "16674",
    country: "Greece",
    latitude: 37.8669,
    longitude: 23.7537,
    bedrooms: 4,
    bathrooms: 3,
    area: "180",
    monthlyRent: "3200",
    securityDeposit: "6400",
    availableFrom: new Date("2024-01-15"),
    leaseDuration: 24,
    petFriendly: true,
    smokingAllowed: false,
    furnished: true,
    utilities: "included",
    images: [
      "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&h=600&fit=crop"
    ],
    amenities: [
      { id: "wifi", name: "High-Speed WiFi", category: "connectivity", icon: "wifi" },
      { id: "ac", name: "Premium AC System", category: "climate", icon: "snowflake" },
      { id: "sea_view", name: "Panoramic Sea View", category: "view", icon: "eye" },
      { id: "rooftop", name: "Private Rooftop", category: "outdoor", icon: "home" },
      { id: "parking", name: "Underground Parking", category: "parking", icon: "car" },
      { id: "gym", name: "Building Gym", category: "fitness", icon: "dumbbell" },
      { id: "concierge", name: "24/7 Concierge", category: "service", icon: "user" },
      { id: "smart_home", name: "Smart Home System", category: "technology", icon: "smartphone" }
    ],
    landlord: {
      id: "landlord-4",
      name: "Alexis Manopoulos",
      email: "alexis@example.com",
      phone: "+30 210 555 0123",
      image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face",
      rating: 4.9,
      responseTime: "within 30 minutes",
      verified: true
    }
  }
];

export const sampleUsers = [
  {
    id: "user-1",
    name: "Elena Papadaki",
    email: "elena@example.com",
    userType: "tenant",
    phone: "+30 694 123 4567",
    image: "https://images.unsplash.com/photo-1494790108755-2616c0763a5b?w=150&h=150&fit=crop&crop=face",
    preferences: {
      maxBudget: 1000,
      preferredLocations: ["Athens", "Thessaloniki"],
      petOwner: false,
      smoker: false
    }
  },
  {
    id: "user-2",
    name: "Nikos Stavros",
    email: "nikos@example.com",
    userType: "landlord",
    phone: "+30 210 789 4567",
    image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face",
    properties: ["sample-1", "sample-3"]
  }
];

export const sampleBookings = [
  {
    id: "booking-1",
    propertyId: "sample-1",
    tenantId: "user-1",
    landlordId: "landlord-1",
    type: "application",
    status: "pending",
    moveInDate: new Date("2024-03-01"),
    leaseDuration: 12,
    message: "Hello! I'm very interested in your apartment. I'm a young professional working in tech, non-smoker, and I can provide references. Looking forward to hearing from you!",
    createdAt: new Date("2024-01-15")
  }
];

// Function to seed the database with sample data
export async function seedSampleData() {
  console.log("🌱 Seeding sample data...");

  // This would typically insert data into your actual database
  // For now, we'll just return the sample data

  return {
    properties: sampleProperties,
    users: sampleUsers,
    bookings: sampleBookings
  };
}
