const express = require('express');
const {
  getCollectionReport,
  getNodeCollection,
} = require('../controllers/collectionController');
const auth = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/collections/:nodeId
// @desc    Get collection report for a node (recursive drill-down)
// @query   year (optional) - defaults to current year
// @access  Private
router.get('/:nodeId', auth, getCollectionReport);
router.get('/total/:nodeId', auth, getNodeCollection);

module.exports = router;
