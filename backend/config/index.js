const getJwtSecret = () => {
  const jwtSecret = process.env.JWT_SECRET;

  if (!jwtSecret) {
    throw new Error('Missing required environment variable: JWT_SECRET');
  }

  return jwtSecret;
};

module.exports = {
  getJwtSecret,
};
