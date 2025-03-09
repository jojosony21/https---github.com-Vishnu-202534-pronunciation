const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const cors = require("cors");
const multer = require("multer");
upload = multer({ dest: "uploads/" });
router.use(cors()); // Allow all origins

router.use(bodyParser.json());
router.use(express.json());

const path = require("path");
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/"); // Store images in "uploads" folder
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

upload = multer({ storage: storage });

const JWT_SECRET =
  "jsfhskjfhkfskhfh()ayikfjdpo.02243243252313133543[]]sdfijsjd";

require("../Schemas/UserDetails");

const User = mongoose.model("UserInfo");
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

//User Registration
router.post("/register", async (req, res) => {
  const { username, email, password, confirmPassword } = req.body;

  // Check if all required fields are provided
  if (!username || !email || !password || !confirmPassword) {
    return res
      .status(400)
      .send({ status: "error", data: "Fill all the fields" });
  }

  // Check if email is valid
  if (!emailRegex.test(email)) {
    return res
      .status(400)
      .send({ status: "error", data: "Invalid email address" });
  }

  // Check if password and confirmPassword match
  if (password !== confirmPassword) {
    return res
      .status(400)
      .send({ status: "error", data: "Passwords do not match" });
  }

  try {
    const oldUser = await User.findOne({ email: email });

    if (oldUser) {
      return res
        .status(409)
        .send({ status: "error", data: "User already exists" });
    }

    const encryptedPassword = await bcrypt.hash(password, 10);

    await User.create({
      username: username,
      email: email,
      password: encryptedPassword,
    });

    res.status(201).send({ status: "ok", data: "User Created" });
  } catch (error) {
    console.error("Error occurred during registration:", error);
    res.status(500).send({ status: "error", data: "Internal server error" });
  }
});

//UserLogin

router.post("/login-user", async (req, res) => {
  const { email, password } = req.body;

  // Check if username is valid
  if (!email) {
    return res
      .status(400)
      .send({ status: "error", data: "Username is required" });
  }

  try {
    const oldUser = await User.findOne({ email: email }); // Change to username lookup

    if (!oldUser) {
      return res
        .status(404)
        .send({ status: "error", data: "User doesn't exist" });
    }

    if (!password || !oldUser.password) {
      return res
        .status(400)
        .send({ status: "error", data: "Invalid password or user data" });
    }

    const isPasswordValid = await bcrypt.compare(password, oldUser.password);

    if (!isPasswordValid) {
      return res
        .status(401)
        .send({ status: "error", data: "Invalid password" });
    }

    const token = jwt.sign(
      { username: oldUser.username, email: oldUser.email },
      JWT_SECRET
    ); // Use username in the token payload

    res.status(200).send({ status: "ok", data: "Success", msg: token });
  } catch (error) {
    console.error("Error occurred during login:", error);
    res.status(500).send({ status: "error", data: "Internal server error" });
  }
});

//Forgot  Password

router.post("/forgotpass", async (req, res) => {
  try {
    const { email } = req.body;
    // Check if email is valid
    if (!emailRegex.test(email)) {
      return res
        .status(400)
        .send({ status: "error", data: "Invalid email address" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ error: "Email not found" });
    }

    const otp = Math.floor(100000 + Math.random() * 900000);

    user.resetPasswordOTP = otp;
    await user.save();

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: "abhinandmajor@gmail.com",
        pass: "havz wtxv osgk dvbd",
      },
    });

    const mailOptions = {
      from: "abhinandmajor@gmail.com",
      to: email,
      subject: "Password Reset OTP",
      html: `
                  <div style="background-color: #f5f5f5; padding: 20px; font-family: Arial, sans-serif;">
                      <h2 style="color: #333; font-weight: bold;">Password Reset OTP</h2>
                      <p style="font-size: 16px; color: #555;">Dear User,</p>
                      <p style="font-size: 16px; color: #555;">Your OTP for password reset is: <span style="color: #FFA500; font-weight: bold;">${otp}</span></p>
                      <p style="font-size: 14px; color: #777;">Please use this OTP to reset your password.</p>
                      <p style="font-size: 14px; color: #777;">If you did not request a password reset, please ignore this email.</p>
                  </div>
              `,
    };

    await transporter.sendMail(mailOptions);

    res.json({ message: "OTP sent to your email for password reset" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

//Reset Password

router.post("/resetpass", async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;
    // Check if email is valid
    if (!emailRegex.test(email)) {
      return res
        .status(400)
        .send({ status: "error", data: "Invalid email address" });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ error: "Email not found" });
    }

    if (user.resetPasswordOTP != otp) {
      return res.status(400).json({ error: "Invalid OTP" });
    }

    const encryptedPassword = await bcrypt.hash(newPassword, 10);

    user.password = encryptedPassword;
    user.resetPasswordOTP = null;
    await user.save();

    res.json({ message: "Password reset successful" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

//Unique user details
router.post("/userdata", async (req, res) => {
  const { token } = req.body;
  try {
    const user = jwt.verify(token, JWT_SECRET);
    const useremail = user.email;
    const name = user.username;
    console.log(useremail, name);

    if (User.findOne({ email: useremail })) {
      return res.send({ status: "ok", data: { name, useremail } });
    } else {
      return res.send({ stauts: "error", data: "user doesnot exits" });
    }
  } catch (err) {
    return res.send({ status: "error", data: "internal server error" });
  }
});
router.post("/change-password", async (req, res) => {
  const { email, currentPassword, newPassword } = req.body;

  try {
    // Find the user by email
    const user = await User.findOne({ email });

    // Check if the user exists
    if (!user) {
      return res
        .status(404)
        .json({ status: "error", message: "User not found" });
    }

    // Check if the current password matches the stored password
    const isPasswordValid = await bcrypt.compare(
      currentPassword,
      user.password
    );
    if (!isPasswordValid) {
      return res
        .status(401)
        .json({ status: "error", message: "Invalid current password" });
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update the user's password
    user.password = hashedPassword;
    await user.save();

    return res
      .status(200)
      .json({ status: "success", message: "Password updated successfully" });
  } catch (error) {
    console.error("Error changing password:", error);
    return res
      .status(500)
      .json({ status: "error", message: "Internal server error" });
  }
});
router.post(
  "/upload-profile-image",
  upload.single("image"),
  async (req, res) => {
    try {
      const { token } = req.body;
      const user = jwt.verify(token, "YOUR_SECRET_KEY");

      const imageUrl = `http://localhost:5000/uploads/${req.file.filename}`;

      await User.updateOne({ email: user.email }, { profileImage: imageUrl });

      res.json({ status: "ok", imageUrl });
    } catch (err) {
      res.status(500).json({ status: "error", data: "Upload failed" });
    }
  }
);
router.use("/uploads", express.static(path.join(__dirname, "uploads")));

router.post("/update-user", async (req, res) => {
  const { username, email } = req.body;
  const token = req.headers.authorization.split(" ")[1]; // Get token from header
  const decoded = jwt.verify(token, JWT_SECRET); // Verify the token

  try {
    const updatedUser = await User.findOneAndUpdate(
      { username: decoded.username }, // Find user by username (or ID)
      { username, email }, // Update username and email
      { new: true } // Return the updated document
    );

    if (!updatedUser) {
      return res.status(404).send({ status: "error", data: "User not found" });
    }

    res.status(200).send({ status: "ok", data: "User updated successfully" });
  } catch (error) {
    console.error("Error updating user:", error);
    res.status(500).send({ status: "error", data: "Internal server error" });
  }
});

module.exports = router;
