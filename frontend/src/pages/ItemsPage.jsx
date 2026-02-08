import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';

import apiClient from '../api/client';

const PAGE_LIMIT = 10;

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
    <main>
      <h1>Items</h1>

      {isLoading && <p>Loading items...</p>}
      {!isLoading && error && <p>{error}</p>}

      {!isLoading && !error && (
        <>
          {items.length === 0 ? (
            <p>No items found.</p>
          ) : (
            <ul>
              {items.map((item) => (
                <li key={item._id}>
                <Link to={`/items/${item._id}`}>
                <p>Title: {item.title}</p>
                <p>Category: {item.category}</p>
                <p>Status: {item.status}</p>
                <p>Location: {item.location}</p>
                </Link>
              </li>
            ))}
          </ul>

          )}

          <div>
            <button type="button" onClick={() => setPage((currentPage) => currentPage - 1)} disabled={!hasPrevious}>
              Previous
            </button>
            <span>
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
