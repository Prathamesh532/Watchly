import mongoose from "mongoose";

const connectDB = async () => {
	try {
		const Connection_Instance = await mongoose.connect(
			`${process.env.MONGODB_URL}/${process.env.DB_NAME}`
		);
		console.log("DB connected:", Connection_Instance.connection.host);
	} catch (error) {
		if (error.name === "MongoNetworkError") {
			console.log("Network error connecting to MongoDB");
		} else if (error.name === "MongooseServerSelectionError") {
			console.log(
				"Server Selection Error, Ensure MongoDB is running and accessible"
			);
		} else console.log("An Unexpected Error:", error);

		process.exit(1);
	}
};

export { connectDB };
