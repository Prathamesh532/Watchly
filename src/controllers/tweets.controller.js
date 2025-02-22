import { asyncErrorHandler, throwError } from "../utils/asyncErrorHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Tweet } from "../models/tweets.model.js";

const createTweet = asyncErrorHandler(async (req, res) => {
	const { content, owner } = req.body;

	if (!content || !owner) {
		throw new ApiError(400, "content or user_id is required ");
	}

	const tweet = await Tweet.create({
		content,
		owner,
	});

	if (!tweet) {
		throw new ApiError(500, "Server Error creating tweet");
	}

	return res
		.status(200)
		.json(new ApiResponse(200, tweet, "Tweet post successfully"));
});

const getUserTweets = asyncErrorHandler(async (req, res) => {
	const userTweets = await Tweet.find({ owner: req.user?._id });

	if (!userTweets?.length) {
		throw new ApiError(400, "No tweets found");
	}

	return res
		.status(200)
		.json(new ApiResponse(200, userTweets, "Tweets fetched successfully"));
});

const updateTweet = asyncErrorHandler(async (req, res) => {
	const { content, id } = req.body;

	if (!content || !id) {
		throw new ApiError(400, "content or id is required");
	}

	const updatedTweet = await Tweet.findByIdAndUpdate(
		id,
		{
			$set: { content },
		},
		{ new: true }
	);

	if (!updatedTweet) {
		throw new ApiError(500, "Server Error updating tweet");
	}

	return res
		.status(200)
		.json(new ApiResponse(200, updatedTweet, "Tweet updated successfully"));
});

const deleteTweet = asyncErrorHandler(async (req, res) => {
	const { id } = req.params;

	if (!id) {
		throw new ApiError(400, "id is required");
	}

	const deletedTweet = await Tweet.findByIdAndDelete(id);

	if (!deletedTweet) {
		throw new ApiError(500, "Server Error deleting tweet");
	}

	return res
		.status(200)
		.json(new ApiResponse(200, deletedTweet, "Tweet deleted successfully"));
});

export { createTweet, getUserTweets, updateTweet, deleteTweet };
