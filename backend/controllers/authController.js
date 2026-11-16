
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const mongoose = require("mongoose");
const Dealership = require("../models/Dealership");
const Technician = require("../models/Technician");
const createUserWithLinkedTechnician = async ({
  name,
  email,
  password,
  role,
  dealership,
}) => {
  let technicianRecord = null;

  if (role === "Technician") {
    const employeeId = `TECH-${new mongoose.Types.ObjectId()
      .toString()
      .slice(-8)
      .toUpperCase()}`;

    technicianRecord = await Technician.create({
      employeeId,
      name,
      dealership,
    });
  }

  try {
    const user = await User.create({
      name,
      email,
      password,
      role,
      dealership,
      technician: technicianRecord?._id || null,
    });

    return user;
  } catch (error) {
    if (technicianRecord) {
      await Technician.findByIdAndDelete(technicianRecord._id);
    }

    throw error;
  }
};
const register = async (req, res) => {
  try {
    const { name, email, password, role, dealership } = req.body;

    if (!name || !email || !password || !role || !dealership) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters",
      });
    }

    const allowedRoles = ["Service Advisor", "Technician"];

if (!allowedRoles.includes(role)) {
  return res.status(403).json({
    success: false,
    message: "Public registration is restricted to Service Advisors and Technicians.",
  });
}
    const existingUser = await User.findOne({
      email: email.toLowerCase(),
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "User already exists",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

   
    const user = await createUserWithLinkedTechnician({
  name,
  email,
  password: hashedPassword,
  role,
  dealership,
});
    res.status(201).json({
      success: true,
      message: "User registered successfully",
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        dealership: user.dealership,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    const user = await User.findOne({
      email: email.toLowerCase(),
    }).select("+password");

    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    const token = jwt.sign(
      {
        id: user._id,
        role: user.role,
        dealership: user.dealership,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: process.env.JWT_EXPIRES_IN || "1d",
      }
    );

    res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        dealership: user.dealership,
        technician: user.technician || null,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};




const getUsers = async (req, res) => {
  try {
    const users = await User.find()
      .select("-password")
      .populate("dealership", "name dealershipCode location")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: users.length,
      data: users,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const createManagedUser = async (req, res) => {
  try {
    const { name, email, password, role, dealership } = req.body;

    if (!name || !email || !password || !role || !dealership) {
      return res.status(400).json({
        success: false,
        message: "All fields are required.",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters.",
      });
    }

    const allowedRoles = [
      "Manager",
      "Service Advisor",
      "Technician",
    ];

    if (!allowedRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user role.",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(dealership)) {
      return res.status(400).json({
        success: false,
        message: "Invalid dealership ID.",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const existingUser = await User.findOne({
      email: normalizedEmail,
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "A user with this email already exists.",
      });
    }

    const dealershipExists = await Dealership.findById(dealership);

    if (!dealershipExists) {
      return res.status(404).json({
        success: false,
        message: "Selected dealership does not exist.",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

   const user = await createUserWithLinkedTechnician({
  name: name.trim(),
  email: normalizedEmail,
  password: hashedPassword,
  role,
  dealership,
});

    const createdUser = await User.findById(user._id)
      .select("-password")
      .populate("dealership", "name dealershipCode location");

    return res.status(201).json({
      success: true,
      message: "User created successfully.",
      data: createdUser,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "A user with this email already exists.",
      });
    }

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  register,
  login,
  getUsers,
  createManagedUser,
};
