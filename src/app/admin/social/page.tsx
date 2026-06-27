'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { 
  Calendar, 
  TrendingUp, 
  BarChart3, 
  Settings,
  Play,
  Pause,
  Plus,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  Clock,
  Users,
  Hash
} from 'lucide-react';

interface SocialPost {
  id: string;
  title: string;
  content: string;
  subreddit: string;
  status: 'pending' | 'scheduled' | 'posted' | 'failed';
  scheduledTime?: string;
  postedAt?: string;
  figureId: string;
  figureName: string;
  figureImage?: string;
  engagement?: {
    upvotes: number;
    comments: number;
  };
}

interface PostingStats {
  totalPosts: number;
  postedCount: number;
  pendingCount: number;
  averageEngagement: number;
  topSubreddit: string;
}

export default function SocialPostingDashboard() {
  const [posts, setPosts] = useState<SocialPost[]>([
    {
      id: '1',
      title: 'WWE Elite: Batista Deluxe Aggression (2005)',
      content: 'Classic Batista figure from the debut Deluxe Aggression wave...',
      subreddit: 'wrestling_figures',
      status: 'posted',
      postedAt: '2026-06-15T14:30:00Z',
      figureId: 'fp_wrestling_jakks-pacific_deluxe-aggression_1_batista_007d1b',
      figureName: 'Batista',
      figureImage: 'https://cdn.shopify.com/s/files/1/0619/5534/2589/products/s1-bat.jpg',
      engagement: { upvotes: 42, comments: 8 }
    },
    {
      id: '2',
      title: 'Marvel Legends: Iron Man Mark 3',
      content: 'Iconic red and gold armor from the first Iron Man film...',
      subreddit: 'MarvelLegends',
      status: 'scheduled',
      scheduledTime: '2026-06-16T10:00:00Z',
      figureId: 'fp_marvel_hasbro_marvel-legends_mark3_abc123',
      figureName: 'Iron Man',
      figureImage: 'https://example.com/ironman.jpg',
    },
    {
      id: '3',
      title: 'Star Wars Black Series: Darth Vader',
      content: 'The definitive 6-inch scale Vader figure...',
      subreddit: 'starwarsblackseries',
      status: 'pending',
      figureId: 'fp_star-wars_hasbro_black-series_vader_xyz789',
      figureName: 'Darth Vader',
    },
  ]);

  const [stats, setStats] = useState<PostingStats>({
    totalPosts: 24,
    postedCount: 18,
    pendingCount: 6,
    averageEngagement: 32,
    topSubreddit: 'wrestling_figures'
  });

  const [isPostingEnabled, setIsPostingEnabled] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showNewPostModal, setShowNewPostModal] = useState(false);

  // Simulate fetching posts
  useEffect(() => {
    // In production, fetch from your API
    // fetch('/api/social/posts').then(res => res.json()).then(setPosts);
  }, []);

  const handlePostNow = (postId: string) => {
    // Implement post now logic
    alert(`Posting ${postId} now...`);
  };

  const handleSchedulePost = (postId: string, date: string) => {
    // Implement schedule logic
    const updatedPosts = posts.map(post => 
      post.id === postId 
        ? { ...post, status: 'scheduled' as const, scheduledTime: date }
        : post
    );
    setPosts(updatedPosts);
  };

  const handleDeletePost = (postId: string) => {
    if (confirm('Are you sure you want to delete this post?')) {
      setPosts(posts.filter(post => post.id !== postId));
    }
  };

  const getStatusColor = (status: SocialPost['status']) => {
    switch (status) {
      case 'posted': return 'bg-green-100 text-green-800';
      case 'scheduled': return 'bg-blue-100 text-blue-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'failed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: SocialPost['status']) => {
    switch (status) {
      case 'posted': return <CheckCircle className="w-4 h-4" />;
      case 'scheduled': return <Clock className="w-4 h-4" />;
      case 'pending': return <Clock className="w-4 h-4" />;
      case 'failed': return <XCircle className="w-4 h-4" />;
      default: return null;
    }
  };

  const filteredPosts = selectedCategory === 'all' 
    ? posts 
    : posts.filter(post => post.status === selectedCategory);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Social Posting Dashboard</h1>
              <p className="text-gray-600 mt-2">Automatically share your figure collection on Reddit & Twitter</p>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setIsPostingEnabled(!isPostingEnabled)}
                className={`flex items-center px-4 py-2 rounded-lg ${isPostingEnabled ? 'bg-green-100 text-green-800' : 'bg-gray-200 text-gray-800'}`}
              >
                {isPostingEnabled ? (
                  <>
                    <Play className="w-4 h-4 mr-2" />
                    Auto-posting Enabled
                  </>
                ) : (
                  <>
                    <Pause className="w-4 h-4 mr-2" />
                    Auto-posting Paused
                  </>
                )}
              </button>
              <button
                onClick={() => setShowNewPostModal(true)}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                New Post
              </button>
              <button className="p-2 text-gray-600 hover:text-gray-900">
                <Settings className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Posts</p>
                <p className="text-3xl font-bold mt-2">{stats.totalPosts}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <Hash className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Posted</p>
                <p className="text-3xl font-bold mt-2">{stats.postedCount}</p>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Avg. Engagement</p>
                <p className="text-3xl font-bold mt-2">{stats.averageEngagement}</p>
              </div>
              <div className="p-3 bg-purple-100 rounded-lg">
                <Users className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Top Subreddit</p>
                <p className="text-3xl font-bold mt-2">r/{stats.topSubreddit}</p>
              </div>
              <div className="p-3 bg-orange-100 rounded-lg">
                <TrendingUp className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Post Queue */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm">
              <div className="p-6 border-b">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold">Post Queue</h2>
                  <div className="flex space-x-2">
                    {['all', 'pending', 'scheduled', 'posted', 'failed'].map((category) => (
                      <button
                        key={category}
                        onClick={() => setSelectedCategory(category)}
                        className={`px-3 py-1 text-sm rounded-full ${selectedCategory === category ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'}`}
                      >
                        {category.charAt(0).toUpperCase() + category.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="divide-y">
                {filteredPosts.map((post) => (
                  <div key={post.id} className="p-6 hover:bg-gray-50">
                    <div className="flex items-start space-x-4">
                      {/* Figure Image */}
                      {post.figureImage && (
                        <div className="relative w-20 h-20 flex-shrink-0">
                          <Image
                            src={post.figureImage}
                            alt={post.figureName}
                            fill
                            className="object-cover rounded-lg"
                          />
                        </div>
                      )}

                      {/* Post Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-3">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(post.status)}`}>
                              {getStatusIcon(post.status)}
                              <span className="ml-1">{post.status.charAt(0).toUpperCase() + post.status.slice(1)}</span>
                            </span>
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                              r/{post.subreddit}
                            </span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => handlePostNow(post.id)}
                              className="text-sm text-blue-600 hover:text-blue-800"
                            >
                              Post Now
                            </button>
                            <button
                              onClick={() => {/* Edit */}}
                              className="p-1 text-gray-500 hover:text-gray-700"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeletePost(post.id)}
                              className="p-1 text-gray-500 hover:text-red-600"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        <h3 className="font-semibold text-gray-900 mb-1">{post.title}</h3>
                        <p className="text-sm text-gray-600 line-clamp-2 mb-3">{post.content}</p>

                        {/* Engagement Stats */}
                        {post.engagement && (
                          <div className="flex items-center space-x-4 text-sm text-gray-500">
                            <span>▲ {post.engagement.upvotes} upvotes</span>
                            <span>💬 {post.engagement.comments} comments</span>
                            {post.postedAt && (
                              <span>{new Date(post.postedAt).toLocaleDateString()}</span>
                            )}
                          </div>
                        )}

                        {/* Scheduling */}
                        {post.status === 'scheduled' && post.scheduledTime && (
                          <div className="mt-3 flex items-center text-sm text-blue-600">
                            <Clock className="w-4 h-4 mr-1" />
                            Scheduled for {new Date(post.scheduledTime).toLocaleString()}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Schedule Settings */}
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <h3 className="font-semibold text-lg mb-4">Schedule Settings</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Daily Post Time
                  </label>
                  <input
                    type="time"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    defaultValue="10:00"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Posts Per Day
                  </label>
                  <select className="w-full px-3 py-2 border border-gray-300 rounded-lg">
                    <option>1</option>
                    <option>2</option>
                    <option>3</option>
                    <option>5</option>
                  </select>
                </div>
                <button className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                  Save Schedule
                </button>
              </div>
            </div>

            {/* Category Distribution */}
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <h3 className="font-semibold text-lg mb-4">Category Distribution</h3>
              <div className="space-y-3">
                {[
                  { name: 'Wrestling Figures', count: 12, color: 'bg-blue-500' },
                  { name: 'Marvel', count: 6, color: 'bg-red-500' },
                  { name: 'Star Wars', count: 4, color: 'bg-yellow-500' },
                  { name: 'Other', count: 2, color: 'bg-gray-500' },
                ].map((category) => (
                  <div key={category.name} className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className={`w-3 h-3 rounded-full ${category.color} mr-2`} />
                      <span className="text-sm">{category.name}</span>
                    </div>
                    <span className="text-sm font-medium">{category.count}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <h3 className="font-semibold text-lg mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <button className="w-full px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-left">
                  Generate 5 New Posts
                </button>
                <button className="w-full px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-left">
                  Post to Twitter Only
                </button>
                <button className="w-full px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-left">
                  View Analytics
                </button>
                <button className="w-full px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-left">
                  Export Post History
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* New Post Modal (Simplified) */}
      {showNewPostModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold mb-4">Create New Post</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Select Figure</label>
                <select className="w-full px-3 py-2 border rounded-lg">
                  <option>Batista - Deluxe Aggression</option>
                  <option>John Cena - Deluxe Aggression</option>
                  <option>Iron Man - Marvel Legends</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Subreddit</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border rounded-lg"
                  placeholder="wrestling_figures"
                />
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowNewPostModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg"
                >
                  Cancel
                </button>
                <button className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg">
                  Create Post
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}