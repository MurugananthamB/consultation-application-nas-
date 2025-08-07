const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Please provide your name"],
      trim: true,
    },
    doctorId: {
      type: String,
      required: [true, "Please provide your doctor ID"],
      unique: true,
      trim: true,
    },
    password: {
      type: String,
      required: [true, "Please provide a password"],
      select: false,
    },
    role: {
      type: String,
      enum: ["doctor", "admin"],
      default: "doctor",
    },
    location: {
      type: String,
      required: [true, "Please provide your location"],
    },
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Hash password before saving
userSchema.pre("save", async function (next) {
  // Only hash the password if it has been modified (or is new)
  if (!this.isModified("password")) {
    console.log("Password not modified, skipping hash");
    return next();
  }

  try {
    console.log("Hashing password for user:", this.doctorId);
    // Generate a salt
    const salt = await bcrypt.genSalt(10);
    // Hash the password with the salt
    const hashedPassword = await bcrypt.hash(this.password, salt);
    console.log("Password hashed successfully");
    this.password = hashedPassword;
    next();
  } catch (error) {
    console.error("Error hashing password:", error);
    next(error);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function (candidatePassword) {
  try {
    console.log("Comparing password for user:", this.doctorId);
    console.log("Candidate password:", candidatePassword);
    console.log("Stored password hash:", this.password);

    if (!this.password) {
      console.error("No password hash found for user");
      return false;
    }

    // Compare the candidate password with the stored hash
    const isMatch = await bcrypt.compare(candidatePassword, this.password);
    console.log("Password comparison result:", isMatch);
    return isMatch;
  } catch (error) {
    console.error("Password comparison error:", error);
    return false;
  }
};

// Create default admin user
userSchema.statics.createDefaultAdmin = async function () {
  try {
    console.log("Checking for existing admin user...");
    const adminExists = await this.findOne({ doctorId: "admin" });

    if (!adminExists) {
      console.log("Creating default admin user...");
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash("admin123", salt);
      console.log("Generated password hash for admin:", hashedPassword);

      const admin = new this({
        name: "Admin",
        doctorId: "admin",
        password: hashedPassword,
        role: "admin",
        location: "APH",
      });

      await admin.save();
      console.log("Default admin user created successfully");
    } else {
      console.log("Admin user already exists");
    }

    return true;
  } catch (error) {
    // Handle duplicate key error specifically
    if (error.code === 11000) {
      console.log("Admin user already exists (duplicate key)");
      return true;
    }
    console.error("Error creating admin user:", error);
    throw error;
  }
};

const User = mongoose.model("User", userSchema);

// Create default admin when the application starts
mongoose.connection.once("open", async () => {
  try {
    await User.createDefaultAdmin();
  } catch (error) {
    // Silently handle duplicate key errors - admin already exists
    if (error.code !== 11000) {
      console.error("⚠️ Unexpected error creating admin:", error.message);
    }
  }
});

module.exports = User;
