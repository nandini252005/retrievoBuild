const express = require('express');


const { createItem, getItems, getItemById, updateItemStatus } = require('../controllers/item.controller');
const { authenticateJWT } = require('../middleware');
const { deleteItem } = require('../controllers/item.controller');


const router = express.Router();

router.delete('/:id', authenticateJWT, deleteItem);
router.post('/', authenticateJWT, createItem);
router.get('/', authenticateJWT, getItems);
router.get('/:id', getItemById);
router.patch('/:id/status', authenticateJWT, updateItemStatus);


module.exports = router;



