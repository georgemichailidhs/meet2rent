import { NextResponse } from 'next/server';

export async function GET() {
  const robotsContent = `User-agent: *
Allow: /

# Allow important pages
Allow: /search
Allow: /listings
Allow: /property/*
Allow: /info
Allow: /help

# Disallow private/sensitive pages
Disallow: /dashboard/
Disallow: /admin/
Disallow: /api/
Disallow: /auth/
Disallow: /payment/
Disallow: /contracts/
Disallow: /messages/
Disallow: /_next/
Disallow: /tmp/

# Disallow query parameters that might create duplicate content
Disallow: /*?utm_*
Disallow: /*?ref=*
Disallow: /*?src=*
Disallow: /*?fbclid=*
Disallow: /*?gclid=*

# Allow specific bots
User-agent: Googlebot
Allow: /
Crawl-delay: 1

User-agent: Bingbot
Allow: /
Crawl-delay: 1

User-agent: facebookexternalhit
Allow: /

User-agent: Twitterbot
Allow: /

# Block suspicious/aggressive crawlers
User-agent: AhrefsBot
Disallow: /

User-agent: MJ12bot
Disallow: /

User-agent: SemrushBot
Disallow: /

User-agent: DotBot
Disallow: /

# Sitemap location
Sitemap: https://meet2rent.com/sitemap.xml

# Host directive (helps with preferred domain)
Host: https://meet2rent.com
`;

  return new NextResponse(robotsContent, {
    headers: {
      'Content-Type': 'text/plain',
      'Cache-Control': 'public, max-age=86400, s-maxage=86400', // Cache for 24 hours
    },
  });
}
