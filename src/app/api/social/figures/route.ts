import { NextRequest, NextResponse } from 'next/server';

// Mock figure data - replace with your actual figures-reference-v2.js
const mockFigures = [
  {
    figure_id: 'fp_wrestling_jakks-pacific_deluxe-aggression_1_batista_007d1b',
    v1_name: 'Batista',
    fandom: 'wrestling',
    manufacturer: 'jakks-pacific',
    product_line: 'deluxe-aggression',
    release_wave: '1',
    year: 2005,
    canonical_image_url: 'https://cdn.shopify.com/s/files/1/0619/5534/2589/products/s1-bat.jpg',
    key_features: 'Inaugural Deluxe Aggression piece from Jakks',
    search_hints: ['wwe deluxe aggression batista']
  },
  {
    figure_id: 'fp_wrestling_jakks-pacific_deluxe-aggression_1_john-cena_1ec6e8',
    v1_name: 'John Cena',
    fandom: 'wrestling',
    manufacturer: 'jakks-pacific',
    product_line: 'deluxe-aggression',
    release_wave: '1',
    year: 2005,
    canonical_image_url: 'https://cdn.shopify.com/s/files/1/0619/5534/2589/products/s-l1600_0e05e847-292f-4b47-ad8f-4bb8cf710eef.jpg',
    key_features: 'Cena headlined the debut 2005 wave',
    search_hints: ['wwe deluxe aggression john cena']
  },
  {
    figure_id: 'fp_marvel_hasbro_marvel-legends_iron-man_abc123',
    v1_name: 'Iron Man',
    fandom: 'marvel',
    manufacturer: 'hasbro',
    product_line: 'marvel-legends',
    release_wave: '45',
    year: 2023,
    canonical_image_url: 'https://example.com/ironman.jpg',
    key_features: 'Mark 3 armor with light-up arc reactor',
    search_hints: ['marvel legends iron man mark 3']
  },
  {
    figure_id: 'fp_star-wars_hasbro_black-series_vader_xyz789',
    v1_name: 'Darth Vader',
    fandom: 'star-wars',
    manufacturer: 'hasbro',
    product_line: 'black-series',
    release_wave: '12',
    year: 2022,
    canonical_image_url: 'https://example.com/vader.jpg',
    key_features: 'Empire Strikes Back version with removable helmet',
    search_hints: ['star wars black series darth vader']
  }
];

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const fandom = searchParams.get('fandom');
    const limit = searchParams.get('limit') || '20';
    const search = searchParams.get('search');
    
    let figures = mockFigures;
    
    // Filter by fandom if provided
    if (fandom) {
      figures = figures.filter(figure => figure.fandom === fandom);
    }
    
    // Search if provided
    if (search) {
      const searchLower = search.toLowerCase();
      figures = figures.filter(figure => 
        figure.v1_name.toLowerCase().includes(searchLower) ||
        figure.product_line.toLowerCase().includes(searchLower) ||
        figure.search_hints?.some(hint => hint.toLowerCase().includes(searchLower))
      );
    }
    
    // Apply limit
    figures = figures.slice(0, parseInt(limit));
    
    // Get unique fandoms for filter
    const fandoms = Array.from(new Set(mockFigures.map(f => f.fandom)));
    
    return NextResponse.json({
      success: true,
      data: figures,
      filters: {
        fandoms,
        totalFigures: mockFigures.length
      },
      pagination: {
        total: mockFigures.length,
        returned: figures.length,
        hasMore: mockFigures.length > figures.length
      }
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to fetch figures' },
      { status: 500 }
    );
  }
}