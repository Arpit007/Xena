const path = require('path');
const cors = require('cors');
const logger = require('morgan');
const helmet = require('helmet');
const express = require('express');
const flash = require('express-flash');
const favicon = require('serve-favicon');
const bodyParser = require('body-parser');
const session = require('express-session');
const compression = require('compression');
const cookieParser = require('cookie-parser');

const index = require('./routes/index');
const api = require('./routes/api');

const app = express();

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(session({
    secret : xConfig.crypto.SessionKey,
    resave : false,
    saveUninitialized : true,
    cookie : { secure : true }
}));
app.use(flash());

//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(cors());
app.use(helmet());
app.use(compression());
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended : false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', index);
app.use('/api', api);

app.use(function (req, res, next) {
    const err = new Error('Not Found');
    err.status = 404;
    next(err);
});

app.use(function (err, req, res, next) {
    res.locals.message = err.message;
    res.locals.error = req.app.get('NODE_ENV') === 'development' ? err : {};
    res.status(err.status || 500);
    res.render('error');
});

module.exports = app;