import React from "react";
import { motion } from "framer-motion";
import { FaUser, FaChevronDown } from "react-icons/fa";

const UserMenuButton = ({ isOpen, onToggle, user }) => {
  // Generate user initials from name
  const getUserInitials = (name) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  // Get truncated name for display
  const getDisplayName = (name) => {
    if (!name) return "User";
    return name.length > 15 ? name.substring(0, 15) + "..." : name;
  };

  return (
    <>
      {/* Desktop Version */}
      <div className="d-none d-md-block">
        <motion.div
          className="position-fixed"
          style={{
            top: "20px",
            right: "20px",
            zIndex: 1050,
          }}
        >
          <motion.button
            onClick={onToggle}
            className="btn btn-light d-flex align-items-center gap-2 px-3 py-2 rounded-pill shadow-sm border-0"
            style={{
              background: "rgba(255, 255, 255, 0.95)",
              backdropFilter: "blur(10px)",
              minWidth: "140px",
            }}
            whileHover={{ scale: 1.05, boxShadow: "0 4px 12px rgba(0,0,0,0.15)" }}
            whileTap={{ scale: 0.95 }}
            data-user-menu
          >
            <div
              className="rounded-circle d-flex align-items-center justify-content-center"
              style={{
                width: "32px",
                height: "32px",
                background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                color: "white",
                fontSize: "0.8rem",
                fontWeight: "bold",
              }}
            >
              {getUserInitials(user?.name)}
            </div>
            <span className="fw-medium text-dark" style={{ fontSize: "0.9rem" }}>
              {getDisplayName(user?.name)}
            </span>
            <motion.div
              animate={{ rotate: isOpen ? 180 : 0 }}
              transition={{ duration: 0.3 }}
            >
              <FaChevronDown size={12} className="text-muted" />
            </motion.div>
          </motion.button>
        </motion.div>
      </div>

      {/* Mobile Version */}
      <div className="d-md-none">
        <motion.div
          className="position-fixed"
          style={{
            top: "15px",
            right: "15px",
            zIndex: 1050,
          }}
        >
          <motion.button
            onClick={onToggle}
            className="btn btn-light rounded-circle shadow-sm border-0 d-flex align-items-center justify-content-center"
            style={{
              width: "48px",
              height: "48px",
              background: "rgba(255, 255, 255, 0.95)",
              backdropFilter: "blur(10px)",
            }}
            whileHover={{ scale: 1.1, boxShadow: "0 4px 12px rgba(0,0,0,0.15)" }}
            whileTap={{ scale: 0.9 }}
            data-user-menu
          >
            <FaUser size={20} className="text-primary" />
          </motion.button>
        </motion.div>
      </div>
    </>
  );
};

export default UserMenuButton; 