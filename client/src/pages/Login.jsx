
import React, { useState } from "react";
import { motion } from "framer-motion";
import api from "../config/Api";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setLoading(true);

    try {
  const { data } = await api.post("/api/auth/login", { email, password });

  // Use AuthContext to set user & token so ProtectedRoute sees the change immediately
  login(data.user, data.token);

  setMessage("Login successful!");
      setTimeout(() => {
        if (data.user.role === "admin") {
          navigate("/dashboard/admin", { replace: true });
        } else if (data.user.role === "superadmin") {
          navigate("/dashboard/superadmin", { replace: true });
        } else {
          navigate("/dashboard/user", { replace: true });
        }
      }, 1000);
    } catch (err) {
      setMessage(err.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const fadeIn = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5 },
    },
  };

  const buttonVariants = {
    idle: { scale: 1 },
    hover: { scale: 1.03 },
    tap: { scale: 0.97 },
  };

  return (
    <motion.div
      className="max-w-md mx-auto mt-10 mb-10  p-8 border rounded-lg shadow-lg bg-white"
      initial="hidden"
      animate="visible"
      variants={fadeIn}
    >
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <h2 className="text-center text-3xl font-bold mb-8 text-green-700">
          Sign in to Turf Time
        </h2>
      </motion.div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <motion.div
          initial={{ x: -50, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          <div className="relative">
            <input
              type="email"
              placeholder=" "
              value={email}
              required
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-4 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-green-600 peer transition-all duration-300"
            />
            <label className="absolute text-gray-500 left-4 top-4 transition-all duration-300 peer-focus:-top-2.5 peer-focus:text-sm peer-focus:bg-white peer-focus:px-2 peer-focus:text-green-600 peer-[:not(:placeholder-shown)]:-top-2.5 peer-[:not(:placeholder-shown)]:text-sm peer-[:not(:placeholder-shown)]:bg-white peer-[:not(:placeholder-shown)]:px-2">
              Email address
            </label>
          </div>
        </motion.div>

        <motion.div
          initial={{ x: -50, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.5 }}
        >
          <div className="relative">
            <input
              type="password"
              placeholder=" "
              value={password}
              required
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-4 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-green-600 peer transition-all duration-300"
            />
            <label className="absolute text-gray-500 left-4 top-4 transition-all duration-300 peer-focus:-top-2.5 peer-focus:text-sm peer-focus:bg-white peer-focus:px-2 peer-focus:text-green-600 peer-[:not(:placeholder-shown)]:-top-2.5 peer-[:not(:placeholder-shown)]:text-sm peer-[:not(:placeholder-shown)]:bg-white peer-[:not(:placeholder-shown)]:px-2">
              Password
            </label>
          </div>
        </motion.div>

        <motion.button
          type="submit"
          disabled={loading}
          className="w-full py-4 bg-gradient-to-r from-green-600 to-green-700 text-white font-bold rounded-lg hover:from-green-700 hover:to-green-800 transition-all shadow-md"
          variants={buttonVariants}
          initial="idle"
          whileHover="hover"
          whileTap="tap"
        >
          {loading ? (
            <div className="flex justify-center items-center">
              <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full mr-2"></div>
              Signing in...
            </div>
          ) : (
            "Sign in"
          )}
        </motion.button>
      </form>

      {message && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          className={`mt-5 text-center font-medium ${
            message.includes("successful") ? "text-green-600" : "text-red-600"
          }`}
        >
          {message}
        </motion.p>
      )}

      <motion.div
        className="mt-6 text-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4, duration: 0.5 }}
      >
        <p className="text-gray-600">
          Don't have an account?{" "}
          <Link
            to="/signup"
            className="text-green-600 font-medium hover:text-green-800 transition-colors"
          >
            Sign up
          </Link>
        </p>
      </motion.div>
    </motion.div>

  );
}
