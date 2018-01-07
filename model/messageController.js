/**
 * Created by StarkX on 06-Jan-18.
 */
const message = require('./message');
const user = require('./userController');

message.createMessage = (conversationID, mType, content, author) => {
    "use strict";
    return message.create({
        conversationID : conversationID,
        mType : mType,
        content : content,
        author : author
    }).then((message) => {
        return user.getUserByID(author)
            .then((User) => {
                message._doc.authorName = User.userName;
                return message;
            });
    });
};

module.exports = message;