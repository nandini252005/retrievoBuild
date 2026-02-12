import { useEffect, useState } from 'react';

import apiClient from '../api/client';
import { useAuth } from '../auth/AuthContext';
import './MyReportsPage.css';

const STATUS_CLASS_MAP = {
  LOST: 'status-badge status-badge--gray',
  FOUND: 'status-badge status-badge--navy',
  CLAIMED: 'status-badge status-badge--navy',
  RETURNED: 'status-badge status-badge--green',
  PENDING: 'status-badge status-badge--navy',
  APPROVED: 'status-badge status-badge--green',
  REJECTED: 'status-badge status-badge--red',
};

function getList(data, key) {
  if (Array.isArray(data)) {
    return data;
  }

  if (Array.isArray(data?.[key])) {
    return data[key];
  }

  return [];
}

function formatStatus(status) {
  return status || 'UNKNOWN';
}

function badgeClassFor(status) {
  return STATUS_CLASS_MAP[status] || 'status-badge status-badge--gray';
}

function MyReportsPage() {
  const { isAuthenticated } = useAuth();

  const [myItems, setMyItems] = useState([]);
  const [claimsSubmitted, setClaimsSubmitted] = useState([]);
  const [claimsReceived, setClaimsReceived] = useState([]);

  const [sectionLoading, setSectionLoading] = useState({
    items: false,
    submitted: false,
    received: false,
  });

  const [sectionErrors, setSectionErrors] = useState({
    items: '',
    submitted: '',
    received: '',
  });

  useEffect(() => {
    let isCancelled = false;

    const fetchMyReports = async () => {
      if (!isAuthenticated) {
        setMyItems([]);
        setClaimsSubmitted([]);
        setClaimsReceived([]);
        setSectionLoading({ items: false, submitted: false, received: false });
        setSectionErrors({ items: '', submitted: '', received: '' });
        return;
      }

      setSectionLoading({ items: true, submitted: true, received: true });
      setSectionErrors({ items: '', submitted: '', received: '' });

      const [itemsResult, submittedResult, receivedResult] = await Promise.allSettled([
        apiClient.get('/items', { params: { mine: true } }),
        apiClient.get('/claims/mine'),
        apiClient.get('/claims/received'),
      ]);

      if (isCancelled) {
        return;
      }

      if (itemsResult.status === 'fulfilled') {
        setMyItems(getList(itemsResult.value.data, 'items'));
      } else {
        setMyItems([]);
        setSectionErrors((current) => ({
          ...current,
          items: itemsResult.reason?.response?.data?.message || 'Could not load your reported items.',
        }));
      }

      if (submittedResult.status === 'fulfilled') {
        setClaimsSubmitted(getList(submittedResult.value.data, 'claims'));
      } else {
        setClaimsSubmitted([]);
        setSectionErrors((current) => ({
          ...current,
          submitted: submittedResult.reason?.response?.data?.message || 'Could not load submitted claims.',
        }));
      }

      if (receivedResult.status === 'fulfilled') {
        setClaimsReceived(getList(receivedResult.value.data, 'claims'));
      } else {
        setClaimsReceived([]);
        setSectionErrors((current) => ({
          ...current,
          received: receivedResult.reason?.response?.data?.message || 'Could not load claims on your items.',
        }));
      }

      setSectionLoading({ items: false, submitted: false, received: false });
    };

    fetchMyReports();

    return () => {
      isCancelled = true;
    };
  }, [isAuthenticated]);

  if (!isAuthenticated) {
    return (
      <main className="page">
        <h1>My Reports</h1>
        <section className="card">
          <p className="muted-text">Please sign in to view your reports.</p>
        </section>
      </main>
    );
  }

  return (
    <main className="page">
      <h1>My Reports</h1>

      <section className="card">
        <h2>My Reported Items</h2>

        {sectionLoading.items ? <p className="muted-text">Loading your reported items...</p> : null}
        {!sectionLoading.items && sectionErrors.items ? (
          <p className="message-error" role="alert">{sectionErrors.items}</p>
        ) : null}

        {!sectionLoading.items && !sectionErrors.items && myItems.length === 0 ? (
          <p className="muted-text">You have not reported any items yet.</p>
        ) : null}

        {!sectionLoading.items && !sectionErrors.items && myItems.length > 0 ? (
          <div className="reports-list">
            {myItems.map((item) => (
              <article className="card report-card" key={item._id || item.id || item.title}>
                <p><strong>{item.title || 'Untitled item'}</strong></p>
                <p>Category: {item.category || 'N/A'}</p>
                <p>Location: {item.location || 'N/A'}</p>
                <p>
                  Status:{' '}
                  <span className={badgeClassFor(formatStatus(item.status))}>
                    {formatStatus(item.status)}
                  </span>
                </p>
              </article>
            ))}
          </div>
        ) : null}
      </section>

      <section className="card">
        <h2>Claims I Submitted</h2>

        {sectionLoading.submitted ? <p className="muted-text">Loading claims you submitted...</p> : null}
        {!sectionLoading.submitted && sectionErrors.submitted ? (
          <p className="message-error" role="alert">{sectionErrors.submitted}</p>
        ) : null}

        {!sectionLoading.submitted && !sectionErrors.submitted && claimsSubmitted.length === 0 ? (
          <p className="muted-text">You have not submitted any claims.</p>
        ) : null}

        {!sectionLoading.submitted && !sectionErrors.submitted && claimsSubmitted.length > 0 ? (
          <div className="reports-list">
            {claimsSubmitted.map((claim) => {
              const itemTitle = claim.itemId?.title || claim.itemTitle || 'Unknown item';

              return (
                <article className="card report-card" key={claim._id || claim.id || `${itemTitle}-${claim.message}`}>
                  <p><strong>Item:</strong> {itemTitle}</p>
                  <p><strong>Message:</strong> {claim.message || 'No message provided.'}</p>
                  <p>
                    Status:{' '}
                    <span className={badgeClassFor(formatStatus(claim.status))}>
                      {formatStatus(claim.status)}
                    </span>
                  </p>
                </article>
              );
            })}
          </div>
        ) : null}
      </section>

      <section className="card">
        <h2>Claims On My Items</h2>

        {sectionLoading.received ? <p className="muted-text">Loading claims on your items...</p> : null}
        {!sectionLoading.received && sectionErrors.received ? (
          <p className="message-error" role="alert">{sectionErrors.received}</p>
        ) : null}

        {!sectionLoading.received && !sectionErrors.received && claimsReceived.length === 0 ? (
          <p className="muted-text">No one has claimed your reported items yet.</p>
        ) : null}

        {!sectionLoading.received && !sectionErrors.received && claimsReceived.length > 0 ? (
          <div className="reports-list">
            {claimsReceived.map((claim) => {
              const itemTitle = claim.itemId?.title || claim.itemTitle || 'Unknown item';
              const claimantName = claim.claimantId?.name || claim.claimantId?.email || 'Unknown claimant';

              return (
                <article className="card report-card" key={claim._id || claim.id || `${itemTitle}-${claimantName}`}>
                  <p><strong>Item:</strong> {itemTitle}</p>
                  <p><strong>Claimant:</strong> {claimantName}</p>
                  <p><strong>Message:</strong> {claim.message || 'No message provided.'}</p>
                  <p>
                    Status:{' '}
                    <span className={badgeClassFor(formatStatus(claim.status))}>
                      {formatStatus(claim.status)}
                    </span>
                  </p>
                </article>
              );
            })}
          </div>
        ) : null}
      </section>
    </main>
  );
}

export default MyReportsPage;
