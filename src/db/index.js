import { config } from "../config/config.js";
import mongoose from "mongoose";

export const connectDB = async () => {
  try {
    const connectionInstance = await mongoose.connect(
      `${config.MONGODB_URI}/${config.DB_NAME}`,
    );

    console.log(
      "DB Connected Successfully. Connection Host: ",
      connectionInstance.connection.host,
    );
  } catch (error) {
    console.log("DB Connection error: ", error);
    process.exit(1);
  }
};
