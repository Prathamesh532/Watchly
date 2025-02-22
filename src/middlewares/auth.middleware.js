import User from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncErrorHandler } from "../utils/asyncErrorHandler.js";
import jwt from "jsonwebtoken";

export const verifyToken = asyncErrorHandler(async (req, _, next) => {
	try {
		const token =
			req.cookies?.accessToken ||
			req.header("Authorization").replace("Bearer ", "");

		if (!token) {
			throw new ApiError(400, "Token not Found");
		}

		const decode = await jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

		const user = await User.findById(decode._id).select(
			"-password -refreshToken"
		);

		if (!user) {
			throw new ApiError(400, "User is not Authorized");
		}

		req.user = user;

		next();
	} catch (error) {
		throw new ApiError(
			400,
			`Error Authorizing Token Or Token Not Found:  ${error}`
		);
	}
});
