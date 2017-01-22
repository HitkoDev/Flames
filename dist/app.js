"use strict";
const express = require("express");
const logger = require("morgan");
const body_parser_1 = require("body-parser");
const cookieParser = require("cookie-parser");
const session = require("express-session");
const path = require("path");
const handlebars = require("express-handlebars");
const _1 = require(".");
const MongoDBStore = require('connect-mongodb-session')(session);
const uuid = require('node-uuid');
const md5 = require('md5');
const flame = new _1.Flames({
    cache: false,
    path: path.join(__dirname, '..', 'content'),
    defaultTpl: 'first',
    globalData: {
        siteName: 'Hitko',
        metaTitle: 'HitkoDev'
    }
});
exports.app = express();
exports.app.use(logger('combined'));
exports.app.disable('x-powered-by');
exports.app.use(body_parser_1.json({
    limit: '1mb'
}));
exports.app.use(body_parser_1.urlencoded({
    extended: true
}));
exports.app.use(cookieParser());
exports.app.engine('hbs', handlebars({
    defaultLayout: 'main',
    extname: '.hbs',
    layoutsDir: path.join(__dirname, '..', 'views/layouts/'),
    partialsDir: path.join(__dirname, '..', 'views/partials/')
}));
exports.app.set('view engine', 'hbs');
//const dbPromise = MongoClient.connect(constants.mongo)
exports.app.use((req, res, next) => {
    res.set({
        'Cache-Control': 'private, no-cache, no-store, must-revalidate, max-age=0',
        'Expires': '-1',
        'Pragma': 'no-cache'
    });
    next();
});
exports.app.use('/', flame.router);
exports.app.use((req, res, next) => {
    let err = new Error("Page not found");
    err['status'] = 404;
    next(err);
});
exports.app.use((err, req, res, next) => {
    res.status(err.status || 500);
    res.send({
        status: false,
        error: {
            message: err.message,
            info: (err.stack)
        }
    });
});
function serve(port = 5967) {
    let instance = parseInt(process.env.NODE_APP_INSTANCE || '0') + port;
    return exports.app.listen(instance, () => console.log('Example app listening on port ' + instance + '!'));
}
const server = serve();
//# sourceMappingURL=app.js.map