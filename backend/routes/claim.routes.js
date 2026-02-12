const express = require('express');
const {
  createClaim,
  getClaimsForItem,
  getMyClaims,
  getReceivedClaims,
  approveClaim,
  rejectClaim,
} = require('../controllers/claim.controller');

const { authenticateJWT } = require('../middleware');

const router = express.Router();

router.post('/', authenticateJWT, createClaim);
router.get('/mine', authenticateJWT, getMyClaims);
router.get('/received', authenticateJWT, getReceivedClaims);
router.get('/', authenticateJWT, getClaimsForItem);

router.patch('/:id/approve', authenticateJWT, approveClaim);
router.patch('/:id/reject', authenticateJWT, rejectClaim);

module.exports = router;
