const { promisify } = require("util");
const jwt = require('jsonwebtoken');
const cookieService = require("../services/cookieService");
const catchAsync = require('../utils/catchAsync');
const AppError = require("../utils/appError");
const User = require('../models/userModel');


module.exports = catchAsync(async (req, res, next) => {
    const { __session } = req.cookies;

    // check if session cookie exists
    if (!__session) {
        return next(new AppError(401, 'Unauthenticated'));
    };

    // decrypt session token from session cookie
    const sessionToken = cookieService.decrypt(__session);

    // verify decrypted session token
    const decoded = await promisify(jwt.verify)(sessionToken, process.env.JWT_SESSION_SECRET);

    // check if user still exists
    const currentUser = await User.findById(decoded.id);
    if (!currentUser) {
        return next(new AppError(401, 'The user no longer exists!'));
    };

    //check if user has changed password after the token was issued
    if (currentUser.hasPasswordChangedAfter(decoded.iat)) {
        return next(new AppError(401, 'User has changed password! Please log in again.'));
    };

    // grant access to protected routes and assign user to req.user
    req.user = currentUser;
    res.locals.user = currentUser;

    // jump to the next middleware
    next();
});