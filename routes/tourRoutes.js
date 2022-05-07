const router = require('express').Router();
const aliasTours = require('../middleware/aliasTours');
const authorizeOnly = require('../middleware/authorizeOnly');
const tourController = require('../controllers/tourController');
const reviewRouter = require('./reviewRoutes');


router
    .use("/:tourId/reviews", reviewRouter)
    .get("/", tourController.getAllTours)
    .get("/top-5-cheapest", aliasTours.TopFiveCheapest, tourController.getAllTours)
    .get("/:id", tourController.getTourById)
    .post("/", tourController.createTour)
    .patch("/:id", tourController.updateTourById)
    .delete("/:id", authorizeOnly("admin"), tourController.deleteTourById)


module.exports = router;