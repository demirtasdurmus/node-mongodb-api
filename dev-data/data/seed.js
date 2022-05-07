const fs = require('fs');
const mongoose = require('mongoose');
const Tour = require('../../models/tourModel');
const Review = require('../../models/reviewModel');
const User = require('../../models/userModel');


// connect to MongoDB
mongoose.connect('mongodb://localhost:27017/test')
    .then((con) => {
        con.connections.map(db => {
            console.log(`Connected to ${db.name} db successfully!`)
        });
    })
    .catch((err) => {
        console.log("OOPS! 💥 Unable to connect MongoDB", err.message);
    });

// seeder function
const seedDB = async () => {
    try {
        const tours = JSON.parse(fs.readFileSync(`${__dirname}/tours.json`, 'utf-8'));
        const reviews = JSON.parse(fs.readFileSync(`${__dirname}/reviews.json`, 'utf-8'));
        const users = JSON.parse(fs.readFileSync(`${__dirname}/users.json`, 'utf-8'));
        await Tour.deleteMany();
        await Review.deleteMany();
        await User.deleteMany();

        await Tour.create(tours);
        await Review.create(reviews);
        await User.create(users, { validateBeforeSave: false });
        console.log('Data seeded successfully!');
    }
    catch (err) {
        console.log(err);
    }
    finally {
        mongoose.connection.close();
        process.exit();
    }
};


// runfunction if called from command line properly in the directory
// sample: node dev-data/data/seed.js --seed
if (process.argv[2] === '--seed') {
    seedDB();
};