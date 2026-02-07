const { authenticateJWT, authorizeRoles } = require('./auth.middleware');

module.exports = {
  authenticateJWT,
  authorizeRoles,
};
