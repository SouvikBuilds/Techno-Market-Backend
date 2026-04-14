import { asyncHandler } from "../utils/index.js";
import jwt from "jsonwebtoken";
import { User } from "../models/user.model.js";
import { config } from "../config/config.js";

export const verifyJWT = asyncHandler(async (req, res, next) => {
  try {
    const token =
      req.cookies?.accessToken ||
      req.header("Authorization")?.replace("Bearer ", "");

    if (!token) {
      return res.status(401).json({ message: "Unauthorized request" });
    }

    const decodedToken = jwt.verify(token, config.ACCESS_TOKEN_SECRET);

    const user = await User.findById(decodedToken?._id).select(
      "-password -refreshToken",
    );

    if (!user) {
      return res.status(401).json({ message: "Invalid Access Token" });
    }

    req.user = user;
    next();
  } catch (error) {
    console.log("Error in verifyJWT middleware: ", error);
    return res.status(401).json({ message: "Invalid access token" });
  }
});
