import { useNavigate } from 'react-router-dom';
import './ItemsPage.css';

function ItemsPage() {
  const navigate = useNavigate();

  return (
    <main className="page">
      <h1>Welcome to Retrievo</h1>

      {/* Instruction Note */}
      <section className="dashboard-note">
        <h2>Search Before Reporting</h2>
        <p>
          Please search existing reports first to check whether your item
          has already been listed. If you cannot find it, you may proceed
          to create a new report.
        </p>
      </section>

      {/* Action Cards */}
      <section className="dashboard-actions">

  {/* View Reports - PRIMARY */}
  <button
    className="dashboard-card dashboard-card--primary"
    onClick={() => navigate('/reports')}
  >
    <div className="dashboard-card__icon">🔍</div>
    <h3>View Reports</h3>
    <p>Browse and search all reported items before creating a new report.</p>
  </button>

  {/* Report Lost */}
  <button
    className="dashboard-card dashboard-card--primary"
    onClick={() => navigate('/create', { state: { defaultStatus: 'LOST' } })}
  >
    <div className="dashboard-card__icon">📌</div>
    <h3>Report Lost Item</h3>
    <p>Submit details about something you’ve lost.</p>
  </button>

  {/* Report Found */}
  <button
    className="dashboard-card dashboard-card--primary"
    onClick={() => navigate('/create', { state: { defaultStatus: 'FOUND' } })}
  >
    <div className="dashboard-card__icon">📦</div>
    <h3>Report Found Item</h3>
    <p>Record an item you discovered to help reunite it.</p>
  </button>

</section>
    </main>
  );
}

export default ItemsPage;