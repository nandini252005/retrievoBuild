import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import apiClient from '../api/client';

function CreateItemPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const initialReportType = location.state?.defaultStatus === 'FOUND' ? 'FOUND' : 'LOST';

  const [form, setForm] = useState({
    title: '',
    description: '',
    category: '',
    customCategory: '',
    location: '',
    reportType: initialReportType,
  });
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((previous) => ({ ...previous, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      const formData = new FormData();
      formData.append('title', form.title);
      formData.append('description', form.description);
      formData.append('category', form.category);
      formData.append('customCategory', form.customCategory);
      formData.append('location', form.location);
      formData.append('reportType', form.reportType);

      if (image) {
        formData.append('image', image);
      }

      await apiClient.post('/items', formData);
      navigate('/items');
    } catch (submitError) {
      setError(submitError.response?.data?.message || 'Failed to create item');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="page create-item-container">
      <h1>Create Item</h1>

      {error && <p className="message-error" role="alert">{error}</p>}

      <section className="card create-item-card">
        <form className="form" onSubmit={handleSubmit}>
          <div className="form-row form-field">
            <label htmlFor="title">Title</label>
            <input id="title" name="title" value={form.title} onChange={handleChange} required />
          </div>

          <div className="form-row form-field">
            <label htmlFor="description">Description</label>
            <textarea id="description" name="description" value={form.description} onChange={handleChange} required />
          </div>

          <div className="form-row form-field">
            <label htmlFor="category">Category</label>
            <select id="category" name="category" value={form.category} onChange={handleChange} required>
              <option value="">Select Category</option>
              <option value="Electronics">Electronics</option>
              <option value="Books">Books</option>
              <option value="Keys">Keys</option>
              <option value="Daily Essentials">Daily Essentials</option>
              <option value="Clothing">Clothing</option>
              <option value="Accessories">Accessories</option>
              <option value="Others">Others</option>
            </select>
          </div>

          {form.category === 'Others' && (
            <div className="form-row form-field">
              <label htmlFor="customCategory">Custom Category</label>
              <input
                id="customCategory"
                type="text"
                name="customCategory"
                placeholder="Specify category"
                value={form.customCategory}
                onChange={handleChange}
                required
              />
            </div>
          )}

          <div className="form-row form-field">
            <label htmlFor="location">Location</label>
            <input id="location" name="location" value={form.location} onChange={handleChange} required />
          </div>

          <div className="form-row form-field">
            <label htmlFor="reportType">Status</label>
            <select id="reportType" name="reportType" value={form.reportType} onChange={handleChange}>
              <option value="LOST">LOST</option>
              <option value="FOUND">FOUND</option>
            </select>
          </div>

          <div className="form-row form-field">
            <label htmlFor="image">Image (optional)</label>
            <input
              id="image"
              type="file"
              accept="image/*"
              onChange={(event) => {
                const file = event.target.files?.[0] || null;
                setImage(file);
                setPreview(file ? URL.createObjectURL(file) : null);
              }}
            />

            {preview && <img src={preview} alt="Selected item preview" className="image-preview" />}
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
