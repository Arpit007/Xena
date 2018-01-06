/**
 * Created by StarkX on 06-Jan-18.
 */
const nodeMailer = require('nodemailer');
const fs = require('fs');
const path = require('path');
const handlebars = require('handlebars');

const transporter = nodeMailer.createTransport({
    service: 'gmail',
    auth:{
        user: xConfig.mail.email,
        pass: xConfig.mail.password
    }
});

const htmlTemplate = handlebars.compile(fs.readFileSync(path.join(__dirname, '../static/Reset.html'), {encoding: 'utf-8'}));

module.exports = (email, userName, link, callback) => {
    "use strict";
    
    let replacements={
        appName: xConfig.appName,
        userName: userName,
        link: link,
        duration: xConfig.crypto.JwtExpiration
    };
    
    let options={
        from: xConfig.mail.email,
        to : email,
        subject : xConfig.appName + ' Password Reset',
        html : htmlTemplate(replacements)
    };
    
    transporter.sendMail(options, (err, info)=>{
       if(err) console.log(err);
       callback(err);
    });
};