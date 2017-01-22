import * as express from 'express'
import * as logger from 'morgan'
import { json as JsonParser, urlencoded as UrlEncParser } from 'body-parser'
import { Application, Request, Response, NextFunction, RequestHandler } from 'express'
import * as cookieParser from 'cookie-parser'
import { MongoClient, Db, ObjectID } from 'mongodb'
import * as session from 'express-session'
import * as path from 'path'
import * as handlebars from 'express-handlebars'

import { Flames } from '.'

const MongoDBStore = require('connect-mongodb-session')(session)
const uuid = require('node-uuid')
const md5 = require('md5')

const flame = new Flames({
    path: path.join(__dirname, '..', 'content'),
    defaultTpl: 'first',
    globalData: {
        siteName: 'Hitko',
        metaTitle: 'HitkoDev'
    }
})

export const app = express()
app.use(logger('combined'))
app.disable('x-powered-by')
app.use(JsonParser({
    limit: '1mb'
}))
app.use(UrlEncParser({
    extended: true
}))
app.use(cookieParser())
app.engine('hbs', handlebars({
    defaultLayout: 'main',
    extname: '.hbs',
    layoutsDir: path.join(__dirname, '..', 'views/layouts/'),
    partialsDir: path.join(__dirname, '..', 'views/partials/')
}))
app.set('view engine', 'hbs')
app.enable('view cache')

//const dbPromise = MongoClient.connect(constants.mongo)

app.use((req, res, next) => {
    res.set({
        'Cache-Control': 'private, no-cache, no-store, must-revalidate, max-age=0',
        'Expires': '-1',
        'Pragma': 'no-cache'
    })
    next()
})

app.use('/', flame.router)

app.use((req, res, next) => {
    let err = new Error("Page not found")
    err['status'] = 404
    next(err)
})

app.use((err, req: Request, res: Response, next: NextFunction) => {
    res.status(err.status || 500)
    res.send({
        status: false,
        error: {
            message: err.message,
            info: (err.stack)
        }
    })
})

function serve(port: number = 5967) {
    let instance = parseInt(process.env.NODE_APP_INSTANCE || '0') + port
    return app.listen(instance, () => console.log('Example app listening on port ' + instance + '!'))
}

const server = serve()