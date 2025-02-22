import { asyncErrorHandler, throwError } from "../utils/asyncErrorHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Subscription } from "../models/subscripions.model.js";
import mongoose from "mongoose";

const subscribeChannel = asyncErrorHandler(async (req, res) => {
	const { channel_id } = req.body;

	if (!channel_id) {
		throw new ApiError(400, "Channel_id is required");
	}

	const exists = await Subscription.findOne({
		subscriber: req.user?._id,
		channel: channel_id,
	});

	if (exists) {
		await exists.deleteOne({ _id: exists._id });
		throw new ApiError(400, "Channel UnSubscribed");
	}

	const subscriber = await Subscription.create({
		subscriber: req.user?._id,
		channel: channel_id,
	});

	if (!subscriber) {
		throw new ApiError(500, "Server Error while Subscribing");
	}

	return res
		.status(200)
		.json(new ApiResponse(200, subscriber, "Channel Subscribe"));
});

// controller to return subscriber list of a channel
// const getUserChannelSubscribers = asyncErrorHandler(async (req, res) => {
// 	const { channelId } = req.params;

// 	const userSubsCount = await Subscription.aggregate([
// 		{
// 			$match: {
// 				channel: new mongoose.Types.ObjectId(channelId),
// 			},
// 		},
// 		{
// 			$project: {
// 				subscriber: 1,
// 			},
// 		},
// 		{
// 			$addFields: {

// 			}
// 		}
// 	]);
// });

// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncErrorHandler(async (req, res) => {
	const { subscriberId } = req.params;

	if (!subscriberId) {
		throw new ApiError(400, "Subscriber id is required");
	}

	const subscribedChannels = await Subscription.aggregate([
		{
			$match: {
				subscriber: new mongoose.Types.ObjectId(subscriberId),
			},
		},
		{
			$lookup: {
				from: "users",
				localField: "channel",
				foreignField: "_id",
				as: "channel",
			},
		},
		{
			$unwind: "$channel",
		},
		{
			$project: {
				_id: 0,
				channel_id: "$channel._id",
				username: "$channel.username",
				name: "$channel.name",
				email: "$channel.email",
				image: "$channel.image",
			},
		},
	]);

	if (!subscribedChannels) {
		throw new ApiError(500, "Server Error while getting subscribed channels");
	}

	if (!subscribedChannels.length) {
		return res
			.status(200)
			.json(new ApiResponse(200, [], "No Subscribed Channels"));
	} else {
		return res
			.status(200)
			.json(new ApiResponse(200, subscribedChannels, "Subscribed Channels"));
	}
});

export { subscribeChannel, getSubscribedChannels };
