import './StatusTimeline.css';

const LOST_FLOW = ['LOST', 'PENDING', 'APPROVED', 'RETURNED'];
const FOUND_FLOW = ['FOUND', 'PENDING', 'APPROVED', 'CLAIMED'];

function StatusTimeline({ reportType, status }) {
  const steps = reportType === 'FOUND' ? FOUND_FLOW : LOST_FLOW;
  const currentIndex = steps.indexOf(status);

  return (
    <div className="status-timeline" aria-label="Report lifecycle progress">
      {steps.map((step, index) => {
        const active = index <= currentIndex;

        return (
          <div className="timeline-step" key={step}>
            <div className={`timeline-circle ${active ? 'timeline-circle-active' : ''}`} />

            <span className={`timeline-label ${active ? 'timeline-label-active' : ''}`}>{step}</span>

            {index !== steps.length - 1 && (
              <div className={`timeline-line ${index < currentIndex ? 'timeline-line-active' : ''}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

export default StatusTimeline;
