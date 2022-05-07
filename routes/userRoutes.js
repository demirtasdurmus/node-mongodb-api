const router = require('express').Router();
const userController = require('./../controllers/userController');


router
    .patch("/update-my-password", userController.updateMyPassword)
    .get("/", userController.getMyData)
    .patch("/", userController.updateMyData)
    .delete("/", userController.deleteMe)


module.exports = router;