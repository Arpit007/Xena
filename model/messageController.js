/**
 * Created by StarkX on 06-Jan-18.
 */
const message = require('./message');

message.createMessage = (conversationID, mType, content, author) => {
    "use strict";
    return message.create({
        conversationID : conversationID,
        mType : mType,
        content : content,
        author : author
    });
};

module.exports = message;