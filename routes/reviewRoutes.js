const router = require('express').Router({ mergeParams: true });
const authorizeOnly = require('../middleware/authorizeOnly');
const reviewController = require('../controllers/reviewController');


router
    .get("/", reviewController.getAllReviews)
    .post("/", authorizeOnly("user"), reviewController.createReview)
    .delete("/:id", reviewController.deleteReview)


module.exports = router;