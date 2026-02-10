import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import apiClient from '../api/client';

function CreateItemPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const initialStatus = location.state?.defaultStatus === 'FOUND' ? 'FOUND' : 'LOST';

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [locationText, setLocationText] = useState('');
  const [status, setStatus] = useState(initialStatus);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      await apiClient.post('/items', {
        title,
        description,
        category,
        location: locationText,
        status,
      });

      navigate('/items');
    } catch (submitError) {
      setError(submitError.response?.data?.message || 'Failed to create item');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="page">
      <h1>Create Item</h1>

      {error && <p className="message-error" role="alert">{error}</p>}

      <section className="card">
        <form className="form" onSubmit={handleSubmit}>
          <div className="form-row">
            <label htmlFor="title">Title</label>
            <input id="title" value={title} onChange={(event) => setTitle(event.target.value)} required />
          </div>

          <div className="form-row">
            <label htmlFor="description">Description</label>
            <textarea
              id="description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              required
            />
          </div>

          <div className="form-row">
            <label htmlFor="category">Category</label>
            <input id="category" value={category} onChange={(event) => setCategory(event.target.value)} required />
          </div>

          <div className="form-row">
            <label htmlFor="location">Location</label>
            <input id="location" value={locationText} onChange={(event) => setLocationText(event.target.value)} required />
          </div>

          <div className="form-row">
            <label htmlFor="status">Status</label>
            <select id="status" value={status} onChange={(event) => setStatus(event.target.value)}>
              <option value="LOST">LOST</option>
              <option value="FOUND">FOUND</option>
            </select>
          </div>

          <button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Creating...' : 'Create Item'}
          </button>
        </form>
      </section>
    </main>
  );
}

export default CreateItemPage;
