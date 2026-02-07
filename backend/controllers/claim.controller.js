const mongoose = require('mongoose');

const { Claim, Item } = require('../models');

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
      return res.status(400).json({ message: 'Claims are only allowed when item status is FOUND' });
    }

    if (item.createdBy.toString() === req.user.id) {
      return res.status(403).json({ message: 'Forbidden: item owner cannot claim their own item' });
    }

    const existingClaim = await Claim.findOne({ itemId: item._id, claimantId: req.user.id });

    if (existingClaim) {
      return res.status(409).json({ message: 'Duplicate claim is not allowed for the same user and item' });
    }

    const claim = await Claim.create({
      itemId: item._id,
      claimantId: req.user.id,
      message: typeof message === 'string' ? message : '',
      status: 'PENDING',
    });

    return res.status(201).json(claim);
  } catch (error) {
    return res.status(500).json({ message: 'Failed to create claim' });
  }
};

const reviewClaim = (decision) => async (req, res) => {
  try {
    const { id: claimId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(claimId)) {
      return res.status(400).json({ message: 'Invalid claim id' });
    }

    if (decision === 'APPROVED') {
      const session = await mongoose.startSession();

      try {
        let responsePayload;

        await session.withTransaction(async () => {
          const claim = await Claim.findById(claimId).session(session);

          if (!claim) {
            responsePayload = { status: 404, body: { message: 'Claim not found' } };
            return;
          }

          const item = await Item.findById(claim.itemId).session(session);

          if (!item) {
            responsePayload = { status: 404, body: { message: 'Associated item not found' } };
            return;
          }

          if (item.createdBy.toString() !== req.user.id) {
            responsePayload = {
              status: 403,
              body: { message: 'Forbidden: only item owner can review claims' },
            };
            return;
          }

          if (claim.status !== 'PENDING') {
            responsePayload = { status: 400, body: { message: 'Only pending claims can be reviewed' } };
            return;
          }

          if (item.status !== 'FOUND') {
            responsePayload = {
              status: 400,
              body: { message: 'Claims can only be reviewed while item status is FOUND' },
            };
            return;
          }

          claim.status = 'APPROVED';
          item.status = 'CLAIMED';

          await claim.save({ session });
          await item.save({ session });

          responsePayload = { status: 200, body: { claim, item } };
        });

        if (!responsePayload) {
          return res.status(500).json({ message: 'Failed to review claim' });
        }

        return res.status(responsePayload.status).json(responsePayload.body);
      } finally {
        await session.endSession();
      }
    }

    const claim = await Claim.findById(claimId);

    if (!claim) {
      return res.status(404).json({ message: 'Claim not found' });
    }

    const item = await Item.findById(claim.itemId);

    if (!item) {
      return res.status(404).json({ message: 'Associated item not found' });
    }

    if (item.createdBy.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Forbidden: only item owner can review claims' });
    }

    if (claim.status !== 'PENDING') {
      return res.status(400).json({ message: 'Only pending claims can be reviewed' });
    }

    if (item.status !== 'FOUND') {
      return res.status(400).json({ message: 'Claims can only be reviewed while item status is FOUND' });
    }

    claim.status = 'REJECTED';
    await claim.save();

    return res.status(200).json({ claim, item });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to review claim' });
  }
};

const approveClaim = reviewClaim('APPROVED');
const rejectClaim = reviewClaim('REJECTED');

module.exports = {
  createClaim,
  approveClaim,
  rejectClaim,
};
