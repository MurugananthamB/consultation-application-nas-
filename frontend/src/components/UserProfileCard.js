import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, Button, Badge } from "react-bootstrap";
import { 
  FaUser, 
  FaUserShield, 
  FaEdit, 
  FaClock, 
  FaSignOutAlt,
  FaLock
} from "react-icons/fa";
import ChangePasswordModal from "./ChangePasswordModal";

const UserProfileCard = ({ isOpen, onClose, onLogout, onEditProfile, user }) => {
  const [showChangePassword, setShowChangePassword] = useState(false);

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

  // Format last login time
  const formatLastLogin = (lastLogin) => {
    if (!lastLogin) return "Never";
    const date = new Date(lastLogin);
    const now = new Date();
    const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return "Just now";
    if (diffInHours < 24) return `${diffInHours} hours ago`;
    if (diffInHours < 48) return "Yesterday";
    return date.toLocaleDateString();
  };

  // Get role badge color
  const getRoleBadgeVariant = (role) => {
    switch (role?.toLowerCase()) {
      case "admin": return "danger";
      case "doctor": return "primary";
      case "nurse": return "success";
      default: return "secondary";
    }
  };

  const handleChangePassword = () => {
    setShowChangePassword(true);
    onClose(); // Close the profile dropdown when opening the modal
  };

  const handlePasswordChangeSuccess = (passwordData) => {
    // TODO: Handle successful password change
    console.log("Password changed successfully:", passwordData);
    // You can add a success notification here
  };

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop for click outside */}
            <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 1040,
            }}
          />

          {/* Desktop Profile Card */}
          <div className="d-none d-md-block">
            <motion.div
              className="position-fixed"
              style={{
                top: "80px",
                right: "20px",
                zIndex: 1050,
                minWidth: "320px",
              }}
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              data-profile-card
            >
              <Card
                className="shadow-lg border-0"
                style={{
                  borderRadius: "16px",
                  background: "rgba(255, 255, 255, 0.98)",
                  backdropFilter: "blur(15px)",
                  border: "1px solid rgba(255, 255, 255, 0.2)",
                }}
              >
                <Card.Body className="p-4">
                  {/* User Avatar and Basic Info */}
                  <div className="d-flex align-items-center mb-4">
                    <div
                      className="rounded-circle d-flex align-items-center justify-content-center me-3"
                      style={{
                        width: "60px",
                        height: "60px",
                        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                        color: "white",
                        fontSize: "1.2rem",
                        fontWeight: "bold",
                      }}
                    >
                      {getUserInitials(user?.name)}
                    </div>
                    <div className="flex-grow-1">
                      <h6 className="mb-1 fw-bold text-dark">
                        {user?.name || "User Name"}
                      </h6>
                      <Badge 
                        bg={getRoleBadgeVariant(user?.role)}
                        className="mb-1"
                      >
                        {user?.role || "User"}
                      </Badge>
                      <div className="d-flex align-items-center text-muted" style={{ fontSize: "0.85rem" }}>
                        <FaClock className="me-1" size={12} />
                        Last active: {formatLastLogin(user?.lastLogin)}
                      </div>
                    </div>
                  </div>

                  {/* User Details */}
                  <div className="mb-4">
                    {user?.department && (
                      <div className="d-flex align-items-center">
                        <FaUserShield className="text-muted me-2" size={14} />
                        <span className="text-muted" style={{ fontSize: "0.9rem" }}>
                          {user.department}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="d-flex gap-2">
                    <Button
                      variant="outline-primary"
                      size="sm"
                      onClick={handleChangePassword}
                      className="flex-fill d-flex align-items-center justify-content-center"
                      style={{ fontSize: "0.85rem" }}
                    >
                      <FaLock className="me-1" size={12} />
                      Change Password
                    </Button>
                     <Button
                       variant="outline-danger"
                       size="sm"
                       onClick={onLogout}
                       className="flex-fill d-flex align-items-center justify-content-center"
                       style={{ fontSize: "0.85rem" }}
                     >
                       <FaSignOutAlt className="me-1" size={12} />
                       Logout
                     </Button>
                   </div>
                </Card.Body>
              </Card>
            </motion.div>
          </div>

          {/* Mobile Profile Card */}
          <div className="d-md-none">
            <motion.div
              className="position-fixed"
              style={{
                top: "80px",
                right: "15px",
                left: "15px",
                zIndex: 1050,
              }}
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              data-profile-card
            >
              <Card
                className="shadow-lg border-0"
                style={{
                  borderRadius: "16px",
                  background: "rgba(255, 255, 255, 0.98)",
                  backdropFilter: "blur(15px)",
                  border: "1px solid rgba(255, 255, 255, 0.2)",
                }}
              >
                <Card.Body className="p-3">
                  {/* User Avatar and Basic Info */}
                  <div className="d-flex align-items-center mb-3">
                    <div
                      className="rounded-circle d-flex align-items-center justify-content-center me-3"
                      style={{
                        width: "50px",
                        height: "50px",
                        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                        color: "white",
                        fontSize: "1rem",
                        fontWeight: "bold",
                      }}
                    >
                      {getUserInitials(user?.name)}
                    </div>
                    <div className="flex-grow-1">
                      <h6 className="mb-1 fw-bold text-dark" style={{ fontSize: "0.95rem" }}>
                        {user?.name || "User Name"}
                      </h6>
                      <Badge 
                        bg={getRoleBadgeVariant(user?.role)}
                        className="mb-1"
                        style={{ fontSize: "0.75rem" }}
                      >
                        {user?.role || "User"}
                      </Badge>
                    </div>
                  </div>

                  {/* User Details */}
                  <div className="mb-3">
                    {user?.department && (
                      <div className="d-flex align-items-center mb-1">
                        <FaUserShield className="text-muted me-2" size={12} />
                        <span className="text-muted" style={{ fontSize: "0.8rem" }}>
                          {user.department}
                        </span>
                      </div>
                    )}
                    <div className="d-flex align-items-center">
                      <FaClock className="text-muted me-2" size={12} />
                      <span className="text-muted" style={{ fontSize: "0.8rem" }}>
                        Last active: {formatLastLogin(user?.lastLogin)}
                      </span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="d-flex gap-2">
                     <Button
                       variant="outline-primary"
                       size="sm"
                       onClick={handleChangePassword}
                       className="flex-fill d-flex align-items-center justify-content-center"
                       style={{ fontSize: "0.8rem", padding: "0.375rem 0.5rem" }}
                     >
                       <FaLock className="me-1" size={10} />
                       Change Password
                     </Button>
                     <Button
                       variant="outline-danger"
                       size="sm"
                       onClick={onLogout}
                       className="flex-fill d-flex align-items-center justify-content-center"
                       style={{ fontSize: "0.8rem", padding: "0.375rem 0.5rem" }}
                     >
                       <FaSignOutAlt className="me-1" size={10} />
                       Logout
                     </Button>
                   </div>
                 </Card.Body>
               </Card>
             </motion.div>
           </div>
           </>
         )}
       </AnimatePresence>

       {/* Change Password Modal */}
       <ChangePasswordModal
         show={showChangePassword}
         onHide={() => setShowChangePassword(false)}
         onSave={handlePasswordChangeSuccess}
       />
     </>
   );
 };

export default UserProfileCard; 