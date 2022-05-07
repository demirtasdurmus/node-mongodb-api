const ApiService = require('../services/apiServices');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');
const Tour = require('../models/tourModel');


exports.getAllTours = catchAsync(async (req, res, next) => {
    // construct query object
    const apiService = new ApiService(Tour.find(), req.query)
        .filter()
        .sort()
        .limitFields()
        .paginate();

    // execute query
    const allTours = await apiService.query;

    // send response
    res.status(200).json(
        {
            status: "success",
            results: allTours.length,
            data: allTours
        }
    );
});

exports.getTourById = catchAsync(async (req, res, next) => {
    // get tour by id
    const tour = await Tour
        .findById(req.params.id)
        .populate({
            path: 'guides',
            select: '-__v -passwordChangedAt'
        });
    // const tour = await Tour.findOne({ _id: req.params.id });

    // check if tour exists
    if (!tour) {
        return next(new AppError(404, "No tour found with that ID"));
    };

    // send response
    res.status(200).json({ status: "success", data: tour });
});

exports.createTour = catchAsync(async (req, res, next) => {
    const newTour = await Tour.create(req.body);
    res.status(201).json({ status: "success", data: newTour });
});

exports.updateTourById = catchAsync(async (req, res, next) => {
    // find and update tour
    const tour = await Tour.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    // const updatedTour = await Tour.updateOne({ _id: req.params.id }, req.body);

    // check if tour exists
    if (!tour) {
        return next(new AppError(404, "No tour found with that ID"));
    };

    // send response
    res.status(200).json({ status: "success", data: updatedTour });
});

exports.deleteTourById = catchAsync(async (req, res, next) => {
    // find and delete tour
    const tour = await Tour.deleteOne({ _id: req.params.id });

    // check if tour exists
    if (!tour) {
        return next(new AppError(404, "No tour found with that ID"));
    };

    // send response
    res.status(204).json({ status: "success", data: "" });
});