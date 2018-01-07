/**
 * Created by StarkX on 05-Jan-18.
 */
const user = require('./user');
const bCrypt = require('bcrypt');
const rand = require('random-key');
const jwt = require('jsonwebtoken');

const statusCode = require('./statusCode');

const hashCount = () => {
    "use strict";
    return Math.floor(Math.random() * (xConfig.crypto.MaxPasswordIterations - xConfig.crypto.MinPasswordIterations))
        + xConfig.crypto.MinPasswordIterations;
};

const comparePassword = (realPassword, password) => {
    "use strict";
    return new Promise((resolve, reject) => {
        bCrypt.compare(realPassword, password, function (err, valid) {
            if (err) reject(err);
            else resolve(valid);
        });
    });
};

user.createUser = (userName, email, password) => {
    return new Promise((resolve, reject) => resolve())
        .then(() => {
            "use strict";
            if (password.length < xConfig.crypto.MinPasswordLength)
                throw statusCode.PasswordShort;
            if (password.length > xConfig.crypto.MaxPasswordLength)
                throw statusCode.PasswordLong;
        }).then(() => {
            return user
                .findOne({ $or : [ { userName : userName }, { email : email } ] })
                .then((users) => {
                    "use strict";
                    if (users && users.length > 0)
                        throw statusCode.UserAlreadyExists;
                    return bCrypt.genSalt(hashCount())
                        .then((salt) => bCrypt.hash(password, salt))
                        .then((hash) => {
                            return user
                                .create({
                                    userName : userName,
                                    email : email,
                                    password : hash
                                });
                        })
                        .catch((e) => {
                            "use strict";
                            console.log(e);
                            throw statusCode.InternalError;
                        });
                });
        });
};

user.getUser = (identifier, throwOnNull = false) => {
    return user
        .findOne({ $or : [ { userName : identifier }, { email : identifier } ] })
        .then((user) => {
            "use strict";
            if (!user && throwOnNull)
                throw statusCode.UserDoesNotExists;
            return user;
        })
        .catch((e) => {
            "use strict";
            console.log(e);
            return null;
        });
};

user.getUserByID = (id) => {
    return user
        .findById(id)
        .catch((e) => {
            "use strict";
            console.log(e);
            return null;
        });
};

user.authorise = (identifier, password) => {
    "use strict";
    return user.getUser(identifier, true)
        .then((user) => comparePassword(password, user.password))
        .then((validity) => {
            if (!validity)
                throw statusCode.Unauthorized;
            return user;
        });
};

user.generateResetToken = (identifier) => {
    "use strict";
    return user.getUser(identifier, true)
        .then((User) => {
            User.resetToken = jwt.sign({
                userID : User._id.toString(),
                key : rand.generate(xConfig.crypto.ResetTokenLength)
            }, xConfig.crypto.TokenKey, { expiresIn : xConfig.crypto.JwtExpiration * 60 * 60 });
            return User.save()
                .then(() => User)
                .catch((e) => {
                    console.log(e);
                    throw statusCode.InternalError;
                })
        });
};

user.resetTokenValidity = (User, Token) => {
    "use strict";
    return (User.reset.Token === Token);
};

user.changePassword = (User, newPassword) => {
    "use strict";
    return bCrypt.genSalt(hashCount())
        .then((salt) => bCrypt.hash(newPassword, salt))
        .then((hash) => {
            User.password = hash;
            User.reset.Token = null;
            User.reset.Expiry = null;
            return User.save()
                .then(() => User)
                .catch((e) => {
                    console.log(e);
                    throw statusCode.InternalError;
                });
        });
};

module.exports = user;