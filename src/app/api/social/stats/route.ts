import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Mock stats - replace with actual data from your database
    const stats = {
      totalPosts: 24,
      postedCount: 18,
      pendingCount: 6,
      failedCount: 0,
      averageEngagement: 32,
      topSubreddit: 'wrestling_figures',
      topPerformingPosts: [
        { title: 'WWE Elite Batista', engagement: 87, subreddit: 'wrestling_figures' },
        { title: 'Marvel Legends Iron Man', engagement: 64, subreddit: 'MarvelLegends' },
        { title: 'Star Wars Vader', engagement: 42, subreddit: 'starwarsblackseries' },
      ],
      categoryDistribution: [
        { name: 'Wrestling Figures', count: 12, percentage: 50 },
        { name: 'Marvel', count: 6, percentage: 25 },
        { name: 'Star Wars', count: 4, percentage: 16.7 },
        { name: 'DC', count: 1, percentage: 4.2 },
        { name: 'Other', count: 1, percentage: 4.2 },
      ],
      postingSchedule: {
        enabled: true,
        dailyTime: '10:00',
        postsPerDay: 1,
        nextScheduled: '2026-06-16T10:00:00Z'
      }
    };
    
    return NextResponse.json({
      success: true,
      data: stats,
      updatedAt: new Date().toISOString()
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to fetch stats' },
      { status: 500 }
    );
  }
}