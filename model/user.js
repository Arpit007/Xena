/**
 * Created by StarkX on 05-Jan-18.
 */
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const userSchema = new Schema({
    userName : { type : String, required : true, trim : true, unique : true, index : true },
    email : { type : String, required : true, trim : true, index : true },
    password : { type : String, required : true },
    isAdmin : { type : Boolean, default : false }
});

module.exports = mongoose.model('User', userSchema);