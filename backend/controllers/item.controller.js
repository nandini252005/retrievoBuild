const mongoose = require('mongoose');


const { Item } = require('../models');


const Claim = require('../models/claim.model');


const isValidStatusTransition = (currentStatus, nextStatus, reportType) => {
  if ((currentStatus === 'LOST' || currentStatus === 'FOUND') && nextStatus === 'PENDING') {
    return true;
  }

  if (currentStatus === 'PENDING' && nextStatus === 'APPROVED') {
    return true;
  }

  if (currentStatus === 'APPROVED' && reportType === 'LOST' && nextStatus === 'RETURNED') {
    return true;
  }

  if (currentStatus === 'APPROVED' && reportType === 'FOUND' && nextStatus === 'CLAIMED') {
    return true;
  }

  return false;
};



class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

const deleteItem = async (req, res) => {
  const session = await mongoose.startSession();

  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new HttpError(400, 'Invalid item id');
    }

    await session.withTransaction(async () => {
      const item = await Item.findById(id).session(session);

      if (!item) {
        throw new HttpError(404, 'Item not found');
      }

      if (item.createdBy.toString() !== req.user.id) {
        throw new HttpError(403, 'Only owner can delete this item');
      }

      if (['CLAIMED', 'RETURNED'].includes(item.status)) {
        throw new HttpError(400, 'Finalized items cannot be deleted');
      }

      await Claim.deleteMany({ itemId: item._id }).session(session);
      await Item.deleteOne({ _id: item._id }).session(session);
    });

    res.status(200).json({ message: 'Item deleted successfully' });

  } catch (error) {
    console.error('deleteItem error:', error);

    if (error instanceof HttpError) {
      return res.status(error.status).json({ message: error.message });
    }

    return res.status(500).json({
      message: error.message || 'Failed to delete item',
    });
  } finally {
    session.endSession();
  }
};

module.exports = {
  deleteItem,
};


const createItem = async (req, res) => {
  try {
    const { title, description, category, location, images, status } = req.body;


    if (!title || !description || !category || !location) {
      return res.status(400).json({
        message: 'title, description, category, and location are required',
      });
    }


    // ✅ Validate status explicitly
    const allowedStatuses = ['LOST', 'FOUND'];
    const finalStatus = allowedStatuses.includes(status) ? status : 'LOST';


    const item = await Item.create({
      title,
      description,
      category,
      location,
      images: Array.isArray(images) ? images : [],
      status: finalStatus, // ✅ USE CLIENT VALUE
      reportType: finalStatus,
      createdBy: req.user.id,
    });


    return res.status(201).json(item);
  } catch (error) {
    console.error('createItem error:', error);
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


    const query = {};

    // If mine=true → only items created by logged-in user
    if (req.query.mine === 'true') {
      query.createdBy = req.user.id;
    }

    if (req.query.reportType && req.query.reportType !== 'All') {
      query.reportType = req.query.reportType;
    }

    if (req.query.category) {
      query.category = { $regex: req.query.category, $options: 'i' };
    }

    if (req.query.location) {
      query.location = { $regex: req.query.location, $options: 'i' };
    }


    const [items, totalItems] = await Promise.all([
      Item.find(query)
        .populate('createdBy', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Item.countDocuments(query),
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
  console.error('getItems error:', error);
  return res.status(500).json({
    message: 'Failed to fetch items',
    error: error.message
  });
}
}




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


    if (!isValidStatusTransition(item.status, status, item.reportType)) {
      return res.status(400).json({
        message: `Invalid status transition for ${item.reportType} flow: ${item.status} -> ${status}`,
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
  deleteItem,
  createItem,
  getItems,
  getItemById,
  updateItemStatus,
};
