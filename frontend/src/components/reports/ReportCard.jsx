import { Link } from 'react-router-dom';

import ReportTimeline from './ReportTimeline';

const STATUS_CLASS_MAP = {
  LOST: 'status-badge status-badge--gray',
  FOUND: 'status-badge status-badge--navy',
  CLAIMED: 'status-badge status-badge--navy',
  RETURNED: 'status-badge status-badge--green',
  PENDING: 'status-badge status-badge--navy',
  APPROVED: 'status-badge status-badge--green',
  REJECTED: 'status-badge status-badge--red',
};

function formatStatus(status) {
  return status || 'UNKNOWN';
}

function badgeClassFor(status) {
  return STATUS_CLASS_MAP[status] || 'status-badge status-badge--gray';
}

function formatReportedOn(createdAt) {
  if (!createdAt) {
    return 'N/A';
  }

  return new Date(createdAt).toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

function ReportCard({ item }) {
  const reportedBy = item.createdBy?.name || item.createdBy?.email || 'Unknown';
  const reportedOn = formatReportedOn(item.createdAt);

  return (
    <Link className="report-card-link" to={`/items/${item._id}`}>
      <article className="report-card-compact">
        <div className="report-card-compact__header">
          <h3 className="report-card-compact__title">{item.title}</h3>
          <span className={badgeClassFor(formatStatus(item.status))}>{formatStatus(item.status)}</span>
        </div>

        <div className="report-card-compact__meta" aria-label="Report metadata">
          <span>Reported by {reportedBy}</span>
          <span aria-hidden="true">•</span>
          <span>{reportedOn}</span>
        </div>

        <div className="report-card-compact__details" aria-label="Report details">
          <span>{item.category || 'N/A'}</span>
          <span aria-hidden="true">•</span>
          <span>{item.location || 'N/A'}</span>
        </div>

        <ReportTimeline reportType={item.reportType} status={item.status} />
      </article>
    </Link>
  );
}

export default ReportCard;
