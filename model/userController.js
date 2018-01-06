/**
 * Created by StarkX on 05-Jan-18.
 */
const user = require('./user');
const bCrypt = require('bcrypt');
const rand = require('random-key');
const dateDiff = require('date-diff');

const statusCode = require('./statusCode');

user.createUser = (userName, email, password) => {
    const Count = Math.floor(Math.random() * (xConfig.crypto.MaxPasswordIterations - xConfig.crypto.MinPasswordIterations))
        + xConfig.crypto.MinPasswordIterations;
    
    return bCrypt.genSalt(Count)
        .then((salt) => {
            "use strict";
            bCrypt.hash(password, salt)
                .then((hash) => {
                    return user
                        .create({
                            userName : userName,
                            email : email,
                            password : hash
                        })
                        .catch((e) => {
                            "use strict";
                            console.log(e);
                            return null;
                        });
                });
        });
};

user.getUser = (identifier) => {
    return user
        .findOne({ $or : [ { userName : identifier }, { email : identifier } ] })
        .catch((e) => {
            "use strict";
            console.log(e);
            return null;
        });
};

user.authorise = (identifier, password) => {
    "use strict";
    return user.getUser(identifier)
        .then((user) => {
            if (!user)
                throw statusCode.UserDoesNotExists;
            return bCrypt.compare(password, user.password);
        })
        .catch((e) => {
            console.log(e);
            throw statusCode.InternalError;
        });
};

user.generateResetToken = (identifier) => {
    "use strict";
    return user.getUser(identifier)
        .then((User) => {
            if (!User)throw statusCode.UserDoesNotExists;
            User.reset.Token = rand.generate(xConfig.crypto.TokenSaltLength);
            User.reset.Expiry = new Date();
            return User.save()
                .then(() => User.reset.Token)
                .catch((e) => {
                    console.log(e);
                    throw statusCode.InternalError;
                })
        });
};

user.resetTokenValidity = (User, Token) => {
    "use strict";
    if (!User.reset.Expiry)
        throw statusCode.BadRequest;
    const diff = new dateDiff(new Date(), User.reset.Expiry);
    if (diff.hours() > xConfig.crypto.ResetTokenExpiry)
        throw statusCode.Timeout;
    return (User.crypto.Token === Token);
};

user.changePassword = (User, newPassword) => {
    "use strict";
    const Count = Math.floor(Math.random() * (xConfig.crypto.MaxPasswordIterations - xConfig.crypto.MinPasswordIterations))
        + xConfig.crypto.MinPasswordIterations;
    
    return bCrypt.genSalt(Count)
        .then((salt) => {
            "use strict";
            bCrypt.hash(newPassword, salt)
                .then((hash) => {
                    User.password = hash;
                    User.reset.Token = null;
                    User.reset.Expiry = null;
                    return User.save()
                        .then(() => User)
                        .catch((e) => {
                            console.log(e);
                            throw statusCode.InternalError;
                        })
                });
        });
};

module.exports = user;