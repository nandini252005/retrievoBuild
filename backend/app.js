const express = require('express');
const cors = require('cors');

const { authRoutes, itemRoutes, claimRoutes } = require('./routes');

const app = express();

/* ✅ APPLY CORS FIRST — NO OPTIONS, NO GUESSING */
app.use(cors());

app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api/auth', authRoutes);
app.use('/api/items', itemRoutes);
app.use('/api/claims', claimRoutes);

module.exports = app;
