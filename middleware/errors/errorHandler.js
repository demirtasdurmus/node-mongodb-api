const sendErrorDev = (err, res) => {
    // 1) log error to console
    console.log(`-------------------------${err.name}---------------------------`);
    console.log("errorMessage=>", err.message);
    console.log("errorStack=>", err.stack);
    console.log(`---------------------------------------------------------------`);

    // 2) send error message to client
    res.status(err.statusCode).send({
        status: err.status,
        error: err,
        name: err.name,
        message: err.message,
        stack: err.stack
    });
};

const sendErrorProd = (err, res) => {
    // send message to client: operational, trusted errors
    if (err.isOperational) {
        res.status(err.statusCode).send({
            status: err.status,
            message: err.message
        });
        // don't leak error details: programming or other unknown errors
    } else {
        // 1) log error
        console.error('ERROR 💥', err);
        // 2) send generic message
        res.status(500).send({
            status: 'error',
            message: 'Something went very wrong!'
        });
    }
};

// handle errors and send response accordingly
module.exports = (err, req, res, next) => {
    err.statusCode = err.statusCode || 500;
    err.status = err.status || 'error';

    // log error regardless of the NODE_ENV if headers sent
    if (res.headersSent) {
        console.log("---headers-sent---");
        console.log(err.stack);
    };

    // configure error handling based on NODE_ENV
    if (process.env.NODE_ENV === 'production') {
        !res.headersSent && sendErrorProd(err, res);
    } else {
        !res.headersSent && sendErrorDev(err, res);
    }
};