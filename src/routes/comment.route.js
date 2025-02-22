import { Router } from "express";
import { verifyToken } from "../middlewares/auth.middleware.js";
import {
	addComment,
	getVideoComments,
	updateComment,
	deleteComment,
} from "../controllers/commet.controller.js";

const commentRouter = Router();

commentRouter.route("/").post(verifyToken, addComment);
commentRouter
	.route("/getVideoComment/:videoId/comments")
	.get(verifyToken, getVideoComments);
commentRouter.route("/updateComment").patch(verifyToken, updateComment);
commentRouter
	.route("/deleteComment/:comment_id")
	.delete(verifyToken, deleteComment);

export default commentRouter;
