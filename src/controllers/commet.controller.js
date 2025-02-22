import { asyncErrorHandler, throwError } from "../utils/asyncErrorHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Comment } from "../models/comments.model.js";
import mongoose from "mongoose";

const addComment = asyncErrorHandler(async (req, res) => {
	const { content, video, owner } = req.body;

	if (!content || !video || !owner) {
		throw new ApiError(400, "fields are required");
	}

	const comment = await Comment.create({
		content,
		video,
		owner,
	});

	if (!comment) {
		throw new ApiError(500, "Server Error while commenting");
	}

	return res
		.status(200)
		.json(new ApiResponse(200, comment, "Comment Added successfull"));
});

const getVideoComments = asyncErrorHandler(async (req, res) => {
	const { videoId } = req.params;
	const { page = 1, limit = 10 } = req.query;

	if (!videoId) {
		throw new ApiError(400, "video Id is required");
	}

	if (!page || !limit) {
		throw new ApiError(400, "page limit is required");
	}

	const getCommentPipeline = [
		{
			$match: { video: new mongoose.Types.ObjectId(videoId) }, // Match 'video' field, not 'videoId'
		},
		{
			$sort: { createdAt: -1 }, // Sort by newest comments first
		},
	];

	const option = {
		page: parseInt(page),
		limit: parseInt(limit),
	};

	const getComments = await Comment.aggregate(getCommentPipeline, option);

	if (!getComments) {
		throw new ApiError(500, "Server Error getting video comments");
	}

	return res
		.status(200)
		.json(new ApiResponse(200, getComments, "Comments Fetched Successfully"));
});

const updateComment = asyncErrorHandler(async (req, res) => {
	const { content, id } = req.body;

	if (!content || !id) {
		throw new ApiError(400, "comment & id is required");
	}

	const updateComment = await Comment.findByIdAndUpdate(
		id,
		{
			$set: { content: content },
		},
		{ new: true }
	);

	if (!updateComment) {
		throw new ApiError(500, "Server Error updating comment");
	}

	return res
		.status(200)
		.json(new ApiResponse(200, updateComment, "Comment updated Successfully"));
});

const deleteComment = asyncErrorHandler(async (req, res) => {
	const { comment_id } = req.params;

	if (!comment_id) {
		throw new ApiError(400, "comment id is required");
	}

	const comment = await Comment.findByIdAndDelete(comment_id);

	if (!comment) {
		throw new ApiError(500, "Server Error while deleting comment");
	}

	return res
		.status(200)
		.json(new ApiResponse(200, comment, "Comment deleted Successfully"));
});

export { addComment, getVideoComments, updateComment, deleteComment };
