import React, { useState, useEffect, useContext } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X } from "lucide-react";
import { AuthContext } from "../context/AuthContext";
import { useTranslation } from 'react-i18next';

function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const { isAuthenticated, role } = useContext(AuthContext);
  const { t } = useTranslation();

  useEffect(() => {
    setIsOpen(false); // close menu when route changes
  }, [location.pathname]);

  const dashboardPath =
    role === "admin"
      ? "/dashboard/admin"
      : role === "superadmin"
      ? "/dashboard/superadmin"
      : role === "user"
      ? "/dashboard/user"
      : "/";

  const navLinks = [
    { name: t('app.nav.home'), path: "/" },
    { name: t('app.nav.about'), path: "/about" },
    { name: t('app.nav.turfs'), path: "/turfs" },
    { name: t('app.nav.contact'), path: "/contact" },
  ];

  const authButtons = !isAuthenticated ? (
    <>
      <Link to="/login">
          <motion.button
          whileHover={{ scale: 1.05 }}
          className="px-4 py-2 rounded-md font-medium bg-white text-green-600 border border-green-600 hover:bg-green-50 transition"
        >
          {t('app.auth.login')}
        </motion.button>
      </Link>
      <Link to="/signup">
        <motion.button
          whileHover={{ scale: 1.05 }}
          className="px-4 py-2 rounded-md font-medium bg-green-600 text-white hover:bg-green-700 transition"
        >
          {t('app.auth.signup')}
        </motion.button>
      </Link>
    </>
  ) : (
    <Link to={dashboardPath}>
      <motion.button
        whileHover={{ scale: 1.05 }}
        className="px-4 py-2 rounded-md font-medium bg-green-600 text-white hover:bg-green-700 transition"
      >
        {t('app.auth.dashboard')}
      </motion.button>
    </Link>
  );

  return (
    <nav className="fixed top-0 left-0 w-full z-50 bg-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex-shrink-0">
            <Link to="/" className="text-2xl font-bold text-green-600">
              {t('app.title')}
            </Link>
          </div>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-6">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                to={link.path}
                className="font-medium text-gray-800 hover:text-green-600 transition"
              >
                {link.name}
              </Link>
            ))}

            <div className="flex items-center space-x-2">{authButtons}</div>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="p-2 rounded-md text-gray-800 hover:bg-gray-100"
            >
              {isOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Dropdown Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="md:hidden bg-white shadow-lg border-t border-gray-200"
          >
            <div className="px-4 py-4 flex flex-col space-y-3">
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  to={link.path}
                  className="font-medium text-gray-800 hover:text-green-600"
                >
                  {link.name}
                </Link>
              ))}

              <div className="pt-4 border-t border-gray-100 flex flex-col space-y-2">
                {authButtons}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}

export default Navbar;
