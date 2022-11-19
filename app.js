const path = require('path');

const cookieParser = require('cookie-parser');
const express = require("express");
const helmet = require("helmet");
const hpp = require("hpp");
const mongoSanitize = require("express-mongo-sanitize");
const xss = require("xss-clean");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");

const api = require("./api");
const AppError = require('./utils/appError');
const errorConverter = require('./middleware/errors/errorConverter');
const errorHandler = require('./middleware/errors/errorHandler');


// start express server
const app = express();

// set up logger
if (process.env.NODE_ENV === "development") {
    app.use(morgan("dev"));
};

// limit requests from same IP
const limiter = rateLimit({
    max: 100,
    windowMs: 60 * 60 * 1000,
    message: "Too many requests from this IP, please try again in an hour!"
});
app.use("/api", limiter);

// set security http headers
app.use(helmet());

// parse cookies
app.use(cookieParser());

// parse incoming requests with JSON body payloads
app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: true }))

// sanitize data against noSQL query injection
app.use(mongoSanitize());

// sanitize data against XSS
app.use(xss());

// prevent http param pollution
app.use(hpp({
    whitelist: ["duration", "ratingsQuantity", "ratingsAverage", "maxGroupSize", "difficulty", "price"]
}));

// serve static files
app.use(express.static(path.join(__dirname, 'public')));

// redirect incoming requests to api.js
app.use("/api/v1", api);

// set up a 404 error handler
app.all("*", (req, res, next) => {
    next(new AppError(404, "Can't find the route!"));
});

// convert errors to AppError, if needed
app.use(errorConverter);

// handle errors
app.use(errorHandler);

module.exports = app;