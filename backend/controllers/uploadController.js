import File from '../models/File.js';
import Internship from '../models/Internship.js';
import Company from '../models/Company.js';
import Notes from '../models/Notes.js';
import cloudinary from '../config/cloudinary.js';

// Upload internship document
export const uploadInternshipDocument = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    // Find the internship
    const internship = await Internship.findById(req.body.internshipId);
    if (!internship) {
      return res.status(404).json({ message: 'Internship not found' });
    }

    // Check if user is the internship creator or admin
    if (internship.createdBy.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to upload documents for this internship' });
    }

    // Create file record in database
    const fileRecord = new File({
      filename: req.file.filename,
      originalname: req.file.originalname,
      url: req.file.path,
      publicId: req.file.filename, // Cloudinary public_id
      size: req.file.size,
      mimetype: req.file.mimetype,
      uploadedBy: req.user.id,
      internship: req.body.internshipId,
      type: 'internship_document'
    });

    await fileRecord.save();

    // Add file reference to internship
    internship.documents.push(fileRecord._id);
    await internship.save();

    res.status(201).json({
      message: 'Document uploaded successfully',
      file: {
        id: fileRecord._id,
        filename: fileRecord.originalname,
        url: fileRecord.url,
        size: fileRecord.size,
        uploadedAt: fileRecord.createdAt
      }
    });
  } catch (error) {
    console.error('Upload internship document error:', error);
    res.status(500).json({ message: error.message });
  }
};

// Upload company logo
export const uploadCompanyLogo = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No logo uploaded' });
    }

    // Find the company
    const company = await Company.findOne({ createdBy: req.user.id });
    if (!company) {
      return res.status(404).json({ message: 'Company not found' });
    }

    // Delete old logo from Cloudinary if exists
    if (company.logo && company.logoPublicId) {
      try {
        await cloudinary.uploader.destroy(company.logoPublicId);
      } catch (deleteError) {
        console.warn('Failed to delete old logo from Cloudinary:', deleteError);
      }
    }

    // Create file record in database
    const fileRecord = new File({
      filename: req.file.filename,
      originalname: req.file.originalname,
      url: req.file.path,
      publicId: req.file.filename,
      size: req.file.size,
      mimetype: req.file.mimetype,
      uploadedBy: req.user.id,
      company: company._id,
      type: 'company_logo'
    });

    await fileRecord.save();

    // Update company with new logo
    company.logo = req.file.path;
    company.logoPublicId = req.file.filename;
    await company.save();

    res.status(200).json({
      message: 'Logo uploaded successfully',
      logo: {
        url: req.file.path,
        filename: req.file.originalname,
        size: req.file.size
      },
      company
    });
  } catch (error) {
    console.error('Upload company logo error:', error);
    res.status(500).json({ message: error.message });
  }
};

// Upload company picture (general pictures for company gallery)
export const uploadCompanyPicture = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No picture uploaded' });
    }

    // Find the company
    const company = await Company.findOne({ createdBy: req.user.id });
    if (!company) {
      return res.status(404).json({ message: 'Company not found' });
    }

    // Create file record in database
    const fileRecord = new File({
      filename: req.file.filename,
      originalname: req.file.originalname,
      url: req.file.path,
      publicId: req.file.filename,
      size: req.file.size,
      mimetype: req.file.mimetype,
      uploadedBy: req.user.id,
      company: company._id,
      type: 'company_picture'
    });

    await fileRecord.save();

    res.status(201).json({
      message: 'Picture uploaded successfully',
      picture: {
        id: fileRecord._id,
        filename: fileRecord.originalname,
        url: fileRecord.url,
        size: fileRecord.size,
        uploadedAt: fileRecord.createdAt
      }
    });
  } catch (error) {
    console.error('Upload company picture error:', error);
    res.status(500).json({ message: error.message });
  }
};

// Get user's uploaded files
export const getUserFiles = async (req, res) => {
  try {
    const files = await File.find({ uploadedBy: req.user.id })
      .populate('internship', 'title')
      .populate('company', 'name')
      .sort({ createdAt: -1 });

    res.json({
      files: files.map(file => ({
        id: file._id,
        filename: file.originalname,
        url: file.url,
        size: file.size,
        type: file.type,
        uploadedAt: file.createdAt,
        internship: file.internship,
        company: file.company
      }))
    });
  } catch (error) {
    console.error('Get user files error:', error);
    res.status(500).json({ message: error.message });
  }
};

// Upload note
export const uploadNote = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Only admins can upload notes' });
    }

    // Validate required fields
    const { title, category, level, description } = req.body;
    if (!title || !category || !level) {
      return res.status(400).json({ message: 'Title, category, and level are required' });
    }

    // Create file record in database
    const fileRecord = new File({
      filename: req.file.filename,
      originalname: req.file.originalname,
      url: req.file.path,
      publicId: req.file.filename,
      size: req.file.size,
      mimetype: req.file.mimetype,
      uploadedBy: req.user.id,
      type: 'note'
    });

    await fileRecord.save();

    // Create note record
    const note = new Notes({
      title,
      description: description || '',
      category,
      level,
      file: fileRecord._id,
      uploadedBy: req.user.id
    });

    await note.save();

    res.status(201).json({
      message: 'Note uploaded successfully',
      note: {
        id: note._id,
        title: note.title,
        description: note.description,
        category: note.category,
        level: note.level,
        file: {
          id: fileRecord._id,
          filename: fileRecord.originalname,
          url: fileRecord.url,
          size: fileRecord.size
        },
        uploadedAt: note.createdAt
      }
    });
  } catch (error) {
    console.error('Upload note error:', error);
    res.status(500).json({ message: error.message });
  }
};

// Delete a file
export const deleteFile = async (req, res) => {
  try {
    const file = await File.findById(req.params.fileId);

    if (!file) {
      return res.status(404).json({ message: 'File not found' });
    }

    // Check ownership
    if (file.uploadedBy.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to delete this file' });
    }

    // Delete from Cloudinary
    try {
      await cloudinary.uploader.destroy(file.publicId);
    } catch (cloudinaryError) {
      console.warn('Failed to delete from Cloudinary:', cloudinaryError);
    }

    // Remove file reference from related documents
    if (file.internship) {
      await Internship.findByIdAndUpdate(file.internship, {
        $pull: { documents: file._id }
      });
    }

    if (file.company) {
      await Company.findByIdAndUpdate(file.company, {
        $unset: { logo: 1, logoPublicId: 1 }
      });
    }

    // Remove file reference from notes
    if (file.type === 'note') {
      await Notes.findOneAndDelete({ file: file._id });
    }

    // Delete from database
    await File.findByIdAndDelete(req.params.fileId);

    res.json({ message: 'File deleted successfully' });
  } catch (error) {
    console.error('Delete file error:', error);
    res.status(500).json({ message: error.message });
  }
};
