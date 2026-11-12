# ✍️ Inkflow — Modern Blog Publishing Platform

A modern, responsive, and full-featured **Blog Publishing Platform** built strictly using **HTML5, CSS3, Vanilla JavaScript, Node.js, and MongoDB**.

---

## 🌟 Features Overview

### 1. 📰 Editorial Feed & Discovery
- **Hero Featured Story Banner**: Highlights the top featured or latest published story with engagement metrics.
- **Category Filtering**: Filter stories instantly by topics (*Technology, Coding, Design, AI & Future, Lifestyle, Business, Architecture*).
- **Instant Search with Debounce**: Real-time multi-field search across titles, summaries, tags, categories, and author names.
- **Dynamic Sorting**: Sort articles by *Latest*, *Most Read*, *Most Clapped*, or *Oldest First*.
- **Post Card Metrics**: Reading time estimate, category badge, author avatar, publish date, likes count, and comments count.

### 2. 📖 Immersive Article Reader
- **Markdown Rendering**: Built-in, zero-dependency Markdown parser supporting Headings (`#`, `##`, `###`), blockquotes, code blocks, bullet lists, links, and figures.
- **Interactive Claps / Likes**: Reader clapping counter with instant client state persistence.
- **Community Comments**: Live discussion thread with commenter name, role, custom avatars, and timestamped thoughts.
- **Direct Link Sharing & Hash Routing**: Every article has its own direct anchor link (`#post-<id>`).

### 3. ✏️ Rich Story Editor
- **Full Story Composer**: Title, Category selector, Tags input, Author bio, and Cover Image selector.
- **One-Click Unsplash Presets**: Instant high-resolution cover presets (*Tech, Code, Minimal, Abstract, Lifestyle*).
- **Markdown Toolbar**: Fast formatting buttons for Bold, Italic, Headings, Blockquotes, Code Blocks, Lists, Links, and Images.
- **Live Preview Tab**: Instant split/tab toggle between *Write* and *Live Rendered Preview*.
- **Edit & Update Mode**: Pre-populates existing articles for seamless updating.

### 4. 📊 Creator Analytics & Management Dashboard
- **Live Metric Cards**: Total Published Stories, Total Reads/Views, Total Claps, and Total Community Comments.
- **Story Management Table**: View, Edit, or Delete any published article.
- **Safe Delete Modal**: Confirmation modal to prevent accidental story deletion.
- **Database Seeder**: One-click "Reset Sample Posts" button.

### 5. 🎨 Design & Accessibility
- **Pure CSS3 (Zero Frameworks)**: Lightweight, fast loading, custom variables.
- **Dark Mode & Light Mode**: Seamless theme switcher that automatically respects system preference and persists in `localStorage`.
- **Responsive Design**: Flawless experience across mobile phones, tablets, and desktops.

---

## 🛠️ Technology Stack

| Layer | Technologies Used | Description |
|---|---|---|
| **Frontend** | HTML5, CSS3, Vanilla JavaScript (ES6+) | Semantic markup, CSS Variables, Flexbox/Grid, zero external frontend frameworks |
| **Backend** | Node.js, Express 5 | RESTful API routes, static asset delivery, CORS, dotenv |
| **Database** | MongoDB, Mongoose | Schema validation, text indexes, slug generation, timestamps |
| **Fallback** | Auto Local Store | Automatic zero-config fallback to local file store if local MongoDB service is not started |

---

## 📂 Project Structure

```
BlogPublishingPlatform/
├── config/
│   └── db.js                 # MongoDB Mongoose connection & fallback detection
├── data/
│   ├── samplePosts.js        # Curated rich sample articles for demo
│   └── fallbackStore.json    # Local JSON persistence store (used if MongoDB service is offline)
├── models/
│   ├── Post.js               # Mongoose Schema & Model with indexes & middlewares
│   └── postService.js        # Unified database service abstraction
├── public/
│   ├── css/
│   │   └── style.css         # Modern, responsive styles (Light & Dark themes)
│   ├── js/
│   │   ├── api.js            # REST API client
│   │   ├── markdown.js       # Safe Markdown to HTML parser
│   │   └── app.js            # Core application state & UI controller
│   └── index.html            # Main Single-Page Application interface
├── .env                      # Environment variables
├── .env.example              # Example environment template
├── package.json              # Project dependencies & scripts
├── seed.js                   # CLI seed runner
├── server.js                 # Express server & API endpoints
└── README.md                 # Project documentation
```

---

## 🚀 Getting Started

### 1. Prerequisites
Ensure you have **Node.js** (v18 or newer) installed on your system.

### 2. Installation
Open your terminal in the project directory and install dependencies:
```bash
npm install
```

### 3. Configure Database (.env)
The project is configured by default to connect to your local MongoDB:
```env
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/blog_publishing_platform
```

> **Note on MongoDB**:
> - If you have MongoDB installed and running locally, it connects automatically.
> - If you use **MongoDB Atlas**, paste your Atlas connection string into `MONGODB_URI` in `.env`.
> - If MongoDB is not currently running on your computer, the platform will **automatically run in zero-config Local Store mode** so you can immediately run and test the app without errors!

### 4. Seed Sample Posts (Optional)
To pre-populate high-quality sample posts:
```bash
npm run seed
```

### 5. Start the Application
Run the server:
```bash
npm start
```
Or with auto-reload:
```bash
npm run dev
```

Open your browser and visit:
👉 **[http://localhost:5000](http://localhost:5000)**

---

## 📡 REST API Reference

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/status` | Check server and database connection status |
| `GET` | `/api/posts` | Get all posts (supports `?search=`, `?category=`, `?sort=`, `?tag=`) |
| `GET` | `/api/posts/:id` | Get single post by ID (increments view count) |
| `POST` | `/api/posts` | Create a new blog post |
| `PUT` | `/api/posts/:id` | Update an existing blog post |
| `DELETE`| `/api/posts/:id` | Delete a blog post |
| `POST` | `/api/posts/:id/like` | Increment like/clap counter |
| `POST` | `/api/posts/:id/comments` | Add a comment to an article |
| `GET` | `/api/categories` | Get category breakdown and post counts |
| `GET` | `/api/stats` | Get creator analytics (views, likes, comments, top posts) |
| `POST` | `/api/seed` | Reset and seed sample blog articles |
