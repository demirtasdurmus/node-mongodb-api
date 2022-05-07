const crypto = require("crypto");
//const jwt = require('jsonwebtoken');
const AppError = require("../utils/appError");
const catchAsync = require('../utils/catchAsync');
const cookieService = require("../services/cookieService");
const emailService = require("../services/emailService");
const jwtService = require('../services/jwtService');
const User = require('../models/userModel');


// register the new user
exports.register = catchAsync(async (req, res, next) => {
    const { firstName, lastName, email, password, passwordConfirm } = req.body;

    // create the new user
    const newUser = await User.create({
        firstName,
        lastName,
        email,
        password,
        passwordConfirm,
    });

    // FIXME: send verification email to the user
    // login the user
    // configue client to warn logged in user to verify email before do anything
    // send the new user to the client
    newUser.password = undefined;
    res.status(201).send({
        status: "success",
        data: newUser,
    });
});

// TODO: finish verification process
// verify and login the new user for the first time
exports.verify = catchAsync(async (req, res, next) => {
    // const { token } = req.params;

    // // verify token & extract user data
    // const decoded = await jwToken.verify(token, process.env.JWT_VERIFY_SECRET);
    // // fetch user from db
    // const user = await UserInfo.findOne({
    //     where: {
    //         id: decoded.id
    //     },
    //     attributes: ["id", "is_verified"],
    //     include: [Role]
    // });

    // // update user data
    // if (user && user.verify !== true) {
    //     user.is_verified = true;
    //     await user.save();

    //     // sign a session token and embed it in the cookie
    //     const token = jwToken.sign(
    //         {
    //             id: user.id,
    //             role: user.role.code
    //         },
    //         process.env.JWT_SESSION_SECRET,
    //         process.env.JWT_SESSION_EXPIRY);
    //     const sessionCookie = await cookies.encrypt(token);

    //     // create a cookie expiry date
    //     const cookieExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);

    //     // assign the cookie to the response
    //     res.cookie("__session", sessionCookie, {
    //         expires: cookieExpiry,
    //         httpOnly: true,
    //         secure: req.secure || req.headers['x-forwarded-proto'] === 'https',
    //         sameSite: process.env.NODE_ENV === "development" ? "Lax" : "Strict"
    //     });
    // };
    // res.redirect(`${setBaseUrl()}`);
});

// login user
exports.login = catchAsync(async (req, res, next) => {
    const { email, password, remember } = req.body;

    // check if email and password exist
    if (!email || !password) {
        return next(new AppError(400, 'Please provide email and password!'));
    };

    // check if user exists
    const user = await User.findOne({ email: email }).select("+password");
    if (!user) {
        return next(new AppError(401, "Incorrect email or password!"));
    };

    // check if password is correct
    const isPasswordCorrect = await user.isPasswordCorrect(password, user.password);
    if (!isPasswordCorrect) {
        return next(new AppError(401, "Incorrect email or password!"));
    };

    // check if user is verified
    if (user.isVerified !== true) {
        return next(new AppError(401, "Please verify your email first!"));
    };

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
            remember: remember
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

// logout user
exports.logout = (req, res, next) => {
    res.clearCookie("__session");
    res.status(200).json({ status: 'success' });
};

// send a new password reset link to the user
exports.forgetPassword = catchAsync(async (req, res, next) => {
    const { email } = req.body;

    // check if email exists
    const user = await User.findOne({ email: email });
    if (!user) {
        return next(new AppError(401, "User not found in our system!"));
    };

    // create a new password reset token
    const resetToken = await user.createPasswordResetToken();
    await user.save({ validateBeforeSave: false });

    try {
        // send the reset token to the user via email and send a success message
        const data = {
            name: user.firstName,
            resetUrl: `${req.protocol}://${req.get("host")}/api/v1/auth/reset-password/${resetToken}`
        };
        await emailService.sendEmailViaSendgrid(user.email, data, process.env.SENDGRID_VERIFICATION_TEMPLATE_ID);
        return res.status(200).json({ status: "success", data: "Password reset link sent to your email!" });

    } catch (err) {
        // if there is an error, delete the reset token from the db and send an error message
        user.passwordResetToken = undefined;
        user.passwordResetExpires = undefined;
        await user.save({ validateBeforeSave: false });
        return next(new AppError(500, err.message, err.name, false, err.stack));
    }
});

// send a new password reset link to the user
exports.resetPassword = catchAsync(async (req, res, next) => {
    const { token } = req.params;

    // check if user with the token exists
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");
    const user = await User.findOne({
        passwordResetToken: hashedToken,
        passwordResetExpires: {
            $gt: Date.now()
        }
    });
    if (!user) {
        return next(new AppError(400, "Token is invalid or has expired!"));
    };

    // update the user's password
    user.password = req.body.password;
    user.passwordConfirm = req.body.passwordConfirm;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    // update passwordChangedAt property and log the user in
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