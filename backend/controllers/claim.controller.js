const mongoose = require('mongoose');
const Claim = require('../models/claim.model');
const Item = require('../models/item.model');

/**
 * Create a claim (non-owner, item must be FOUND)
 */
const createClaim = async (req, res) => {
  try {
    const { itemId, message } = req.body;

    if (!mongoose.Types.ObjectId.isValid(itemId)) {
      return res.status(400).json({ message: 'Invalid item id' });
    }

    const item = await Item.findById(itemId);

    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }

    if (item.status !== 'FOUND') {
      return res.status(400).json({ message: 'Claims allowed only when item is FOUND' });
    }

    if (item.createdBy.toString() === req.user.id) {
      return res.status(403).json({ message: 'Owner cannot claim their own item' });
    }

    const existingClaim = await Claim.findOne({
      itemId: item._id,
      claimantId: req.user.id,
    });

    if (existingClaim) {
      return res.status(409).json({ message: 'You already claimed this item' });
    }

    const claim = await Claim.create({
      itemId: item._id,
      claimantId: req.user.id,
      message: message || '',
      status: 'PENDING',
    });

    res.status(201).json(claim);
  } catch (error) {
    console.error('createClaim error:', error);
    res.status(500).json({ message: 'Failed to create claim' });
  }
};

/**
 * Get all claims for an item (ONLY OWNER)
 */
const getClaimsForItem = async (req, res) => {
  try {
    const { itemId } = req.query;

    if (!mongoose.Types.ObjectId.isValid(itemId)) {
      return res.status(400).json({ message: 'Invalid item id' });
    }

    const item = await Item.findById(itemId);

    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }

    if (item.createdBy.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Only owner can view claims' });
    }

    const claims = await Claim.find({ itemId })
      .populate('claimantId', 'name email')
      .sort({ createdAt: -1 });

    res.status(200).json(claims);
  } catch (error) {
    console.error('getClaimsForItem error:', error);
    res.status(500).json({ message: 'Failed to fetch claims' });
  }
};

/**
 * Approve / Reject claim (OWNER only)
 */
const reviewClaim = (decision) => async (req, res) => {
  try {
    const { id: claimId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(claimId)) {
      return res.status(400).json({ message: 'Invalid claim id' });
    }

    const claim = await Claim.findById(claimId);
    if (!claim) {
      return res.status(404).json({ message: 'Claim not found' });
    }

    const item = await Item.findById(claim.itemId);
    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }

    if (item.createdBy.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Only owner can review claims' });
    }

    if (claim.status !== 'PENDING') {
      return res.status(400).json({ message: 'Claim already reviewed' });
    }

    if (item.status !== 'FOUND') {
      return res.status(400).json({ message: 'Item must be FOUND' });
    }

    if (decision === 'APPROVED') {
      claim.status = 'APPROVED';
      item.status = 'CLAIMED';
      await item.save();
    } else {
      claim.status = 'REJECTED';
    }

    await claim.save();

    res.status(200).json({ claim, item });
  } catch (error) {
    console.error('reviewClaim error:', error);
    res.status(500).json({ message: 'Failed to review claim' });
  }
};

module.exports = {
  createClaim,
  getClaimsForItem,
  approveClaim: reviewClaim('APPROVED'),
  rejectClaim: reviewClaim('REJECTED'),
};
