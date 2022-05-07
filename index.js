const dotenv = require("dotenv");
const mongoose = require('mongoose');

// handle uncaught exceptions
process.on("uncaughtException", err => {
    console.log('UNCAUGHT EXCEPTION! 💥 Shutting down...');
    console.log(err.stack);
    process.exit(1);
});

// configure dotenv so Node.js knows where to look
dotenv.config({ path: "./.config.env" });

// connect to MongoDB
mongoose.connect(`mongodb://${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`)
    .then((con) => {
        con.connections.map(db => {
            console.log(`Connected to ${db.name} db successfully!`)
        });
    })
    .catch((err) => {
        console.log("OOPS! 💥 Unable to connect MongoDB", err.message);
    })

// import express app
const app = require('./app');

// declare the port variable
const PORT = process.env.PORT || 8000;

// run the express server to wait for requests
const server = app.listen(PORT, () => {
    console.log(`Server is awake on port ${PORT}:${process.env.NODE_ENV}`);
});

// handle unhandled rejections
process.on('unhandledRejection', err => {
    console.log('UNHANDLED REJECTION! 💥 Shutting down...');
    console.log(err.stack);
    // close server gracefully first
    server.close(() => {
        // then exit process
        process.exit(1);
    });
});

// ensure graceful shutdown in case sigterm received
process.on('SIGTERM', () => {
    console.log('👋 SIGTERM RECEIVED. Shutting down gracefully');
    server.close(() => {
        console.log('💥 Process terminated!');
    });
});