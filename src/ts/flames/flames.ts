import { RequestHandler, Router } from 'express'
import * as fs from 'fs'
import * as path from 'path'

const BSON = require('bson')
const bson = new BSON()

const defaults = {
    cache: true,
    cacheLife: 1000 * 60 * 60,
    globalData: {}
}

export function getSafePath(url: string): string {
    url = (url || '').trim()
    let sURL = path.normalize(url).replace(/\\/gm, '/')
    if (sURL.endsWith('/'))
        sURL = sURL.substr(0, sURL.length - 1)
    console.log(url, sURL)

    let i = 0
    while (i < sURL.length && (sURL.charAt(i) == '.' || sURL.charAt(i) == '/'))
        i++

    return sURL.substr(i) || ''
}

export function readFilePromise(file: string) {
    return new Promise<Buffer>((resolve, reject) => {
        fs.readFile(file, (err, _data) => {
            if (err)
                return reject(err)
            resolve(_data)
        })
    })
}

export class Flames {

    public router: Router
    private cache: {
        [key: string]: {
            timestamp: Date,
            dataPromise: Promise<any>
        }
    } = {}

    constructor(private config: { [key: string]: any }) {
        this.config = Object.assign({}, defaults, config)

        this.router = Router()
        this.router.use((req, res, next) => {
            this.getData(req.path)
                .then((data) => res.render(data.tpl, data))
                .catch(err => next(err))
        })
    }

    public getData(urlPath: string, safe: boolean = true): Promise<any> {
        if (safe)
            urlPath = getSafePath(urlPath)

        if (this.config['cache'] && urlPath in this.cache) {
            let d = new Date()
            d.setTime(d.getTime() - this.config['cacheLife'])
            if (this.cache[urlPath].timestamp > d)
                return this.cache[urlPath].dataPromise
        }

        let pr = (urlPath ? readFilePromise(path.join(this.config['path'], urlPath) + '.bson') : Promise.reject({}))
            .catch(err => readFilePromise(path.join(this.config['path'], urlPath, '__index') + '.bson'))
            .then(_data => {
                let data = bson.deserialize(_data)
                data.tpl = this.resolveTpl(data)
                return Object.assign({}, this.config['globalData'], data)
            })

        if (this.config['cache'])
            this.cache[urlPath] = {
                timestamp: new Date(),
                dataPromise: pr
            }

        return pr
    }

    public resolveTpl(data) {
        let tpl = data.tpl || ''
        if (!tpl && this.config['tplResolver'])
            tpl = this.config['tplResolver'](data)

        if (!tpl && this.config['defaultTpl'])
            tpl = this.config['defaultTpl']

        return tpl
    }

}