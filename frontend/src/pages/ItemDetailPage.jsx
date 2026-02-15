import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';

import apiClient from '../api/client';
import { useAuth } from '../auth/AuthContext';

function ItemDetailPage() {
  const { id } = useParams();
  const { isAuthenticated, user } = useAuth();

  const [item, setItem] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const [claimMessage, setClaimMessage] = useState('');
  const [isSubmittingClaim, setIsSubmittingClaim] = useState(false);
  const [claimSuccessMessage, setClaimSuccessMessage] = useState('');
  const [claimErrorMessage, setClaimErrorMessage] = useState('');

  const [claims, setClaims] = useState([]);
  const [isLoadingClaims, setIsLoadingClaims] = useState(false);
  const [claimsError, setClaimsError] = useState('');
  const [reviewErrorMessage, setReviewErrorMessage] = useState('');
  const [reviewingClaimIds, setReviewingClaimIds] = useState({});
  const [isUpdatingItemStatus, setIsUpdatingItemStatus] = useState(false);
  const [statusUpdateErrorMessage, setStatusUpdateErrorMessage] = useState('');

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

  const ownerId = useMemo(() => {
    if (!item?.createdBy) {
      return null;
    }

    if (typeof item.createdBy === 'string') {
      return item.createdBy;
    }

    return item.createdBy._id || item.createdBy.id || null;
  }, [item]);

  const currentUserId = user?._id || user?.id || null;
  const isOwner = Boolean(currentUserId && ownerId && currentUserId === ownerId);

  const isFoundReport = item?.reportType === 'FOUND';
  const isClaimBlockedStatus = ['CLAIMED', 'RETURNED'].includes(item?.status);
  const canShowClaimForm = Boolean(isAuthenticated && !isOwner && isFoundReport && !isClaimBlockedStatus);

  const ownerStatusActionLabel =
    item?.reportType === 'LOST' ? 'Mark as Returned' : item?.reportType === 'FOUND' ? 'Mark as Claimed' : '';

  const ownerStatusAction =
    item?.reportType === 'LOST' ? 'RETURNED' : item?.reportType === 'FOUND' ? 'CLAIMED' : null;

  const canShowOwnerStatusAction = Boolean(isOwner && item?.status === 'APPROVED' && ownerStatusAction);

  useEffect(() => {
    fetchItem();
  }, [id]);

  useEffect(() => {
    const fetchClaims = async () => {
      if (!item || !isOwner) {
        setClaims([]);
        setClaimsError('');
        setReviewErrorMessage('');
        return;
      }

      setIsLoadingClaims(true);
      setClaimsError('');

      try {
        const response = await apiClient.get('/claims', {
          params: {
            itemId: id,
          },
        });

        if (Array.isArray(response.data)) {
          setClaims(response.data);
        } else if (Array.isArray(response.data?.claims)) {
          setClaims(response.data.claims);
        } else {
          setClaims([]);
        }
      } catch (fetchClaimsError) {
        setClaims([]);
        setClaimsError(fetchClaimsError.response?.data?.message || 'Failed to fetch claims');
      } finally {
        setIsLoadingClaims(false);
      }
    };

    fetchClaims();
  }, [id, item, isOwner]);

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

  const handleReviewClaim = async (claimId, decision) => {
    setReviewErrorMessage('');
    setReviewingClaimIds((prev) => ({ ...prev, [claimId]: true }));

    const endpoint = decision === 'approve' ? `/claims/${claimId}/approve` : `/claims/${claimId}/reject`;

    try {
      const response = await apiClient.patch(endpoint);
      const updatedClaim = response.data?.claim || response.data;
      const updatedItem = response.data?.item;

      setClaims((prevClaims) =>
        prevClaims.map((claim) =>
          claim._id === claimId || claim.id === claimId
            ? {
                ...claim,
                ...(updatedClaim && typeof updatedClaim === 'object' ? updatedClaim : {}),
                status:
                  updatedClaim?.status || (decision === 'approve' ? 'APPROVED' : 'REJECTED'),
              }
            : claim
        )
      );

      if (updatedItem && typeof updatedItem === 'object') {
        setItem((prevItem) =>
          prevItem
            ? {
                ...prevItem,
                ...updatedItem,
              }
            : prevItem
        );
      }
    } catch (reviewError) {
      setReviewErrorMessage(reviewError.response?.data?.message || 'Failed to review claim');
    } finally {
      setReviewingClaimIds((prev) => ({ ...prev, [claimId]: false }));
    }
  };

  const handleOwnerStatusAction = async () => {
    if (!ownerStatusAction) {
      return;
    }

    setStatusUpdateErrorMessage('');
    setIsUpdatingItemStatus(true);

    try {
      await apiClient.patch(`/items/${id}/status`, {
        status: ownerStatusAction,
      });
      await fetchItem();
    } catch (statusError) {
      setStatusUpdateErrorMessage(statusError.response?.data?.message || 'Failed to update item status');
    } finally {
      setIsUpdatingItemStatus(false);
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

      {/* Removed old owner-only "Mark as Found" action block for LOST items. */}

      {canShowOwnerStatusAction ? (
        <section className="card">
          <button type="button" onClick={handleOwnerStatusAction} disabled={isUpdatingItemStatus}>
            {isUpdatingItemStatus ? 'Updating status...' : ownerStatusActionLabel}
          </button>
          {statusUpdateErrorMessage ? (
            <p className="message-error" role="alert">{statusUpdateErrorMessage}</p>
          ) : null}
        </section>
      ) : null}

      {/* Updated claim form section for found-item ownership claims. */}
      {canShowClaimForm ? (
        <section className="card">
          <h2>This Is Mine</h2>
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
              {isSubmittingClaim ? 'Submitting claim...' : 'This Is Mine'}
            </button>
          </form>
        </section>
      ) : null}

      {isOwner ? (
        <section className="card">
          <h2>Claims</h2>

          {isLoadingClaims ? <p className="muted-text">Loading claims...</p> : null}
          {claimsError ? <p className="message-error" role="alert">{claimsError}</p> : null}
          {reviewErrorMessage ? <p className="message-error" role="alert">{reviewErrorMessage}</p> : null}

          {!isLoadingClaims && !claimsError && claims.length === 0 ? (
            <p className="muted-text">No claims have been submitted yet.</p>
          ) : null}

          {!isLoadingClaims && !claimsError && claims.length > 0 ? (
            <div className="form">
              {claims.map((claim) => {
                const claimId = claim._id || claim.id;
                const claimant = claim.claimantId || claim.claimedBy || {};
                const isReviewing = Boolean(claimId && reviewingClaimIds[claimId]);
                const isPending = claim.status === 'PENDING';

                return (
                  <article key={claimId} className="card">
                    <p>
                      <strong>Claimed by:</strong>{' '}
                      {claimant.name || claimant.email || 'Unknown claimant'}
                      {claimant.name && claimant.email ? ` (${claimant.email})` : ''}
                    </p>
                    <p><strong>Message:</strong> {claim.message || 'No message provided.'}</p>
                    <p><strong>Status:</strong> {claim.status}</p>

                    {isPending ? (
                      <div>
                        <button
                          type="button"
                          onClick={() => handleReviewClaim(claimId, 'approve')}
                          disabled={isReviewing}
                        >
                          {isReviewing ? 'Processing...' : 'Approve'}
                        </button>{' '}
                        <button
                          type="button"
                          onClick={() => handleReviewClaim(claimId, 'reject')}
                          disabled={isReviewing}
                        >
                          {isReviewing ? 'Processing...' : 'Reject'}
                        </button>
                      </div>
                    ) : null}
                  </article>
                );
              })}
            </div>
          ) : null}
        </section>
      ) : null}
    </main>
  );
}

export default ItemDetailPage;
