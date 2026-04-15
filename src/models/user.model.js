import mongoose, { model, Schema } from "mongoose";
import jwt from "jsonwebtoken";

import bcrypt from "bcrypt";
import { config } from "../config/config.js";
import aggregatePaginate from "mongoose-aggregate-paginate-v2";

const userSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
    },

    avatar: {
      type: String,
    },

    stream: {
      type: String,
      enum: ["Btech", "Bca", "Mca", "Others"],
      default: "Others",
    },

    branch: {
      type: String,
      enum: [
        "CSE",
        "IT",
        "Mechanical",
        "Electrical",
        "ECE",
        "Food Technology",
        "Others",
      ],
      default: "Others",
    },

    year: {
      type: String,
      enum: ["1st year", "2nd year", "3rd year", "4th year"],
      default: "1st year",
    },

    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },

    password: {
      type: String,
      required: [true, "Password is required"],
      minLength: [8, "Password must be at least 8 characters long"],
      maxLength: [16, "Password cannot exceed 16 characters"],
      validate: {
        validator: function (value) {
          return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/.test(
            value,
          );
        },
        message:
          "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character.",
      },
    },

    verifyToken: {
      type: String,
      maxLength: 6,
      minLength: 6,
    },

    verifyTokenExpiry: {
      type: Date,
    },

    refreshToken: {
      type: String,
    },

    availabilityTime: {
      type: String,
    },

    role: {
      type: String,
      enum: ["admin", "user"],
      default: "user",
    },

    isVerified: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true },
);

userSchema.pre("save", async function () {
  if (!this.isModified("password")) return;
  this.password = await bcrypt.hash(this.password, 10);
});

userSchema.methods.isPasswordCorrect = async function (password) {
  return await bcrypt.compare(password, this.password);
};

userSchema.methods.generateAccessToken = function () {
  return jwt.sign(
    {
      _id: this._id,
      name: this.name,
      email: this.email,
    },
    config.ACCESS_TOKEN_SECRET,
    { expiresIn: config.ACCESS_TOKEN_EXPIRY },
  );
};

userSchema.methods.generateRefreshToken = function () {
  return jwt.sign(
    {
      _id: this._id,
    },
    config.REFRESH_TOKEN_SECRET,
    { expiresIn: config.REFRESH_TOKEN_EXPIRY },
  );
};
userSchema.plugin(aggregatePaginate);
export const User = model("User", userSchema);
