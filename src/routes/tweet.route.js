import { Router } from "express";
import { verifyToken } from "../middlewares/auth.middleware.js";
import {
	createTweet,
	deleteTweet,
	getAllTweets,
	getUserTweets,
	updateTweet,
} from "../controllers/tweets.controller.js";

const tweetRouter = Router();

tweetRouter.route("/").post(verifyToken, createTweet);
tweetRouter.route("/").patch(verifyToken, updateTweet);
tweetRouter.route("/deleteTweet/:id").delete(verifyToken, deleteTweet);
tweetRouter.route("/getUserTweets").get(verifyToken, getUserTweets);
tweetRouter.route("/getTweets").get(verifyToken, getAllTweets);
export default tweetRouter;
