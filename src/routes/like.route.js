import { Router } from "express";
import { verifyToken } from "../middlewares/auth.middleware.js";
import {
	getLikedVideos,
	toggleCommentLike,
	toggleTweetLike,
	toggleVideoLike,
} from "../controllers/like.controller.js";

const likeRouter = Router();

likeRouter.route("/video/:videoId").post(verifyToken, toggleVideoLike);
likeRouter.route("/comment/:comment_id").post(verifyToken, toggleCommentLike);
likeRouter.route("/tweet/:tweet_id").post(verifyToken, toggleTweetLike);
likeRouter.route("/getLikedVideo").get(verifyToken, getLikedVideos);

export default likeRouter;
