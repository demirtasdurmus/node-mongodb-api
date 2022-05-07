const api = require("express").Router();
const isLoggedIn = require("./middleware/isLoggedIn");
const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const tourRoutes = require("./routes/tourRoutes");
const reviewRoutes = require("./routes/reviewRoutes");

api.use('/auth', authRoutes);
api.use('/users', isLoggedIn, userRoutes);
api.use('/tours', isLoggedIn, tourRoutes);
api.use('/reviews', isLoggedIn, reviewRoutes);

module.exports = api;