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

const FILTERS = [
  { key: 'LOST', label: 'Lost Reports' },
  { key: 'FOUND', label: 'Found Reports' },
  { key: 'MY_CLAIMS', label: 'My Claims' },
  { key: 'RECEIVED_CLAIMS', label: 'Claims Received' },
];

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

function filterItems(items, activeFilter) {
  if (activeFilter === 'LOST') {
    return items.filter((item) => item.status === 'LOST');
  }

  if (activeFilter === 'FOUND') {
    return items.filter((item) => item.status === 'FOUND');
  }

  return items;
}

function MyReportsPage() {
  const { isAuthenticated } = useAuth();

  const [myItems, setMyItems] = useState([]);
  const [claimsSubmitted, setClaimsSubmitted] = useState([]);
  const [claimsReceived, setClaimsReceived] = useState([]);
  const [activeFilter, setActiveFilter] = useState('ALL');
  const [hoveredFilter, setHoveredFilter] = useState('');

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

  const filteredItems = filterItems(myItems, activeFilter);
  const showItemsSection = activeFilter === 'ALL' || activeFilter === 'LOST' || activeFilter === 'FOUND';
  const showSubmittedClaimsSection = activeFilter === 'ALL' || activeFilter === 'MY_CLAIMS';
  const showReceivedClaimsSection = activeFilter === 'ALL' || activeFilter === 'RECEIVED_CLAIMS';

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

      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '0.5rem',
          marginBottom: '1rem',
        }}
      >
        {FILTERS.map((filter) => {
          const isActive = activeFilter === filter.key;
          const isHovered = hoveredFilter === filter.key;

          return (
            <button
              type="button"
              key={filter.key}
              className={isActive ? 'active-filter' : ''}
              onClick={() => setActiveFilter(filter.key)}
              onMouseEnter={() => setHoveredFilter(filter.key)}
              onMouseLeave={() => setHoveredFilter('')}
              style={{
                border: isActive ? '1px solid #0b2f6b' : '1px solid #b0b0b0',
                backgroundColor: isActive ? '#0b2f6b' : isHovered ? '#f3f4f6' : '#ffffff',
                color: isActive ? '#ffffff' : '#1f2937',
                borderRadius: '999px',
                padding: '0.5rem 0.9rem',
                fontSize: '0.9rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
            >
              {filter.label}
            </button>
          );
        })}
      </div>

      {showItemsSection ? (
        <section className="card">
          <h2>My Reported Items</h2>

          {sectionLoading.items ? <p className="muted-text">Loading your reported items...</p> : null}
          {!sectionLoading.items && sectionErrors.items ? (
            <p className="message-error" role="alert">{sectionErrors.items}</p>
          ) : null}

          {!sectionLoading.items && !sectionErrors.items && filteredItems.length === 0 ? (
            <p className="muted-text">You have not reported any items for this filter.</p>
          ) : null}

          {!sectionLoading.items && !sectionErrors.items && filteredItems.length > 0 ? (
            <div className="reports-list">
              {filteredItems.map((item) => (
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
      ) : null}

      {showSubmittedClaimsSection ? (
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
      ) : null}

      {showReceivedClaimsSection ? (
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
      ) : null}
    </main>
  );
}

export default MyReportsPage;
