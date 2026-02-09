import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';

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
  const [items, setItems] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchItems = async () => {
      setIsLoading(true);
      setError('');

      try {
        const response = await apiClient.get('/items', {
          params: {
            page,
            limit: PAGE_LIMIT,
          },
        });

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
  }, [page]);

  const hasPrevious = page > 1;
  const hasNext = page < totalPages;

  return (
    <main className="page">
      <h1>Items</h1>

      {isLoading && <p className="muted-text">Loading items...</p>}
      {!isLoading && error && <p className="message-error" role="alert">{error}</p>}

      {!isLoading && !error && (
        <>
          {items.length === 0 ? (
            <p className="muted-text">No items found.</p>
          ) : (
            <ul className="items-list">
              {items.map((item) => {
                const statusClass = STATUS_CLASS_MAP[item.status] || 'status-badge--lost';

                return (
                  <li key={item._id}>
                    <Link className="item-card-link" to={`/items/${item._id}`}>
                      <article className="item-card">
                        <div className="item-card__head">
                          <h2 className="item-card__title">{item.title}</h2>
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
    </main>
  );
}

export default ItemsPage;
