/**
 * Created by StarkX on 06-Jan-18.
 */
/**
 * Created by Home Laptop on 06-Nov-17.
 */
const Connections = {};

module.exports = function (app) {
    const io = require('socket.io').listen(app);
    
    io.on('connection', function (socket) {
        socket.on('verify', function (_ID) {
        });
        
        socket.on('disconnect', function () {
            console.log('Disconnected: ' + socket.UserName);
            delete Connections[ socket.UserID ];
        });
    });
};