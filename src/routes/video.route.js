import { Router } from "express";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyToken } from "../middlewares/auth.middleware.js";
import {
	getAllVideos,
	getUserVideosById,
	getVideoById,
	getVideoByTitle,
	togglePublishStatus,
	updateThumbnail,
	updateVideoDetails,
	uploadVideo,
	videoViewIncrement,
} from "../controllers/video.controller.js";

const videoRouter = Router();

videoRouter.route("/upload").post(
	verifyToken,
	upload.fields([
		{
			name: "video",
			maxCount: 1,
		},
		{
			name: "thumbnail",
			maxCount: 1,
		},
	]),
	uploadVideo
);
videoRouter.route("/update").patch(verifyToken, updateVideoDetails);
videoRouter
	.route("/update-thumbnail")
	.patch(verifyToken, upload.single("thumbnail"), updateThumbnail);

videoRouter.route("/view-increment").post(verifyToken, videoViewIncrement);
videoRouter.route("/getVideo/:videoId").get(verifyToken, getVideoById);
videoRouter.route("/getUserVideos/:userId").get(verifyToken, getUserVideosById);
videoRouter.route("/search").get(getVideoByTitle);
videoRouter.route("/getAllvideo").get(getAllVideos);
videoRouter
	.route("/toggle-publish/:videoId")
	.patch(verifyToken, togglePublishStatus);

export default videoRouter;
