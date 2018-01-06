/**
 * Created by StarkX on 05-Jan-18.
 */
const mongoose = require('mongoose');

const Schema = mongoose.Schema;
const ObjectID = Schema.ObjectId;

const conversationSchema = new Schema({
    participants : [ { type : ObjectID, ref : 'User' } ],
    global : { type : Boolean, default : false }
});

module.exports = mongoose.model('Conversation', conversationSchema);
