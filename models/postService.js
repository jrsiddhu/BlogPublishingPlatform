const fs = require('fs');
const path = require('path');
const { isMongoConnected } = require('../config/db');
const Post = require('./Post');
const samplePosts = require('../data/samplePosts');

const FALLBACK_STORE_PATH = path.join(__dirname, '..', 'data', 'fallbackStore.json');

// Ensure fallback file exists with initial data
const initFallbackStore = () => {
  if (!fs.existsSync(FALLBACK_STORE_PATH)) {
    const initialPosts = samplePosts.map((item, index) => {
      const now = new Date(Date.now() - index * 3600000 * 12);
      return {
        _id: `post_${Date.now()}_${index}`,
        ...item,
        slug: item.title.toLowerCase().replace(/[^\w\s-]/g, '').replace(/[\s_-]+/g, '-'),
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
        comments: (item.comments || []).map((c, cIdx) => ({
          _id: `comm_${Date.now()}_${cIdx}`,
          ...c,
          createdAt: c.createdAt ? new Date(c.createdAt).toISOString() : new Date().toISOString()
        }))
      };
    });
    fs.writeFileSync(FALLBACK_STORE_PATH, JSON.stringify(initialPosts, null, 2), 'utf-8');
  }
};

initFallbackStore();

const readFallbackPosts = () => {
  try {
    initFallbackStore();
    const data = fs.readFileSync(FALLBACK_STORE_PATH, 'utf-8');
    return JSON.parse(data);
  } catch (err) {
    console.error('Error reading fallback store:', err);
    return [];
  }
};

const writeFallbackPosts = (posts) => {
  try {
    fs.writeFileSync(FALLBACK_STORE_PATH, JSON.stringify(posts, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error writing fallback store:', err);
  }
};

const postService = {
  // Check active mode
  getStorageMode: () => {
    return isMongoConnected() ? 'MongoDB (Live Database)' : 'Local File Store (MongoDB Fallback)';
  },

  // Get all posts with filtering, searching, and sorting
  getAllPosts: async ({ search, category, sort = 'newest', tag }) => {
    if (isMongoConnected()) {
      const query = { published: true };

      if (category && category !== 'All') {
        query.category = category;
      }

      if (tag) {
        query.tags = { $in: [new RegExp(tag, 'i')] };
      }

      if (search && search.trim()) {
        const regex = new RegExp(search.trim(), 'i');
        query.$or = [
          { title: regex },
          { excerpt: regex },
          { content: regex },
          { category: regex },
          { 'author.name': regex },
          { tags: { $in: [regex] } }
        ];
      }

      let sortOption = { createdAt: -1 };
      if (sort === 'popular' || sort === 'views') {
        sortOption = { views: -1, createdAt: -1 };
      } else if (sort === 'likes') {
        sortOption = { likes: -1, createdAt: -1 };
      } else if (sort === 'oldest') {
        sortOption = { createdAt: 1 };
      }

      return await Post.find(query).sort(sortOption).lean();
    } else {
      // Local Store implementation
      let posts = readFallbackPosts().filter(p => p.published !== false);

      if (category && category !== 'All') {
        posts = posts.filter(p => p.category?.toLowerCase() === category.toLowerCase());
      }

      if (tag) {
        posts = posts.filter(p => p.tags?.some(t => t.toLowerCase() === tag.toLowerCase()));
      }

      if (search && search.trim()) {
        const q = search.trim().toLowerCase();
        posts = posts.filter(p =>
          p.title?.toLowerCase().includes(q) ||
          p.excerpt?.toLowerCase().includes(q) ||
          p.content?.toLowerCase().includes(q) ||
          p.category?.toLowerCase().includes(q) ||
          p.author?.name?.toLowerCase().includes(q) ||
          p.tags?.some(t => t.toLowerCase().includes(q))
        );
      }

      if (sort === 'popular' || sort === 'views') {
        posts.sort((a, b) => (b.views || 0) - (a.views || 0));
      } else if (sort === 'likes') {
        posts.sort((a, b) => (b.likes || 0) - (a.likes || 0));
      } else if (sort === 'oldest') {
        posts.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
      } else {
        posts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      }

      return posts;
    }
  },

  // Get single post by ID (and increment view count)
  getPostById: async (id, incrementView = true) => {
    if (isMongoConnected()) {
      if (incrementView) {
        return await Post.findByIdAndUpdate(id, { $inc: { views: 1 } }, { new: true }).lean();
      }
      return await Post.findById(id).lean();
    } else {
      const posts = readFallbackPosts();
      const index = posts.findIndex(p => p._id === id || p.slug === id);
      if (index === -1) return null;

      if (incrementView) {
        posts[index].views = (posts[index].views || 0) + 1;
        writeFallbackPosts(posts);
      }
      return posts[index];
    }
  },

  // Create new post
  createPost: async (postData) => {
    // Calculate read time
    const wordCount = (postData.content || '').trim().split(/\s+/).length;
    const minutes = Math.max(1, Math.ceil(wordCount / 200));
    postData.readTime = `${minutes} min read`;

    if (isMongoConnected()) {
      const post = new Post(postData);
      return await post.save();
    } else {
      const posts = readFallbackPosts();
      const slugBase = (postData.title || 'untitled')
        .toLowerCase()
        .replace(/[^\w\s-]/g, '')
        .replace(/[\s_-]+/g, '-')
        .replace(/^-+|-+$/g, '');

      const newPost = {
        _id: `post_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
        ...postData,
        slug: `${slugBase}-${Date.now().toString().slice(-4)}`,
        views: 0,
        likes: 0,
        comments: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      posts.unshift(newPost);
      writeFallbackPosts(posts);
      return newPost;
    }
  },

  // Update existing post
  updatePost: async (id, updateData) => {
    if (updateData.content) {
      const wordCount = updateData.content.trim().split(/\s+/).length;
      updateData.readTime = `${Math.max(1, Math.ceil(wordCount / 200))} min read`;
    }

    if (isMongoConnected()) {
      return await Post.findByIdAndUpdate(id, { ...updateData, updatedAt: new Date() }, { new: true, runValidators: true }).lean();
    } else {
      const posts = readFallbackPosts();
      const index = posts.findIndex(p => p._id === id || p.slug === id);
      if (index === -1) return null;

      posts[index] = {
        ...posts[index],
        ...updateData,
        updatedAt: new Date().toISOString()
      };

      writeFallbackPosts(posts);
      return posts[index];
    }
  },

  // Delete post
  deletePost: async (id) => {
    if (isMongoConnected()) {
      return await Post.findByIdAndDelete(id);
    } else {
      const posts = readFallbackPosts();
      const filtered = posts.filter(p => p._id !== id && p.slug !== id);
      const wasDeleted = filtered.length < posts.length;
      if (wasDeleted) {
        writeFallbackPosts(filtered);
      }
      return wasDeleted;
    }
  },

  // Like a post
  likePost: async (id) => {
    if (isMongoConnected()) {
      return await Post.findByIdAndUpdate(id, { $inc: { likes: 1 } }, { new: true }).lean();
    } else {
      const posts = readFallbackPosts();
      const index = posts.findIndex(p => p._id === id || p.slug === id);
      if (index === -1) return null;

      posts[index].likes = (posts[index].likes || 0) + 1;
      writeFallbackPosts(posts);
      return posts[index];
    }
  },

  // Add comment to a post
  addComment: async (id, { author, avatar, text }) => {
    const comment = {
      author: author || 'Thoughtful Reader',
      avatar: avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80',
      text,
      createdAt: new Date()
    };

    if (isMongoConnected()) {
      const updated = await Post.findByIdAndUpdate(
        id,
        { $push: { comments: comment } },
        { new: true, runValidators: true }
      ).lean();
      return updated;
    } else {
      const posts = readFallbackPosts();
      const index = posts.findIndex(p => p._id === id || p.slug === id);
      if (index === -1) return null;

      const newComment = {
        _id: `comm_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
        ...comment,
        createdAt: comment.createdAt.toISOString()
      };

      if (!posts[index].comments) posts[index].comments = [];
      posts[index].comments.push(newComment);
      writeFallbackPosts(posts);
      return posts[index];
    }
  },

  // Get all categories with counts
  getCategories: async () => {
    if (isMongoConnected()) {
      const counts = await Post.aggregate([
        { $match: { published: true } },
        { $group: { _id: '$category', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]);
      return counts.map(c => ({ name: c._id, count: c.count }));
    } else {
      const posts = readFallbackPosts().filter(p => p.published !== false);
      const countMap = {};
      posts.forEach(p => {
        const cat = p.category || 'General';
        countMap[cat] = (countMap[cat] || 0) + 1;
      });
      return Object.entries(countMap).map(([name, count]) => ({ name, count }));
    }
  },

  // Analytics stats for admin dashboard
  getStats: async () => {
    if (isMongoConnected()) {
      const totalPosts = await Post.countDocuments({ published: true });
      const aggregate = await Post.aggregate([
        { $match: { published: true } },
        {
          $group: {
            _id: null,
            totalViews: { $sum: '$views' },
            totalLikes: { $sum: '$likes' },
            totalComments: { $sum: { $size: { $ifNull: ['$comments', []] } } }
          }
        }
      ]);

      const topPosts = await Post.find({ published: true })
        .sort({ views: -1 })
        .limit(5)
        .select('title views likes category readTime')
        .lean();

      const summary = aggregate[0] || { totalViews: 0, totalLikes: 0, totalComments: 0 };

      return {
        totalPosts,
        totalViews: summary.totalViews,
        totalLikes: summary.totalLikes,
        totalComments: summary.totalComments,
        topPosts
      };
    } else {
      const posts = readFallbackPosts().filter(p => p.published !== false);
      const totalPosts = posts.length;
      let totalViews = 0;
      let totalLikes = 0;
      let totalComments = 0;

      posts.forEach(p => {
        totalViews += p.views || 0;
        totalLikes += p.likes || 0;
        totalComments += p.comments ? p.comments.length : 0;
      });

      const topPosts = [...posts]
        .sort((a, b) => (b.views || 0) - (a.views || 0))
        .slice(0, 5)
        .map(p => ({
          _id: p._id,
          title: p.title,
          views: p.views || 0,
          likes: p.likes || 0,
          category: p.category,
          readTime: p.readTime
        }));

      return {
        totalPosts,
        totalViews,
        totalLikes,
        totalComments,
        topPosts
      };
    }
  },

  // Seed sample data into active database
  seedDatabase: async () => {
    if (isMongoConnected()) {
      await Post.deleteMany({});
      const created = await Post.insertMany(samplePosts);
      return created.length;
    } else {
      fs.unlinkSync(FALLBACK_STORE_PATH);
      initFallbackStore();
      return samplePosts.length;
    }
  }
};

module.exports = postService;
