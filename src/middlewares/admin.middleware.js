import { ApiError } from "../utils/index.js";

export const isAdmin = async (req, res, next) => {
  if (!req.user) {
    throw new ApiError(401, "Unauthorised");
  }

  if (req.user.role !== "admin") {
    throw new ApiError(403, "Forbidden: Admin access required");
  }

  next();
};
