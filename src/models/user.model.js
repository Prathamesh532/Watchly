import dotenv from "dotenv";
dotenv.config({
	path: "./.env",
});
import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema(
	{
		username: {
			type: String,
			required: true,
			unique: true,
			lowercase: true,
			trim: true,
			index: true,
		},
		fullname: {
			type: String,
			required: true,
			lowercase: true,
			trim: true,
		},
		email: {
			type: String,
			required: true,
			unique: true,
			lowercase: true,
			trim: true,
		},
		password: {
			type: String,
			required: true,
		},
		refreshToken: {
			type: String,
		},
		watchHistory: [
			{
				type: mongoose.Schema.Types.ObjectId,
				ref: "Video",
			},
		],
		avatar: {
			type: String,
		},
		coverImage: {
			type: String,
		},
	},
	{ timestamps: true }
);

// to encrypt password and store it in DB
userSchema.pre("save", async function (next) {
	if (!this.isModified("password")) return;
	this.password = await bcrypt.hash(this.password, 10);
	next();
});

// method to check the password
userSchema.methods.isPasswordCorrect = async function (password) {
	return await bcrypt.compare(password, this.password);
};

// method to generate Access Token
userSchema.methods.generateAccessToken = async function () {
	return jwt.sign(
		{
			_id: this._id,
			username: this.username,
			email: this.email,
		},
		process.env.ACCESS_TOKEN_SECRET,
		{
			expiresIn: process.env.ACCESS_TOKEN_EXPIRY,
		}
	);
};

// method to generate Access Token
userSchema.methods.generateRefreshToken = async function () {
	return jwt.sign(
		{
			_id: this._id,
		},
		process.env.REFRESH_TOKEN_SECRET,
		{
			expiresIn: process.env.REFRESH_TOKEN_EXPIRY,
		}
	);
};

const User = mongoose.model("User", userSchema);

export default User;
