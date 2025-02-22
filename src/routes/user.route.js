import {
	changePassword,
	logoutUser,
	refreshToken,
	userLogin,
	userResgister,
	getUser,
	updateUser,
	updateAvatar,
	updateCoverImage,
	getUserChannelProfileData,
	getUserWatchHistory,
} from "../controllers/users.controller.js";
import { Router } from "express";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyToken } from "../middlewares/auth.middleware.js";

const userRouter = Router();

userRouter.route("/register").post(
	upload.fields([
		{
			name: "avatar",
			maxCount: 1,
		},
		{
			name: "coverImage",
			maxCount: 1,
		},
	]),
	userResgister
);
userRouter.route("/login").post(userLogin);
userRouter.route("/logout").post(verifyToken, logoutUser);
userRouter.route("/refreshAccessToken").post(refreshToken);
userRouter.route("/me").get(verifyToken, getUser);
userRouter.route("/changepassword").post(verifyToken, changePassword);
userRouter.route("/userUpdate").put(verifyToken, updateUser);
userRouter
	.route("/updateAvatar")
	.put(verifyToken, upload.single("avatar"), updateAvatar);
userRouter
	.route("/updateCoverImage")
	.put(verifyToken, upload.single("coverImage"), updateCoverImage);

userRouter
	.route("/userProfile/:username")
	.get(verifyToken, getUserChannelProfileData);

userRouter.route("/userWatchHistory").get(verifyToken, getUserWatchHistory);

export default userRouter;
