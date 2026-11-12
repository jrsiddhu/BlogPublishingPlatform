const mongoose = require('mongoose');

// Comment Sub-schema
const CommentSchema = new mongoose.Schema(
  {
    author: {
      type: String,
      required: [true, 'Comment author name is required'],
      trim: true,
      default: 'Anonymous Reader'
    },
    avatar: {
      type: String,
      default: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80'
    },
    text: {
      type: String,
      required: [true, 'Comment message cannot be empty'],
      trim: true,
      maxlength: 1000
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  },
  { _id: true }
);

// Main Blog Post Schema
const PostSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Please provide a post title'],
      trim: true,
      maxlength: [180, 'Title cannot exceed 180 characters']
    },
    slug: {
      type: String,
      lowercase: true,
      trim: true
    },
    excerpt: {
      type: String,
      required: [true, 'Please provide a short excerpt/summary'],
      trim: true,
      maxlength: [350, 'Excerpt cannot exceed 350 characters']
    },
    content: {
      type: String,
      required: [true, 'Article content is required']
    },
    author: {
      name: {
        type: String,
        default: 'Alex Rivera',
        trim: true
      },
      role: {
        type: String,
        default: 'Content Creator',
        trim: true
      },
      avatar: {
        type: String,
        default: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=120&q=80'
      }
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      trim: true,
      default: 'Technology'
    },
    tags: {
      type: [String],
      default: []
    },
    coverImage: {
      type: String,
      default: 'https://images.unsplash.com/photo-1499750310107-5fef28a66643?auto=format&fit=crop&w=1200&q=80'
    },
    readTime: {
      type: String,
      default: '3 min read'
    },
    views: {
      type: Number,
      default: 0
    },
    likes: {
      type: Number,
      default: 0
    },
    comments: [CommentSchema],
    featured: {
      type: Boolean,
      default: false
    },
    published: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Slug generator pre-save middleware
PostSchema.pre('save', function (next) {
  if (this.isModified('title') || !this.slug) {
    const slugBase = this.title
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
    this.slug = `${slugBase}-${Date.now().toString().slice(-4)}`;
  }

  // Calculate read time dynamically if not explicitly specified
  if (this.isModified('content')) {
    const wordCount = (this.content || '').trim().split(/\s+/).length;
    const minutes = Math.max(1, Math.ceil(wordCount / 200));
    this.readTime = `${minutes} min read`;
  }

  next();
});

// Text indexing for fast search
PostSchema.index({
  title: 'text',
  content: 'text',
  excerpt: 'text',
  category: 'text',
  tags: 'text'
});

PostSchema.index({ category: 1, createdAt: -1 });

module.exports = mongoose.model('Post', PostSchema);
