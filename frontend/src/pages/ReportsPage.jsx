import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import apiClient from '../api/client';
import './ItemsPage.css';

const PAGE_LIMIT = 10;

const STATUS_CLASS_MAP = {
  LOST: 'status-badge--lost',
  FOUND: 'status-badge--found',
  CLAIMED: 'status-badge--claimed',
  RETURNED: 'status-badge--returned',
};

function ReportsPage() {
  const [items, setItems] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const [filters, setFilters] = useState({
    status: 'All',
    category: '',
    location: '',
  });

  const [appliedFilters, setAppliedFilters] = useState({
    status: 'All',
    category: '',
    location: '',
  });

  useEffect(() => {
    const fetchItems = async () => {
      setIsLoading(true);
      setError('');

      const params = { page, limit: PAGE_LIMIT };

      if (appliedFilters.status !== 'All') {
        params.status = appliedFilters.status;
      }
      if (appliedFilters.category.trim()) {
        params.category = appliedFilters.category.trim();
      }
      if (appliedFilters.location.trim()) {
        params.location = appliedFilters.location.trim();
      }

      try {
        const res = await apiClient.get('/items', { params });
        setItems(res.data.items || []);
        setTotalPages(res.data.totalPages || 1);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to fetch items');
        setItems([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchItems();
  }, [page, appliedFilters]);

  const hasPrevious = page > 1;
  const hasNext = page < totalPages;

  const handleFilterChange = (event) => {
    const { name, value } = event.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const handleFilterSubmit = (event) => {
    event.preventDefault();
    setPage(1);
    setAppliedFilters(filters);
  };

  return (
    <main className="page">
      <h1>Item Reports</h1>

      <section className="reports-section">
        <form className="filters" onSubmit={handleFilterSubmit}>
          <div className="filters__grid">
            <label className="filters__field">
              <span>Status</span>
              <select name="status" value={filters.status} onChange={handleFilterChange}>
                <option value="All">All</option>
                <option value="LOST">LOST</option>
                <option value="FOUND">FOUND</option>
                <option value="CLAIMED">CLAIMED</option>
                <option value="RETURNED">RETURNED</option>
              </select>
            </label>

            <label className="filters__field">
              <span>Category</span>
              <input
                name="category"
                type="text"
                placeholder="e.g. phone"
                value={filters.category}
                onChange={handleFilterChange}
              />
            </label>

            <label className="filters__field">
              <span>Location</span>
              <input
                name="location"
                type="text"
                placeholder="e.g. library"
                value={filters.location}
                onChange={handleFilterChange}
              />
            </label>
          </div>

          <button className="filters__search-button" type="submit">
            Search
          </button>
        </form>

        {isLoading && <p className="muted-text">Loading items...</p>}
        {!isLoading && error && <p className="message-error">{error}</p>}

        {!isLoading && !error && (
          <>
            {items.length === 0 ? (
              <p className="muted-text">No items match your filters.</p>
            ) : (
              <ul className="items-list">
                {items.map((item) => {
                  const statusClass =
                    STATUS_CLASS_MAP[item.status] || 'status-badge--lost';

                  return (
                    <li key={item._id}>
                      <Link className="item-card-link" to={`/items/${item._id}`}>
                        <article className="item-card">
                          <div className="item-card__head">
                            <h3 className="item-card__title">{item.title}</h3>
                            <span className={`status-badge ${statusClass}`}>
                              {item.status}
                            </span>
                          </div>
                          <p className="item-meta">Category: {item.category}</p>
                          <p className="item-meta">Location: {item.location}</p>
                        </article>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}

            <div className="pagination">
              <button onClick={() => setPage((p) => p - 1)} disabled={!hasPrevious}>
                Previous
              </button>
              <span className="muted-text">
                Page {page} of {totalPages}
              </span>
              <button onClick={() => setPage((p) => p + 1)} disabled={!hasNext}>
                Next
              </button>
            </div>
          </>
        )}
      </section>
    </main>
  );
}

export default ReportsPage;