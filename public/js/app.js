/**
 * Inkflow - Modern Blog Publishing Platform
 * Main Client Application Controller (Vanilla JavaScript)
 */

document.addEventListener('DOMContentLoaded', () => {
  // Application State
  const state = {
    activeView: 'feed',
    posts: [],
    currentPost: null,
    editingPostId: null,
    categories: [],
    activeCategory: 'All',
    searchQuery: '',
    sortBy: 'newest',
    likedPostIds: new Set(JSON.parse(localStorage.getItem('inkflow_likes') || '[]')),
    theme: localStorage.getItem('inkflow_theme') || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'),
    pendingDeleteId: null
  };

  // DOM Elements Cache
  const elements = {
    // Nav & Controls
    brandLogo: document.getElementById('brandLogo'),
    navFeedBtn: document.getElementById('navFeedBtn'),
    navWriteBtn: document.getElementById('navWriteBtn'),
    navDashboardBtn: document.getElementById('navDashboardBtn'),
    themeToggleBtn: document.getElementById('themeToggleBtn'),
    themeIcon: document.getElementById('themeIcon'),
    dbStatusPill: document.getElementById('dbStatusPill'),
    searchInput: document.getElementById('globalSearchInput'),
    searchClearBtn: document.getElementById('searchClearBtn'),

    // Views
    viewFeed: document.getElementById('viewFeed'),
    viewReader: document.getElementById('viewReader'),
    viewEditor: document.getElementById('viewEditor'),
    viewDashboard: document.getElementById('viewDashboard'),

    // Feed Components
    heroBanner: document.getElementById('heroBanner'),
    categoryFilterBar: document.getElementById('categoryFilterBar'),
    feedSortSelect: document.getElementById('feedSortSelect'),
    feedCountDisplay: document.getElementById('feedCountDisplay'),
    postsGrid: document.getElementById('postsGrid'),
    emptyState: document.getElementById('emptyState'),

    // Reader Components
    readerBackBtn: document.getElementById('readerBackBtn'),
    readerCategory: document.getElementById('readerCategory'),
    readerReadTime: document.getElementById('readerReadTime'),
    readerTitle: document.getElementById('readerTitle'),
    readerAuthorAvatar: document.getElementById('readerAuthorAvatar'),
    readerAuthorName: document.getElementById('readerAuthorName'),
    readerAuthorRole: document.getElementById('readerAuthorRole'),
    readerDate: document.getElementById('readerDate'),
    readerCoverWrap: document.getElementById('readerCoverWrap'),
    readerCoverImg: document.getElementById('readerCoverImg'),
    readerContent: document.getElementById('readerContent'),
    readerTagsList: document.getElementById('readerTagsList'),
    readerLikeBtn: document.getElementById('readerLikeBtn'),
    readerLikeCount: document.getElementById('readerLikeCount'),
    readerCommentCount: document.getElementById('readerCommentCount'),
    commentsList: document.getElementById('commentsList'),
    commentForm: document.getElementById('commentForm'),
    commentAuthorInput: document.getElementById('commentAuthorInput'),
    commentTextInput: document.getElementById('commentTextInput'),

    // Editor Components
    editorHeading: document.getElementById('editorHeading'),
    postForm: document.getElementById('postForm'),
    postIdInput: document.getElementById('postIdInput'),
    postTitleInput: document.getElementById('postTitleInput'),
    postCategorySelect: document.getElementById('postCategorySelect'),
    postTagsInput: document.getElementById('postTagsInput'),
    postAuthorNameInput: document.getElementById('postAuthorNameInput'),
    postAuthorRoleInput: document.getElementById('postAuthorRoleInput'),
    postCoverImageInput: document.getElementById('postCoverImageInput'),
    coverPreviewBox: document.getElementById('coverPreviewBox'),
    postExcerptInput: document.getElementById('postExcerptInput'),
    postContentInput: document.getElementById('postContentInput'),
    editorPreviewPane: document.getElementById('editorPreviewPane'),
    tabWriteBtn: document.getElementById('tabWriteBtn'),
    tabPreviewBtn: document.getElementById('tabPreviewBtn'),
    editorCancelBtn: document.getElementById('editorCancelBtn'),

    // Dashboard Components
    statTotalPosts: document.getElementById('statTotalPosts'),
    statTotalViews: document.getElementById('statTotalViews'),
    statTotalLikes: document.getElementById('statTotalLikes'),
    statTotalComments: document.getElementById('statTotalComments'),
    dashboardPostsTableBody: document.getElementById('dashboardPostsTableBody'),
    btnSeedData: document.getElementById('btnSeedData'),

    // Modal & Toast
    deleteModal: document.getElementById('deleteModal'),
    btnCancelDelete: document.getElementById('btnCancelDelete'),
    btnConfirmDelete: document.getElementById('btnConfirmDelete'),
    toastContainer: document.getElementById('toastContainer')
  };

  // ==========================================================================
  // Helper & Utility Functions
  // ==========================================================================

  const showToast = (message, type = 'info') => {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;

    let icon = 'ℹ️';
    if (type === 'success') icon = '✔';
    if (type === 'error') icon = '✖';

    toast.innerHTML = `<span>${icon}</span> <span>${message}</span>`;
    elements.toastContainer.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      setTimeout(() => toast.remove(), 300);
    }, 3500);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const applyTheme = (theme) => {
    document.documentElement.setAttribute('data-theme', theme);
    state.theme = theme;
    localStorage.setItem('inkflow_theme', theme);
    if (elements.themeIcon) {
      elements.themeIcon.textContent = theme === 'dark' ? '☀️' : '🌙';
    }
  };

  // ==========================================================================
  // Database Status Check
  // ==========================================================================

  const checkDbStatus = async () => {
    try {
      const res = await BlogAPI.getStatus();
      if (elements.dbStatusPill) {
        if (res.database.connected) {
          elements.dbStatusPill.innerHTML = `<span class="status-dot"></span> MongoDB Active`;
          elements.dbStatusPill.title = `Connected to ${res.database.uri}`;
        } else {
          elements.dbStatusPill.innerHTML = `<span class="status-dot local-mode"></span> Local Store Mode`;
          elements.dbStatusPill.title = `Running via local store. Connect MongoDB anytime to switch.`;
        }
      }
    } catch (err) {
      console.warn('Status check failed:', err);
    }
  };

  // ==========================================================================
  // Navigation & View Routing
  // ==========================================================================

  const switchView = (viewName, pushHash = true) => {
    state.activeView = viewName;

    // Toggle active classes on view containers
    [elements.viewFeed, elements.viewReader, elements.viewEditor, elements.viewDashboard].forEach(el => {
      if (el) el.classList.remove('active');
    });

    [elements.navFeedBtn, elements.navDashboardBtn].forEach(el => {
      if (el) el.classList.remove('active');
    });

    if (viewName === 'feed') {
      elements.viewFeed.classList.add('active');
      elements.navFeedBtn.classList.add('active');
      loadPosts();
      loadCategories();
      if (pushHash) window.location.hash = '';
    } else if (viewName === 'reader') {
      elements.viewReader.classList.add('active');
      if (state.currentPost && pushHash) {
        window.location.hash = `post-${state.currentPost._id}`;
      }
    } else if (viewName === 'editor') {
      elements.viewEditor.classList.add('active');
      if (pushHash) window.location.hash = state.editingPostId ? `edit-${state.editingPostId}` : 'write';
    } else if (viewName === 'dashboard') {
      elements.viewDashboard.classList.add('active');
      elements.navDashboardBtn.classList.add('active');
      loadDashboard();
      if (pushHash) window.location.hash = 'dashboard';
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // ==========================================================================
  // Feed View Controller
  // ==========================================================================

  const loadPosts = async () => {
    try {
      elements.postsGrid.innerHTML = `
        <div style="grid-column: 1/-1; text-align: center; padding: 3rem; color: var(--text-muted);">
          Loading articles...
        </div>
      `;

      const response = await BlogAPI.getPosts({
        search: state.searchQuery,
        category: state.activeCategory,
        sort: state.sortBy
      });

      state.posts = response.data || [];
      renderPostsGrid(state.posts);
      renderHeroBanner(state.posts);
    } catch (err) {
      elements.postsGrid.innerHTML = `
        <div style="grid-column: 1/-1; text-align: center; padding: 3rem; color: var(--danger);">
          Failed to load articles. Please verify server connection.
        </div>
      `;
    }
  };

  const loadCategories = async () => {
    try {
      const res = await BlogAPI.getCategories();
      state.categories = res.data || [];
      renderCategoryFilter(state.categories);
    } catch (err) {
      console.warn('Error loading categories:', err);
    }
  };

  const renderCategoryFilter = (categories) => {
    if (!elements.categoryFilterBar) return;

    const totalCount = categories.reduce((sum, c) => sum + c.count, 0);

    let html = `
      <button class="cat-pill ${state.activeCategory === 'All' ? 'active' : ''}" data-category="All">
        All (${totalCount})
      </button>
    `;

    categories.forEach(cat => {
      const isActive = state.activeCategory === cat.name;
      html += `
        <button class="cat-pill ${isActive ? 'active' : ''}" data-category="${cat.name}">
          ${cat.name} (${cat.count})
        </button>
      `;
    });

    elements.categoryFilterBar.innerHTML = html;

    // Attach click events
    elements.categoryFilterBar.querySelectorAll('.cat-pill').forEach(btn => {
      btn.addEventListener('click', () => {
        state.activeCategory = btn.dataset.category;
        renderCategoryFilter(state.categories);
        loadPosts();
      });
    });
  };

  const renderHeroBanner = (posts) => {
    if (!elements.heroBanner) return;

    // Find featured post or latest post
    const featured = posts.find(p => p.featured) || posts[0];
    if (!featured) {
      elements.heroBanner.style.display = 'none';
      return;
    }

    elements.heroBanner.style.display = 'block';
    elements.heroBanner.innerHTML = `
      <span class="hero-featured-tag">★ Featured Story</span>
      <h1 class="hero-title" data-id="${featured._id}">${featured.title}</h1>
      <p class="hero-excerpt">${featured.excerpt}</p>
      <div class="hero-meta">
        <div class="author-chip">
          <img src="${featured.author?.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=120&q=80'}" alt="${featured.author?.name}" class="author-avatar" />
          <div>
            <div class="author-meta-name">${featured.author?.name || 'Author'}</div>
            <div class="author-meta-role">${featured.category} • ${featured.readTime || '3 min read'}</div>
          </div>
        </div>
        <div class="hero-stats">
          <span>👀 ${featured.views || 0} reads</span>
          <span>💖 ${featured.likes || 0} claps</span>
          <span>💬 ${(featured.comments || []).length} thoughts</span>
        </div>
      </div>
    `;

    elements.heroBanner.querySelector('.hero-title').addEventListener('click', () => {
      openReader(featured._id);
    });
  };

  const renderPostsGrid = (posts) => {
    if (!elements.postsGrid) return;

    elements.feedCountDisplay.innerHTML = `Showing <strong>${posts.length}</strong> ${posts.length === 1 ? 'story' : 'stories'}`;

    if (posts.length === 0) {
      elements.postsGrid.style.display = 'none';
      elements.emptyState.style.display = 'block';
      return;
    }

    elements.emptyState.style.display = 'none';
    elements.postsGrid.style.display = 'grid';

    elements.postsGrid.innerHTML = posts.map(post => {
      const isLiked = state.likedPostIds.has(post._id);
      const tagsHtml = (post.tags || []).slice(0, 3).map(t => `<span class="card-tag">#${t}</span>`).join('');

      return `
        <article class="post-card" data-id="${post._id}">
          <div class="card-image-wrap open-reader-trigger">
            <img src="${post.coverImage || 'https://images.unsplash.com/photo-1499750310107-5fef28a66643?auto=format&fit=crop&w=800&q=80'}" alt="${post.title}" class="card-image" loading="lazy" />
            <span class="card-category-badge">${post.category || 'Article'}</span>
            <span class="card-readtime-badge">${post.readTime || '3 min read'}</span>
          </div>

          <div class="card-body">
            <h3 class="card-title open-reader-trigger">${post.title}</h3>
            <p class="card-excerpt">${post.excerpt}</p>
            
            ${tagsHtml ? `<div class="card-tags">${tagsHtml}</div>` : ''}

            <div class="card-footer">
              <div class="card-author-info">
                <img src="${post.author?.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=120&q=80'}" alt="${post.author?.name}" class="card-author-img" />
                <span>${post.author?.name || 'Author'}</span>
              </div>

              <div class="card-actions">
                <button class="action-btn card-like-btn ${isLiked ? 'liked' : ''}" data-id="${post._id}" title="Clap / Like">
                  <span>${isLiked ? '💖' : '🤍'}</span>
                  <span class="like-counter">${post.likes || 0}</span>
                </button>
                <button class="action-btn card-comment-btn" data-id="${post._id}" title="Comments">
                  <span>💬</span>
                  <span>${(post.comments || []).length}</span>
                </button>
              </div>
            </div>
          </div>
        </article>
      `;
    }).join('');

    // Attach card event listeners
    elements.postsGrid.querySelectorAll('.post-card').forEach(card => {
      const id = card.dataset.id;

      // Click title or image to open reader
      card.querySelectorAll('.open-reader-trigger').forEach(el => {
        el.addEventListener('click', () => openReader(id));
      });

      // Like button on card
      const likeBtn = card.querySelector('.card-like-btn');
      if (likeBtn) {
        likeBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          handleLikePost(id, likeBtn);
        });
      }

      // Comment button triggers reader and scrolls to comments
      const commentBtn = card.querySelector('.card-comment-btn');
      if (commentBtn) {
        commentBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          openReader(id, true);
        });
      }
    });
  };

  // ==========================================================================
  // Reader View Controller
  // ==========================================================================

  const openReader = async (postId, scrollToComments = false) => {
    try {
      const res = await BlogAPI.getPost(postId);
      const post = res.data;
      if (!post) throw new Error('Post not found');

      state.currentPost = post;
      renderReader(post);
      switchView('reader');

      if (scrollToComments) {
        setTimeout(() => {
          elements.commentsSection?.scrollIntoView({ behavior: 'smooth' });
        }, 200);
      }
    } catch (err) {
      showToast('Could not load article: ' + err.message, 'error');
    }
  };

  const renderReader = (post) => {
    elements.readerCategory.textContent = post.category || 'Story';
    elements.readerReadTime.textContent = post.readTime || '3 min read';
    elements.readerTitle.textContent = post.title;

    elements.readerAuthorAvatar.src = post.author?.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=120&q=80';
    elements.readerAuthorName.textContent = post.author?.name || 'Anonymous Author';
    elements.readerAuthorRole.textContent = post.author?.role || 'Creator';
    elements.readerDate.textContent = `Published on ${formatDate(post.createdAt)}`;

    if (post.coverImage) {
      elements.readerCoverWrap.style.display = 'block';
      elements.readerCoverImg.src = post.coverImage;
    } else {
      elements.readerCoverWrap.style.display = 'none';
    }

    // Parse and render Markdown content
    elements.readerContent.innerHTML = MarkdownParser.parse(post.content);

    // Tags list
    if (post.tags && post.tags.length > 0) {
      elements.readerTagsList.innerHTML = post.tags
        .map(t => `<span class="card-tag">#${t}</span>`)
        .join('');
      elements.readerTagsList.style.display = 'flex';
    } else {
      elements.readerTagsList.style.display = 'none';
    }

    // Like Button
    const isLiked = state.likedPostIds.has(post._id);
    elements.readerLikeCount.textContent = post.likes || 0;
    elements.readerLikeBtn.classList.toggle('active', isLiked);

    // Comments
    renderComments(post.comments || []);
  };

  const renderComments = (comments) => {
    elements.readerCommentCount.textContent = `(${comments.length})`;

    if (comments.length === 0) {
      elements.commentsList.innerHTML = `
        <div style="text-align: center; padding: 2rem; color: var(--text-muted); font-size: 0.95rem;">
          No thoughts shared yet. Be the first to start the conversation!
        </div>
      `;
      return;
    }

    elements.commentsList.innerHTML = comments.slice().reverse().map(c => `
      <div class="comment-card">
        <img src="${c.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80'}" alt="${c.author}" class="comment-avatar" />
        <div class="comment-content-wrap">
          <div class="comment-meta">
            <span class="comment-author">${c.author}</span>
            <span class="comment-time">${formatDate(c.createdAt)}</span>
          </div>
          <p class="comment-text">${c.text}</p>
        </div>
      </div>
    `).join('');
  };

  const handleLikePost = async (postId, buttonEl) => {
    try {
      const res = await BlogAPI.likePost(postId);
      const newLikes = res.likes;

      // Update liked set
      state.likedPostIds.add(postId);
      localStorage.setItem('inkflow_likes', JSON.stringify(Array.from(state.likedPostIds)));

      if (buttonEl) {
        buttonEl.classList.add('liked');
        const counter = buttonEl.querySelector('.like-counter');
        if (counter) counter.textContent = newLikes;
        const heart = buttonEl.querySelector('span:first-child');
        if (heart) heart.textContent = '💖';
      }

      // If active in reader view
      if (state.currentPost && state.currentPost._id === postId) {
        elements.readerLikeCount.textContent = newLikes;
        elements.readerLikeBtn.classList.add('active');
      }

      showToast('Clapped for article!', 'success');
    } catch (err) {
      showToast('Failed to clap for post', 'error');
    }
  };

  // ==========================================================================
  // Editor View Controller (Write & Edit)
  // ==========================================================================

  const openEditor = (postToEdit = null) => {
    elements.postForm.reset();

    if (postToEdit) {
      state.editingPostId = postToEdit._id;
      elements.editorHeading.textContent = 'Edit Story';
      elements.postIdInput.value = postToEdit._id;
      elements.postTitleInput.value = postToEdit.title;
      elements.postCategorySelect.value = postToEdit.category || 'Technology';
      elements.postTagsInput.value = (postToEdit.tags || []).join(', ');
      elements.postAuthorNameInput.value = postToEdit.author?.name || '';
      elements.postAuthorRoleInput.value = postToEdit.author?.role || '';
      elements.postCoverImageInput.value = postToEdit.coverImage || '';
      elements.postExcerptInput.value = postToEdit.excerpt || '';
      elements.postContentInput.value = postToEdit.content || '';
      updateCoverPreview(postToEdit.coverImage);
    } else {
      state.editingPostId = null;
      elements.editorHeading.textContent = 'Create New Story';
      elements.postIdInput.value = '';
      elements.postAuthorNameInput.value = localStorage.getItem('inkflow_author_name') || 'Alex Rivera';
      elements.postAuthorRoleInput.value = localStorage.getItem('inkflow_author_role') || 'Contributor';
      elements.postCoverImageInput.value = 'https://images.unsplash.com/photo-1499750310107-5fef28a66643?auto=format&fit=crop&w=1200&q=80';
      updateCoverPreview(elements.postCoverImageInput.value);
    }

    setEditorTab('write');
    switchView('editor');
  };

  const updateCoverPreview = (url) => {
    if (!elements.coverPreviewBox) return;
    if (url && url.trim()) {
      elements.coverPreviewBox.innerHTML = `<img src="${url.trim()}" alt="Cover preview" onerror="this.onerror=null; this.parentElement.innerHTML='<span style=\\'color:var(--danger)\\'>Image failed to load</span>';" />`;
    } else {
      elements.coverPreviewBox.innerHTML = `<span style="color:var(--text-muted); font-size:0.85rem;">No cover image preview</span>`;
    }
  };

  const setEditorTab = (tab) => {
    if (tab === 'write') {
      elements.tabWriteBtn.classList.add('active');
      elements.tabPreviewBtn.classList.remove('active');
      elements.postContentInput.style.display = 'block';
      elements.editorPreviewPane.style.display = 'none';
    } else {
      elements.tabPreviewBtn.classList.add('active');
      elements.tabWriteBtn.classList.remove('active');
      elements.postContentInput.style.display = 'none';
      elements.editorPreviewPane.style.display = 'block';
      elements.editorPreviewPane.innerHTML = MarkdownParser.parse(elements.postContentInput.value || '*Nothing written yet...*');
    }
  };

  const insertMarkdownSyntax = (syntaxPrefix, syntaxSuffix = '') => {
    const textarea = elements.postContentInput;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    const selection = text.substring(start, end) || 'text';

    const replacement = syntaxPrefix + selection + syntaxSuffix;
    textarea.value = text.substring(0, start) + replacement + text.substring(end);
    textarea.focus();
    textarea.setSelectionRange(start + syntaxPrefix.length, start + syntaxPrefix.length + selection.length);
  };

  // ==========================================================================
  // Dashboard View Controller
  // ==========================================================================

  const loadDashboard = async () => {
    try {
      const statsRes = await BlogAPI.getStats();
      const stats = statsRes.data;

      elements.statTotalPosts.textContent = stats.totalPosts || 0;
      elements.statTotalViews.textContent = (stats.totalViews || 0).toLocaleString();
      elements.statTotalLikes.textContent = (stats.totalLikes || 0).toLocaleString();
      elements.statTotalComments.textContent = (stats.totalComments || 0).toLocaleString();

      const postsRes = await BlogAPI.getPosts({ sort: 'newest' });
      renderDashboardTable(postsRes.data || []);
    } catch (err) {
      showToast('Error loading dashboard: ' + err.message, 'error');
    }
  };

  const renderDashboardTable = (posts) => {
    if (!elements.dashboardPostsTableBody) return;

    if (posts.length === 0) {
      elements.dashboardPostsTableBody.innerHTML = `
        <tr>
          <td colspan="6" style="text-align: center; padding: 2.5rem; color: var(--text-muted);">
            No published posts yet. Click "Write" in the top bar to create one!
          </td>
        </tr>
      `;
      return;
    }

    elements.dashboardPostsTableBody.innerHTML = posts.map(p => `
      <tr>
        <td>
          <div class="table-post-title" data-id="${p._id}" title="${p.title}">${p.title}</div>
        </td>
        <td><span class="card-tag">${p.category}</span></td>
        <td>${p.views || 0}</td>
        <td>${p.likes || 0}</td>
        <td>${(p.comments || []).length}</td>
        <td>${formatDate(p.createdAt)}</td>
        <td>
          <div class="table-actions">
            <button class="tbl-btn btn-table-view" data-id="${p._id}">View</button>
            <button class="tbl-btn btn-table-edit" data-id="${p._id}">Edit</button>
            <button class="tbl-btn delete btn-table-del" data-id="${p._id}">Delete</button>
          </div>
        </td>
      </tr>
    `).join('');

    // Attach actions
    elements.dashboardPostsTableBody.querySelectorAll('.table-post-title, .btn-table-view').forEach(btn => {
      btn.addEventListener('click', () => openReader(btn.dataset.id));
    });

    elements.dashboardPostsTableBody.querySelectorAll('.btn-table-edit').forEach(btn => {
      btn.addEventListener('click', async () => {
        const res = await BlogAPI.getPost(btn.dataset.id);
        openEditor(res.data);
      });
    });

    elements.dashboardPostsTableBody.querySelectorAll('.btn-table-del').forEach(btn => {
      btn.addEventListener('click', () => {
        state.pendingDeleteId = btn.dataset.id;
        elements.deleteModal.classList.add('active');
      });
    });
  };

  // ==========================================================================
  // Event Listeners Registration
  // ==========================================================================

  // Theme toggle
  elements.themeToggleBtn.addEventListener('click', () => {
    applyTheme(state.theme === 'dark' ? 'light' : 'dark');
  });

  // Top Nav Clicks
  elements.brandLogo.addEventListener('click', () => switchView('feed'));
  elements.navFeedBtn.addEventListener('click', () => switchView('feed'));
  elements.navWriteBtn.addEventListener('click', () => openEditor());
  elements.navDashboardBtn.addEventListener('click', () => switchView('dashboard'));
  elements.readerBackBtn.addEventListener('click', () => switchView('feed'));

  // Global Search input debounce
  let searchDebounceTimeout = null;
  elements.searchInput.addEventListener('input', (e) => {
    const val = e.target.value.trim();
    state.searchQuery = val;
    elements.searchClearBtn.style.display = val ? 'block' : 'none';

    clearTimeout(searchDebounceTimeout);
    searchDebounceTimeout = setTimeout(() => {
      if (state.activeView !== 'feed') switchView('feed');
      loadPosts();
    }, 300);
  });

  elements.searchClearBtn.addEventListener('click', () => {
    elements.searchInput.value = '';
    state.searchQuery = '';
    elements.searchClearBtn.style.display = 'none';
    loadPosts();
  });

  // Sort dropdown
  elements.feedSortSelect.addEventListener('change', (e) => {
    state.sortBy = e.target.value;
    loadPosts();
  });

  // Reader Like Button
  elements.readerLikeBtn.addEventListener('click', () => {
    if (state.currentPost) {
      handleLikePost(state.currentPost._id, elements.readerLikeBtn);
    }
  });

  // Reader Comment Submission
  elements.commentForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!state.currentPost) return;

    const author = elements.commentAuthorInput.value.trim() || 'Reader';
    const text = elements.commentTextInput.value.trim();

    if (!text) {
      showToast('Please type a comment before posting', 'error');
      return;
    }

    try {
      const res = await BlogAPI.addComment(state.currentPost._id, {
        author,
        text,
        avatar: `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(author)}`
      });

      state.currentPost.comments = res.comments;
      renderComments(res.comments);
      elements.commentTextInput.value = '';
      showToast('Comment posted successfully!', 'success');
    } catch (err) {
      showToast('Error posting comment: ' + err.message, 'error');
    }
  });

  // Editor Preset Image Buttons
  document.querySelectorAll('.preset-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const url = btn.dataset.url;
      elements.postCoverImageInput.value = url;
      updateCoverPreview(url);
    });
  });

  elements.postCoverImageInput.addEventListener('input', (e) => {
    updateCoverPreview(e.target.value);
  });

  // Editor Tabs (Write / Preview)
  elements.tabWriteBtn.addEventListener('click', () => setEditorTab('write'));
  elements.tabPreviewBtn.addEventListener('click', () => setEditorTab('preview'));
  elements.editorCancelBtn.addEventListener('click', () => switchView('feed'));

  // Editor Markdown Toolbar buttons
  document.querySelectorAll('.toolbar-btn[data-syntax]').forEach(btn => {
    btn.addEventListener('click', () => {
      const syntax = btn.dataset.syntax;
      if (syntax === 'bold') insertMarkdownSyntax('**', '**');
      else if (syntax === 'italic') insertMarkdownSyntax('*', '*');
      else if (syntax === 'h2') insertMarkdownSyntax('## ');
      else if (syntax === 'h3') insertMarkdownSyntax('### ');
      else if (syntax === 'quote') insertMarkdownSyntax('> ');
      else if (syntax === 'code') insertMarkdownSyntax('```javascript\n', '\n```');
      else if (syntax === 'list') insertMarkdownSyntax('* ');
      else if (syntax === 'link') insertMarkdownSyntax('[link description](', ')');
      else if (syntax === 'image') insertMarkdownSyntax('![alt text](', ')');
    });
  });

  // Editor Form Submit (Create / Update)
  elements.postForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const title = elements.postTitleInput.value.trim();
    const category = elements.postCategorySelect.value;
    const tags = elements.postTagsInput.value.split(',').map(t => t.trim()).filter(Boolean);
    const authorName = elements.postAuthorNameInput.value.trim() || 'Alex Rivera';
    const authorRole = elements.postAuthorRoleInput.value.trim() || 'Writer';
    const coverImage = elements.postCoverImageInput.value.trim();
    let excerpt = elements.postExcerptInput.value.trim();
    const content = elements.postContentInput.value.trim();

    if (!title || !content) {
      showToast('Please provide both Title and Story Content', 'error');
      return;
    }

    // Auto-generate excerpt if blank
    if (!excerpt) {
      excerpt = content.replace(/[#*`>]/g, '').slice(0, 160).trim() + '...';
    }

    // Save author preference in localStorage
    localStorage.setItem('inkflow_author_name', authorName);
    localStorage.setItem('inkflow_author_role', authorRole);

    const postPayload = {
      title,
      category,
      tags,
      author: {
        name: authorName,
        role: authorRole,
        avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(authorName)}`
      },
      coverImage: coverImage || 'https://images.unsplash.com/photo-1499750310107-5fef28a66643?auto=format&fit=crop&w=1200&q=80',
      excerpt,
      content
    };

    try {
      if (state.editingPostId) {
        await BlogAPI.updatePost(state.editingPostId, postPayload);
        showToast('Story updated successfully!', 'success');
      } else {
        await BlogAPI.createPost(postPayload);
        showToast('New story published!', 'success');
      }

      switchView('feed');
    } catch (err) {
      showToast('Error saving story: ' + err.message, 'error');
    }
  });

  // Delete Modal Actions
  elements.btnCancelDelete.addEventListener('click', () => {
    elements.deleteModal.classList.remove('active');
    state.pendingDeleteId = null;
  });

  elements.btnConfirmDelete.addEventListener('click', async () => {
    if (!state.pendingDeleteId) return;

    try {
      await BlogAPI.deletePost(state.pendingDeleteId);
      showToast('Post deleted successfully', 'success');
      elements.deleteModal.classList.remove('active');
      state.pendingDeleteId = null;
      loadDashboard();
      loadCategories();
    } catch (err) {
      showToast('Error deleting post: ' + err.message, 'error');
    }
  });

  // Seed sample data button in dashboard
  elements.btnSeedData.addEventListener('click', async () => {
    if (!confirm('This will repopulate sample articles. Continue?')) return;
    try {
      const res = await BlogAPI.seed();
      showToast(res.message, 'success');
      loadDashboard();
      loadCategories();
    } catch (err) {
      showToast('Seed error: ' + err.message, 'error');
    }
  });

  // Hash change routing (e.g. bookmarks or back/forward)
  window.addEventListener('hashchange', () => {
    const hash = window.location.hash.slice(1);
    if (!hash) {
      switchView('feed', false);
    } else if (hash === 'dashboard') {
      switchView('dashboard', false);
    } else if (hash === 'write') {
      openEditor();
    } else if (hash.startsWith('post-')) {
      const id = hash.replace('post-', '');
      openReader(id);
    }
  });

  // ==========================================================================
  // Initialization
  // ==========================================================================
  applyTheme(state.theme);
  checkDbStatus();

  // Route initial hash or feed
  const initialHash = window.location.hash.slice(1);
  if (initialHash.startsWith('post-')) {
    openReader(initialHash.replace('post-', ''));
  } else if (initialHash === 'dashboard') {
    switchView('dashboard');
  } else if (initialHash === 'write') {
    openEditor();
  } else {
    switchView('feed');
  }
});
