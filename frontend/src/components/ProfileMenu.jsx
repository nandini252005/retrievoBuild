import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

function ProfileMenu({ onLogout }) {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('keydown', handleEscape);
    };
  }, []);

  const handleSelect = (action) => {
    setIsOpen(false);
    action();
  };

  return (
    <div className="navbar__profile" ref={containerRef}>
      <button
        type="button"
        className="navbar__profile-button"
        onClick={() => setIsOpen((prevState) => !prevState)}
        aria-expanded={isOpen}
        aria-haspopup="menu"
        aria-label="Open profile menu"
      >
        <span aria-hidden="true" className="navbar__profile-icon">
          👤
        </span>
      </button>

      {isOpen ? (
        <ul className="navbar__dropdown" role="menu" aria-label="Profile menu">
          <li role="none">
            <button type="button" role="menuitem" onClick={() => handleSelect(() => navigate('/my-reports'))}>
              My Reports
            </button>
          </li>
          <li role="none">
            <button type="button" role="menuitem" onClick={() => handleSelect(() => navigate('/profile'))}>
              Edit Profile
            </button>
          </li>
          <li role="none">
            <button type="button" role="menuitem" onClick={() => handleSelect(() => navigate('/stats'))}>
              Stats
            </button>
          </li>
          <li role="none">
            <button type="button" role="menuitem" onClick={() => handleSelect(onLogout)}>
              Logout
            </button>
          </li>
        </ul>
      ) : null}
    </div>
  );
}

export default ProfileMenu;
