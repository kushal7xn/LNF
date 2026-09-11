import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import axios from '../config/axios';

const Home = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    category: '',
    color: '',
    location: '',
    date_from: '',
    date_to: ''
  });

  const fetchItems = useCallback(async (activeFilters = {}) => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      Object.keys(activeFilters).forEach(key => {
        if (activeFilters[key]) params.append(key, activeFilters[key]);
      });
      
      const response = await axios.get(`/api/items/search?${params.toString()}`);
      setItems(response.data);
    } catch (error) {
      console.error('Error fetching items:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const handleFilterChange = (e) => {
    setFilters({
      ...filters,
      [e.target.name]: e.target.value
    });
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchItems(filters);
  };

  const clearFilters = () => {
    setFilters({
      category: '',
      color: '',
      location: '',
      date_from: '',
      date_to: ''
    });
    fetchItems({});
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <div className="home">
      <div className="hero">
        <h1>Lost & Found</h1>
        <p>Help reunite people with their lost belongings</p>
      </div>

      <div className="search-section">
        <h2>Search Found Items</h2>
        <form onSubmit={handleSearch} className="search-form">
          <div className="search-row">
            <input
              type="text"
              name="category"
              placeholder="Category (e.g., phone, keys, wallet)"
              value={filters.category}
              onChange={handleFilterChange}
            />
            <input
              type="text"
              name="color"
              placeholder="Color"
              value={filters.color}
              onChange={handleFilterChange}
            />
            <input
              type="text"
              name="location"
              placeholder="Location found"
              value={filters.location}
              onChange={handleFilterChange}
            />
          </div>
          <div className="search-row">
            <div className="date-inputs">
              <label>Date from:</label>
              <input
                type="date"
                name="date_from"
                value={filters.date_from}
                onChange={handleFilterChange}
              />
            </div>
            <div className="date-inputs">
              <label>Date to:</label>
              <input
                type="date"
                name="date_to"
                value={filters.date_to}
                onChange={handleFilterChange}
              />
            </div>
          </div>
          <div className="search-actions">
            <button type="submit">Search</button>
            <button type="button" onClick={clearFilters}>Clear Filters</button>
          </div>
        </form>
      </div>

      <div className="items-section">
        {loading ? (
          <div className="loading">Loading items...</div>
        ) : (
          <>
            <h3>Found Items ({items.length})</h3>
            {items.length === 0 ? (
              <p className="no-items">No items found matching your criteria.</p>
            ) : (
              <div className="items-grid">
                {items.map(item => (
                  <div key={item.id} className="item-card">
                    {item.photo_url && (
                      <img 
                        src={`http://localhost:5000${item.photo_url}`} 
                        alt={item.category}
                        className="item-image"
                      />
                    )}
                    <div className="item-info">
                      <h4>{item.category}</h4>
                      <p><strong>Color:</strong> {item.color}</p>
                      <p><strong>Found at:</strong> {item.location_found}</p>
                      <p><strong>Date found:</strong> {formatDate(item.date_found)}</p>
                      <p><strong>Status:</strong> {item.status}</p>
                      <Link to={`/item/${item.id}`} className="view-details-btn">
                        View Details & Claim
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Home;
