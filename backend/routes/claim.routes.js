const express = require('express');

const { createClaim, approveClaim, rejectClaim } = require('../controllers/claim.controller');
const { authenticateJWT } = require('../middleware');

const router = express.Router();

router.post('/', authenticateJWT, createClaim);
router.patch('/:id/approve', authenticateJWT, approveClaim);
router.patch('/:id/reject', authenticateJWT, rejectClaim);

module.exports = router;
