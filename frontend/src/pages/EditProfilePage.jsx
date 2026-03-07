import { useEffect, useState } from 'react';

import apiClient from '../api/client';

function EditProfilePage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      setErrorMessage('');

      try {
        const response = await apiClient.get('/profile/me');
        const profile = response.data || {};

        setName(profile.name || '');
        setEmail(profile.email || '');
      } catch (error) {
        const apiMessage = error.response?.data?.message;
        setErrorMessage(apiMessage || 'Failed to load profile.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');
    setIsSubmitting(true);

    try {
      const payload = { name };

      if (newPassword) {
        payload.password = newPassword;
      }

      const response = await apiClient.patch('/profile/me', payload);
      const updatedProfile = response.data || {};

      setName(updatedProfile.name || name);
      setEmail(updatedProfile.email || email);
      setNewPassword('');
      setSuccessMessage('Profile updated successfully.');
    } catch (error) {
      const apiMessage = error.response?.data?.message;
      setErrorMessage(apiMessage || 'Failed to update profile.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="page">
      <h1>Edit Profile</h1>

      <section className="card">
        {isLoading ? (
          <p className="muted-text">Loading profile...</p>
        ) : (
          <form className="form" onSubmit={handleSubmit}>
            <div className="form-row">
              <label htmlFor="name">Name</label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(event) => setName(event.target.value)}
                autoComplete="name"
                required
              />
            </div>

            <div className="form-row">
              <label htmlFor="email">Email</label>
              <input id="email" type="email" value={email} readOnly disabled />
            </div>

            <div className="form-row">
              <label htmlFor="new-password">New Password</label>
              <input
                id="new-password"
                type="password"
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
                autoComplete="new-password"
                placeholder="Leave blank to keep current password"
              />
            </div>

            {errorMessage ? (
              <p className="message-error" role="alert">
                {errorMessage}
              </p>
            ) : null}

            {successMessage ? <p className="message-success">{successMessage}</p> : null}

            <button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </button>
          </form>
        )}
      </section>
    </main>
  );
}

export default EditProfilePage;
