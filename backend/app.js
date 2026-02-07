const express = require('express');

const { authRoutes, itemRoutes, claimRoutes } = require('./routes');

const app = express();

app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api/auth', authRoutes);
app.use('/api/items', itemRoutes);
app.use('/api/claims', claimRoutes);

module.exports = app;
