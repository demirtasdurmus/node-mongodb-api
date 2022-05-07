const httpStatus = require('http-status');
const AppError = require('../../utils/appError');
const { Error } = require('mongoose');
const { MongoServerError } = require('mongodb');
const { JsonWebTokenError, TokenExpiredError, NotBeforeError } = require('jsonwebtoken');


const convertMongoDBError = (err) => {
    if (err.code === 11000) {
        // create a custom message for MongoDB duplicate key error
        const value = err.errmsg.match(/(["'])(\\?.)*?\1/)[0];
        err.message = `Duplicate field value: ${value}. Please use another value!`;
    } else {
        // create a default message for all other errors
        err.statusCode = err.statusCode || httpStatus.INTERNAL_SERVER_ERROR;
        err.message = err.message || httpStatus[err.statusCode];
    };
    return err;
};

const convertMongooseError = (err) => {
    if (err.name === 'CastError') {
        // create a custom message for Mongoose cast errors
        err.message = `Invalid ${err.path}: ${err.value}`;
    } else if (err.name === 'ValidationError') {
        // create a custom message for Mongoose validation errors
        let allErrors = Object.values(err.errors).map(val => val.message);
        err.message = `Invalid input data: ${allErrors.join('. ')}`;
    } else {
        // create a default message for all other no-express errors
        err.statusCode = err.statusCode || httpStatus.INTERNAL_SERVER_ERROR;
        err.message = err.message || httpStatus[err.statusCode];
    };
    return err;
};

// convert non-express errors to AppError
module.exports = (err, req, res, next) => {
    let error = err;
    if (!(error instanceof AppError)) {
        // set initial statusCode to 400 if not already set
        error.statusCode = error.statusCode || httpStatus.BAD_REQUEST;

        // convert errors conditionally
        if (error instanceof JsonWebTokenError) {
            error.message = 'Invalid session. Please log in again.';
            error.statusCode = httpStatus.UNAUTHORIZED;
        } else if (error instanceof TokenExpiredError) {
            error.message = 'Session expired. Please log in again.';
            error.statusCode = httpStatus.UNAUTHORIZED;
        } else if (error instanceof NotBeforeError) {
            error.message = 'Session not active. Please log in again.';
            error.statusCode = httpStatus.UNAUTHORIZED;
        } else if (error instanceof MongoServerError) {
            error = convertMongoDBError(error);
        } else if (error instanceof Error) {
            error = convertMongooseError(error);
        } else {
            error.statusCode = error.statusCode || httpStatus.INTERNAL_SERVER_ERROR;
            error.message = error.message || httpStatus[error.statusCode];
            error.isOperational = false;
        };

        // recreate the error object with the new arguments
        error = new AppError(error.statusCode, error.message, error.name, error.isOperational, error.stack);
    };
    // pass the error to the actual error handler middleware
    next(error);
};