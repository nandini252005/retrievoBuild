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
    status: 'All',
    category: '',
    location: '',
  });

  const [appliedFilters, setAppliedFilters] = useState({
    reportType: 'All',
    status: 'All',
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
        <form className="reports-filter-bar" onSubmit={handleFilterSubmit}>
          <select name="reportType" value={filters.reportType} onChange={handleFilterChange}>
            <option value="All">Report Type</option>
            <option value="LOST">Lost</option>
            <option value="FOUND">Found</option>
          </select>

          <select name="status" value={filters.status} onChange={handleFilterChange}>
            <option value="All">Current Status</option>
            <option value="PENDING">Pending</option>
            <option value="APPROVED">Approved</option>
            <option value="RETURNED">Returned</option>
            <option value="CLAIMED">Claimed</option>
          </select>

          <input
            type="text"
            name="category"
            placeholder="Category"
            value={filters.category}
            onChange={handleFilterChange}
          />

          <input
            type="text"
            name="location"
            placeholder="Location"
            value={filters.location}
            onChange={handleFilterChange}
          />

          <div className="filter-actions">
            <button type="submit" className="search-btn">
              Search
            </button>

            <button
              type="button"
              className="reset-btn"
              onClick={() => {
                setFilters({
                  reportType: 'All',
                  status: 'All',
                  category: '',
                  location: '',
                });
                setAppliedFilters({
                  reportType: 'All',
                  status: 'All',
                  category: '',
                  location: '',
                });
                setPage(1);
              }}
            >
              Reset
            </button>
          </div>
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
