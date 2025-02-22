import { asyncErrorHandler, throwError } from "../utils/asyncErrorHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Like } from "../models/like.mode.js";

const toggleVideoLike = asyncErrorHandler(async (req, res) => {
	console.log("req.param", req.user);

	const { videoId } = req.params;

	if (!videoId) {
		throw new ApiError(400, "video id are required");
	}

	const alreadyLiked = await Like.findOne({
		video: videoId,
		likedBy: req.user?._id,
	});

	if (alreadyLiked) {
		await Like.findByIdAndDelete(alreadyLiked._id);
	}

	const like = await Like.create({
		video: videoId,
		likedBy: req.user?._id,
	});

	if (!like) {
		throw new ApiError(500, "Server Error while commenting on video");
	}

	return res
		.status(200)
		.json(new ApiResponse(200, like, "Comment Added successfull"));
});

const toggleCommentLike = asyncErrorHandler(async (req, res) => {
	const { commentId } = req.params;

	if (!commentId) {
		throw new ApiError(400, "comment id are required");
	}

	const alreadyLiked = await Like.findOne({
		comment: commentId,
		likedBy: req.user?.user._id,
	});

	if (alreadyLiked) {
		await Like.findByIdAndDelete(alreadyLiked._id);
	}

	const like = await Like.create({
		comment: commentId,
		likedBy: req.user?.user._id,
	});

	if (!like) {
		throw new ApiError(500, "Server Error while commenting on video comment");
	}

	return res
		.status(200)
		.json(new ApiResponse(200, like, "Comment Added successfull"));
});

const toggleTweetLike = asyncErrorHandler(async (req, res) => {
	const { tweetId } = req.params;

	if (!tweetId) {
		throw new ApiError(400, "tweet id are required");
	}

	const alreadyLiked = await Like.findOne({
		tweet: tweetId,
		likedBy: req.user?.user._id,
	});

	if (alreadyLiked) {
		await Like.findByIdAndDelete(alreadyLiked._id);
	}

	const like = await Like.create({
		tweet: tweetId,
		likedBy: req.user?.user._id,
	});

	if (!like) {
		throw new ApiError(500, "Server Error while commenting on tweet comment");
	}

	return res
		.status(200)
		.json(new ApiResponse(200, like, "Comment Added successfull"));
});

const getLikedVideos = asyncErrorHandler(async (req, res) => {
	const user = req.user?.user._id;

	if (!user) {
		throw new ApiError(400, "User is not authorized");
	}

	const likedVideos = await Like.find({
		likedBy: user._id,
	});

	if (!likedVideos?.length) {
		throw new ApiError(400, "No Liked videos found");
	}

	return res
		.status(200)
		.json(new ApiResponse(200, likedVideos, "Liked videos fetched"));
});

export { toggleVideoLike, toggleCommentLike, toggleTweetLike, getLikedVideos };
