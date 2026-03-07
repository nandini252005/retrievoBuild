import { useEffect, useState } from 'react';

import apiClient from '../api/client';
import ReportCard from '../components/reports/ReportCard';
import './ItemsPage.css';
import './ReportsPage.css';

const PAGE_LIMIT = 10;

function ReportsPage() {
  const [items, setItems] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const [filters, setFilters] = useState({
    reportType: 'All',
    category: '',
    location: '',
  });

  const [appliedFilters, setAppliedFilters] = useState({
    reportType: 'All',
    category: '',
    location: '',
  });

  useEffect(() => {
    const fetchItems = async () => {
      setIsLoading(true);
      setError('');

      const params = { page, limit: PAGE_LIMIT };

      if (appliedFilters.reportType !== 'All') {
        params.reportType = appliedFilters.reportType;
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
              <span>Report Type</span>
              <select name="reportType" value={filters.reportType} onChange={handleFilterChange}>
                <option value="All">All</option>
                <option value="LOST">LOST</option>
                <option value="FOUND">FOUND</option>
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
              <ul className="items-list reports-list-compact">
                {items.map((item) => (
                  <li key={item._id}>
                    <ReportCard item={item} />
                  </li>
                ))}
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
