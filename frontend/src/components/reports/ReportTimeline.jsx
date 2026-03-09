const LIFECYCLE_BY_REPORT_TYPE = {
  LOST: ['LOST', 'PENDING', 'APPROVED', 'RETURNED'],
  FOUND: ['FOUND', 'PENDING', 'APPROVED', 'CLAIMED'],
};

function ReportTimeline({ reportType, status }) {
  const lifecycle = LIFECYCLE_BY_REPORT_TYPE[reportType] || [];

  if (lifecycle.length === 0) {
    return null;
  }

  const currentIndex = lifecycle.indexOf(status);

  return (
    <div className="timeline" aria-label="Report lifecycle progress">
      {lifecycle.map((step, index) => {
        const isCompleted = currentIndex >= 0 && index <= currentIndex;

        return (
          <div className="timeline-step" key={step}>
            <div className={`timeline-dot ${isCompleted ? 'is-completed' : ''}`} />
            {index < lifecycle.length - 1 ? (
              <div className={`timeline-line ${currentIndex > index ? 'is-completed' : ''}`} aria-hidden="true" />
            ) : null}
          </div>
        );
      })}
    </div>
  );
}

export default ReportTimeline;
