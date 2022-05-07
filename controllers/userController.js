const AppError = require('./../utils/AppError');
const catchAsync = require('./../utils/catchAsync');
const cookieService = require("../services/cookieService");
const jwtService = require('../services/jwtService');
const User = require('../models/userModel');


exports.updateMyPassword = catchAsync(async (req, res, next) => {
    const { currentPassword, password, passwordConfirm } = req.body;

    // check if current password is correct
    const user = await User.findById(req.user._id).select('+password');
    if (!(await user.isPasswordCorrect(currentPassword, user.password))) {
        return next(new AppError(401, 'Current password is incorrect'));
    };

    // update password
    user.password = password;
    user.passwordConfirm = passwordConfirm;
    await user.save();

    // log the user in again
    // sign a session token and embed it in the cookie
    const sessionToken = jwtService.sign(
        {
            id: user.id,
            role: user.role
        },
        process.env.JWT_SESSION_SECRET,
        process.env.JWT_SESSION_EXPIRY
    );
    const sessionCookie = await cookieService.encrypt(sessionToken);
    const sessionExpiry = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    // assign the cookie to the response
    res.cookie("__session", sessionCookie, {
        expires: sessionExpiry,
        httpOnly: true,
        secure: req.secure || req.headers['x-forwarded-proto'] === 'https',
        sameSite: process.env.NODE_ENV === "development" ? "Lax" : "Strict"
    });

    // TODO: - assign refresh token to the cookie as well
    // sign a refresh token and encrypt it
    const refreshToken = jwtService.sign(
        {
            id: user.id,
            role: user.role,
            remember: false
        },
        process.env.JWT_REFRESH_SECRET,
        process.env.JWT_REFRESH_EXPIRY
    );
    const refreshCookie = await cookieService.encrypt(refreshToken);

    // save the refresh token to the db
    await User.findByIdAndUpdate(user._id, { refreshToken });

    // // send a success message to the client
    // // by adding the refresh token to the response
    // // to be added as authorization header in client requests
    res.status(200).send({
        status: "success",
        data: { token: refreshCookie }
    });
});

exports.getMyData = catchAsync(async (req, res, next) => {
    // TODO: - get user Data
    // exclude unnecessary fields
    // send the data to the client
    res.status(200).send({ status: "success", data: { message: "not implemented yet" } });
});

exports.updateMyData = catchAsync(async (req, res, next) => {
    // TODO: - update the user data
    // exclude everything except the name, email, and image
    // update the user data
    // with userId from req object
    res.status(200).send({ status: "success", data: { message: "not implemented yet" } });
});

exports.deleteMe = catchAsync(async (req, res, next) => {
    // TODO: - inactivate the user
    res.status(200).send({ status: "success", data: { message: "not implemented yet" } });
});