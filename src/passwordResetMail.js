/**
 * Created by StarkX on 06-Jan-18.
 */
const nodeMailer = require('nodemailer');
const fs = require('fs');
const handlebars = require('handlebars');

const transporter = nodeMailer.createTransport({
    service : 'gmail',
    auth : {
        user : xConfig.mail.email,
        pass : xConfig.mail.password
    }
});
const htmlTemplate = handlebars.compile(fs.readFileSync('static/Reset.html', { encoding : 'utf-8' }));

module.exports = (emailID, userName, link) => {
    "use strict";
    
    let replacements = {
        appName : xConfig.appName,
        userName : userName,
        link : link,
        duration : xConfig.crypto.JwtExpiration
    };
    
    let options = {
        from : xConfig.mail.email,
        to : emailID,
        subject : xConfig.appName + ' Password Reset',
        html : htmlTemplate(replacements)
    };
    
    return new Promise((resolve, reject) => {
        transporter.sendMail(options, (err, info) => {
            resolve(err);
        });
    });
};