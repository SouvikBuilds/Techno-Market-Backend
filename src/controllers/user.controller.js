import { User } from "../models/user.model.js";
import { config } from "../config/config.js";
import { nanoid } from "nanoid";
import jwt from "jsonwebtoken";

import {
  ApiResponse,
  asyncHandler,
  ApiError,
  uploadOnCloudinary,
  deleteFromCloudinary,
} from "../utils/index.js";

import { sendVerifyEmail } from "../services/mailer.service.js";

const registerUser = asyncHandler(async (req, res) => {
  try {
    const { name, email, password, stream, branch, year } = req.body;

    if (
      [name, email, password].some((field) => !field || field.trim() === "")
    ) {
      throw new ApiError(400, "Required fields are missing");
    }

    const existingUser = await User.findOne({
      email: email.trim().toLowerCase(),
    });
    if (existingUser) {
      throw new ApiError(400, "User already exists");
    }

    const avatarLocalPath = req.file?.path;

    let avatar;
    if (avatarLocalPath) {
      avatar = await uploadOnCloudinary(avatarLocalPath);
    }

    const verifyToken = nanoid(6);
    const verifyTokenExpiry = new Date(Date.now() + 10 * 60 * 1000);

    const user = await User.create({
      name,
      email,
      password,
      stream,
      branch,
      year,
      avatar: avatar?.secure_url || null,
      verifyToken,
      verifyTokenExpiry,
      isVerified: false,
    });

    const subject = "Verify your email - Techno Market";

    const html = `
        <h2>Email Verification</h2>
        <p>Your verification code is:</p>
        <h1>${verifyToken}</h1>
        <p>This code will expire in 10 minutes.</p>
        `;

    try {
      await sendVerifyEmail(user.email, subject, html);
    } catch (error) {
      console.log("Error while sending email: ", error);
    }

    const createdUser = await User.findById(user?._id).select(
      "-password -refreshToken -verifyToken -verifyTokenExpiry",
    );

    return res
      .status(201)
      .json(
        new ApiResponse(201, createdUser, "New User Registered successfully"),
      );
  } catch (error) {
    console.log("Error while registering user: ", error);
    throw new ApiError(
      error.statusCode || 500,
      error.message || "Something went wrong while registering user",
    );
  }
});

const generateAccessandRefreshToken = async (userId) => {
  try {
    const user = await User.findById(userId);
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();
    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });
    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(
      500,
      "Something went wrong while generating refresh and access tokens",
    );
  }
};

const resendVerifyEmail = asyncHandler(async (req, res) => {
  try {
    const { email } = req.body;
    if (!email || email.trim().length == 0) {
      console.log("Email is missing");
      throw new ApiError(400, "Email is required");
    }
    const user = await User.findOne({ email: email.trim().toLowerCase() });
    if (!user) {
      console.log("User with this email not found");
      throw new ApiError(404, "User with this email doesn't exist");
    }

    if (user.isVerified) {
      console.log("User is already verified");
      throw new ApiError(400, "User is already verified");
    }

    if (
      user.verifyTokenExpiry &&
      user.verifyTokenExpiry.getTime() - Date.now() > 9 * 60 * 1000
    ) {
      throw new ApiError(429, "Please wait before requesting a new code");
    }

    const verifyToken = nanoid(6);
    const verifyTokenExpiry = new Date(Date.now() + 10 * 60 * 1000);

    user.verifyToken = verifyToken;
    user.verifyTokenExpiry = verifyTokenExpiry;

    await user.save({ validateBeforeSave: false });

    const subject = "Resend Verification Code - Techno Market";
    const html = ` <h2>Email Verification</h2> <p>Your new verification code is:</p> <h1>${verifyToken}</h1> <p>This code will expire in 10 minutes.</p> `;

    try {
      await sendVerifyEmail(user.email, subject, html);
    } catch (error) {
      console.log("Email resend failed: ", error.message);
    }

    return res
      .status(200)
      .json(new ApiResponse(200, {}, "Verification email resent successfully"));
  } catch (error) {
    console.log("Error while resending verification email: ", error);
    throw new ApiError(
      error.statusCode || 500,
      error.message || "Error while resending verification email",
    );
  }
});

const verifyUser = asyncHandler(async (req, res) => {
  try {
    const { email, verifyToken } = req.body;
    if (
      !email ||
      !verifyToken ||
      email.trim().length == 0 ||
      verifyToken.trim().length == 0
    ) {
      console.log("required data missing");
      throw new ApiError(400, "Email and verify token are required");
    }

    const user = await User.findOne({ email: email.trim().toLowerCase() });
    if (!user) {
      console.log("User with this email doesn't exist");
      throw new ApiError(404, "User with this email doesn't exist");
    }
    if (user.isVerified) {
      throw new ApiError(400, "User is already verified");
    }
    if (!user.verifyTokenExpiry || user.verifyTokenExpiry < Date.now()) {
      console.log("Verify code has expired. Please request a new one.");
      throw new ApiError(
        400,
        "Verify code has expired. Please request a new one.",
      );
    }
    if (user.verifyToken !== verifyToken) {
      console.log("Verify token is incorrect.");
      throw new ApiError(400, "Verify code is incorrect.");
    }

    user.isVerified = true;
    user.verifyToken = null;
    user.verifyTokenExpiry = null;
    await user.save({ validateBeforeSave: false });
    return res
      .status(200)
      .json(new ApiResponse(200, {}, "User is verified successfully"));
  } catch (error) {
    console.log("Error while verifying user", error);
    throw new ApiError(
      error.statusCode || 500,
      error.message || "Something went wrong while verifying user",
    );
  }
});

const loginUser = asyncHandler(async (req, res) => {
  try {
    const { email, password } = req.body;
    if (
      !email ||
      !password ||
      email.trim().length == 0 ||
      password.trim().length == 0
    ) {
      console.log("Email and password are required");
      throw new ApiError(400, "Email and password are required");
    }

    const user = await User.findOne({ email: email.trim().toLowerCase() });
    if (!user) {
      console.log("User with this email id doesn't exist");
      throw new ApiError(404, "User with this email id doesn't exist");
    }
    if (!user.isVerified) {
      console.log("User is not verified, pleasy verify before");
      throw new ApiError(400, "Please verify your email before login");
    }
    const isPasswordCorrect = await user.isPasswordCorrect(password);
    if (!isPasswordCorrect) {
      console.log("Invalid credential");
      throw new ApiError(401, "Invalid credentials");
    }

    const { accessToken, refreshToken } = await generateAccessandRefreshToken(
      user?._id,
    );

    const options = {
      httpOnly: true,
      secure: config.NODE_ENV === "production",
    };

    const loggedInUser = await User.findById(user?._id).select(
      "-password -verifyToken -refreshToken -verifyTokenExpiry",
    );

    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", refreshToken, options)
      .json(
        new ApiResponse(
          200,
          {
            user: loggedInUser,
            accessToken,
            refreshToken,
          },
          "User Logged In Successfully",
        ),
      );
  } catch (error) {
    console.log("Error while logging in user: ", error);
    throw new ApiError(
      error.statusCode || 500,
      error.message || "Something went wrong while logging in user",
    );
  }
});

const updateUser = asyncHandler(async (req, res) => {
  try {
    const { name, year, stream, branch } = req.body;
    if (
      [name, year, stream, branch].every(
        (field) => !field || field.trim() === "",
      )
    ) {
      throw new ApiError(400, "At least one field is required");
    }
    const updatedFields = {};
    if (name && name.trim() !== "") updatedFields.name = name.trim();
    if (year && year.trim() !== "") updatedFields.year = year.trim();
    if (stream && stream.trim() !== "") updatedFields.stream = stream.trim();
    if (branch && branch.trim() !== "") updatedFields.branch = branch.trim();
    const updatedUser = await User.findByIdAndUpdate(
      req.user?._id,
      {
        $set: updatedFields,
      },
      { new: true, runValidators: true },
    ).select("-password -refreshToken -verifyToken -verifyTokenExpiry");
    if (!updatedUser) {
      console.log("User not found");
      throw new ApiError(404, "User not found");
    }
    return res
      .status(201)
      .json(new ApiResponse(201, updatedUser, "User updated successfully"));
  } catch (error) {
    console.log("Error while updating user: ", error);
    throw new ApiError(
      error.statusCode || 500,
      error.message || "Something went wrong while updating user",
    );
  }
});

const getCurrentUser = asyncHandler(async (req, res) => {
  try {
    return res
      .status(200)
      .json(
        new ApiResponse(200, req.user, "Current User fetched successfully"),
      );
  } catch (error) {
    console.log("Error while getting current user: ", error);
    throw new ApiError(
      error.statusCode || 500,
      error.message || "Something went wrong while getting current user",
    );
  }
});

const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken =
    req.cookies.refreshToken || req.body.refreshToken;
  if (!incomingRefreshToken) {
    throw new ApiError(401, "Unauthorized request");
  }
  try {
    const decodedToken = jwt.verify(
      incomingRefreshToken,
      config.REFRESH_TOKEN_SECRET,
    );

    const user = await User.findById(decodedToken?._id);
    if (!user) {
      throw new ApiError(401, "Invalid Refresh Token");
    }

    if (incomingRefreshToken !== user?.refreshToken) {
      throw new ApiError(401, "Refresh Token is Expired or used");
    }

    const options = {
      httpOnly: true,
      secure: config.NODE_ENV === "production",
    };
    const { accessToken, refreshToken: newRefreshToken } =
      await generateAccessandRefreshToken(user._id);

    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", newRefreshToken, options)
      .json(
        new ApiResponse(
          200,
          { accessToken, refreshToken: newRefreshToken },
          "Access Token refreshed",
        ),
      );
  } catch (error) {
    console.log("Invalid Refresh Token");
    throw new ApiError(401, error?.message || "Invalid Refresh Token");
  }
});

const logOutUser = asyncHandler(async (req, res) => {
  try {
    if (!req.user || !req.user?._id) {
      throw new ApiError(401, "User not authenticated");
    }
    await User.findByIdAndUpdate(
      req.user?._id,
      {
        $unset: { refreshToken: 1 },
      },
      { new: true },
    );

    const options = {
      httpOnly: true,
      secure: config.NODE_ENV === "production",
    };

    return res
      .status(200)
      .clearCookie("accessToken", options)
      .clearCookie("refreshToken", options)
      .json(new ApiResponse(200, {}, "User loggedout successfully"));
  } catch (error) {
    console.log("Error while logout user: ", error);
    throw new ApiError(
      error.statusCode || 500,
      error.message || "Something went wrong",
    );
  }
});

const updateProfilePicture = asyncHandler(async (req, res) => {
  try {
    const user = await User.findById(req.user?._id);
    if (user.avatar) {
      await deleteFromCloudinary(user.avatar);
    }

    const avatarLocalPath = req.file?.path;
    if (!avatarLocalPath) {
      throw new ApiError(400, "Profile picture is required");
    }
    const newAvatar = await uploadOnCloudinary(avatarLocalPath);

    const response = await User.findByIdAndUpdate(
      req.user?._id,
      {
        $set: {
          avatar: newAvatar?.secure_url,
        },
      },
      { new: true, runValidators: true },
    ).select("-password -refreshToken -verifyToken -verifyTokenExpiry");
    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          { response },
          "Profile picture updated successfully",
        ),
      );
  } catch (error) {
    console.log("Error while updating profile picture: ", error);
    throw new ApiError(
      error.statusCode || 500,
      error.message || "Something went wrong while updating profile picture",
    );
  }
});

const changeCurrentPassword = asyncHandler(async (req, res) => {
  try {
    const { password, newPassword } = req.body;
    if (
      !password ||
      !newPassword ||
      password.trim().length === 0 ||
      newPassword.trim().length === 0
    ) {
      console.log("Required fields are missing");
      throw new ApiError(400, "Required fields are missing");
    }
    const user = await User.findById(req.user?._id);

    if (!user) {
      throw new ApiError(404, "User not found");
    }

    if (!(await user.isPasswordCorrect(password))) {
      console.log("Enter Correct password");
      throw new ApiError(400, "Enter correct password");
    }

    user.password = newPassword.trim();
    await user.save();

    return res
      .status(200)
      .json(new ApiResponse(200, {}, "Password changed successfully"));
  } catch (error) {
    console.log("Error while changing password: ", error);
    throw new ApiError(
      error?.statusCode || 500,
      error?.message || "Something went wrong while changing password",
    );
  }
});

const deleteUser = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;
    const userToDelete = await User.findById(id);

    if (!userToDelete) {
      console.log("User not found");
      throw new ApiError(404, "User not found");
    }

    await User.findByIdAndDelete(id);
    return res
      .status(200)
      .json(new ApiResponse(200, {}, "User deleted successfully"));
  } catch (error) {
    console.log("Error while deleting user: ", error);
    throw new ApiError(
      error.statusCode || 500,
      error.message || "Something went wrong while deleting user",
    );
  }
});

const updateUserRole = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;
    if (!["admin", "user"].includes(role)) {
      console.log("Invalid role");
      throw new ApiError(400, "Invalid role");
    }

    const updatedUser = await User.findByIdAndUpdate(
      id,
      { $set: { role } },
      { new: true, runValidators: true },
    ).select("-password -refreshToken -verifyToken -verifyTokenExpiry");

    if (!updatedUser) {
      console.log("User not found");
      throw new ApiError(404, "User not found");
    }

    return res
      .status(200)
      .json(
        new ApiResponse(200, updatedUser, "User role updated successfully"),
      );
  } catch (error) {
    console.log("Error while updating user role: ", error);
    throw new ApiError(
      error.statusCode || 500,
      error.message || "Something went wrong while updating user's role",
    );
  }
});

export {
  registerUser,
  generateAccessandRefreshToken,
  resendVerifyEmail,
  verifyUser,
  loginUser,
  updateUser,
  getCurrentUser,
  refreshAccessToken,
  logOutUser,
  updateProfilePicture,
  changeCurrentPassword,
  deleteUser,
  updateUserRole,
};
