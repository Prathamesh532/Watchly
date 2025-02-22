import { Router } from "express";
import { verifyToken } from "../middlewares/auth.middleware.js";
import {
	addVideoToPlaylist,
	createPlaylist,
	getPlaylist,
	removePlaylist,
	removeVideoFromPlaylist,
	updatePlaylistDetails,
	getPlaylistById,
	getUserPlaylists,
} from "../controllers/playlist.controller.js";

const playlistRouter = Router();

playlistRouter.route("/create").post(verifyToken, createPlaylist);
playlistRouter
	.route("/updateDetails")
	.patch(verifyToken, updatePlaylistDetails);
playlistRouter.route("/title").get(verifyToken, getPlaylist);
playlistRouter.route("/getById/:playlistId").get(verifyToken, getPlaylistById);
playlistRouter.route("/remove").delete(verifyToken, removePlaylist);
playlistRouter.route("/addvideo").patch(verifyToken, addVideoToPlaylist);
playlistRouter
	.route("/removevideo")
	.patch(verifyToken, removeVideoFromPlaylist);
playlistRouter
	.route("/getUserPlaylist/:userId")
	.get(verifyToken, getUserPlaylists);

export default playlistRouter;
