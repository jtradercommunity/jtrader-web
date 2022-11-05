const { Validator,ValidationError } = require("express-json-validator-middleware");
const { validate } = new Validator();
const config = process.env;
const jwt = require('jsonwebtoken');

function validationErrorMiddleware(error, request, response, next) {
	if (response.headersSent) {
		return next(error);
	}

	const isValidationError = error instanceof ValidationError;
	if (!isValidationError) {
		return next(error);
	}

	response.status(400).json({
		"status": {
            "code" : 1899,
            "description": "Cannot process at this moment, please try again!"
        }
	});

	next();
}

function auth(req,res,next){
	const token = req.body.token || req.query.token || req.headers['x-access-token'];
	if (!token) {
		return res.status(403).json({
			"status": {
				"code" : 1999,
				"description": "A token is required for authentication"
			}
		});
	}

	try {
		const decoded = jwt.verify(token, config.TOKEN_KEY);
		req.user = decoded;
	} catch (err) {
		return res.status(401).json({
			"status": {
				"code" : 1899,
				"description": "Invalid Token"
			}
		});
	}

	return next();
}

module.exports = {validationErrorMiddleware,auth}