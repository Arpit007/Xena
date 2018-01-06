/**
 * Created by StarkX on 05-Jan-18.
 */
const mongoose = require('mongoose');

const Schema = mongoose.Schema;
const ObjectID = Schema.ObjectId;
const messageType = require('./messageType');

const messageSchema = new Schema({
    conversationID : { type : ObjectID, ref : 'Conversation', required : true },
    mType : {
        type : String,
        enum : [ messageType.TEXT, messageType.FILE, messageType.IMAGE, messageType.VIDEO ],
        default : messageType.TEXT
    },
    content : String,
    author : { type : ObjectID, ref : 'User' }
}, {
    timestamps : true
});

module.exports = mongoose.model('Message', messageSchema);