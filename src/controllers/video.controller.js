import { asyncErrorHandler } from "../utils/asyncErrorHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import {
	deleteFromCloudinary,
	uploadOnCloudinary,
} from "../utils/cloudinary.js";
import { Video } from "../models/video.model.js";

const uploadVideo = asyncErrorHandler(async (req, res) => {
	// take title, description, isPublished + video and thumbnail files
	// calculate views count -- cant think

	const { title, description, isPublished } = req.body;

	if (!title) {
		throw new ApiError(400, "Title is required");
	}

	let videoServerPath = null;
	let thumbnailServerPath = null;

	if (!req.files) {
		throw new ApiError(400, "Video and Thumbnail is required");
	}

	if (!req.files.video) {
		throw new ApiError(400, "Video is required");
	}

	if (!req.files.thumbnail) {
		throw new ApiError(400, "Thumbnail is required");
	}

	try {
		videoServerPath = req.files?.video[0]?.path;
		thumbnailServerPath = req.files?.thumbnail[0]?.path;
	} catch (error) {
		throw new ApiError(500, "Error uploading File on Sever");
	}

	let videoFile = null;
	let thumbnail = null;

	try {
		videoFile = await uploadOnCloudinary(videoServerPath);
		thumbnail = await uploadOnCloudinary(thumbnailServerPath);
	} catch (error) {
		throw new ApiError(500, "Error uploading File on s3 Bucket");
	}

	const video = await Video.create({
		title,
		description: description || "",
		isPublished,
		owner: req.user?._id,
		videoFile: videoFile?.url || "",
		thumbnail: thumbnail?.url || "",
		duration: videoFile?.duration,
	});

	if (!video) {
		throw new ApiError(500, "Error Uploading Video");
	}

	return res
		.status(200)
		.json(new ApiResponse(200, video, "Video Uploaded Successfully"));
});

const getVideoById = asyncErrorHandler(async (req, res) => {
	const { videoId } = req.params;

	if (!videoId) {
		throw new ApiError(400, "videoId is required");
	}

	const video = await Video.findById(videoId);

	if (!video) {
		throw new ApiError(404, "Video Not Found");
	}

	return res.status(200).json(new ApiResponse(200, video, "Video Found"));
});

const getUserVideosById = asyncErrorHandler(async (req, res) => {
	const { userId } = req.params;

	if (!userId) {
		throw new ApiError(400, "videoId is required");
	}

	const video = await Video.find({
		owner: userId,
	});

	if (!video) {
		throw new ApiError(404, "Video Not Found");
	}

	return res.status(200).json(new ApiResponse(200, video, "Video Found"));
});

const getVideoByTitle = asyncErrorHandler(async (req, res) => {
	const { title } = req.query;

	if (!title) {
		throw new ApiError(400, "Provide Video title details");
	}

	const searchedVideo = await Video.find({
		title: { $regex: title, $options: "i" },
	});

	if (!searchedVideo.length) {
		throw new ApiError(404, "No result with this title");
	}

	return res
		.status(200)
		.json(
			new ApiResponse(200, searchedVideo, "Searched video fetched Successfully")
		);
});

const updateVideoDetails = asyncErrorHandler(async (req, res) => {
	const { title, description = "", _id } = req.body;

	if (!title || !description) {
		throw new ApiError(400, "title or description is required");
	}

	const updateVideoDetail = await Video.findByIdAndUpdate(
		_id,
		{
			$set: {
				title,
				description,
			},
		},
		{ new: true }
	);

	if (!updateVideoDetail) {
		throw new ApiError(500, "Server Error updating details");
	}

	console.log("updateVideoDetail", updateVideoDetail);

	return res
		.status(200)
		.json(
			new ApiResponse(
				200,
				updateVideoDetail,
				"Video Details Update Successfully"
			)
		);
});

const updateThumbnail = asyncErrorHandler(async (req, res) => {
	const { _id, thumbnail_url } = req.body;

	if (!_id || !thumbnail_url) {
		throw new ApiError(400, "Video id or thumbnail_url is required");
	}

	const thumbnailServerPath = req.file;

	if (!thumbnailServerPath || thumbnailServerPath?.fieldname !== "thumbnail") {
		throw new ApiError(400, "Thumbnail is Required");
	}

	const thumbnail = await uploadOnCloudinary(thumbnailServerPath?.path);

	if (!thumbnail?.url) {
		throw new ApiError(500, "Error uploading thumbnail on s3 bucket");
	}

	const updatedThumbnail = await Video.findByIdAndUpdate(
		_id,
		{
			$set: { thumbnail: thumbnail?.url },
		},
		{ new: true }
	);

	if (!updatedThumbnail) {
		throw new ApiError(500, "Error updating thumbnail");
	}

	try {
		const previousThumbnailPublicId = thumbnail_url
			.split("/")
			.pop()
			.split(".")[0];
		await deleteFromCloudinary(previousThumbnailPublicId);
	} catch (error) {
		console.log("Error deleting previous thumbnail", error);
	}

	return res
		.status(200)
		.json(new ApiResponse(200, updatedThumbnail, "Thumbnail Updated"));
});

const videoViewIncrement = asyncErrorHandler(async (req, res) => {
	const { videoId } = req.body;

	if (!videoId) {
		throw new ApiError(400, "videoId is required");
	}

	const updateViewCount = await Video.findByIdAndUpdate(
		videoId,
		{
			$inc: {
				views: 1,
			},
		},
		{ new: true }
	).select(
		"-videoFile -thumbnail -duration -isPublished -owner -title -description"
	);

	if (!updateViewCount) {
		throw new ApiError(500, "Error updating view count");
	}

	return res
		.status(200)
		.json(new ApiResponse(200, updateViewCount, "View Count Updated"));
});

const getAllVideos = asyncErrorHandler(async (req, res) => {
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

	const pipelineForGettingVideo = [
		{
			$sort: {
				[sortBy]: sortType === "asc" ? 1 : -1,
			},
		},
		{
			$lookup: {
				from: "users",
				localField: "owner",
				foreignField: "_id",
				as: "owner",
			},
		},
		{
			$unwind: {
				path: "$owner",
				preserveNullAndEmptyArrays: true, // Handle cases where no owner exists
			},
		},
		{
			$project: {
				title: 1,
				description: 1,
				thumbnail: 1,
				videoFile: 1,
				views: 1,
				duration: 1,
				createdAt: 1,
				username: "$owner.username",
				fullname: "$owner.fullname",
				avatar: "$owner.avatar",
			},
		},
		{
			$facet: {
				data: [{ $skip: (pageNumber - 1) * pageSize }, { $limit: pageSize }],
				totalCount: [{ $count: "count" }],
			},
		},
	];

	const result = await Video.aggregate(pipelineForGettingVideo);

	if (!result || result.length === 0) {
		throw new ApiError(500, "Server Error while fetching videos");
	}

	const allVideo = result[0].data;
	const totalCount = result[0].totalCount[0]?.count || 0;
	const totalPages = Math.ceil(totalCount / pageSize);

	return res
		.status(200)
		.json(
			new ApiResponse(
				200,
				{ allVideo, totalCount, totalPages, currentPage: pageNumber },
				"Videos fetched successfully"
			)
		);
});

const deleteVideo = asyncErrorHandler(async (req, res) => {
	const { videoId } = req.params;

	if (!videoId) {
		throw new ApiError(400, "Video id is required");
	}

	const video = await Video.findByIdAndDelete(videoId);

	if (!video) {
		throw new ApiError(500, "Server Error while deleting video");
	}

	return res.status(200).json(200, video, "Video Deleted Successfully");
});

const togglePublishStatus = asyncErrorHandler(async (req, res) => {
	const { videoId } = req.params;

	if (!videoId) {
		throw new ApiError(400, "Video id is required");
	}

	const video = await Video.findById(videoId);

	if (!video) {
		throw new ApiError(500, "Server Error while toggling video");
	}

	const updateVideoPublishStatus = await Video.findByIdAndUpdate(
		videoId,
		{
			$set: {
				isPublished: !video?.isPublished,
			},
		},
		{ new: true }
	);

	if (!updateVideoPublishStatus) {
		throw new ApiError(500, "Server Error While while toggling publish");
	}

	const message =
		(await video?.isPublished) === "true"
			? "Video Publish Successfully"
			: "Video Un-Publish Successfully";

	return res.status(200).json(new ApiResponse(200, video, message));
});

export {
	uploadVideo,
	getVideoById,
	updateVideoDetails,
	updateThumbnail,
	videoViewIncrement,
	getVideoByTitle,
	deleteVideo,
	togglePublishStatus,
	getAllVideos,
	getUserVideosById,
};
