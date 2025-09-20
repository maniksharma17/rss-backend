const mongoose = require("mongoose");
const Node = require("../models/Node");
const Member = require("../models/Member");
const Payment = require("../models/Payment");
const { Types } = require("mongoose");

/**
 * Get all descendant nodes of a given node (including the node itself)
 */
const getAllDescendants = async (nodeId) => {
  const descendants = [];
  const queue = [nodeId];

  while (queue.length > 0) {
    const currentNodeId = queue.shift();
    descendants.push(currentNodeId);

    // Find direct children
    const children = await Node.find({ parentId: currentNodeId }).select("_id");
    queue.push(...children.map((child) => child._id));
  }

  return descendants;
};

/**
 * Calculate total collection for a node (including all descendants)
 */
const getTotalCollection = async (nodeId) => {
  try {
    // Get all descendant nodes
    const descendantIds = await getAllDescendants(nodeId);

    // Get all branch nodes from descendants
    const branchNodes = await Node.find({
      _id: { $in: descendantIds },
      type: "Branch",
    }).select("_id");

    const branchIds = branchNodes.map((branch) => branch._id);

    if (branchIds.length === 0) {
      return 0;
    }

    // Get all members from these branches
    const members = await Member.find({
      branchId: { $in: branchIds },
    }).select("_id");

    const memberIds = members.map((member) => member._id);

    if (memberIds.length === 0) {
      return 0;
    }

    // Calculate total payments
    const totalResult = await Payment.aggregate([
      {
        $match: {
          memberId: { $in: memberIds },
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: "$amount" },
        },
      },
    ]);

    return totalResult.length > 0 ? totalResult[0].total : 0;
  } catch (error) {
    console.error("Error calculating total collection:", error);
    return 0;
  }
};

/**
 * Check if a user has access to a specific node
 */
const hasAccessToNode = async (userNodeId, targetNodeId) => {
  // User can access their own node
  if (userNodeId.toString() === targetNodeId.toString()) {
    return true;
  }

  // Check if target node is level below or above of user's node
  const userNode = await Node.findById(userNodeId);
  const targetNode = await Node.findById(targetNodeId);

  const typeOrder = getNodeTypeOrder();
  const userOrder = typeOrder[userNode.type];
  const targetOrder = typeOrder[targetNode.type];

  return userOrder < targetOrder;
};

/**
 * Generate hierarchical node type order for validation
 */
const getNodeTypeOrder = () => {
  return {
    Bharat: 0,
    Kshetra: 1,
    Prant: 2,
    Vibhag: 3,
    Jila: 4,
    'Nagar/Khand': 5,
    'Basti/Mandal': 6,
    'Gram/Shakha/Mohalla/Sthaan': 7,
  };
};

/**
 * Validate if child type can be created under parent type
 */
const canCreateChildType = (parentType, childType) => {
  const typeOrder = getNodeTypeOrder();
  const parentOrder = typeOrder[parentType];
  const childOrder = typeOrder[childType];

  // Child should be exactly one level below parent
  return childOrder === parentOrder + 1;
};

/***
 * Get total members from any level
 */
const getTotalMembers = async (nodeId) => {
  const objectId = new Types.ObjectId(nodeId);

  const result = await Node.aggregate([
    { $match: { _id: objectId } },
    {
      $graphLookup: {
        from: "nodes", // collection name for nodes
        startWith: "$_id",
        connectFromField: "_id", // each node
        connectToField: "parentId", // link parent → child
        as: "descendants",
      },
    },
    {
      $project: {
        allBranchIds: { $concatArrays: [["$_id"], "$descendants._id"] },
      },
    },
  ]);

  if (!result.length) return 0;

  const branchIds = result[0].allBranchIds;
  console.log(branchIds);

  const memberCount = await Member.countDocuments({
    branchId: { $in: branchIds },
  });

  return memberCount;
};

/**
 * Get total collection
 */

async function getNodeTotalCollection(nodeId, year) {
  const currentYear = new Date().getFullYear();
  year = year || currentYear;

  const startDate = new Date(year, 0, 1);
  const endDate = new Date(year + 1, 0, 1);

  // Step 1: Find all descendant nodes (including self)
  const descendants = await Node.aggregate([
    { $match: { _id: new mongoose.Types.ObjectId(nodeId) } },
    {
      $graphLookup: {
        from: "nodes",
        startWith: "$_id",
        connectFromField: "_id",
        connectToField: "parentId",
        as: "descendants",
      },
    },
    {
      $project: {
        allNodeIds: { $concatArrays: [["$_id"], "$descendants._id"] },
      },
    },
  ]);

  if (!descendants.length) return 0;

  const nodeIds = descendants[0].allNodeIds;

  // Step 2: Find all members under these nodes
  const members = await Member.find({ branchId: { $in: nodeIds } }).select(
    "_id"
  );
  const memberIds = members.map((m) => m._id);

  if (!memberIds.length) return 0;

  // Step 3: Aggregate payments
  const payments = await Payment.aggregate([
    {
      $match: {
        memberId: { $in: memberIds },
        date: { $gte: startDate, $lt: endDate },
      },
    },
    {
      $group: { _id: null, total: { $sum: "$amount" } },
    },
  ]);

  return payments.length ? payments[0].total : 0;
}

/**
 * Generate collection report
 */
async function generateCollectionReport(nodeId, year) {
  const startDate = new Date(year, 0, 1);
  const endDate = new Date(year + 1, 0, 1);

  const node = await Node.findById(nodeId);

  // Step 1: Find all descendant nodes (recursive)
  const descendants = await Node.aggregate([
    { $match: { _id: new mongoose.Types.ObjectId(nodeId) } },
    {
      $graphLookup: {
        from: "nodes",
        startWith: "$_id",
        connectFromField: "_id",
        connectToField: "parentId",
        as: "descendants",
      },
    },
    {
      $project: {
        allNodeIds: {
          $concatArrays: [["$_id"], "$descendants._id"],
        },
      },
    },
  ]);

  if (!descendants.length) {
    throw new Error("Node not found");
  }

  const nodeIds = descendants[0].allNodeIds;

  // Step 2: Members under these nodes
  const members = await Member.find({ branchId: { $in: nodeIds } }).select(
    "_id branchId"
  );
  const memberIds = members.map((m) => m._id);

  if (!memberIds.length) {
    return {
      nodeId,
      year,
      totalCollection: 0,
      averageCollectionPerUser: 0,
      monthlyCollection: Array(12).fill(0),
      totalMembers: 0,
      topPerformingChildren: [],
      worstPerformingChildren: [],
      collectionsToday: 0,
    };
  }

  // Step 3: Aggregate yearly payments
  const payments = await Payment.aggregate([
    {
      $match: {
        memberId: { $in: memberIds },
        date: { $gte: startDate, $lt: endDate },
      },
    },
    {
      $group: {
        _id: { month: { $month: "$date" } },
        total: { $sum: "$amount" },
      },
    },
  ]);

  // monthly totals
  const monthlyCollection = Array(12).fill(0);
  payments.forEach((p) => {
    monthlyCollection[p._id.month - 1] = p.total;
  });

  const totalCollection = monthlyCollection.reduce((a, b) => a + b, 0);
  const averageCollectionPerUser = totalCollection / members.length;

  // Step 4: Collections today
  const today = new Date();
  const startOfDay = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate()
  );
  const endOfDay = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate() + 1
  );

  const todayPayments = await Payment.aggregate([
    {
      $match: {
        memberId: { $in: memberIds },
        date: { $gte: startOfDay, $lt: endOfDay },
      },
    },
    {
      $group: { _id: null, total: { $sum: "$amount" } },
    },
  ]);

  const collectionsToday = todayPayments.length ? todayPayments[0].total : 0;

  // Step 5: Top + Worst performing direct children
  const children = await Node.find({ parentId: nodeId }).select("_id name");

  const childPerformances = await Promise.all(
    children.map(async (child) => {
      const total = await getNodeTotalCollection(child._id, year);
      return {
        childId: child._id,
        name: child.name,
        total,
      };
    })
  );

  // sort descending
  childPerformances.sort((a, b) => b.total - a.total);

  const topPerformingChildren = childPerformances.slice(0, 5);
  const worstPerformingChildren = childPerformances
    .slice(-5) // last 5
    .reverse(); // so lowest appears first

  return {
    nodeId,
    type: node.type,
    year,
    name: node.name,
    totalCollection,
    averageCollectionPerUser,
    monthlyCollection,
    totalMembers: members.length,
    childPerformances,
    topPerformingChildren,
    worstPerformingChildren,
    collectionsToday,
  };
}

module.exports = {
  getAllDescendants,
  getTotalCollection,
  hasAccessToNode,
  canCreateChildType,
  getNodeTypeOrder,
  getTotalMembers,
  generateCollectionReport,
  getNodeTotalCollection
};
