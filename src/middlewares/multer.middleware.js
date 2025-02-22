import multer from "multer";
import fs from "fs";

const storage = multer.diskStorage({
	destination: (req, file, cb) => {
		// Set the destination for multer to save the file
		let path = `./uploads/${file.fieldname}`;
		if (!fs.existsSync(path)) {
			fs.mkdirSync(path);
		}

		cb(null, path);
	},
	filename: (req, file, cb) => {
		// Use the original filename
		cb(null, file.originalname);
	},
});

export const upload = multer({ storage });
