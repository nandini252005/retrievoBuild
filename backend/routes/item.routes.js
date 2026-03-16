const express = require('express');

const {
  createItem,
  getItems,
  getItemById,
  updateItemStatus,
  deleteItem,
} = require('../controllers/item.controller');
const { authenticateJWT } = require('../middleware');
const upload = require('../middleware/upload.middleware');

const router = express.Router();

router.delete('/:id', authenticateJWT, deleteItem);
router.post('/', authenticateJWT, upload.single('image'), createItem);
router.get('/', authenticateJWT, getItems);
router.get('/:id', getItemById);
router.patch('/:id/status', authenticateJWT, updateItemStatus);

module.exports = router;
