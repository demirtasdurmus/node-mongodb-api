const AppError = require("../utils/appError");


module.exports = (...roles) => {
    return (req, res, next) => {

        // check if current user is authorized
        if (!roles.includes(req.user.role)) {
            return next(new AppError(403, 'You are not authorized to perform this action!'));
        };

        // jump to the next middleware
        next();
    }
};