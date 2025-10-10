import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import './BlogArchive.css';

/**
 * BlogArchive.jsx - Blog Archive Page
 *
 * Displays a grid of blog post cards with filtering and search.
 * Matches the design from https://sexyselfies.com/sex-talk/
 * Includes SEO meta tags for search engines.
 */

const BlogArchive = () => {
  const [posts, setPosts] = useState([]);
  const [filteredPosts, setFilteredPosts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [error, setError] = useState(null);

  const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5002';

  // Fetch blog posts
  useEffect(() => {
    fetchPosts();
    fetchCategories();
  }, [page, selectedCategory]);

  // Filter posts locally when search query changes
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredPosts(posts);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = posts.filter(
        post =>
          post.title.toLowerCase().includes(query) ||
          post.excerpt.toLowerCase().includes(query) ||
          post.tags.some(tag => tag.toLowerCase().includes(query))
      );
      setFilteredPosts(filtered);
    }
  }, [searchQuery, posts]);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      let url = `${API_BASE}/api/v1/blog?page=${page}&limit=12`;

      if (selectedCategory !== 'all') {
        url = `${API_BASE}/api/v1/blog/category/${selectedCategory}?page=${page}&limit=12`;
      }

      const response = await fetch(url);
      const data = await response.json();

      if (data.success) {
        setPosts(data.posts);
        setFilteredPosts(data.posts);
        setTotalPages(data.pagination.pages);
      } else {
        setError('Failed to load blog posts');
      }
    } catch (err) {
      console.error('Error fetching posts:', err);
      setError('Failed to load blog posts. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/v1/blog/categories`);
      const data = await response.json();

      if (data.success) {
        setCategories(data.categories);
      }
    } catch (err) {
      console.error('Error fetching categories:', err);
    }
  };

  const handleCategoryChange = category => {
    setSelectedCategory(category);
    setPage(1);
  };

  const handleSearch = e => {
    e.preventDefault();
    // Search is handled by useEffect
  };

  const formatDate = dateString => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const truncateExcerpt = (text, maxLength = 150) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength).trim() + '...';
  };

  return (
    <div className="BlogArchive-container">
      {/* SEO Meta Tags */}
      <Helmet>
        <title>Sex Talk Blog - Dating, Relationships & Romance | SexySelfies</title>
        <meta name="title" content="Sex Talk Blog - Dating, Relationships & Romance | SexySelfies" />
        <meta name="description" content="Explore articles about dating, relationships, modern romance, and adult content creation. Tips, advice, and insights from the SexySelfies community." />
        <meta name="keywords" content="dating advice, relationships, modern romance, adult content, content creators, dating tips, sexy selfies" />

        {/* Canonical URL */}
        <link rel="canonical" href="https://sexyselfies.com/blog" />

        {/* Open Graph / Facebook */}
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://sexyselfies.com/blog" />
        <meta property="og:title" content="Sex Talk Blog - Dating, Relationships & Romance" />
        <meta property="og:description" content="Explore articles about dating, relationships, modern romance, and adult content creation." />
        <meta property="og:image" content="https://sexyselfies.com/og-image.jpg" />
        <meta property="og:site_name" content="SexySelfies" />

        {/* Twitter */}
        <meta property="twitter:card" content="summary_large_image" />
        <meta property="twitter:url" content="https://sexyselfies.com/blog" />
        <meta property="twitter:title" content="Sex Talk Blog - Dating, Relationships & Romance" />
        <meta property="twitter:description" content="Explore articles about dating, relationships, modern romance, and adult content creation." />
        <meta property="twitter:image" content="https://sexyselfies.com/og-image.jpg" />
      </Helmet>

      {/* Header Section */}
      <header className="BlogArchive-header">
        <div className="BlogArchive-headerContent">
          <h1 className="BlogArchive-title">Sex Talk Blog</h1>
          <p className="BlogArchive-subtitle">
            Explore articles about dating, relationships, and modern romance
          </p>
        </div>
      </header>

      {/* Filters & Search */}
      <section className="BlogArchive-filters">
        <div className="BlogArchive-filtersContainer">
          {/* Category Filter */}
          <div className="BlogArchive-categoryFilter">
            <button
              className={`BlogArchive-categoryBtn ${
                selectedCategory === 'all' ? 'active' : ''
              }`}
              onClick={() => handleCategoryChange('all')}
            >
              All Posts
            </button>
            {categories.map(cat => (
              <button
                key={cat.name}
                className={`BlogArchive-categoryBtn ${
                  selectedCategory === cat.name ? 'active' : ''
                }`}
                onClick={() => handleCategoryChange(cat.name)}
              >
                {cat.name} ({cat.count})
              </button>
            ))}
          </div>

          {/* Search Bar */}
          <form className="BlogArchive-searchForm" onSubmit={handleSearch}>
            <input
              type="text"
              className="BlogArchive-searchInput"
              placeholder="Search articles..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
            <button type="submit" className="BlogArchive-searchBtn">
              <svg
                width="20"
                height="20"
                viewBox="0 0 20 20"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M9 17A8 8 0 1 0 9 1a8 8 0 0 0 0 16zM19 19l-4.35-4.35"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </form>
        </div>
      </section>

      {/* Posts Grid */}
      <section className="BlogArchive-postsSection">
        {loading ? (
          <div className="BlogArchive-loading">
            <div className="BlogArchive-spinner"></div>
            <p>Loading posts...</p>
          </div>
        ) : error ? (
          <div className="BlogArchive-error">
            <p>{error}</p>
            <button onClick={fetchPosts} className="BlogArchive-retryBtn">
              Try Again
            </button>
          </div>
        ) : filteredPosts.length === 0 ? (
          <div className="BlogArchive-empty">
            <p>No posts found matching your search.</p>
          </div>
        ) : (
          <>
            <div className="BlogArchive-grid">
              {filteredPosts.map(post => (
                <article key={post._id} className="BlogArchive-postCard">
                  <Link
                    to={`/blog/${post.slug}`}
                    className="BlogArchive-cardLink"
                  >
                    {/* Featured Image */}
                    {post.featuredImage && (
                      <div className="BlogArchive-imageContainer">
                        <img
                          src={post.featuredImage}
                          alt={post.title}
                          className="BlogArchive-image"
                        />
                      </div>
                    )}

                    {/* Post Content */}
                    <div className="BlogArchive-cardContent">
                      {/* Category Badge */}
                      <span className="BlogArchive-categoryBadge">
                        {post.category}
                      </span>

                      {/* Title */}
                      <h2 className="BlogArchive-cardTitle">{post.title}</h2>

                      {/* Excerpt */}
                      <p className="BlogArchive-excerpt">
                        {truncateExcerpt(post.excerpt)}
                      </p>

                      {/* Meta Info */}
                      <div className="BlogArchive-meta">
                        <span className="BlogArchive-date">
                          {formatDate(post.publishDate)}
                        </span>
                        <span className="BlogArchive-views">
                          {post.views} views
                        </span>
                      </div>
                    </div>
                  </Link>
                </article>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="BlogArchive-pagination">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="BlogArchive-pageBtn"
                >
                  Previous
                </button>
                <span className="BlogArchive-pageInfo">
                  Page {page} of {totalPages}
                </span>
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="BlogArchive-pageBtn"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </section>
    </div>
  );
};

export default BlogArchive;
