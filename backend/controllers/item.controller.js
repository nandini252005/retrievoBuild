const mongoose = require('mongoose');

const { Item } = require('../models');

const VALID_STATUS_TRANSITIONS = {
  LOST: 'FOUND',
  FOUND: 'CLAIMED',
  CLAIMED: 'RETURNED',
};

const createItem = async (req, res) => {
  try {
    const { title, description, category, location, images } = req.body;

    if (!title || !description || !category || !location) {
      return res.status(400).json({
        message: 'title, description, category, and location are required',
      });
    }

    const item = await Item.create({
      title,
      description,
      category,
      location,
      images: Array.isArray(images) ? images : [],
      status: 'LOST',
      createdBy: req.user.id,
    });

    return res.status(201).json(item);
  } catch (error) {
    return res.status(500).json({ message: 'Failed to create item' });
  }
};

const getItems = async (req, res) => {
  try {
    const items = await Item.find()
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });

    return res.status(200).json(items);
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch items' });
  }
};

const getItemById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid item id' });
    }

    const item = await Item.findById(id).populate('createdBy', 'name email');

    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }

    return res.status(200).json(item);
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch item' });
  }
};

const updateItemStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid item id' });
    }

    if (!status) {
      return res.status(400).json({ message: 'status is required' });
    }

    const item = await Item.findById(id);

    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }

    if (item.createdBy.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Forbidden: only owner can update item status' });
    }

    const expectedNextStatus = VALID_STATUS_TRANSITIONS[item.status];

    if (!expectedNextStatus || status !== expectedNextStatus) {
      return res.status(400).json({
        message: `Invalid status transition. Allowed transition: ${item.status} -> ${expectedNextStatus || 'NONE'}`,
      });
    }

    item.status = status;
    await item.save();

    return res.status(200).json(item);
  } catch (error) {
    return res.status(500).json({ message: 'Failed to update item status' });
  }
};

module.exports = {
  createItem,
  getItems,
  getItemById,
  updateItemStatus,
};
