import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';

import apiClient from '../api/client';
import { useAuth } from '../auth/AuthContext';

function ItemDetailPage() {
  const { id } = useParams();
  const { isAuthenticated } = useAuth();

  const [item, setItem] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const [claimMessage, setClaimMessage] = useState('');
  const [isSubmittingClaim, setIsSubmittingClaim] = useState(false);
  const [claimSuccessMessage, setClaimSuccessMessage] = useState('');
  const [claimErrorMessage, setClaimErrorMessage] = useState('');

  useEffect(() => {
    const fetchItem = async () => {
      setIsLoading(true);
      setError('');

      try {
        const response = await apiClient.get(`/items/${id}`);
        setItem(response.data || null);
      } catch (fetchError) {
        setItem(null);
        setError(fetchError.response?.data?.message || 'Failed to fetch item');
      } finally {
        setIsLoading(false);
      }
    };

    fetchItem();
  }, [id]);

  const canShowClaimForm = isAuthenticated && item?.status === 'FOUND';

  const handleClaimSubmit = async (event) => {
    event.preventDefault();

    setClaimSuccessMessage('');
    setClaimErrorMessage('');
    setIsSubmittingClaim(true);

    try {
      await apiClient.post('/claims', {
        itemId: id,
        message: claimMessage,
      });

      setClaimSuccessMessage('Claim submitted successfully.');
      setClaimMessage('');
    } catch (submitError) {
      setClaimErrorMessage(submitError.response?.data?.message || 'Failed to submit claim');
    } finally {
      setIsSubmittingClaim(false);
    }
  };

  if (isLoading) {
    return (
      <main className="page">
        <h1>Item Detail</h1>
        <p className="muted-text">Loading item...</p>
      </main>
    );
  }

  if (error) {
    return (
      <main className="page">
        <h1>Item Detail</h1>
        <p className="message-error" role="alert">{error}</p>
      </main>
    );
  }

  if (!item) {
    return (
      <main className="page">
        <h1>Item Detail</h1>
        <p className="muted-text">Item not found.</p>
      </main>
    );
  }

  return (
    <main className="page">
      <h1>{item.title}</h1>
      <section className="card">
        <p><strong>Description:</strong> {item.description}</p>
        <p><strong>Category:</strong> {item.category}</p>
        <p><strong>Location:</strong> {item.location}</p>
        <p><strong>Status:</strong> {item.status}</p>
        <p><strong>Creator:</strong> {item.createdBy?.name || item.createdBy?.email || 'Unknown'}</p>
      </section>

      {canShowClaimForm ? (
        <section className="card">
          <h2>Claim this item</h2>
          <form className="form" onSubmit={handleClaimSubmit}>
            <div className="form-row">
              <label htmlFor="claim-message">Message (optional)</label>
              <textarea
                id="claim-message"
                value={claimMessage}
                onChange={(event) => setClaimMessage(event.target.value)}
                disabled={isSubmittingClaim}
                rows={4}
              />
            </div>

            {claimSuccessMessage ? <p className="message-success">{claimSuccessMessage}</p> : null}
            {claimErrorMessage ? <p className="message-error" role="alert">{claimErrorMessage}</p> : null}

            <button type="submit" disabled={isSubmittingClaim}>
              {isSubmittingClaim ? 'Submitting claim...' : 'Submit claim'}
            </button>
          </form>
        </section>
      ) : null}
    </main>
  );
}

export default ItemDetailPage;
