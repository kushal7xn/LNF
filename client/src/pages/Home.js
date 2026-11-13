import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import axios from '../config/axios';

const Sparkle = () => <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.5c.8 4.7 2.8 6.7 9.5 9.5-6.7 2.8-8.7 4.8-9.5 9.5-1.1-4.7-3.1-6.7-9.5-9.5 6.4-2.8 8.4-4.8 9.5-9.5Z" fill="currentColor"/></svg>;

const Home = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ category: '', color: '', location: '', date_from: '', date_to: '' });

  const fetchItems = useCallback(async (activeFilters = {}) => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      Object.keys(activeFilters).forEach(key => { if (activeFilters[key]) params.append(key, activeFilters[key]); });
      const response = await axios.get(`/api/items/search?${params.toString()}`);
      setItems(response.data);
    } catch (error) {
      console.error('Error fetching items:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchItems(); }, [fetchItems]);
  const handleFilterChange = e => setFilters(current => ({ ...current, [e.target.name]: e.target.value }));
  const handleSearch = e => { e.preventDefault(); fetchItems(filters); };
  const clearFilters = () => {
    const emptyFilters = { category: '', color: '', location: '', date_from: '', date_to: '' };
    setFilters(emptyFilters);
    fetchItems({});
  };
  const formatDate = dateString => dateString ? new Date(dateString).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : 'Date not listed';

  return (
    <div className="home">
      <section className="hero-shell">
        <div className="hero-copy">
          <div className="eyebrow"><span className="eyebrow-dot" /> A little kindness goes a long way</div>
          <h1>Lost something?<br /><em>Let’s bring it home.</em></h1>
          <p>Every found thing has a story. Find yours again with a community that cares enough to return it.</p>
          <a className="hero-cta" href="#found-items">Explore found items <span aria-hidden="true">↗</span></a>
          <div className="hero-proof"><div className="proof-avatars"><span>J</span><span>M</span><span>A</span><span>+</span></div><div><strong>Good people, doing good things</strong><small>One thoughtful return at a time</small></div></div>
        </div>
        <div className="hero-art" role="img" aria-label="A warm still life of everyday belongings waiting to be reunited with their owners">
          <div className="art-glow" />
          <div className="orbit orbit-one" /><div className="orbit orbit-two" />
          <div className="float-note note-top"><span className="note-icon">✳</span><span><b>Found with care</b><small>Ready to go home</small></span></div>
          <div className="photo-frame"><div className="photo-grain" /><span className="photo-caption">THE LITTLE THINGS MATTER</span></div>
          <div className="float-note note-bottom"><span className="pin-icon">⌖</span><span><b>Somewhere nearby</b><small>Your story starts here</small></span></div>
          <div className="art-sparkle sparkle-a"><Sparkle /></div><div className="art-sparkle sparkle-b"><Sparkle /></div>
        </div>
        <div className="hero-stamp"><span>FOUND</span><small>with<br />love</small></div>
      </section>

      <section className="search-section" aria-labelledby="search-heading">
        <div className="search-heading"><div><span className="section-kicker">A GOOD PLACE TO START</span><h2 id="search-heading">What are you looking for?</h2></div><span className="search-mark">⌕</span></div>
        <form onSubmit={handleSearch} className="search-form">
          <div className="search-fields">
            <label className="search-field"><span>ITEM OR CATEGORY</span><input type="text" name="category" placeholder="e.g. keys, a blue backpack" value={filters.category} onChange={handleFilterChange} /></label>
            <label className="search-field"><span>COLOUR</span><input type="text" name="color" placeholder="Any colour" value={filters.color} onChange={handleFilterChange} /></label>
            <label className="search-field"><span>WHERE WAS IT FOUND?</span><input type="text" name="location" placeholder="Campus, café, street…" value={filters.location} onChange={handleFilterChange} /></label>
            <label className="search-field search-date"><span>FOUND AFTER</span><input type="date" name="date_from" aria-label="Found after" value={filters.date_from} onChange={handleFilterChange} /></label>
            <label className="search-field search-date"><span>FOUND BEFORE</span><input type="date" name="date_to" aria-label="Found before" value={filters.date_to} onChange={handleFilterChange} /></label>
          </div>
          <div className="search-actions"><button type="button" className="clear-button" onClick={clearFilters}>Clear all</button><button type="submit" className="search-button"><span>Search found items</span><span aria-hidden="true">→</span></button></div>
        </form>
      </section>

      <section className="items-section" id="found-items">
        <div className="items-heading"><div><span className="section-kicker">THE COMMUNITY COLLECTION</span><h2>Recently found</h2><p>Little things, waiting for their people.</p></div><div className="item-count"><span>{loading ? '—' : String(items.length).padStart(2, '0')}</span><small>items<br />listed</small></div></div>
        {loading ? <div className="loading"><span className="loading-dot" /> Finding the latest listings…</div> : items.length === 0 ? (
          <div className="empty-state"><span className="empty-icon">⌕</span><h3>No matches just yet</h3><p>Try another search, or check back soon. Something might turn up.</p><p className="review-note">New found-item listings appear here after an administrator approves them.</p><button type="button" className="clear-button" onClick={clearFilters}>Show everything</button></div>
        ) : (
          <div className="items-grid">{items.map((item, index) => (
            <article key={item.id} className="item-card" style={{ '--card-index': index }}>
              <Link to={`/item/${item.id}`} className="card-image-wrap" aria-label={`View ${item.category}`}>
                {item.photo_url ? <img src={`http://localhost:5000${item.photo_url}`} alt={item.category} className="item-image" /> : <div className={`item-placeholder placeholder-${index % 4}`}><span>{(item.category || '?').slice(0, 1).toUpperCase()}</span><small>FOUND WITH CARE</small></div>}
                <span className="card-status"><i /> {item.status || 'Available'}</span><span className="card-arrow">↗</span>
              </Link>
              <div className="item-info"><div className="card-title-row"><h3>{item.category}</h3><span className="card-color">{item.color}</span></div><p className="card-location"><span>⌖</span> {item.location_found || 'Location not listed'}</p><div className="card-footer"><span>Found {formatDate(item.date_found)}</span><Link to={`/item/${item.id}`}>See details <span>→</span></Link></div></div>
            </article>
          ))}</div>
        )}
      </section>
      <section className="kindness-banner"><Sparkle /><p>Found something? <strong>You could make someone’s whole day.</strong></p><Link to="/finder/login">Share a found item <span>→</span></Link></section>
      <footer className="home-footer"><Link to="/" className="footer-brand"><span className="brand-mark">↗</span> wayback</Link><span>A little more human, one return at a time.</span><a href="#search-heading">Back to top ↑</a></footer>
    </div>
  );
};

export default Home;
