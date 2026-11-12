/**
 * Blog Platform API Client
 * Wraps all HTTP REST calls to the Node.js / Express backend
 */
const API_BASE = '/api';

const BlogAPI = {
  async request(endpoint, options = {}) {
    const defaultHeaders = {
      'Content-Type': 'application/json'
    };

    const config = {
      ...options,
      headers: {
        ...defaultHeaders,
        ...options.headers
      }
    };

    try {
      const response = await fetch(`${API_BASE}${endpoint}`, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || `HTTP error ${response.status}`);
      }

      return data;
    } catch (err) {
      console.error(`API Error [${endpoint}]:`, err);
      throw err;
    }
  },

  // Health / Database Status
  async getStatus() {
    return this.request('/status');
  },

  // Get Posts with filters
  async getPosts(params = {}) {
    const query = new URLSearchParams();
    if (params.search) query.append('search', params.search);
    if (params.category && params.category !== 'All') query.append('category', params.category);
    if (params.sort) query.append('sort', params.sort);
    if (params.tag) query.append('tag', params.tag);

    const queryString = query.toString();
    return this.request(`/posts${queryString ? `?${queryString}` : ''}`);
  },

  // Get Single Post (and trigger view count increment)
  async getPost(id) {
    return this.request(`/posts/${id}`);
  },

  // Create New Post
  async createPost(postData) {
    return this.request('/posts', {
      method: 'POST',
      body: JSON.stringify(postData)
    });
  },

  // Update Existing Post
  async updatePost(id, postData) {
    return this.request(`/posts/${id}`, {
      method: 'PUT',
      body: JSON.stringify(postData)
    });
  },

  // Delete Post
  async deletePost(id) {
    return this.request(`/posts/${id}`, {
      method: 'DELETE'
    });
  },

  // Like a post
  async likePost(id) {
    return this.request(`/posts/${id}/like`, {
      method: 'POST'
    });
  },

  // Add Comment to Post
  async addComment(id, commentData) {
    return this.request(`/posts/${id}/comments`, {
      method: 'POST',
      body: JSON.stringify(commentData)
    });
  },

  // Get Categories and counts
  async getCategories() {
    return this.request('/categories');
  },

  // Get Dashboard Analytics
  async getStats() {
    return this.request('/stats');
  },

  // Seed sample database
  async seed() {
    return this.request('/seed', {
      method: 'POST'
    });
  }
};
