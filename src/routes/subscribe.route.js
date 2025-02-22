import { Router } from "express";
import { verifyToken } from "../middlewares/auth.middleware.js";
import {
	getSubscribedChannels,
	subscribeChannel,
} from "../controllers/subscriber.controller.js";

const subscriberRouter = Router();

subscriberRouter.route("/").post(verifyToken, subscribeChannel);
subscriberRouter
	.route("/getSubscribedChannels/:subscriberId")
	.get(verifyToken, getSubscribedChannels);
export default subscriberRouter;
