import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import apiClient from '../api/client';

const getErrorMessages = (error) => {
  const apiErrors = error.response?.data?.errors;
  const apiMessage = error.response?.data?.message;

  if (Array.isArray(apiErrors) && apiErrors.length > 0) {
    return apiErrors.map((entry) => {
      if (typeof entry === 'string') {
        return entry;
      }

      if (entry?.msg && entry?.path) {
        return `${entry.path}: ${entry.msg}`;
      }

      return entry?.message || JSON.stringify(entry);
    });
  }

  if (apiMessage) {
    return [apiMessage];
  }

  return ['Registration failed. Please try again.'];
};

function RegisterPage() {
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessages, setErrorMessages] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const hasMultipleErrors = useMemo(() => errorMessages.length > 1, [errorMessages.length]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setErrorMessages([]);
    setIsSubmitting(true);

    try {
      await apiClient.post('/auth/register', {
        name,
        email,
        password,
      });

      navigate('/login', { replace: true });
    } catch (error) {
      setErrorMessages(getErrorMessages(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main>
      <h1>Register</h1>
      <form onSubmit={handleSubmit}>
        <div>
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

        <div>
          <label htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            autoComplete="email"
            required
          />
        </div>

        <div>
          <label htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="new-password"
            required
          />
        </div>

        {errorMessages.length > 0 ? (
          hasMultipleErrors ? (
            <ul role="alert">
              {errorMessages.map((message) => (
                <li key={message}>{message}</li>
              ))}
            </ul>
          ) : (
            <p role="alert">{errorMessages[0]}</p>
          )
        ) : null}

        <button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Registering...' : 'Register'}
        </button>
      </form>

      <p>
        Already have an account? <Link to="/login">Login</Link>
      </p>
    </main>
  );
}

export default RegisterPage;
