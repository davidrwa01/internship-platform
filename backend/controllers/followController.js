import Follow from "../models/Follow.js";
import Company from "../models/Company.js";
import User from "../models/User.js";
import Notification from "../models/Notification.js";

// Helper function to create notifications
const createNotification = async (data, io) => {
  try {
    const notification = await Notification.create(data);

    // Populate notification data for socket emission
    const populatedNotification = await Notification.findById(notification._id)
      .populate("sender", "fullName email companyName")
      .populate("relatedApplication")
      .populate("relatedInternship")
      .populate("relatedConversation");

    // Emit real-time notification to the recipient's room
    if (io) {
      io.to(`notifications_${data.recipient}`).emit('new_notification', populatedNotification);
      console.log(`Emitted new notification to user ${data.recipient}`);
    }

    return notification;
  } catch (error) {
    console.error("Create notification error:", error);
    return null;
  }
};

export const followCompany = async (req, res) => {
  try {
    const { companyId } = req.body;

    const company = await Company.findById(companyId);
    if (!company) {
      return res.status(404).json({ message: "Company not found" });
    }

    // Check if already following
    const existingFollow = await Follow.findOne({
      follower: req.user.id,
      following: companyId,
    });

    if (existingFollow) {
      return res.status(400).json({ message: "Already following this company" });
    }

    const follow = await Follow.create({
      follower: req.user.id,
      following: companyId,
    });

    // Send notification to company about new follower
    const companyUser = await User.findOne({ _id: company.createdBy });
    if (companyUser) {
      await createNotification({
        recipient: companyUser._id,
        sender: req.user.id,
        type: "new_follower",
        title: "New Follower",
        message: `${req.user.fullName || req.user.email} started following your company`,
        relatedCompany: company._id
      }, req.app.get("io"));

      console.log(`✅ Follow notification sent to company: ${companyUser.email}`);
    }

    res.status(201).json({
      message: "Successfully followed company",
      follow,
    });
  } catch (error) {
    console.error("Follow company error:", error);
    res.status(500).json({ message: error.message });
  }
};

export const unfollowCompany = async (req, res) => {
  try {
    const { companyId } = req.params;

    const follow = await Follow.findOneAndDelete({
      follower: req.user.id,
      following: companyId,
    });

    if (!follow) {
      return res.status(404).json({ message: "Not following this company" });
    }

    res.status(200).json({ message: "Successfully unfollowed company" });
  } catch (error) {
    console.error("Unfollow company error:", error);
    res.status(500).json({ message: error.message });
  }
};

export const getFollowedCompanies = async (req, res) => {
  try {
    const follows = await Follow.find({ follower: req.user.id })
      .populate("following", "name email location trainings")
      .sort({ createdAt: -1 });

    const companies = follows.map((follow) => follow.following);

    res.status(200).json(companies);
  } catch (error) {
    console.error("Get followed companies error:", error);
    res.status(500).json({ message: error.message });
  }
};

export const getCompanyFollowers = async (req, res) => {
  try {
    const company = await Company.findOne({ email: req.user.email });
    if (!company) {
      return res.status(404).json({ message: "Company not found" });
    }

    const followers = await Follow.find({ following: company._id })
      .populate("follower", "fullName email")
      .sort({ createdAt: -1 });

    res.status(200).json(followers);
  } catch (error) {
    console.error("Get company followers error:", error);
    res.status(500).json({ message: error.message });
  }
};

export const isFollowing = async (req, res) => {
  try {
    const { companyId } = req.params;

    const follow = await Follow.findOne({
      follower: req.user.id,
      following: companyId,
    });

    res.status(200).json({ isFollowing: !!follow });
  } catch (error) {
    console.error("Check follow status error:", error);
    res.status(500).json({ message: error.message });
  }
};