require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { connectDB, isMongoConnected } = require('./config/db');
const postService = require('./models/postService');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static frontend files (HTML, CSS, JS)
app.use(express.static(path.join(__dirname, 'public')));

// ----------------------------------------------------
// REST API ROUTES
// ----------------------------------------------------

// Server & Database Health Check
app.get('/api/status', (req, res) => {
  res.json({
    status: 'online',
    timestamp: new Date().toISOString(),
    database: {
      connected: isMongoConnected(),
      mode: postService.getStorageMode(),
      uri: isMongoConnected() ? (process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/blog_publishing_platform') : 'Local Storage Mode (Active)'
    }
  });
});

// Get all posts with filtering, search, sorting
app.get('/api/posts', async (req, res) => {
  try {
    const { search, category, sort, tag } = req.query;
    const posts = await postService.getAllPosts({ search, category, sort, tag });
    res.json({ success: true, count: posts.length, data: posts });
  } catch (err) {
    console.error('Error fetching posts:', err);
    res.status(500).json({ success: false, message: 'Server error fetching posts', error: err.message });
  }
});

// Get categories with count
app.get('/api/categories', async (req, res) => {
  try {
    const categories = await postService.getCategories();
    res.json({ success: true, data: categories });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error retrieving categories', error: err.message });
  }
});

// Get Dashboard Analytics
app.get('/api/stats', async (req, res) => {
  try {
    const stats = await postService.getStats();
    res.json({ success: true, data: stats });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error fetching dashboard stats', error: err.message });
  }
});

// Get single post by ID
app.get('/api/posts/:id', async (req, res) => {
  try {
    const post = await postService.getPostById(req.params.id, true);
    if (!post) {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }
    res.json({ success: true, data: post });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error retrieving post', error: err.message });
  }
});

// Create new post
app.post('/api/posts', async (req, res) => {
  try {
    const { title, excerpt, content, category, author, tags, coverImage, featured } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ success: false, message: 'Title is required' });
    }
    if (!excerpt || !excerpt.trim()) {
      return res.status(400).json({ success: false, message: 'Excerpt is required' });
    }
    if (!content || !content.trim()) {
      return res.status(400).json({ success: false, message: 'Content is required' });
    }

    const postData = {
      title: title.trim(),
      excerpt: excerpt.trim(),
      content: content.trim(),
      category: category ? category.trim() : 'Technology',
      author: {
        name: (author && author.name) ? author.name.trim() : 'Alex Rivera',
        role: (author && author.role) ? author.role.trim() : 'Content Creator',
        avatar: (author && author.avatar) ? author.avatar.trim() : 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=120&q=80'
      },
      tags: Array.isArray(tags) ? tags : (tags ? tags.split(',').map(t => t.trim()).filter(Boolean) : []),
      coverImage: coverImage && coverImage.trim() ? coverImage.trim() : 'https://images.unsplash.com/photo-1499750310107-5fef28a66643?auto=format&fit=crop&w=1200&q=80',
      featured: Boolean(featured)
    };

    const newPost = await postService.createPost(postData);
    res.status(201).json({ success: true, message: 'Post created successfully', data: newPost });
  } catch (err) {
    console.error('Error creating post:', err);
    res.status(400).json({ success: false, message: err.message });
  }
});

// Update post
app.put('/api/posts/:id', async (req, res) => {
  try {
    const { title, excerpt, content, category, author, tags, coverImage, featured } = req.body;
    const updateData = {};

    if (title !== undefined) updateData.title = title.trim();
    if (excerpt !== undefined) updateData.excerpt = excerpt.trim();
    if (content !== undefined) updateData.content = content.trim();
    if (category !== undefined) updateData.category = category.trim();
    if (coverImage !== undefined) updateData.coverImage = coverImage.trim();
    if (featured !== undefined) updateData.featured = Boolean(featured);
    if (author) {
      updateData.author = {
        name: author.name ? author.name.trim() : 'Alex Rivera',
        role: author.role ? author.role.trim() : 'Contributor',
        avatar: author.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=120&q=80'
      };
    }
    if (tags !== undefined) {
      updateData.tags = Array.isArray(tags) ? tags : tags.split(',').map(t => t.trim()).filter(Boolean);
    }

    const updated = await postService.updatePost(req.params.id, updateData);
    if (!updated) {
      return res.status(404).json({ success: false, message: 'Post not found for update' });
    }
    res.json({ success: true, message: 'Post updated successfully', data: updated });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// Delete post
app.delete('/api/posts/:id', async (req, res) => {
  try {
    const deleted = await postService.deletePost(req.params.id);
    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }
    res.json({ success: true, message: 'Post deleted successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error deleting post', error: err.message });
  }
});

// Like a post
app.post('/api/posts/:id/like', async (req, res) => {
  try {
    const updated = await postService.likePost(req.params.id);
    if (!updated) {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }
    res.json({ success: true, likes: updated.likes });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error liking post', error: err.message });
  }
});

// Add comment to post
app.post('/api/posts/:id/comments', async (req, res) => {
  try {
    const { author, avatar, text } = req.body;
    if (!text || !text.trim()) {
      return res.status(400).json({ success: false, message: 'Comment text cannot be empty' });
    }

    const updated = await postService.addComment(req.params.id, {
      author: author ? author.trim() : 'Reader',
      avatar,
      text: text.trim()
    });

    if (!updated) {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }

    const latestComment = updated.comments[updated.comments.length - 1];
    res.status(201).json({ success: true, message: 'Comment posted', comment: latestComment, comments: updated.comments });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// Seed sample posts endpoint
app.post('/api/seed', async (req, res) => {
  try {
    const count = await postService.seedDatabase();
    res.json({ success: true, message: `Successfully seeded ${count} sample posts!` });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Seed failed', error: err.message });
  }
});

// Route fallback: send index.html for any unhandled GET route
app.use((req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Server Initialization
const startServer = async () => {
  await connectDB();

  app.listen(PORT, () => {
    console.log(`\n======================================================`);
    console.log(`🚀 Blog Publishing Platform Server is Running!`);
    console.log(`🌐 Local URL: \x1b[34mhttp://localhost:${PORT}\x1b[0m`);
    console.log(`📡 Storage:   \x1b[32m${postService.getStorageMode()}\x1b[0m`);
    console.log(`======================================================\n`);
  });
};

startServer();
