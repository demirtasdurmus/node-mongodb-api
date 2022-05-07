const jwt = require('jsonwebtoken');
const { promisify } = require("util");
const AppError = require("../utils/appError");


// sign a jwt token
exports.sign = (data, secret, expiry) => {
    return jwt.sign(data, secret, {
        expiresIn: expiry
    });
};

// decode a jwt token
exports.decode = (token) => {
    try {
        if (!token || typeof (token) !== 'string') {
            return null;
        };
        var base64Payload = token.split('.')[1];
        var payload = Buffer.from(base64Payload, 'base64');
        return JSON.parse(payload.toString());
    } catch (e) {
        return null;
    }
};