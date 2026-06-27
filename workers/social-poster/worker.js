/**
 * Social Media Poster Worker
 * Generates figure posts from your database
 */

// Sample figure data structure (you'll replace with actual DB query)
const SAMPLE_FIGURES = [
  {
    figure_id: "fp_wrestling_jakks-pacific_deluxe-aggression_1_batista_007d1b",
    character_canonical: "batista",
    v1_name: "Batista",
    fandom: "wrestling",
    sub_fandom: "wwe",
    manufacturer: "jakks-pacific",
    product_line: "deluxe-aggression",
    release_wave: "1",
    year: 2005,
    canonical_image_url: "https://cdn.shopify.com/s/files/1/0619/5534/2589/products/s1-bat.jpg",
    key_features: "Inaugural Deluxe Aggression piece from Jakks anchoring the gimmick-driven format that defined the line."
  },
  {
    figure_id: "fp_wrestling_jakks-pacific_deluxe-aggression_1_john-cena_1ec6e8",
    character_canonical: "john-cena",
    v1_name: "John Cena",
    fandom: "wrestling",
    sub_fandom: "wwe",
    manufacturer: "jakks-pacific",
    product_line: "deluxe-aggression",
    release_wave: "1",
    year: 2005,
    canonical_image_url: "https://cdn.shopify.com/s/files/1/0619/5534/2589/products/s-l1600_0e05e847-292f-4b47-ad8f-4bb8cf710eef.jpg",
    key_features: "Cena headlined the debut 2005 wave that launched Jakks Pacific's Deluxe Aggression sub-brand."
  }
];

// Subreddit mapping by fandom
const SUBREDDIT_MAP = {
  wrestling: ["wrestling_figures", "ActionFigures"],
  marvel: ["MarvelLegends", "ActionFigures"],
  "star-wars": ["starwarsblackseries", "ActionFigures"],
  dc: ["Multiverse", "ActionFigures"]
};

// Generate post content from figure data
function generatePost(figure) {
  const subreddits = SUBREDDIT_MAP[figure.fandom] || ["ActionFigures"];
  const targetSubreddit = subreddits[0];
  
  // Generate engaging title
  const title = `Today's ${figure.fandom === 'wrestling' ? 'WWE' : figure.fandom} Figure: ${figure.v1_name} (${figure.year})`;
  
  // Generate content with FigurePinner link
  const content = `
**${figure.v1_name}** - ${figure.product_line} series (${figure.year})

${figure.key_features || `Part of the ${figure.product_line} collection from ${figure.manufacturer}.`}

Check current prices and more details on FigurePinner:
https://figurepinner.com/figure/${figure.figure_id}

*Posted by the FigurePinner auto-poster. Want to see more figures from this line? Let me know in the comments!*
`;
  
  return {
    title,
    content,
    subreddit: targetSubreddit,
    figure_id: figure.figure_id,
    image_url: figure.canonical_image_url,
    generated_at: new Date().toISOString()
  };
}

// Select random figure from array
function selectRandomFigure(figures) {
  const randomIndex = Math.floor(Math.random() * figures.length);
  return figures[randomIndex];
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    
    // GET /queue/next - Get next post to make
    if (url.pathname === '/queue/next' && request.method === 'GET') {
      try {
        // Select random figure (in production: query from D1)
        const figure = selectRandomFigure(SAMPLE_FIGURES);
        const post = generatePost(figure);
        
        // In production: Store in D1 queue before returning
        // const id = await env.DB.prepare(
        //   "INSERT INTO social_posts (figure_id, title, content, subreddit, status) VALUES (?, ?, ?, ?, 'pending') RETURNING id"
        // ).bind(post.figure_id, post.title, post.content, post.subreddit).first();
        
        // post.id = id;
        
        return new Response(JSON.stringify({
          success: true,
          post,
          message: "Ready for posting"
        }), {
          headers: { 'Content-Type': 'application/json' }
        });
      } catch (error) {
        return new Response(JSON.stringify({
          success: false,
          error: error.message
        }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }
    
    // POST /queue/mark-posted - Mark post as completed
    if (url.pathname === '/queue/mark-posted' && request.method === 'POST') {
      try {
        const data = await request.json();
        
        // In production: Update D1 record
        // await env.DB.prepare(
        //   "UPDATE social_posts SET status = 'posted', posted_at = ? WHERE id = ?"
        // ).bind(new Date().toISOString(), data.id).run();
        
        return new Response(JSON.stringify({
          success: true,
          message: "Post marked as complete"
        }), {
          headers: { 'Content-Type': 'application/json' }
        });
      } catch (error) {
        return new Response(JSON.stringify({
          success: false,
          error: error.message
        }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }
    
    // GET / - Health check
    if (url.pathname === '/' && request.method === 'GET') {
      return new Response(JSON.stringify({
        service: "FigurePinner Social Poster",
        status: "running",
        endpoints: {
          "GET /queue/next": "Get next post to make",
          "POST /queue/mark-posted": "Mark post as completed",
          "GET /stats": "Get posting statistics"
        }
      }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // GET /stats - Statistics
    if (url.pathname === '/stats' && request.method === 'GET') {
      return new Response(JSON.stringify({
        total_figures: SAMPLE_FIGURES.length,
        fandoms: [...new Set(SAMPLE_FIGURES.map(f => f.fandom))],
        status: "Ready to generate posts"
      }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    return new Response('Not Found', { status: 404 });
  }
};