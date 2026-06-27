import { NextRequest, NextResponse } from 'next/server';

// Mock database - replace with your actual D1/KV storage
const mockPosts = [
  {
    id: '1',
    title: 'WWE Elite: Batista Deluxe Aggression (2005)',
    content: 'Classic Batista figure from the debut Deluxe Aggression wave. Check current prices on FigurePinner!',
    subreddit: 'wrestling_figures',
    status: 'posted' as const,
    postedAt: '2026-06-15T14:30:00Z',
    figureId: 'fp_wrestling_jakks-pacific_deluxe-aggression_1_batista_007d1b',
    figureName: 'Batista',
    figureImage: 'https://cdn.shopify.com/s/files/1/0619/5534/2589/products/s1-bat.jpg',
    engagement: { upvotes: 42, comments: 8 }
  },
  {
    id: '2',
    title: 'Marvel Legends: Iron Man Mark 3',
    content: 'Iconic red and gold armor from the first Iron Man film. Part of the Marvel Legends wave 45.',
    subreddit: 'MarvelLegends',
    status: 'scheduled' as const,
    scheduledTime: '2026-06-16T10:00:00Z',
    figureId: 'fp_marvel_hasbro_marvel-legends_mark3_abc123',
    figureName: 'Iron Man',
  },
  {
    id: '3',
    title: 'Star Wars Black Series: Darth Vader',
    content: 'The definitive 6-inch scale Vader figure with incredible detail and accessories.',
    subreddit: 'starwarsblackseries',
    status: 'pending' as const,
    figureId: 'fp_star-wars_hasbro_black-series_vader_xyz789',
    figureName: 'Darth Vader',
  },
];

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status');
    const limit = searchParams.get('limit') || '50';
    
    let posts = mockPosts;
    
    // Filter by status if provided
    if (status && status !== 'all') {
      posts = posts.filter(post => post.status === status);
    }
    
    // Apply limit
    posts = posts.slice(0, parseInt(limit));
    
    return NextResponse.json({
      success: true,
      data: posts,
      pagination: {
        total: mockPosts.length,
        returned: posts.length,
        hasMore: mockPosts.length > posts.length
      }
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to fetch posts' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate required fields
    if (!body.title || !body.content || !body.subreddit) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    // Create new post
    const newPost = {
      id: Date.now().toString(),
      title: body.title,
      content: body.content,
      subreddit: body.subreddit,
      status: (body.scheduleFor ? 'scheduled' : 'pending') as 'scheduled' | 'pending',
      scheduledTime: body.scheduleFor || null,
      figureId: body.figureId || '',
      figureName: body.figureName || '',
      figureImage: body.figureImage || '',
      createdAt: new Date().toISOString(),
    };
    
    // In production: Save to D1/KV
    // await env.DB.prepare('INSERT INTO social_posts ...').run()
    
    mockPosts.unshift(newPost);
    
    return NextResponse.json({
      success: true,
      data: newPost,
      message: 'Post created successfully'
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to create post' },
      { status: 500 }
    );
  }
}