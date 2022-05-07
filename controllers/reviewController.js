const AppError = require('../utils/AppError');
const catchAsync = require('../utils/catchAsync');
const cookieService = require("../services/cookieService");
const jwtService = require('../services/jwtService');
const User = require('../models/userModel');


exports.getAllReviews = catchAsync(async (req, res, next) => {
    // TODO: - get all reviews
    // send the data to the client
    res.status(200).send({ status: "success", data: { message: "not implemented yet" } });
});

exports.createReview = catchAsync(async (req, res, next) => {
    // Allow nested routes
    if (!req.body.tour) req.body.tour = req.params.tourId;
    if (!req.body.user) req.body.user = req.user.id;
    // TODO: - get data from the client
    // create the new review"
    res.status(200).send({ status: "success", data: { message: "not implemented yet" } });
});

exports.deleteReview = catchAsync(async (req, res, next) => {
    // TODO: - delete the review only if the user is the owner of the review
    res.status(200).send({ status: "success", data: { message: "not implemented yet" } });
});