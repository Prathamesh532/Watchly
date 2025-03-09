import {
	CustomError,
	throwError,
	asyncErrorHandler,
} from "../utils/asyncErrorHandler.js";
import User from "../models/user.model.js";
import {
	deleteFromCloudinary,
	uploadOnCloudinary,
} from "../utils/cloudinary.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";

const option = {
	httpOnly: true,
	secure: true,
};

const generateAccessTokenAndRefreshToken = async (user_id) => {
	try {
		const user = await User.findById(user_id);

		const accessToken = await user.generateAccessToken();
		const refreshToken = await user.generateRefreshToken();

		user.refreshToken = refreshToken;

		await user.save({ validateBeforeSave: false });

		return { accessToken, refreshToken };
	} catch (error) {
		console.log("error token", error);

		throwError(500, "Error Generating Acess or Refresh Token");
	}
};

const userResgister = asyncErrorHandler(async (req, res) => {
	if (!req.body) {
		throw new ApiError(400, "Bad Request, body is required");
	}

	const { fullname, email, username, password } = req.body;

	if (
		[username, fullname, email, password].some((field) => field?.trim() === "")
	) {
		throw new ApiError(400, "All fields are required");
	}

	const userExists = await User.exists({
		$or: [{ username }, { email }],
	});

	if (userExists) {
		throw new CustomError(
			409,
			`User with ${username} or ${email} is already registered.`
		);
	}

	// Create User
	const user = await User.create({
		username,
		fullname,
		email,
		password,
	});

	const userCreated = await User.findById(user._id).select(
		"-password -refreshToken"
	);

	if (!userCreated) {
		throw new CustomError(500, "Error creating user");
	}

	return res
		.status(201)
		.json(new ApiResponse(200, userCreated, "User registered successfully"));
});

const userAvatarCoverImageUpload = asyncErrorHandler(async (req, res) => {
	const { userId } = req.body;

	if (!userId) {
		throw new ApiError(400, "User id is required");
	}

	let avatarLocalPath = null;
	let coverImageLocalPath = null;

	if (!req.files || !req.files.avatar || req.files.avatar.length === 0) {
		throw new CustomError(400, "Avatar is required");
	}

	try {
		avatarLocalPath = req.files.avatar[0]?.path;
		coverImageLocalPath = req.files.coverImage?.[0]?.path;
	} catch (error) {
		console.error("File handling error:", error);
		throw new ApiError(500, "Error processing uploaded files");
	}

	// Upload to Cloudinary with Proper Error Handling
	let coverImage = null;

	let avatar = await uploadOnCloudinary(avatarLocalPath);
	if (coverImageLocalPath) {
		coverImage = await uploadOnCloudinary(coverImageLocalPath);
	}

	// Update User
	const user = await User.findByIdAndUpdate(
		userId,
		{
			avatar: avatar?.url,
			coverImage: coverImage?.url || "",
		},
		{ new: true }
	).select("-password -refreshToken");

	if (!user) {
		throw new CustomError(
			500,
			"Server Error while uploading user avatar or cover image"
		);
	}

	return res
		.status(200)
		.json(new ApiResponse(200, user, "User updated successfully"));
});

const userLogin = asyncErrorHandler(async (req, res) => {
	if (!req.body) {
		throw new ApiError(400, "Bad Request, body is required");
	}
	const { username, password } = req.body;

	if (!username) {
		throwError("username are required", 400);
	}

	let userExists = await User.findOne({ username });

	if (!userExists) {
		throwError(`User with ${username} is not register`, 400);
	}

	const isPasswordMatch = await userExists.isPasswordCorrect(password);

	if (!isPasswordMatch) {
		throwError(`Password or email is incorrect`, 400);
	}

	const { accessToken, refreshToken } =
		await generateAccessTokenAndRefreshToken(userExists._id);

	const loggedInUser = await User.findById(userExists._id).select(
		"-password -refreshToken"
	);

	res
		.status(200)
		.cookie("accessToken", accessToken, option)
		.cookie("refreshToken", refreshToken, option)
		.json(
			new ApiResponse(
				200,
				{
					userData: loggedInUser,
					accessToken,
					refreshToken,
				},
				"User is Login Successfully"
			)
		);
});

const logoutUser = asyncErrorHandler(async (req, res) => {
	await User.findByIdAndUpdate(
		req.user._id,
		{
			$unset: { refreshToken: 1 },
		},
		{ new: true }
	);

	const { accessToken, refreshToken } = req.cookies;

	res
		.status(200)
		.clearCookie("accessToken", accessToken, option)
		.clearCookie("refreshToken", refreshToken, option)
		.json(new ApiResponse(200, {}, "User is Logout Successfully"));
});

const refreshToken = asyncErrorHandler(async (req, res) => {
	try {
		const tokenFromUser = req.cookie?.refreshToken || req.body.refreshToken;

		if (!tokenFromUser) {
			throw new ApiError(400, "Token not found");
		}

		const decodedToken = jwt.verify(
			tokenFromUser,
			process.env.REFRESH_TOKEN_SECRET
		);

		if (!decodedToken) {
			throw new ApiError(401, "Invalid Token");
		}

		const user = await User.findById(decodedToken?._id);

		if (!user) {
			throw new ApiError(409, "Token invalid or Unauthorized Access");
		}

		const { accessToken, newRefreshToken } =
			await generateAccessTokenAndRefreshToken(user._id);

		res
			.status(200)
			.cookie("accessToken", accessToken, option)
			.cookie("refreshToken", newRefreshToken, option)
			.json(
				new ApiResponse(
					200,
					{ accessToken, newRefreshToken },
					"User Token Updated"
				)
			);
	} catch (error) {
		throw new ApiError(500, "Token invalid or Unauthorized Access");
	}
});

const changePassword = asyncErrorHandler(async (req, res) => {
	const { oldPassword, newPassword } = req.body;

	if (!oldPassword && !newPassword) {
		throw new ApiError(400, "Passwords are required");
	}

	const user = await User.findById(req.user?._id);

	if (!user) {
		throw new ApiError(400, "Invalid Acces");
	}

	const isOldPasswordCorrect = await user.isPasswordCorrect(oldPassword);

	if (!isOldPasswordCorrect) {
		throw new ApiError(400, "Old Password is Invalid");
	}

	user.password = newPassword;

	await user.save({ validateBeforeSave: false });

	return res
		.status(200)
		.json(new ApiResponse(200, {}, "Password Changed Successfully"));
});

const getUser = asyncErrorHandler(async (req, res) => {
	const user = await User.findById(req.user?._id).select(
		"-password -refreshToken"
	);

	if (!user) {
		throw new ApiError(400, "User Not Found");
	}

	res
		.status(200)
		.json(new ApiResponse(200, { userData: user }, "User Fetch Successfully"));
});

const updateUser = asyncErrorHandler(async (req, res) => {
	const { fullname, email } = req.body;

	if (!fullname || !email) {
		throw new ApiError(400, "Fullname and email is required");
	}

	const user = await User.findByIdAndUpdate(
		req.user?._id,
		{
			$set: { fullname, email },
		},
		{ new: true }
	).select("-password");

	return res
		.status(200)
		.json(new ApiResponse(200, user, "User details updated"));
});

const updateAvatar = asyncErrorHandler(async (req, res) => {
	try {
		const avatarLocalPath = req.file;

		if (!avatarLocalPath || avatarLocalPath.fieldname !== "avatar") {
			throw new ApiError(400, "File is Required");
		}

		const avatar = await uploadOnCloudinary(avatarLocalPath?.path);

		if (!avatar.url) {
			throw new ApiError(500, "Error in Uploading");
		}

		const user = await User.findByIdAndUpdate(
			req.user?._id,
			{
				$set: {
					avatar: avatar?.url,
				},
			},
			{ new: true }
		).select("-password");

		if (req.user?.avatar) {
			const previousUserAvatarPublicId = req.user?.avatar
				.split("/")
				.pop()
				.split(".")[0];
			await deleteFromCloudinary(previousUserAvatarPublicId);
		}

		return res.status(200).json(new ApiResponse(200, user, "Avator updated"));
	} catch (error) {
		throw new ApiError(500, `Error in Uploading Avatar: ${error?.message}`);
	}
});

const updateCoverImage = asyncErrorHandler(async (req, res) => {
	const coverImageLocalPath = req.file;

	if (!coverImageLocalPath || coverImageLocalPath.fieldname !== "coverImage") {
		throw new ApiError(400, "File is Required");
	}

	const coverImage = await uploadOnCloudinary(coverImageLocalPath?.path);

	if (!coverImage.url) {
		throw new ApiError(500, "Error in Uploading");
	}

	const user = await User.findByIdAndUpdate(
		req.user?._id,
		{
			$set: {
				coverImage: coverImage?.url,
			},
		},
		{ new: true }
	).select("-password");

	if (req.user?.coverImage) {
		const previousUserCoverImagePublicId = req.user?.coverImage
			.split("/")
			.pop()
			.split(".")[0];
		await deleteFromCloudinary(previousUserCoverImagePublicId);
	}

	return res.status(200).json(new ApiResponse(200, user, "CoverImage updated"));
});

const getUserChannelProfileData = asyncErrorHandler(async (req, res) => {
	// take the username and find user and add the aggregation pipeline
	// we need 3 things
	// 1 - my subscriber count (from subcribtion model using channel)
	// 2 - channel which i subscribed (from subcribtion model using subscriber )
	// 3 - is the particular channel i have subscribe or not

	const { username } = req.params;

	if (!username?.trim()) {
		throw new ApiError(400, "Username is required");
	}

	const userProfileData = await User.aggregate([
		{
			$match: {
				username: username,
			},
		},
		{
			$lookup: {
				from: "subscriptions",
				localField: "_id",
				foreignField: "channel",
				as: "userSubs",
			},
		},
		{
			$lookup: {
				from: "subscriptions",
				localField: "_id",
				foreignField: "subscriber",
				as: "SubsChanByUser",
			},
		},
		{
			$addFields: {
				userSubsCounts: {
					$size: "$userSubs",
				},
				userSubsTo: {
					$size: "$SubsChanByUser",
				},
				isChannelSubscribe: {
					$cond: {
						if: { $in: [req.user?._id, "$userSubs.subscriber"] },
						then: true,
						else: false,
					},
				},
			},
		},
		{
			$project: {
				fullname: 1,
				email: 1,
				username: 1,
				avatar: 1,
				coverImage: 1,
				userSubsCounts: 1,
				userSubsTo: 1,
				isChannelSubscribe: 1,
			},
		},
	]);

	if (!userProfileData?.length) {
		throw new ApiResponse(500, "User Profile Data is Not Found");
	}

	return res
		.status(200)
		.json(
			new ApiResponse(
				200,
				userProfileData[0],
				"User Profile Data Fetched Successfully"
			)
		);
});

const getUserWatchHistory = asyncErrorHandler(async (req, res) => {
	const userWatchHistory = await User.aggregate([
		{
			$match: {
				_id: new mongoose.Types.ObjectId(req.user?._id),
			},
		},
		{
			$lookup: {
				from: "videos",
				localField: "watchHistory",
				foreignField: "_id",
				as: "watchHistory",
				pipeline: [
					{
						$lookup: {
							from: "users",
							localField: "owner",
							foreignField: "_id",
							as: "owner",
							pipeline: [
								{
									$project: {
										fullname: 1,
										avatar: 1,
										username: 1,
									},
								},
							],
						},
					},
					{
						$addFields: {
							owner: {
								$first: "$owner",
							},
						},
					},
				],
			},
		},
	]);

	console.log("userWatchHistory", userWatchHistory);

	if (!userWatchHistory?.length)
		throw new ApiError(400, "User Watch History Not Found");

	return res
		.status(200)
		.json(
			new ApiResponse(
				200,
				userWatchHistory[0],
				"User Watch History Fetched Successfully"
			)
		);
});

const getUserById = asyncErrorHandler(async (req, res) => {
	const { userId } = req.params;

	if (!userId?.trim()) {
		throw new ApiError(400, "User Id is required");
	}

	const user = await User.findById(userId).select("-password -refreshToken -watchHistory");

	if (!user) {
		throw new ApiError(400, "User Not Found");
	}

	return res.status(200).json(new ApiResponse(200, user, "User Fetched"));
});

export {
	userResgister,
	userAvatarCoverImageUpload,
	userLogin,
	logoutUser,
	refreshToken,
	changePassword,
	getUser,
	updateUser,
	updateAvatar,
	updateCoverImage,
	getUserChannelProfileData,
	getUserWatchHistory,
	getUserById,
};
