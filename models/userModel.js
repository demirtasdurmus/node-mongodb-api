const crypto = require("crypto");
const { promisify } = require('util');
const bcrypt = require("bcryptjs");
const mongoose = require('mongoose');
const AppError = require("../utils/appError");


const userSchema = new mongoose.Schema({
    firstName: {
        type: String,
        required: [true, 'First name is required'],
        trim: true,
        minlength: [1, 'First name must have more or equal then 1 characters'],
        maxlength: [50, 'First name must have less or equal then 50 characters']
    },
    lastName: {
        type: String,
        required: [true, 'Last name is required'],
        trim: true,
        minlength: [1, 'Last name must have more or equal then 1 characters'],
        maxlength: [50, 'Last name must have less or equal then 50 characters']
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        lowercase: true,
        trim: true,
        validate: {
            validator: function (el) {
                return /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(el);
            },
            message: "Please enter a valid email"
        },
    },
    password: {
        type: String,
        required: [true, 'Password is required'],
        minlength: [6, 'Password must have more or equal then 6 characters'],
        select: false
    },
    passwordConfirm: {
        type: String,
        required: [true, 'Password confirm is required'],
        validate: {
            // this only works on CREATE and SAVE!!!
            validator: function (el) {
                return el === this.password;
            },
            message: "Password and password confirm must be the same"
        },
    },
    isVerified: {
        type: Boolean,
        default: false
    },
    isActive: {
        type: Boolean,
        default: true,
        select: false
    },
    profileImg: {
        type: String,
    },
    role: {
        type: String,
        enum: ['user', 'admin', 'superAdmin'],
        default: 'user'
    },
    refreshToken: {
        type: String,
    },
    createdAt: {
        type: Date,
        default: Date.now(),
        select: false
    },
    passwordChangedAt: {
        type: Date,
    },
    passwordResetToken: {
        type: String,
    },
    passwordResetExpires: {
        type: Date,
    }
});

// add a document middleware to hash the password before save
userSchema.pre('save', async function (next) {
    // only hash the password if it has been modified (or is new)
    if (!this.isModified('password')) return next();

    // hash the password using our new salt
    const hashedPassword = await bcrypt.hash(this.password, 12);
    this.password = hashedPassword;

    // delete passwordConfirm field
    this.passwordConfirm = undefined;
    next();
});

// add a document middleware to update the passwordChangedAt field
userSchema.pre('save', function (next) {
    // only update the passwordChangedAt field if the password has been changed
    if (!this.isModified('password') || this.isNew) return next();

    // update the passwordChangedAt field with -1000 ms to safapass the JWT time stamp
    this.passwordChangedAt = Date.now() - 1000;
    next();
});

// add a query middleware to find only active users
userSchema.pre(/^find/, function (next) {
    // this points to the current query
    this.find({ isActive: { $ne: false } });
    next();
});

// add an instance method to compare the password to the hashed password
userSchema.methods.isPasswordCorrect = async function (candidatePassword, userPassword) {
    return await bcrypt.compare(candidatePassword, userPassword);
};

// add an instance method to check if the password has been changed after a token was issued
userSchema.methods.hasPasswordChangedAfter = function (JWTTimeStamp) {
    if (this.passwordChangedAt) {
        const changedAt = parseInt(this.passwordChangedAt.getTime() / 1000, 10);
        return JWTTimeStamp < changedAt;
    };
    // if there is no passwordChangedAt field, then the password has not been changed
    // false means that the password has not been changed
    return false;
};

// add an instance method to create a reset password token
userSchema.methods.createPasswordResetToken = async function () {
    try {
        // generate a random token
        let resetToken = await promisify(crypto.randomBytes)(32);
        resetToken = resetToken.toString('hex');

        // hash the token and set the passwordResetToken field
        this.passwordResetToken = crypto
            .createHash('sha256')
            .update(resetToken)
            .digest('hex');

        // set the passwordResetExpires field
        this.passwordResetExpires = Date.now() + 10 * 60 * 1000;

        return resetToken;
    } catch (err) {
        throw new AppError(500, err.message);
    }
};

const User = mongoose.model('User', userSchema);

module.exports = User;