import { Link, useNavigate } from 'react-router-dom';
import { useEffect, useRef, useState } from 'react';

import apiClient from '../api/client';
import './ItemsPage.css';

const PAGE_LIMIT = 10;

const STATUS_CLASS_MAP = {
  LOST: 'status-badge--lost',
  FOUND: 'status-badge--found',
  CLAIMED: 'status-badge--claimed',
  RETURNED: 'status-badge--returned',
};

function ItemsPage() {
  const navigate = useNavigate();
  const reportsSectionRef = useRef(null);

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

      const params = {
        page,
        limit: PAGE_LIMIT,
      };

      if (appliedFilters.status && appliedFilters.status !== 'All') {
        params.status = appliedFilters.status;
      }

      if (appliedFilters.category.trim()) {
        params.category = appliedFilters.category.trim();
      }

      if (appliedFilters.location.trim()) {
        params.location = appliedFilters.location.trim();
      }

      try {
        const response = await apiClient.get('/items', { params });

        setItems(response.data.items || []);
        setTotalPages(response.data.totalPages || 1);
      } catch (fetchError) {
        setError(fetchError.response?.data?.message || 'Failed to fetch items');
        setItems([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchItems();
  }, [page, appliedFilters]);

  const hasPrevious = page > 1;
  const hasNext = page < totalPages;

  const handleOpenCreatePage = (defaultStatus) => {
    navigate('/create', {
      state: { defaultStatus },
    });
  };

  const handleViewReports = () => {
    reportsSectionRef.current?.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    });
  };

  const handleFilterChange = (event) => {
    const { name, value } = event.target;

    setFilters((currentFilters) => ({
      ...currentFilters,
      [name]: value,
    }));
  };

  const handleSearch = () => {
    setPage(1);
    setAppliedFilters({
      status: filters.status,
      category: filters.category,
      location: filters.location,
    });
  };

  const handleFilterSubmit = (event) => {
    event.preventDefault();
    handleSearch();
  };

  return (
    <main className="page">
      <h1>Items Dashboard</h1>

      <section className="dashboard-actions" aria-label="Report actions">
        <button
          className="dashboard-action-card dashboard-action-card--lost"
          type="button"
          onClick={() => handleOpenCreatePage('LOST')}
        >
          <span className="dashboard-action-card__title">Report Lost Item</span>
          <span className="dashboard-action-card__hint">Submit a new lost item report.</span>
        </button>

        <button
          className="dashboard-action-card dashboard-action-card--found"
          type="button"
          onClick={() => handleOpenCreatePage('FOUND')}
        >
          <span className="dashboard-action-card__title">Report Found Item</span>
          <span className="dashboard-action-card__hint">Record an item you found.</span>
        </button>

        <button
          className="dashboard-action-card dashboard-action-card--reports"
          type="button"
          onClick={handleViewReports}
        >
          <span className="dashboard-action-card__title">View Reports</span>
          <span className="dashboard-action-card__hint">Jump to the existing item reports list.</span>
        </button>
      </section>

      <section ref={reportsSectionRef} id="reports-list" className="reports-section" aria-label="Item reports">
        <h2>Item Reports</h2>

        <form className="filters" onSubmit={handleFilterSubmit} aria-label="Filter item reports">
          <div className="filters__grid">
            <label className="filters__field" htmlFor="status-filter">
              <span>Status</span>
              <select
                id="status-filter"
                name="status"
                value={filters.status}
                onChange={handleFilterChange}
              >
                <option value="All">All</option>
                <option value="LOST">LOST</option>
                <option value="FOUND">FOUND</option>
                <option value="CLAIMED">CLAIMED</option>
                <option value="RETURNED">RETURNED</option>
              </select>
            </label>

            <label className="filters__field" htmlFor="category-filter">
              <span>Category</span>
              <input
                id="category-filter"
                name="category"
                type="text"
                placeholder="e.g. phone"
                value={filters.category}
                onChange={handleFilterChange}
              />
            </label>

            <label className="filters__field" htmlFor="location-filter">
              <span>Location</span>
              <input
                id="location-filter"
                name="location"
                type="text"
                placeholder="e.g. library"
                value={filters.location}
                onChange={handleFilterChange}
              />
            </label>
          </div>

          <button className="filters__search-button" type="submit">Search</button>
        </form>

        {isLoading && (
          <div className="loading-indicator" role="status" aria-live="polite">
            <span className="loading-indicator__spinner" aria-hidden="true" />
            <p className="muted-text">Loading items...</p>
          </div>
        )}

        {!isLoading && error && <p className="message-error" role="alert">{error}</p>}

        {!isLoading && !error && (
          <>
            {items.length === 0 ? (
              <p className="muted-text">No items match your filters.</p>
            ) : (
              <ul className="items-list">
                {items.map((item) => {
                  const statusClass = STATUS_CLASS_MAP[item.status] || 'status-badge--lost';

                  return (
                    <li key={item._id}>
                      <Link className="item-card-link" to={`/items/${item._id}`}>
                        <article className="item-card">
                          <div className="item-card__head">
                            <h3 className="item-card__title">{item.title}</h3>
                            <span className={`status-badge ${statusClass}`}>{item.status}</span>
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
              <button type="button" onClick={() => setPage((currentPage) => currentPage - 1)} disabled={!hasPrevious}>
                Previous
              </button>
              <span className="muted-text">
                Page {page} of {totalPages}
              </span>
              <button type="button" onClick={() => setPage((currentPage) => currentPage + 1)} disabled={!hasNext}>
                Next
              </button>
            </div>
          </>
        )}
      </section>
    </main>
  );
}

export default ItemsPage;
