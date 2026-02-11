import { useEffect, useMemo, useState } from 'react';

import apiClient from '../api/client';
import { useAuth } from '../auth/AuthContext';

const STATUS_STYLES = {
  LOST: { backgroundColor: '#e5e7eb', color: '#1f2937' },
  FOUND: { backgroundColor: '#dbeafe', color: '#1d4ed8' },
  CLAIMED: { backgroundColor: '#ffedd5', color: '#c2410c' },
  RETURNED: { backgroundColor: '#dcfce7', color: '#15803d' },
  PENDING: { backgroundColor: '#fef9c3', color: '#a16207' },
  APPROVED: { backgroundColor: '#dcfce7', color: '#15803d' },
  REJECTED: { backgroundColor: '#fee2e2', color: '#b91c1c' },
};

const badgeBaseStyle = {
  display: 'inline-flex',
  borderRadius: '999px',
  fontSize: '0.75rem',
  fontWeight: 700,
  padding: '0.2rem 0.55rem',
  letterSpacing: '0.03em',
};

function getId(value) {
  if (!value) {
    return null;
  }

  if (typeof value === 'string') {
    return value;
  }

  return value._id || value.id || null;
}

function normalizeClaims(data) {
  if (Array.isArray(data)) {
    return data;
  }

  if (Array.isArray(data?.claims)) {
    return data.claims;
  }

  return [];
}

async function fetchAllItems() {
  const limit = 50;
  let page = 1;
  let totalPages = 1;
  const allItems = [];

  while (page <= totalPages) {
    const response = await apiClient.get('/items', {
      params: {
        page,
        limit,
      },
    });

    const pageItems = Array.isArray(response.data?.items) ? response.data.items : [];
    allItems.push(...pageItems);

    totalPages = Number(response.data?.totalPages) || 1;
    page += 1;
  }

  return allItems;
}

function MyReportsPage() {
  const { user, isAuthenticated } = useAuth();

  const currentUserId = useMemo(() => getId(user), [user]);

  const [myItems, setMyItems] = useState([]);
  const [claimsSubmitted, setClaimsSubmitted] = useState([]);
  const [claimsOnMyItems, setClaimsOnMyItems] = useState([]);

  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [claimsSubmittedError, setClaimsSubmittedError] = useState('');

  const [reviewError, setReviewError] = useState('');
  const [reviewingClaimIds, setReviewingClaimIds] = useState({});

  useEffect(() => {
    const fetchReports = async () => {
      if (!isAuthenticated || !currentUserId) {
        setMyItems([]);
        setClaimsSubmitted([]);
        setClaimsOnMyItems([]);
        setIsLoading(false);
        setLoadError('');
        setClaimsSubmittedError('');
        return;
      }

      setIsLoading(true);
      setLoadError('');
      setClaimsSubmittedError('');

      try {
        const allItems = await fetchAllItems();

        const ownedItems = allItems.filter((item) => getId(item.createdBy) === currentUserId);
        setMyItems(ownedItems);

        const itemTitleById = allItems.reduce((accumulator, item) => {
          const itemId = getId(item);
          if (itemId) {
            accumulator[itemId] = item.title || 'Untitled item';
          }
          return accumulator;
        }, {});

        try {
          const submittedResponse = await apiClient.get('/claims', {
            params: {
              claimantId: currentUserId,
            },
          });

          const submittedClaims = normalizeClaims(submittedResponse.data).map((claim) => {
            const claimItemId = getId(claim.itemId);
            const claimItemTitle = claim.itemTitle || claim.itemId?.title || itemTitleById[claimItemId] || 'Unknown item';

            return {
              ...claim,
              itemTitle: claimItemTitle,
            };
          });

          setClaimsSubmitted(submittedClaims);
        } catch (submittedError) {
          setClaimsSubmitted([]);
          setClaimsSubmittedError(
            submittedError.response?.data?.message
              || 'Unable to load submitted claims with the current API.'
          );
        }

        const claimsByOwnedItems = await Promise.allSettled(
          ownedItems.map(async (item) => {
            const itemId = getId(item);
            const response = await apiClient.get('/claims', {
              params: {
                itemId,
              },
            });

            return normalizeClaims(response.data).map((claim) => ({
              ...claim,
              itemId,
              itemTitle: item.title,
            }));
          })
        );

        const flattenedClaims = [];
        claimsByOwnedItems.forEach((result) => {
          if (result.status === 'fulfilled' && Array.isArray(result.value)) {
            flattenedClaims.push(...result.value);
          }
        });

        setClaimsOnMyItems(flattenedClaims);
      } catch (error) {
        setMyItems([]);
        setClaimsSubmitted([]);
        setClaimsOnMyItems([]);
        setLoadError(error.response?.data?.message || 'Failed to load reports.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchReports();
  }, [currentUserId, isAuthenticated]);

  const handleReviewClaim = async (claimId, decision) => {
    if (!claimId) {
      return;
    }

    setReviewError('');
    setReviewingClaimIds((previous) => ({ ...previous, [claimId]: true }));

    const endpoint = decision === 'approve' ? `/claims/${claimId}/approve` : `/claims/${claimId}/reject`;

    try {
      const response = await apiClient.patch(endpoint);
      const updatedClaim = response.data?.claim || response.data;

      setClaimsOnMyItems((previousClaims) =>
        previousClaims.map((claim) => {
          const existingClaimId = claim._id || claim.id;
          if (existingClaimId !== claimId) {
            return claim;
          }

          return {
            ...claim,
            ...(updatedClaim && typeof updatedClaim === 'object' ? updatedClaim : {}),
            status: updatedClaim?.status || (decision === 'approve' ? 'APPROVED' : 'REJECTED'),
          };
        })
      );
    } catch (error) {
      setReviewError(error.response?.data?.message || 'Failed to review claim.');
    } finally {
      setReviewingClaimIds((previous) => ({ ...previous, [claimId]: false }));
    }
  };

  if (!isAuthenticated) {
    return (
      <main className="page">
        <h1>My Reports</h1>
        <section className="card">
          <p className="muted-text">Please sign in to view your reports and claims.</p>
        </section>
      </main>
    );
  }

  return (
    <main className="page">
      <h1>My Reports</h1>

      {isLoading ? <p className="muted-text">Loading your reports...</p> : null}
      {!isLoading && loadError ? <p className="message-error" role="alert">{loadError}</p> : null}

      {!isLoading && !loadError ? (
        <>
          <section className="card">
            <h2>My Reported Items</h2>
            {myItems.length === 0 ? (
              <p className="muted-text">You have not created any item reports yet.</p>
            ) : (
              <div className="form">
                {myItems.map((item) => {
                  const itemId = getId(item);
                  const badgeStyle = STATUS_STYLES[item.status] || STATUS_STYLES.LOST;

                  return (
                    <article key={itemId || item.title} className="card">
                      <p><strong>Title:</strong> {item.title}</p>
                      <p>
                        <strong>Status:</strong>{' '}
                        <span style={{ ...badgeBaseStyle, ...badgeStyle }}>{item.status}</span>
                      </p>
                      <p><strong>Category:</strong> {item.category || 'N/A'}</p>
                      <p><strong>Location:</strong> {item.location || 'N/A'}</p>
                    </article>
                  );
                })}
              </div>
            )}
          </section>

          <section className="card">
            <h2>Claims I Submitted</h2>
            {claimsSubmittedError ? <p className="message-error" role="alert">{claimsSubmittedError}</p> : null}
            {!claimsSubmittedError && claimsSubmitted.length === 0 ? (
              <p className="muted-text">You have not submitted any claims yet.</p>
            ) : null}

            {claimsSubmitted.length > 0 ? (
              <div className="form">
                {claimsSubmitted.map((claim) => {
                  const claimId = claim._id || claim.id;
                  const badgeStyle = STATUS_STYLES[claim.status] || STATUS_STYLES.PENDING;

                  return (
                    <article key={claimId || `${claim.itemTitle}-${claim.message}`} className="card">
                      <p><strong>Item:</strong> {claim.itemTitle || 'Unknown item'}</p>
                      <p>
                        <strong>Claim Status:</strong>{' '}
                        <span style={{ ...badgeBaseStyle, ...badgeStyle }}>{claim.status || 'PENDING'}</span>
                      </p>
                      <p><strong>Message:</strong> {claim.message || 'No message provided.'}</p>
                    </article>
                  );
                })}
              </div>
            ) : null}
          </section>

          <section className="card">
            <h2>Claims On My Items</h2>
            {reviewError ? <p className="message-error" role="alert">{reviewError}</p> : null}

            {claimsOnMyItems.length === 0 ? (
              <p className="muted-text">No claims have been submitted on your items.</p>
            ) : (
              <div className="form">
                {claimsOnMyItems.map((claim) => {
                  const claimId = claim._id || claim.id;
                  const claimant = claim.claimantId || {};
                  const claimantName = claimant.name || claimant.email || 'Unknown claimant';
                  const isPending = claim.status === 'PENDING';
                  const isReviewing = Boolean(claimId && reviewingClaimIds[claimId]);
                  const badgeStyle = STATUS_STYLES[claim.status] || STATUS_STYLES.PENDING;

                  return (
                    <article key={claimId || `${claim.itemTitle}-${claimantName}`} className="card">
                      <p><strong>Claimant:</strong> {claimantName}</p>
                      <p><strong>Item:</strong> {claim.itemTitle || 'Unknown item'}</p>
                      <p>
                        <strong>Status:</strong>{' '}
                        <span style={{ ...badgeBaseStyle, ...badgeStyle }}>{claim.status || 'PENDING'}</span>
                      </p>

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
            )}
          </section>
        </>
      ) : null}
    </main>
  );
}

export default MyReportsPage;
