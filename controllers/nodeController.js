const Member = require("../models/Member");
const Node = require("../models/Node");
const { canCreateChildType, hasAccessToNode, getTotalMembers } = require("../utils/helpers");

/**
 * Create a new node
 */
const createNode = async (req, res) => {
  try {
    const { name, type, parentId } = req.body;

    // Validation
    if (!name || !type) {
      return res.status(400).json({
        success: false,
        message: "Name and type are required",
      });
    }

    // Get parent node
    const parentNode = await Node.findById(parentId);

    if (!parentNode) {
      return res.status(404).json({
        success: false,
        message: "Parent node not found",
      });
    }

    // Validate if child type can be created under parent type
    if (!canCreateChildType(parentNode.type, type)) {
      return res.status(400).json({
        success: false,
        message: `Cannot create ${type} under ${parentNode.type}`,
      });
    }

    // Generate node code and password
    let nodeCode;
    let isUnique = false;
    let attempts = 0;

    while (!isUnique && attempts < 10) {
      nodeCode = Node.generateNodeCode(type);
      const existingNode = await Node.findOne({ nodeCode });
      if (!existingNode) {
        isUnique = true;
      }
      attempts++;
    }

    if (!isUnique) {
      return res.status(500).json({
        success: false,
        message: "Failed to generate unique node code",
      });
    }

    const rawPassword = Node.generatePassword();

    // Create new node
    const newNode = new Node({
      name,
      type,
      parentId,
      nodeCode,
      password: rawPassword,
      plainPassword: rawPassword,
    });

    await newNode.save();

    // Return response with raw password
    res.status(201).json({
      success: true,
      message: "Node created successfully",
      data: {
        _id: newNode._id,
        name: newNode.name,
        type: newNode.type,
        parentId: newNode.parentId,
        nodeCode: newNode.nodeCode,
        password: rawPassword,
      },
    });
  } catch (error) {
    console.error("Create node error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while creating node",
    });
  }
};

/**
 * Delete a node
 */
const deleteNode = async (req, res) => {
  try{
    const nodeId = req.params.nodeId;
    const { password } = req.body;
    
    const node = await Node.findById(nodeId);
    if(!node){
      return res.status(404).json({
        message: 'Region not found',
        success: false
      })
    }

    if(password!=node.plainPassword) {
      return res.status(500).json({
        message: 'Incorrect Password',
        success: false
      })
    }

    await Node.findByIdAndDelete(nodeId);
    res.status(200).json({
      message: 'Region Deleted',
      success: true
    })
  } catch(e){
    console.error("Delete node error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
}

/**
 * Edit a node
 */
const editNode = async (req, res) => {
  try{
    const nodeId = req.params.nodeId;
    const { name } = req.body;

    const node = await Node.findById(nodeId);
    if(!node){
      return res.status(404).json({
        message: 'Region not found',
        success: false
      })
    }

    const updatedNode = await Node.findByIdAndUpdate(nodeId, {
      name
    }, {
      runValidators: true,
      new: true
    })

    res.status(200).json({
      success: true,
      message: "Region edited",
      data: updatedNode
    });

  } catch(e){
    console.log("Edit node error: ", e);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
}


/**
 * Get node details
 */
const getNode = async (req, res) => {
  try {
    const nodeId = req.params.id;

    const hasAccess = await hasAccessToNode(req.user.nodeId, nodeId);
    if (!hasAccess) {
      res.status(400).json({
        success: false,
        message: "Access Denied",
      });
      return;
    }

    const node = await Node.findById(nodeId)
      .select("-password")
      .populate("parentId", "name type nodeCode");

    if (!node) {
      return res.status(404).json({
        success: false,
        message: "Node not found",
      });
    }

    res.status(200).json({
      success: true,
      data: node,
    });
  } catch (error) {
    console.error("Get node error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

/**
 * Get children of a node
 */
const getNodeChildren = async (req, res) => {
  try {
    const nodeId = req.params.id;

    const hasAccess = await hasAccessToNode(req.user.nodeId, nodeId);
    if (!hasAccess) {
      return res.status(400).json({
        success: false,
        message: "Access Denied",
      });
    }

    const children = await Node.find({ parentId: nodeId })
      .select("-password")
      .sort({ name: 1 });

    res.status(200).json({
      success: true,
      data: children,
    });
  } catch (error) {
    console.error("Get node children error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

/**
 * Get node by node code
 */
const getNodeByCode = async (req, res) => {
  try {
    const nodeCode = req.params.code;

    // ✅ Fetch node without password
    const node = await Node.findOne({ nodeCode })
      .select("-password")
      .populate("parentId", "name type nodeCode");

    if (!node) {
      return res.status(404).json({
        success: false,
        message: "Node not found",
      });
    }

    // ✅ Access check
    const hasAccess = await hasAccessToNode(req.user.nodeId, node._id);
    if (!hasAccess) {
      return res.status(400).json({
        success: false,
        message: "Access Denied",
      });
    }

    // ✅ Build breadcrumb path
    let path = [];
    let currentNode = node;

    while (currentNode) {
      path.push({
        _id: currentNode._id,
        name: currentNode.name,
        type: currentNode.type,
        nodeCode: currentNode.nodeCode,
      });

      if (currentNode._id.toString() === req.user.nodeId.toString()) {
        break;
      }

      if (!currentNode.parentId) {
        return res.status(400).json({
          success: false,
          message: "Invalid hierarchy: user node is not an ancestor",
        });
      }

      currentNode = await Node.findById(currentNode.parentId)
        .select("name type nodeCode parentId");
    }

    path = path.reverse();

    // ✅ Get total members
    const totalMembers = await getTotalMembers(node._id);

    // ✅ If branch → fetch members
    let members = [];
    if (node.type === "Branch") {
      members = await Member.find({ branchId: node._id })
    }

    // Fetch Children
    const children = await Node.find({ parentId: node._id })
      .select("-password")
      .sort({ name: 1 });

    res.status(200).json({
      success: true,
      data: node,
      children,
      path,
      totalMembers,
      ...(node.type === "Branch" ? { members } : {}), 
    });
  } catch (error) {
    console.error("Get node error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};



module.exports = {
  createNode,
  editNode,
  deleteNode,
  getNode,
  getNodeChildren,
  getNodeByCode,
};
