import dotenv from "dotenv";
dotenv.config();

import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

cloudinary.config({
	cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
	api_key: process.env.CLOUDINARY_API_KEY,
	api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadOnCloudinary = async (localFilePath) => {
	if (!localFilePath) {
		console.error("uploadOnCloudinary: No file path provided");
		return null;
	}
	try {
		// Upload the file to Cloudinary
		const response = await cloudinary.uploader.upload(localFilePath, {
			resource_type: "auto",
		});

		console.log("File uploaded successfully on cloudinary:", response);

		// Remove the locally stored file after a successful upload
		if (fs.existsSync(localFilePath)) {
			fs.unlinkSync(localFilePath);
		}

		return response;
	} catch (error) {
		console.error("Cloudinary upload error:", error.message);

		// Remove the local file only if it exists
		if (fs.existsSync(localFilePath)) {
			fs.unlinkSync(localFilePath);
		}

		return null;
	}
};

const deleteFromCloudinary = async (assestPublicId) => {
	try {
		if (!assestPublicId) {
			console.error("deleteFromCloudinary: Public ID of asset Not Found");
			return null;
		}
		const response = await cloudinary.uploader.destroy(assestPublicId);

		console.log("File Deleted successfully:", response);
	} catch (error) {
		console.error("Cloudinary Delete error:", error.message);
	}
};

export { uploadOnCloudinary, deleteFromCloudinary };
