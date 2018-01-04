/**
 * Created by Home Laptop on 05-Jan-18.
 */
const mongoose = require('mongoose');
const promise = require('bluebird');

mongoose.Promise = promise;

model.exports = (dbUrl) => {
    "use strict";
    mongoose.connect(dbUrl, function (err) {
        if (err)return console.log(err);
        console.log("MongoDB Successfully Connected");
    })
};