import express from "express";
import Turf from "../models/Turf.js";
const router = express.Router();

router.get("/", async (_, res) => {
  try { res.json(await Turf.find().sort({ createdAt: -1 })); }
  catch (e) { res.status(500).json({ msg: e.message }); }
});

router.post("/add", async (req, res) => {
  try { res.status(201).json(await new Turf(req.body).save()); }
  catch (e) { res.status(400).json({ msg: e.message }); }
});

router.put("/:id", async (req, res) => {
  try { res.json(await Turf.findByIdAndUpdate(req.params.id, req.body, { new: true })); }
  catch (e) { res.status(400).json({ msg: e.message }); }
});

router.delete("/:id", async (req, res) => {
  try { await Turf.findByIdAndDelete(req.params.id); res.json({ msg: "Deleted" }); }
  catch (e) { res.status(500).json({ msg: e.message }); }
});

export default router;
