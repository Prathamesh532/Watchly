import multer from "multer";

class CustomError extends Error {
	constructor(
		statusCode,
		message = "Something went wrong",
		errors = [],
		stack = ""
	) {
		super(message);
		this.statusCode = statusCode;
		this.data = null;
		this.message = message;
		this.success = false;
		this.errors = errors;

		if (stack) {
			this.stack = stack;
		} else {
			Error.captureStackTrace(this, this.constructor);
		}
	}
}

// Error handler for multer
export const multerErrorHandler = (err, req, res, next) => {
	if (err instanceof multer.MulterError) {
		// Handle `multer` specific errors
		console.error("Multer error:", err.message);
		return res.status(400).json({ error: err.message });
	}
	if (err.message === "Invalid file type") {
		// Handle your custom errors
		console.error("Multer error:", err.message);
		return res.status(400).json({ error: err.message });
	}
	// Pass other errors to the next middleware
	next(err);
};

export const asyncErrorHandler = (requestHandler) => {
	return async (req, res, next) => {
		try {
			await requestHandler(req, res, next);
		} catch (error) {
			res.status(500).json({ error: error.message });
		}
	};
};

export const asyncErrorHandlerByPromise = (requestHandler) => {
	return (req, res, next) => {
		Promise.resolve(requestHandler(req, res, next)).catch((err) => next(err));
	};
};

// Example of a common error handler
const throwError = (message, statusCode) => {
	const error = new Error(message);
	error.status = statusCode;
	throw error;
};

const successResponse = (message, data) => {
	//string message and data  object is expected here, cannot wrap successResponse into try catch,as it also throws error to send back response internally
	let resObj = { message: message, data: data };
	throw new CustomError(JSON.stringify(resObj), 200);
};

export { CustomError, successResponse, throwError };
