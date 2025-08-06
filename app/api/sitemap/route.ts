import { NextResponse } from 'next/server';
import { generateSitemapUrls } from '@/lib/seo';

export async function GET() {
  try {
    // Get base URLs
    const urls = generateSitemapUrls();

    // TODO: Add dynamic property URLs from database
    // const properties = await getProperties();
    // const propertyUrls = properties.map(property => ({
    //   url: `https://meet2rent.com/property/${property.id}`,
    //   lastModified: property.updatedAt,
    //   changeFrequency: 'weekly' as const,
    //   priority: 0.8,
    // }));
    // urls.push(...propertyUrls);

    // TODO: Add dynamic location URLs
    const popularLocations = [
      'athens',
      'thessaloniki',
      'patras',
      'heraklion',
      'larissa',
      'volos',
      'ioannina',
      'kavala',
      'chania',
      'rhodes'
    ];

    const locationUrls = popularLocations.map(location => ({
      url: `https://meet2rent.com/search?location=${location}`,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 0.7,
    }));

    urls.push(...locationUrls);

    // Generate XML sitemap
    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
${urls.map(({ url, lastModified, changeFrequency, priority }) => `
  <url>
    <loc>${url}</loc>
    <lastmod>${lastModified.toISOString()}</lastmod>
    <changefreq>${changeFrequency}</changefreq>
    <priority>${priority}</priority>
    <xhtml:link rel="alternate" hreflang="el" href="${url.replace('meet2rent.com', 'meet2rent.com/el')}" />
    <xhtml:link rel="alternate" hreflang="en" href="${url.replace('meet2rent.com', 'meet2rent.com/en')}" />
  </url>`).join('')}
</urlset>`;

    return new NextResponse(sitemap, {
      headers: {
        'Content-Type': 'application/xml',
        'Cache-Control': 'public, max-age=3600, s-maxage=3600', // Cache for 1 hour
      },
    });

  } catch (error) {
    console.error('Sitemap generation error:', error);
    return new NextResponse('Error generating sitemap', { status: 500 });
  }
}
