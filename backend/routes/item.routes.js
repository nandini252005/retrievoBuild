const express = require('express');

const { createItem, getItems, getItemById, updateItemStatus } = require('../controllers/item.controller');
const { authenticateJWT } = require('../middleware');

const router = express.Router();

router.post('/', authenticateJWT, createItem);
router.get('/', getItems);
router.get('/:id', getItemById);
router.patch('/:id/status', authenticateJWT, updateItemStatus);

module.exports = router;
