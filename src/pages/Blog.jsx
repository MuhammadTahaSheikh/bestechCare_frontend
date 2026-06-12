import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';

export default function Blog() {
  const [posts, setPosts] = useState([]);

  useEffect(() => {
    api.getBlogPosts().then(setPosts).catch(console.error);
  }, []);

  return (
    <div className="page">
      <div className="container">
        <div className="page-header">
          <h1>Health Blog</h1>
          <p>Latest health tips and news from BestechCare</p>
        </div>

        <div className="blog-grid">
          {posts.map((post) => (
            <article key={post.id} className="blog-card">
              <h3>{post.title}</h3>
              <p>{post.excerpt}</p>
              <div className="blog-meta">
                <span className="text-muted">By {post.author}</span>
                <span className="text-muted">
                  {new Date(post.published_at).toLocaleDateString()}
                </span>
              </div>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}
