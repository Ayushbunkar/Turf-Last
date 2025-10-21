import express from "express";
import { registerUser, loginUser } from "../controllers/authcontroller.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);

// Temporary debug route to verify token and user data during development
router.get('/debug', protect, (req, res) => {
	res.json({ message: 'Auth debug', user: req.user });
});

export default router;
