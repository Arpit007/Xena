/**
 * Created by StarkX on 06-Jan-18.
 */
const jwt = require('jsonwebtoken');

const model = require('../model/model');
const response = require('../model/response');
const statusCode = require('../model/statusCode');
const ObjectID = require('mongoose').Types.ObjectId;

const Connections = {};

//To send message
//{mType,content,isGlobal, otherUser, token}
function sendMessage(socket, payload) {
    try {
        let userID = jwt.verify(payload.token, xConfig.crypto.TokenKey).userID;
        
        let task = () => {
            "use strict";
            let Query;
            try {
                if (payload.isGlobal)
                    Query = model.conversation.getGlobalConversation();
                else Query = model.conversation.getConversationByUsers(socket.userID, payload.otherUser);
            }
            catch (e) {
                console.log(e);
                throw statusCode.InternalError;
            }
            return Query.then((conversation) => {
                "use strict";
                let process = (conversation) => {
                    return model.message.createMessage(conversation._id.toString(), payload.mType, payload.content, ObjectID(socket.userID))
                        .then((message) => {
                            conversation.participants.forEach((participant) => {
                                let arr = Connections[ participant.toString() ];
                                if (arr) {
                                    arr.forEach((sock) => {
                                        if (sock !== socket)
                                            sock.emit('onReceive', message);
                                    });
                                }
                            });
                        })
                        .catch((e) => {
                            console.log(e);
                            throw statusCode.InternalError;
                        });
                };
                if (!conversation)
                    return model.conversation.createConversation(socket.userID, payload.otherUser)
                        .then((conversation) => process(conversation));
                else return process(conversation);
            });
        };
        
        let process;
        if (!payload.isGlobal)
            process = model.user.getUsers([ userID, payload.otherUser ])
                .then((users) => {
                    if (users.length !== 2)
                        throw statusCode.BadRequest;
                    return task();
                });
        else process = task();
        
        return process.catch((e) => socket.emit('onError', response(e)));
    }
    catch (e) {
        return socket.emit('onError', response(statusCode.Unauthorized));
    }
}

function getUserList() {
    let UserList = { admin : [], other : [] };
    return model.user.find({}, { _id : 1, userName : 1, isAdmin : 1 })
        .then((users) => {
            "use strict";
            users.forEach((user) => {
                if (user.isAdmin)
                    UserList.admin.push(user);
                else UserList.other.push(user);
            });
            return UserList;
        })
        .catch((e) => {
            "use strict";
            console.log(e);
            return [];
        });
}

function NotifyAll() {
    return getUserList()
        .then((UserList) => {
            "use strict";
            for (let key in Connections) {
                Connections[ key ].forEach((sock) => {
                    "use strict";
                    sock.emit('list', UserList);
                });
            }
        });
}

function Leave(socket) {
    if (Connections[ socket.userID ]) {
        let index = Connections[ socket.userID ].indexOf(socket);
        if (index !== -1) {
            Connections[ socket.userID ].splice(index, 1);
            if (Connections[ socket.userID ].length === 0)
                delete Connections[ socket.userID ];
        }
    }
}

function AttachEvents(socket) {
    "use strict";
    socket.on('send', (payload) => sendMessage(socket, payload));
    socket.on('allList', () => socket.emit('list', getUserList()));
}

const connect = (app) => {
    const io = require('socket.io').listen(app);
    
    io.on('connection', (socket) => {
        socket.on('verify', function (token) {
            "use strict";
            try {
                let payload = jwt.verify(token, xConfig.crypto.TokenKey);
                const userID = payload.userID;
                
                let process = () => {
                    socket.userID = userID;
                    Connections[ userID ].push(socket);
                    AttachEvents(socket);
                    socket.emit('connectionSuccess');
                };
                
                if (!(userID in Connections)) {
                    return model.user.getUserByID(ObjectID(userID), true)
                        .then((user) => {
                            Connections[ userID ] = [];
                            socket.userName = user.userName;
                            socket.isAdmin = user.isAdmin;
                        })
                        .then(() => process());
                }
                else return new Promise((resolve, reject) => resolve())
                    .then(() => {
                        socket.userName = Connections[ userID ][ 0 ].userName;
                        socket.isAdmin = Connections[ userID ][ 0 ].isAdmin;
                    })
                    .then(() => process())
                    .catch((e) => socket.emit('onError', response(e)));
                
            }
            catch (e) {
                socket.emit('UnAuthorised');
            }
        });
        
        socket.on('disconnect', () => {
            console.log('Disconnected: ' + socket.userName);
            Leave(socket);
        });
    });
};

const broadcastMessage = (conversation, messages) => {
    "use strict";
    return new Promise((resolve, reject) => resolve())
        .then(() => {
            messages.forEach((message) => {
                message = message.message;
                conversation.participants.forEach((participant) => {
                    let arr = Connections[ participant.toString() ];
                    if (arr) {
                        arr.forEach((sock) => {
                            sock.emit('onReceive', message);
                        });
                    }
                });
            });
        });
};

module.exports = {
    connect : connect,
    broadcastMessage : broadcastMessage,
    NotifyNewSignUp : NotifyAll
};