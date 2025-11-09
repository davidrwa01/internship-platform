// backend/controllers/studentController.js
import User from "../models/User.js";
import Application from "../models/Application.js";
import Internship from "../models/Internship.js";

export const getStudentProfile = async (req, res) => {
  try {
    const student = await User.findById(req.user.id);
    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }
    res.status(200).json(student);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getStudentApplications = async (req, res) => {
  try {
    const applications = await Application.find({ student: req.user.id })
      .populate({
        path: "internship",
        populate: {
          path: "company",
          select: "name email phone location"
        }
      })
      .sort({ createdAt: -1 });

    res.status(200).json(applications);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateStudentProfile = async (req, res) => {
  try {
    const { fullName, phone, department, skills } = req.body;
    
    const student = await User.findByIdAndUpdate(
      req.user.id,
      { fullName, phone, department, skills },
      { new: true }
    );

    res.status(200).json({
      message: "Profile updated successfully",
      student
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};