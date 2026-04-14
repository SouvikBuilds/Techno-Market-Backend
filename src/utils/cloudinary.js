import { config } from "../config/config.js";
import { v2 as cloudinary } from "cloudinary";
import fs from "fs";
import { extractPublicId } from "cloudinary-build-url";

cloudinary.config({
  cloud_name: config.CLOUDINARY_CLOUD_NAME,
  api_key: config.CLOUDINARY_API_KEY,
  api_secret: config.CLOUDINARY_CLOUD_SECRET,
});

export const uploadOnCloudinary = async (localFilePath) => {
  try {
    if (!localFilePath) {
      console.log("File path not provided");
      return null;
    }
    const result = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "auto",
    });

    fs.unlinkSync(localFilePath);

    return result;
  } catch (error) {
    console.log("Error uploading on cloudinary: ", error);
    return null;
  }
};

export const deleteFromCloudinary = async (fileUrl) => {
  try {
    if (!fileUrl) {
      console.log("File Url not provided");
      return null;
    }

    const publicId = extractPublicId(fileUrl);
    const result = await cloudinary.uploader.destroy(publicId, {
      resource_type: "auto",
    });
    return result;
  } catch (error) {
    console.log("Error deleting file from cloudinary", error);
    return null;
  }
};
