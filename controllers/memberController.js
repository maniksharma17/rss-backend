const Member = require("../models/Member");
const Payment = require("../models/Payment");

/**
 * Create a new member (Branch only)
 */
const createMember = async (req, res) => {
  try {
    const {
      name,
      email,
      phone,
      address,
      age,
      occupation,
      branchId,
      training,
      sanghYears,
      uniform,
      educationLevel,
      college,
      role,
      otherOccupation,
      birthYear,
    } = req.body;

    // Validation
    if (!name) {
      return res.status(400).json({
        success: false,
        message: "Member name is required",
      });
    }

    // Create new member
    const newMember = new Member({
      branchId,
      name,
      email,
      phone,
      address,
      age,
      occupation,
      training,
      sanghYears,
      uniform,
      educationLevel,
      college,
      role,
      otherOccupation,
      birthYear,
    });

    await newMember.save();

    res.status(201).json({
      success: true,
      message: "Member created successfully",
      data: newMember,
    });
  } catch (error) {
    console.error("Create member error:", error);

    if (error.name === "ValidationError") {
      return res.status(400).json({
        success: false,
        message: "Validation error",
        errors: Object.values(error.errors).map((err) => err.message),
      });
    }

    res.status(500).json({
      success: false,
      message: "Server error while creating member",
    });
  }
};

/**
 * Edit member
 */
const editMember = async (req, res) => {
  try {
    const { name, email, phone, address, age, occupation } = req.body;
    const member = await Member.findById(req.params.id);

    // Validation
    if (!member) {
      return res.status(400).json({
        success: false,
        message: "Member not found",
      });
    }

    // Create new member
    const updatedMember = await Member.findByIdAndUpdate(req.params.id, {
      name,
      email,
      phone,
      address,
      age,
      occupation,
    });

    res.status(201).json({
      success: true,
      message: "Member updated successfully",
      data: updatedMember,
    });
  } catch (error) {
    console.error("Edit member error:", error);

    if (error.name === "ValidationError") {
      return res.status(400).json({
        success: false,
        message: "Validation error",
        errors: Object.values(error.errors).map((err) => err.message),
      });
    }

    res.status(500).json({
      success: false,
      message: "Server error while creating member",
    });
  }
};

/**
 * Delete member
 */
const deleteMember = async (req, res) => {
  try {
    const memberId = req.params.id;
    const member = await Member.findById(memberId);
    if (!member) {
      res.status(404).json({
        message: "Member not found",
        success: false,
      });
    }

    await Member.findByIdAndDelete(memberId);
    res.status(200).json({
      message: "Member Deleted",
      success: true,
    });
  } catch (e) {
    console.error("Delete member error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

/**
 * Get members of a branch with total paid amount
 */
const getBranchMembers = async (req, res) => {
  try {
    const branchId = req.params.branchId;

    // Check if user has access to this branch
    if (req.user.nodeId !== branchId && req.user.type !== "Branch") {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    const members = await Member.find({ branchId }).sort({ name: 1 });

    // Calculate total paid for each member
    const membersWithTotal = await Promise.all(
      members.map(async (member) => {
        const totalResult = await Payment.aggregate([
          {
            $match: { memberId: member._id },
          },
          {
            $group: {
              _id: null,
              total: { $sum: "$amount" },
            },
          },
        ]);

        const totalPaid = totalResult.length > 0 ? totalResult[0].total : 0;

        return {
          id: member._id,
          name: member.name,
          email: member.email,
          phone: member.phone,
          address: member.address,
          age: member.age,
          occupation: member.occupation,
          totalPaid,
          createdAt: member.createdAt,
        };
      })
    );

    res.status(200).json({
      success: true,
      data: membersWithTotal,
    });
  } catch (error) {
    console.error("Get branch members error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

/**
 * Get my branch members (for authenticated Branch user)
 */
const getMyMembers = async (req, res) => {
  try {
    // Check if user is from a Branch
    if (req.user.type !== "Branch") {
      return res.status(403).json({
        success: false,
        message: "Only Branch nodes can access members",
      });
    }

    const members = await Member.find({ branchId: req.user.nodeId }).sort({
      name: 1,
    });

    // Calculate total paid for each member
    const membersWithTotal = await Promise.all(
      members.map(async (member) => {
        const totalResult = await Payment.aggregate([
          {
            $match: { memberId: member._id },
          },
          {
            $group: {
              _id: null,
              total: { $sum: "$amount" },
            },
          },
        ]);

        const totalPaid = totalResult.length > 0 ? totalResult[0].total : 0;

        return {
          id: member._id,
          name: member.name,
          email: member.email,
          phone: member.phone,
          address: member.address,
          age: member.age,
          occupation: member.occupation,
          totalPaid,
          createdAt: member.createdAt,
        };
      })
    );

    res.status(200).json({
      success: true,
      data: membersWithTotal,
    });
  } catch (error) {
    console.error("Get my members error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

/**
 * Get member details
 */
const getMember = async (req, res) => {
  try {
    const memberId = req.params.id;

    const member = await Member.findById(memberId).populate(
      "branchId",
      "name type"
    );

    if (!member) {
      return res.status(404).json({
        success: false,
        message: "Member not found",
      });
    }

    // Calculate total paid
    const totalResult = await Payment.aggregate([
      {
        $match: { memberId: member._id },
      },
      {
        $group: {
          _id: null,
          total: { $sum: "$amount" },
        },
      },
    ]);

    const totalPaid = totalResult.length > 0 ? totalResult[0].total : 0;

    // Fetch all payments sorted by date (newest first)
    const payments = await Payment.find({ memberId: member._id }).sort({
      date: -1,
    });

    res.status(200).json({
      success: true,
      data: {
        ...member.toObject(),
        totalPaid,
        payments,
      },
    });
  } catch (error) {
    console.error("Get member error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

module.exports = {
  createMember,
  editMember,
  deleteMember,
  getBranchMembers,
  getMyMembers,
  getMember,
};
