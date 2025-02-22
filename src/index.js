import dotenv from "dotenv";
import { connectDB } from "./db/connection.js";
import app from "./app.js";

// .env config
dotenv.config();

// connect DB
connectDB()
	.then(() => {
		app.listen(process.env.PORT, () => {
			console.log(`⚙️      Server is running at port : ${process.env.PORT}`);
		});
	})
	.catch((error) => {
		console.log(error);
	});
