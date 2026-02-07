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
    const parsedPage = Number.parseInt(req.query.page, 10);
    const parsedLimit = Number.parseInt(req.query.limit, 10);

    const page = Number.isNaN(parsedPage) || parsedPage <= 0 ? 1 : parsedPage;
    const limit = Number.isNaN(parsedLimit) || parsedLimit <= 0 ? 10 : parsedLimit;
    const skip = (page - 1) * limit;

    const filter = {};

    if (req.query.status) {
      filter.status = req.query.status;
    }

    if (req.query.category) {
      filter.category = req.query.category;
    }

    const [items, totalItems] = await Promise.all([
      Item.find(filter)
        .populate('createdBy', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Item.countDocuments(filter),
    ]);

    const totalPages = Math.ceil(totalItems / limit);

    return res.status(200).json({
      items,
      page,
      limit,
      totalItems,
      totalPages,
    });
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
