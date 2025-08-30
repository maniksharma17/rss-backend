// controllers/collectionController.js
const { generateCollectionReport, getNodeTotalCollection } = require('../utils/helpers');

exports.getCollectionReport = async (req, res) => {
  try {
    const year = req.query.year ? parseInt(req.query.year) : new Date().getFullYear();
    const { nodeId } = req.params;

    const report = await generateCollectionReport(nodeId, year);
    res.json(report);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
};

exports.getNodeCollection = async (req, res) => {
  try {
    const { nodeId } = req.params;

    const report = await getNodeTotalCollection(nodeId);
    res.json(report);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
};

exports.getMyCollectionSummary = async (req, res) => {
  try {
    const year = req.query.year ? parseInt(req.query.year) : new Date().getFullYear();
    const nodeId = req.user.nodeId; // from auth middleware

    const report = await generateCollectionReport(nodeId, year);
    res.json(report);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
};
