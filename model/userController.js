/**
 * Created by StarkX on 05-Jan-18.
 */
const userSchema = require('./user');

userSchema.createUser = (userName, email, password) => {
    return userSchema
        .create({
            userName : userName,
            email : email,
            password : password
        })
        .catch((e) => {
            "use strict";
            console.log(e);
            return null;
        });
};

userSchema.getUser = (identifier) => {
    return userSchema
        .findOne({ $or : { userName : identifier, email : identifier } })
        .catch((e) => {
            "use strict";
            console.log(e);
            return null;
        });
};