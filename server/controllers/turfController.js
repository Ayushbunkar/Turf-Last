import Turf from "../models/Turf.js";
import fs from 'fs';
import path from 'path';
import cloudinary from '../config/cloudinary.js';

// 🟢 CREATE TURF
export const createTurf = async (req, res) => {
  try {
    // Debug: log incoming request details to trace issues
    console.log('--- createTurf called ---');
    console.log('URL:', req.originalUrl);
    console.log('Method:', req.method);
    console.log('Authorization header present?', !!req.headers.authorization);
    console.log('x-access-token header present?', !!req.headers['x-access-token']);
    console.log('Cookie token present?', !!req.cookies?.token);
  console.log('req.user:', req.user ? { id: req.user._id, role: req.user?.role || null, email: req.user?.email } : null);
    console.log('req.file:', req.file ? { originalname: req.file.originalname, mimetype: req.file.mimetype, size: req.file.size } : null);
    console.log('req.body keys:', Object.keys(req.body || {}));

    const { name, location, description, pricePerHour, availableSlots } = req.body;

    // Basic validation
    if (!name || !location || !pricePerHour) {
      console.warn('createTurf: missing required fields', { name, location, pricePerHour });
      return res.status(400).json({ message: 'Missing required fields: name, location, pricePerHour' });
    }

    // Remove all upload/image logic
    let images = [];

    // Auto-approve turfs created by admin or superadmin so they're visible immediately
  const autoApprove = req.user ? (req.user?.role === 'admin' || req.user?.role === 'superadmin') : false;

    const turf = await Turf.create({
      name,
      location,
      description,
      pricePerHour,
      availableSlots,
      images,
      admin: req.user?._id,
      isApproved: autoApprove,
    });

  console.log('createTurf: turf created with id', turf._id);
  // Build an absolute imageUrl for immediate client use.
  const baseUrl = process.env.SERVER_URL || `http://localhost:${process.env.PORT || 4500}`;
  let imageUrl = null;
  if (turf.images && turf.images.length) {
    imageUrl = turf.images[0];
    // if stored as relative path like /uploads/..., prefix the server base URL
    if (!imageUrl.startsWith('http')) {
      imageUrl = `${baseUrl}${imageUrl}`;
    }
  }
    res.status(201).json({ message: "Turf added successfully!", turf, imageUrl });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 🔵 GET ALL TURFS (Public)
export const getAllTurfs = async (req, res) => {
  try {
    // If ?all=true is provided (dev only), return all turfs regardless of approval
    const returnAll = req.query?.all === 'true';
    const filter = returnAll ? {} : { isApproved: true };
  const turfs = await Turf.find(filter).populate("admin", "name email");
  res.json(turfs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 🟣 GET MY TURFS (Admin Only)
export const getMyTurfs = async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ message: 'Not authenticated' });
    const turfs = await Turf.find({ admin: req.user?._id });
    res.json(turfs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// � GET TURF BY ID (Public)
export const getTurfById = async (req, res) => {
  try {
    const turf = await Turf.findById(req.params.id).populate('admin', 'name email');
    if (!turf) return res.status(404).json({ message: 'Turf not found' });
    res.json(turf);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// �🟠 UPDATE TURF (Admin)
export const updateTurf = async (req, res) => {
  try {
    const turf = await Turf.findById(req.params.id);
    if (!turf) return res.status(404).json({ message: "Turf not found" });

    if (!req.user) return res.status(401).json({ message: 'Not authenticated' });
    if (turf.admin.toString() !== req.user?._id.toString()) {
      return res.status(403).json({ message: "Not authorized to edit this turf" });
    }

    const updatedTurf = await Turf.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });

    res.json({ message: "Turf updated", turf: updatedTurf });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 🔴 DELETE TURF
export const deleteTurf = async (req, res) => {
  try {
    const turf = await Turf.findById(req.params.id);
    if (!turf) return res.status(404).json({ message: "Turf not found" });

    if (!req.user) return res.status(401).json({ message: 'Not authenticated' });
    if (turf.admin.toString() !== req.user?._id.toString()) {
      return res.status(403).json({ message: "Not authorized to delete this turf" });
    }

    await turf.deleteOne();
    res.json({ message: "Turf deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// � APPROVE TURF (SuperAdmin Only)

// �🟡 SUPERADMIN - APPROVE TURF
export const approveTurf = async (req, res) => {
  try {
    const turf = await Turf.findById(req.params.id);
    if (!turf) return res.status(404).json({ message: "Turf not found" });

    turf.isApproved = true;
    await turf.save();

    res.json({ message: "Turf approved successfully", turf });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
  // Send notification email asynchronously (non-blocking)
  try {
    if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
      await sendEmail({
        to: turf.admin?.email,
        subject: "Turf Approved",
        text: `Hi ${turf?.admin?.name || 'Admin'}, your turf has been approved by SuperAdmin.`,
      });
    }
  } catch (mailErr) {
    console.warn('approveTurf email failed:', mailErr?.message || mailErr);
  }
};
