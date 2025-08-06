import type { Metadata } from 'next';

// Base SEO configuration for Greek rental market
export const siteConfig = {
  name: 'Meet2Rent',
  description: 'Η κορυφαία ψηφιακή πλατφόρμα ενοικίασης για μακροπρόθεσμες μισθώσεις στην Ελλάδα. Βρείτε το τέλειο σπίτι ή ενοικιάστε το ακίνητό σας με πλήρη ψηφιακή διαδικασία.',
  descriptionEn: 'Greece\'s premier digital rental platform for long-term property rentals. Find your perfect home or rent out your property with complete digital processes.',
  url: 'https://meet2rent.com',
  ogImage: 'https://meet2rent.com/og-image.jpg',
  creator: '@meet2rent',
  keywords: [
    // Greek keywords
    'ενοικίαση',
    'μίσθωση',
    'ακίνητα',
    'διαμερίσματα',
    'Αθήνα',
    'Θεσσαλονίκη',
    'ψηφιακή πλατφόρμα',
    'ενοικιαστής',
    'ιδιοκτήτης',
    'μακροπρόθεσμη μίσθωση',

    // English keywords
    'Greece rentals',
    'Athens apartments',
    'Thessaloniki properties',
    'long-term rental',
    'digital platform',
    'property rental',
    'tenant verification',
    'landlord services',
    'rental contracts',
    'online payments'
  ],
  structuredData: {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Meet2Rent',
    url: 'https://meet2rent.com',
    logo: 'https://meet2rent.com/logo-meet2rent.png',
    description: 'Digital platform for long-term property rentals in Greece',
    foundingDate: '2024',
    address: {
      '@type': 'PostalAddress',
      addressCountry: 'GR',
      addressLocality: 'Athens'
    },
    contactPoint: {
      '@type': 'ContactPoint',
      telephone: '+30-210-555-0100',
      contactType: 'customer service',
      availableLanguage: ['Greek', 'English']
    },
    sameAs: [
      'https://www.facebook.com/meet2rent',
      'https://www.instagram.com/meet2rent',
      'https://www.linkedin.com/company/meet2rent'
    ]
  }
};

// Generate metadata for pages
export function generatePageMetadata({
  title,
  description,
  path = '',
  image,
  noIndex = false,
  keywords = [],
  locale = 'el_GR'
}: {
  title: string;
  description: string;
  path?: string;
  image?: string;
  noIndex?: boolean;
  keywords?: string[];
  locale?: 'el_GR' | 'en_US';
}): Metadata {
  const url = `${siteConfig.url}${path}`;
  const ogImage = image || siteConfig.ogImage;

  return {
    title: `${title} | ${siteConfig.name}`,
    description,
    keywords: [...siteConfig.keywords, ...keywords].join(', '),
    authors: [{ name: siteConfig.name }],
    creator: siteConfig.creator,
    openGraph: {
      type: 'website',
      locale,
      url,
      title,
      description,
      siteName: siteConfig.name,
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [ogImage],
      creator: siteConfig.creator,
    },
    robots: {
      index: !noIndex,
      follow: !noIndex,
      googleBot: {
        index: !noIndex,
        follow: !noIndex,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
    alternates: {
      canonical: url,
      languages: {
        'el-GR': `${siteConfig.url}/el${path}`,
        'en-US': `${siteConfig.url}/en${path}`,
      },
    },
  };
}

// Property structured data
export function generatePropertyStructuredData(property: {
  id: number;
  title: string;
  description: string;
  price: number;
  location: string;
  type: string;
  bedrooms: number;
  bathrooms: number;
  area: number;
  images: string[];
  features: string[];
  landlord: {
    name: string;
    rating: number;
  };
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'RealEstateListing',
    name: property.title,
    description: property.description,
    url: `${siteConfig.url}/property/${property.id}`,
    image: property.images,
    datePosted: new Date().toISOString(),
    validThrough: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(), // 90 days
    offers: {
      '@type': 'Offer',
      price: property.price,
      priceCurrency: 'EUR',
      priceSpecification: {
        '@type': 'UnitPriceSpecification',
        price: property.price,
        priceCurrency: 'EUR',
        unitCode: 'MON',
        unitText: 'monthly'
      },
      availability: 'https://schema.org/InStock'
    },
    address: {
      '@type': 'PostalAddress',
      addressLocality: property.location,
      addressCountry: 'GR'
    },
    floorSize: {
      '@type': 'QuantitativeValue',
      value: property.area,
      unitCode: 'MTK'
    },
    numberOfRooms: property.bedrooms,
    numberOfBathroomsTotal: property.bathrooms,
    accommodationCategory: property.type,
    amenityFeature: property.features.map(feature => ({
      '@type': 'LocationFeatureSpecification',
      name: feature
    })),
    landlord: {
      '@type': 'Person',
      name: property.landlord.name,
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: property.landlord.rating,
        ratingCount: 1,
        bestRating: 5,
        worstRating: 1
      }
    }
  };
}

// Review structured data
export function generateReviewStructuredData(review: {
  id: string;
  rating: number;
  comment: string;
  author: string;
  date: Date;
  property: {
    id: number;
    title: string;
  };
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Review',
    reviewRating: {
      '@type': 'Rating',
      ratingValue: review.rating,
      bestRating: 5,
      worstRating: 1
    },
    reviewBody: review.comment,
    author: {
      '@type': 'Person',
      name: review.author
    },
    datePublished: review.date.toISOString(),
    itemReviewed: {
      '@type': 'RealEstateListing',
      name: review.property.title,
      url: `${siteConfig.url}/property/${review.property.id}`
    }
  };
}

// Search page structured data
export function generateSearchStructuredData() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    url: siteConfig.url,
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${siteConfig.url}/search?q={search_term_string}&location={location}`
      },
      'query-input': [
        'required name=search_term_string',
        'required name=location'
      ]
    }
  };
}

// FAQ structured data for help pages
export function generateFAQStructuredData(faqs: Array<{
  question: string;
  answer: string;
}>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map(faq => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer
      }
    }))
  };
}

// Service structured data
export function generateServiceStructuredData() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: 'Meet2Rent Digital Rental Platform',
    description: 'Complete digital platform for long-term property rentals in Greece',
    provider: {
      '@type': 'Organization',
      name: 'Meet2Rent',
      url: siteConfig.url
    },
    areaServed: {
      '@type': 'Country',
      name: 'Greece'
    },
    serviceType: 'Real Estate Rental Service',
    offers: {
      '@type': 'Offer',
      description: 'Digital rental platform services for tenants and landlords'
    }
  };
}

// Breadcrumb structured data
export function generateBreadcrumbStructuredData(items: Array<{
  name: string;
  url: string;
}>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url
    }))
  };
}

// Generate sitemap data
export function generateSitemapUrls() {
  const baseUrls = [
    { url: '', priority: 1.0, changeFreq: 'daily' },
    { url: '/search', priority: 0.9, changeFreq: 'daily' },
    { url: '/listings', priority: 0.8, changeFreq: 'daily' },
    { url: '/auth/signin', priority: 0.7, changeFreq: 'weekly' },
    { url: '/auth/signup', priority: 0.7, changeFreq: 'weekly' },
    { url: '/info', priority: 0.6, changeFreq: 'weekly' },
    { url: '/help', priority: 0.6, changeFreq: 'weekly' },
    { url: '/privacy', priority: 0.5, changeFreq: 'monthly' },
    { url: '/terms', priority: 0.5, changeFreq: 'monthly' },
  ];

  return baseUrls.map(({ url, priority, changeFreq }) => ({
    url: `${siteConfig.url}${url}`,
    lastModified: new Date(),
    changeFrequency: changeFreq as 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never',
    priority,
  }));
}

// Hreflang generator
export function generateHreflangs(path: string) {
  return [
    { rel: 'alternate', hreflang: 'el', href: `${siteConfig.url}/el${path}` },
    { rel: 'alternate', hreflang: 'en', href: `${siteConfig.url}/en${path}` },
    { rel: 'alternate', hreflang: 'x-default', href: `${siteConfig.url}${path}` },
  ];
}

// Performance optimization hints
export function generateResourceHints() {
  return [
    { rel: 'dns-prefetch', href: '//fonts.googleapis.com' },
    { rel: 'dns-prefetch', href: '//www.google-analytics.com' },
    { rel: 'dns-prefetch', href: '//js.stripe.com' },
    { rel: 'dns-prefetch', href: '//res.cloudinary.com' },
    { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossOrigin: 'anonymous' },
    { rel: 'preconnect', href: 'https://api.stripe.com', crossOrigin: 'anonymous' },
  ];
}
