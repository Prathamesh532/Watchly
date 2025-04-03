import { asyncErrorHandler, throwError } from "../utils/asyncErrorHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Tweet } from "../models/tweets.model.js";
import mongoose from "mongoose";

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
	// const userTweets = await Tweet.find({ owner: req.user?._id });

	const userTweets = await Tweet.aggregate([
		{
			$match: {
				owner: new mongoose.Types.ObjectId(req.user?._id),
			},
		},
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
	]);

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

const getAllTweets = asyncErrorHandler(async (req, res) => {
	const {
		page = 1,
		limit = 10,
		sortBy = "createdAt",
		sortType = "asc",
	} = req.query;

	const pageNumber = parseInt(page, 10);
	const pageSize = parseInt(limit, 10);

	if (isNaN(pageNumber) || isNaN(pageSize)) {
		throw new ApiError(400, "Invalid pagination parameters");
	}

	const sortOrder = sortType === "asc" ? 1 : -1;

	// Fetch total count of tweets
	const totalCount = await Tweet.countDocuments();

	// Fetch paginated tweets with user details
	const allTweets = await Tweet.aggregate([
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
						},
					},
				],
			},
		},
		{
			$addFields: {
				owner: { $first: "$owner" },
			},
		},
		{
			$sort: { [sortBy]: sortOrder },
		},
		{
			$skip: (pageNumber - 1) * pageSize,
		},
		{
			$limit: pageSize,
		},
	]);

	if (!allTweets.length) {
		throw new ApiError(404, "No tweets found");
	}

	const totalPages = Math.ceil(totalCount / pageSize);

	return res
		.status(200)
		.json(
			new ApiResponse(
				200,
				{ allTweets, totalCount, totalPages, currentPage: pageNumber },
				"Tweets fetched successfully"
			)
		);
});

export { createTweet, getUserTweets, updateTweet, deleteTweet, getAllTweets };
