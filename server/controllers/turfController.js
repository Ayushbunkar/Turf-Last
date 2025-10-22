import Turf from "../models/Turf.js";
import AuditLog from '../models/AuditLog.js';
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

    // Handle uploaded image if present
    let images = [];
    if (req.file && req.file.buffer) {
      try {
        if (cloudinary && cloudinary.uploader && typeof cloudinary.uploader.upload_stream === 'function') {
          // upload buffer to cloudinary using upload_stream
          const uploadResult = await new Promise((resolve, reject) => {
            try {
              const stream = cloudinary.uploader.upload_stream({ folder: 'turfs' }, (error, result) => {
                if (error) return reject(error);
                resolve(result);
              });
              stream.end(req.file.buffer);
            } catch (e) {
              reject(e);
            }
          });
          if (uploadResult && uploadResult.secure_url) images.push(uploadResult.secure_url);
        } else {
          // Fallback: write to local uploads folder (dev only)
          const uploadsDir = path.join(process.cwd(), 'uploads');
          if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
          const filename = `turf_${Date.now()}_${(req.file.originalname || '').replace(/[^a-zA-Z0-9.\-]/g, '_')}`;
          const dest = path.join(uploadsDir, filename);
          fs.writeFileSync(dest, req.file.buffer);
          images.push(`/uploads/${filename}`);
        }
      } catch (imgErr) {
        console.warn('Image upload failed:', imgErr?.message || imgErr);
      }
    }

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
    // Allow superadmin to update any turf; otherwise ensure owner matches
    if (req.user?.role !== 'superadmin' && turf.admin.toString() !== req.user?._id.toString()) {
      return res.status(403).json({ message: "Not authorized to edit this turf" });
    }

    // Handle possible image upload on update
    let images = turf.images || [];
    if (req.file && req.file.buffer) {
      try {
        if (cloudinary && cloudinary.uploader && typeof cloudinary.uploader.upload_stream === 'function') {
          const uploadResult = await new Promise((resolve, reject) => {
            try {
              const stream = cloudinary.uploader.upload_stream({ folder: 'turfs' }, (error, result) => {
                if (error) return reject(error);
                resolve(result);
              });
              stream.end(req.file.buffer);
            } catch (e) { reject(e); }
          });
          if (uploadResult && uploadResult.secure_url) images.unshift(uploadResult.secure_url);
        } else {
          const uploadsDir = path.join(process.cwd(), 'uploads');
          if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
          const filename = `turf_${Date.now()}_${(req.file.originalname || '').replace(/[^a-zA-Z0-9.\-]/g, '_')}`;
          const dest = path.join(uploadsDir, filename);
          fs.writeFileSync(dest, req.file.buffer);
          images.unshift(`/uploads/${filename}`);
        }
      } catch (imgErr) {
        console.warn('updateTurf image upload failed:', imgErr?.message || imgErr);
      }
    }

    // Merge body updates and images
    const payload = { ...(req.body || {}) };
    if (images && images.length) payload.images = images;

    const updatedTurf = await Turf.findByIdAndUpdate(req.params.id, payload, {
      new: true,
    });

    // Build imageUrl for convenience (first image)
    const baseUrl = process.env.SERVER_URL || `http://localhost:${process.env.PORT || 4500}`;
    let imageUrl = null;
    if (updatedTurf.images && updatedTurf.images.length) {
      imageUrl = updatedTurf.images[0];
      if (!imageUrl.startsWith('http')) imageUrl = `${baseUrl}${imageUrl}`;
    }

    res.json({ message: "Turf updated", turf: updatedTurf, imageUrl });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 🔴 DELETE TURF
export const deleteTurf = async (req, res) => {
  try {
    console.log('deleteTurf called for id:', req.params.id, 'by user:', req.user ? { id: req.user._id, role: req.user.role } : null);
    const turf = await Turf.findById(req.params.id);
    if (!turf) return res.status(404).json({ message: "Turf not found" });

    if (!req.user) return res.status(401).json({ message: 'Not authenticated' });
    // Allow superadmin to delete any turf; otherwise ensure owner matches
    if (req.user?.role !== 'superadmin' && turf.admin.toString() !== req.user?._id.toString()) {
      return res.status(403).json({ message: "Not authorized to delete this turf" });
    }

    await turf.deleteOne();
    res.json({ message: "Turf deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 🔴 BLOCK TURF (SuperAdmin Only)
export const blockTurf = async (req, res) => {
  try {
    const turf = await Turf.findById(req.params.id);
    if (!turf) return res.status(404).json({ message: "Turf not found" });
    const { reason } = req.body || {};
    turf.isApproved = false;
    turf.status = 'blocked';
    if (reason) turf.blockReason = String(reason).slice(0, 1000);
    turf.lastBlockedAt = new Date();
    await turf.save();

    try {
      await AuditLog.create({ action: 'block_turf', actor: req.user?._id, actorSnapshot: req.user ? { id: req.user._id, name: req.user.name, email: req.user.email } : null, targetTurf: turf._id, meta: { reason: turf.blockReason } });
    } catch (logErr) { console.warn('audit log failed for blockTurf', logErr?.message || logErr); }

    res.json({ message: "Turf blocked successfully", turf });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
  // Optionally notify turf admin asynchronously
  try {
    if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
      await sendEmail({
        to: turf.admin?.email,
        subject: "Turf Blocked",
        text: `Hi ${turf?.admin?.name || 'Admin'}, your turf has been blocked by SuperAdmin.`,
      });
    }
  } catch (mailErr) {
    console.warn('blockTurf email failed:', mailErr?.message || mailErr);
  }
};
// � APPROVE TURF (SuperAdmin Only)

// �🟡 SUPERADMIN - APPROVE TURF
export const approveTurf = async (req, res) => {
  try {
    const turf = await Turf.findById(req.params.id);
    if (!turf) return res.status(404).json({ message: "Turf not found" });
    turf.isApproved = true;
    turf.status = 'active';
    // clear block reason when approving
    turf.blockReason = '';
    turf.lastBlockedAt = undefined;
    await turf.save();

    try {
      await AuditLog.create({ action: 'approve_turf', actor: req.user?._id, actorSnapshot: req.user ? { id: req.user._id, name: req.user.name, email: req.user.email } : null, targetTurf: turf._id, meta: {} });
    } catch (logErr) { console.warn('audit log failed for approveTurf', logErr?.message || logErr); }

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
