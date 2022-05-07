const router = require('express').Router();
const authController = require('../controllers/authController');


router
    .post("/register", authController.register)
    .get("/verify/:token", authController.verify)
    .post("/login", authController.login)
    .get("/logout", authController.logout)
    .post("/forget-password", authController.forgetPassword)
    .patch("/reset-password/:token", authController.resetPassword)


module.exports = router;