import React from "react";
import { motion } from "framer-motion";
import {
  Edit,
  Trash2,
  MapPin,
  Tag,
  Users,
  Star,
  Eye,
  Settings,
  Calendar,
} from "lucide-react";

const sportLabels = {
  football: "Football",
  cricket: "Cricket",
  basketball: "Basketball",
  volleyball: "Volleyball",
  badminton: "Badminton",
  tennis: "Tennis",
  multiple: "Multiple Sports",
};

const TurfAdminCard = ({ turf, onEdit, onDelete, onView, darkMode = false, index }) => {
  const theme = {
    bg: darkMode ? "bg-gray-800" : "bg-white",
    border: darkMode ? "border-gray-700" : "border-gray-200",
    text: darkMode ? "text-gray-300" : "text-gray-700",
    subtext: darkMode ? "text-gray-400" : "text-gray-500",
    accent: darkMode ? "text-green-400" : "text-green-600",
  };

  const formatPrice = (price) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 0,
    }).format(price);

  const getStatusColor = (isActive) =>
    isActive
      ? "bg-gradient-to-r from-green-500/20 to-green-400/30 text-green-500 border border-green-500/30"
      : "bg-gradient-to-r from-red-500/20 to-red-400/30 text-red-400 border border-red-500/30";

  const ActionButton = ({ color, label, Icon, onClick }) => {
    const colorMap = {
      blue: { lightBg: "bg-blue-50", lightText: "text-blue-600", lightHover: "hover:bg-blue-100", lightBorder: "border-blue-200", darkBg: "bg-blue-900/10", darkText: "text-blue-400", darkHover: "hover:bg-blue-900/20", darkBorder: "border-blue-800" },
      green: { lightBg: "bg-green-50", lightText: "text-green-600", lightHover: "hover:bg-green-100", lightBorder: "border-green-200", darkBg: "bg-green-900/10", darkText: "text-green-400", darkHover: "hover:bg-green-900/20", darkBorder: "border-green-800" },
      red: { lightBg: "bg-red-50", lightText: "text-red-600", lightHover: "hover:bg-red-100", lightBorder: "border-red-200", darkBg: "bg-red-900/10", darkText: "text-red-400", darkHover: "hover:bg-red-900/20", darkBorder: "border-red-800" },
      yellow: { lightBg: "bg-yellow-50", lightText: "text-yellow-600", lightHover: "hover:bg-yellow-100", lightBorder: "border-yellow-200", darkBg: "bg-yellow-900/10", darkText: "text-yellow-400", darkHover: "hover:bg-yellow-900/20", darkBorder: "border-yellow-800" },
      purple: { lightBg: "bg-purple-50", lightText: "text-purple-600", lightHover: "hover:bg-purple-100", lightBorder: "border-purple-200", darkBg: "bg-purple-900/10", darkText: "text-purple-400", darkHover: "hover:bg-purple-900/20", darkBorder: "border-purple-800" },
      default: { lightBg: "bg-gray-50", lightText: "text-gray-700", lightHover: "hover:bg-gray-100", lightBorder: "border-gray-200", darkBg: "bg-gray-800", darkText: "text-gray-300", darkHover: "hover:bg-gray-700", darkBorder: "border-gray-700" }
    };
    const token = colorMap[color] || colorMap.default;
    const colors = darkMode
      ? { bg: token.darkBg, text: token.darkText, hover: token.darkHover, border: token.darkBorder }
      : { bg: token.lightBg, text: token.lightText, hover: token.lightHover, border: token.lightBorder };

    return (
      <button onClick={onClick} className={`flex-1 flex items-center justify-center px-3 py-2 rounded-lg text-sm font-medium border transition-all duration-200 shadow-sm ${colors.bg} ${colors.text} ${colors.hover} ${colors.border}`}>
        <Icon className="w-4 h-4 mr-1" /> {label}
      </button>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.08 }}
      className={`rounded-2xl overflow-hidden shadow-md hover:shadow-xl hover:-translate-y-1 transition-all duration-300 ${theme.bg} ${theme.border} border`}
    >
      {/* Image Section */}
      <div className="relative h-52 overflow-hidden">
        {/* inline SVG data URI placeholder to avoid external network dependency */}
        {/** Small helper to compute image src safely **/}
        <img
          src={(() => {
            const img = turf?.images?.[0];
            if (!img || img === '/uploads/undefined' || img === 'undefined' || img === undefined) return `data:image/svg+xml;utf8,${encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' width='400' height='200'><rect width='100%' height='100%' fill='%23e5e7eb'/><text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' fill='%236b7280' font-family='Arial, Helvetica, sans-serif' font-size='20'>No Image</text></svg>`)}`;
            try {
              return img.startsWith("http")
                ? img
                : `${import.meta.env.VITE_API_URL || "http://localhost:4500"}${img}`;
            } catch (err) {
              return `data:image/svg+xml;utf8,${encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' width='400' height='200'><rect width='100%' height='100%' fill='%23e5e7eb'/><text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' fill='%236b7280' font-family='Arial, Helvetica, sans-serif' font-size='20'>No Image</text></svg>`)}`;
            }
          })()}
          alt={turf.name || "Turf image"}
          onError={(e) => {
            // fallback to inline SVG placeholder on any loading error
            e.target.onerror = null;
            e.target.src = `data:image/svg+xml;utf8,${encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' width='400' height='200'><rect width='100%' height='100%' fill='%23e5e7eb'/><text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' fill='%236b7280' font-family='Arial, Helvetica, sans-serif' font-size='20'>No Image</text></svg>`)}`;
          }}
          className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
        />
  {/* subtle overlay so image remains visible */}
  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
        <div className="absolute top-4 right-4">
          <span
            className={`px-3 py-1 text-xs font-semibold rounded-full backdrop-blur-sm ${getStatusColor(
              turf.isActive
            )}`}
          >
            {turf.isActive ? "Active" : "Inactive"}
          </span>
        </div>
        <div className="absolute bottom-4 left-4">
          <h3 className="text-white font-bold text-lg drop-shadow-md">
            {turf.name}
          </h3>
          <div className="flex items-center text-white/80 text-sm mt-1">
            <Star className="w-4 h-4 text-yellow-400 mr-1" /> {turf.rating || 0} •{" "}
            {turf.reviews || 0} reviews
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6 space-y-3">
        {/* Info */}
        <div className="space-y-1">
          <div className="flex items-center">
            <MapPin className={`w-4 h-4 mr-2 ${theme.subtext}`} />
            <span className={`text-sm truncate ${theme.text}`}>
              {turf.location}
            </span>
          </div>
          <div className="flex items-center">
            <Tag className={`w-4 h-4 mr-2 ${theme.subtext}`} />
            <span className={`text-sm ${theme.text}`}>
              {sportLabels[turf.sportType] || turf.sportType}
            </span>
          </div>
          <div className="flex items-center">
            <span className={`text-lg font-semibold ${theme.accent}`}>
              {formatPrice(turf.pricePerHour)} / hour
            </span>
          </div>
        </div>

        {/* Description */}
        <p className={`text-sm line-clamp-2 ${theme.subtext}`}>
          {turf.description}
        </p>

        {/* Stats */}
        <div className="flex items-center gap-4">
          {turf.capacity && (
            <div className="flex items-center">
              <Users className={`w-4 h-4 mr-1 ${theme.subtext}`} />
              <span className={`text-sm ${theme.text}`}>
                {turf.capacity} players
              </span>
            </div>
          )}
          {turf.size && (
            <div className="flex items-center">
              <Settings className={`w-4 h-4 mr-1 ${theme.subtext}`} />
              <span className={`text-sm ${theme.text}`}>{turf.size}</span>
            </div>
          )}
        </div>

        {/* Amenities */}
        {turf.amenities?.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {turf.amenities.slice(0, 3).map((a, i) => (
              <span
                key={i}
                className={`text-xs px-2 py-1 rounded-full ${
                  darkMode
                    ? "bg-green-900/20 text-green-400"
                    : "bg-green-50 text-green-700"
                }`}
              >
                {a}
              </span>
            ))}
            {turf.amenities.length > 3 && (
              <span
                className={`text-xs px-2 py-1 rounded-full ${
                  darkMode
                    ? "bg-gray-700 text-gray-300"
                    : "bg-gray-100 text-gray-600"
                }`}
              >
                +{turf.amenities.length - 3} more
              </span>
            )}
          </div>
        )}

        {/* Created Date */}
        <div className="flex items-center">
          <Calendar className={`w-4 h-4 mr-2 ${theme.subtext}`} />
          <span className={`text-xs ${theme.subtext}`}>
            Created on {new Date(turf.createdAt).toLocaleDateString()}
          </span>
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-4 border-t border-gray-200 dark:border-gray-700">
          <ActionButton color="blue" label="View" Icon={Eye} onClick={() => onView?.(turf)} />
          <ActionButton color="green" label="Edit" Icon={Edit} onClick={() => onEdit?.(turf)} />
          <ActionButton color="red" label="Delete" Icon={Trash2} onClick={() => onDelete?.(turf._id)} />
        </div>
      </div>
    </motion.div>
  );
};

export default TurfAdminCard;
