import { asyncErrorHandler, throwError } from "../utils/asyncErrorHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Playlist } from "../models/playlists.model.js";
import mongoose from "mongoose";

const createPlaylist = asyncErrorHandler(async (req, res) => {
	const { name, description, videos } = req.body;

	if (!name || !description) {
		throw new ApiError(400, "Name & Description is required");
	}

	if (!videos.length) {
		throw new ApiError(400, "At least One Video is required");
	}

	const playlist = await Playlist.create({
		name,
		description,
		owner: req.user?._id,
		videos,
	});

	if (!playlist) {
		throw new ApiError(500, "Error Creating Playlist");
	}

	return res
		.status(200)
		.json(new ApiResponse(200, playlist, "Playlist is created Successfully"));
});

const updatePlaylistDetails = asyncErrorHandler(async (req, res) => {
	const { name = "", description = "", _id } = req.body;

	if (!name || !description) {
		throw new ApiError(400, "Name & Description is required");
	}

	const playlist = await Playlist.findByIdAndUpdate(
		_id,
		{
			$set: {
				name,
				description,
			},
		},
		{ new: true }
	);

	if (!playlist) {
		throw new ApiError(500, "Server Error Updating playlist");
	}

	return res
		.status(200)
		.json(new ApiResponse(200, playlist, "Playlist Updated"));
});

const getPlaylist = asyncErrorHandler(async (req, res) => {
	const { title } = req.query;

	if (!title) {
		throw new ApiError(400, "Please Provide playlist info");
	}

	const searchedPlaylist = await Playlist.find({
		name: { $regex: title, $options: "i" },
	});

	if (!searchedPlaylist?.length) {
		throw new ApiError(400, "Playlist with this info is not found");
	}

	return res
		.status(200)
		.json(
			new ApiResponse(200, searchedPlaylist, "Playlists fetched Successfully")
		);
});

const removePlaylist = asyncErrorHandler(async (req, res) => {
	const { _id } = req.body;

	if (!_id) {
		throw new ApiError(400, "Playlist id is required");
	}

	const playlist = await Playlist.findByIdAndDelete(_id);

	if (!playlist) {
		throw new ApiError(500, "Sever Error in remove playlist");
	}

	return res
		.status(200)
		.json(new ApiResponse(200, playlist, "Playlist deleted Successfully"));
});

const addVideoToPlaylist = asyncErrorHandler(async (req, res) => {
	const { playlist_id, video_id } = req.body;

	if (!playlist_id || !video_id) {
		throw new ApiError(400, "playlist or video id is required");
	}

	const getPlaylistAndAddVideo = await Playlist.findByIdAndUpdate(
		playlist_id,
		{
			$addToSet: {
				videos: video_id,
			},
		},
		{ new: true }
	);

	if (!getPlaylistAndAddVideo) {
		throw new ApiError(500, "Server Error adding video to playlist");
	}

	return res
		.status(200)
		.json(
			new ApiResponse(
				200,
				getPlaylistAndAddVideo,
				"Video added to playlist successfully"
			)
		);
});

const removeVideoFromPlaylist = asyncErrorHandler(async (req, res) => {
	const { playlist_id, video_id } = req.body;

	if (!playlist_id || !video_id) {
		throw new ApiError(400, "Playlist or video Id is required");
	}

	const removeVideo = await Playlist.findByIdAndUpdate(
		playlist_id,
		{
			$pull: {
				videos: video_id,
			},
		},
		{ new: true }
	);

	if (!removeVideo) {
		throw new ApiError(500, "Server Error removing video to playlist");
	}

	return res
		.status(200)
		.json(
			new ApiResponse(200, removeVideo, "Video remove to playlist successfully")
		);
});

const getPlaylistById = asyncErrorHandler(async (req, res) => {
	const { playlistId } = req.params;

	if (!playlistId) {
		throw new ApiError(400, "Please Provide playlist info");
	}

	const playlist = await Playlist.findById(playlistId);

	if (!playlist) {
		throw new ApiError(400, "Playlist with this info is not found");
	}

	return res
		.status(200)
		.json(new ApiResponse(200, playlist, "Playlists fetched Successfully"));
});

const getUserPlaylists = asyncErrorHandler(async (req, res) => {
	const { userId } = req.params;

	if (!userId) {
		throw new ApiError(400, "User id is required");
	}

	const userPlaylists = await Playlist.aggregate([
		{
			$match: {
				owner: new mongoose.Types.ObjectId(userId),
			},
		},
		{
			$project: {
				videos: 1,
				name: 1,
				description: 1,
			},
		},
	]);

	if (!userPlaylists) {
		throw new ApiError(500, "Server Error while fetching user playlist");
	}

	return res
		.status(200)
		.json(new ApiResponse(200, userPlaylists, "user playlist fetched"));
});

export {
	createPlaylist,
	updatePlaylistDetails,
	getPlaylist,
	removePlaylist,
	removeVideoFromPlaylist,
	addVideoToPlaylist,
	getPlaylistById,
	getUserPlaylists,
};
