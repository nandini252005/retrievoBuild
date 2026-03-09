import { Link } from 'react-router-dom';

import ReportTimeline from './ReportTimeline';

const REPORT_TYPE_CLASS_MAP = {
  LOST: 'status-badge status-badge--lost',
  FOUND: 'status-badge status-badge--found',
};

function badgeClassFor(reportType) {
  return REPORT_TYPE_CLASS_MAP[reportType] || 'status-badge status-badge--neutral';
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
  const normalizedType = String(item.reportType || '').toLowerCase();

  return (
    <Link className="report-card-link" to={`/items/${item._id}`}>
      <article className={`report-card ${normalizedType}`}>
        <div className="report-header">
          <h3 className="report-title">{item.title}</h3>
          <span className={badgeClassFor(item.reportType)}>{item.reportType || 'UNKNOWN'}</span>
        </div>

        <div className="report-meta" aria-label="Report metadata">
          <span>Reported by {reportedBy}</span>
          <span className="meta-divider" aria-hidden="true">
            •
          </span>
          <span>{reportedOn}</span>
        </div>

        <div className="report-details" aria-label="Report details">
          <span>Category: {item.category || 'N/A'}</span>
          <span className="meta-divider" aria-hidden="true">
            •
          </span>
          <span>Location: {item.location || 'N/A'}</span>
        </div>

        <ReportTimeline reportType={item.reportType} status={item.status} />
      </article>
    </Link>
  );
}

export default ReportCard;
