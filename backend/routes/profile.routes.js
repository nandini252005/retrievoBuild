const express = require('express');

const { getMyProfile, updateMyProfile } = require('../controllers/profile.controller');
const { authenticateJWT } = require('../middleware');

const router = express.Router();

router.get('/me', authenticateJWT, getMyProfile);
router.patch('/me', authenticateJWT, updateMyProfile);

module.exports = router;
