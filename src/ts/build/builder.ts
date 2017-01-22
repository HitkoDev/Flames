const BSON = require('bson')
const through = require('through2')
const Vinyl = require('vinyl')
const path = require('path')
const fs = require('fs')

const bson = new BSON()

const regex = new RegExp('[^0-9a-zA-Z\u1E00-\u1EFF\u0100-\u017F\u0180-\u024F\.\_]+', 'igum')

import * as VinylFile from 'vinyl'

export interface FlamesFile extends VinylFile {
    flContents: any
    parents: Array<string>
    name: string
}

/**
 * Chain Flames transformations on files, and encode transformed content as BSON
 * 
 *  * If content is a JSON or BSON buffer, it gets parsed first
 *  * If any of the content attributes ends with 'File' (e.g. ```contentFile: 'index.md'```), the path will be resolved relatively to the file.path (rooted in file.base). The contents of the file will be loaded in the attribute without the name (e.g. ```content: 'index.md content'```)
 *  * Transformation takes the array of files, and returns either an array of transformed files, or an coresponding Promise
 *  * Transformation should allways do the ```if (file.flContents)``` check before manipulating file
 *  * If transformation creates aditional files, they should be returned as Flames Files (page content) or Vinyl Files (other resources, such as images, scripts, etc.) These files will in turn get passed to the gulp system for further handling
 */
export function chain(actions) {

    function transform(file: FlamesFile, encoding, callback) {
        // Load file content as JS object
        try {
            file.flContents = bson.deserialize(file.contents)
        } catch (e) {
            try {
                file.flContents = JSON.parse(file.contents.toString())
            } catch (e1) {

            }
        }

        // If file content is a JS object, pass it through 
        if (file.flContents) {
            let relativeName: string = (path.relative(file.base, file.path) || '').trim()
            let dirName: string = path.dirname(relativeName)
            let name: string = path.basename(relativeName, '.json')

            // Set file props
            if (!('parents' in file)) {
                let parents: Array<string> = dirName.split('/') || []
                if (parents[0] == '.')
                    parents.splice(0)
                parents = parents.map(el => el.replace(regex, '-').replace(/\.+/igm, '.'))
                file.parents = parents
            }
            if (!('name' in file))
                file.name = name

            // Load any external references
            let mp = []
            for (let k in file.flContents) {
                if (k.endsWith('File')) {
                    mp.push(new Promise((resolve, reject) => {
                        let fp = ''

                        if (file.flContents[k].startsWith('/'))
                            fp = path.join(file.base, file.flContents[k].substr(1))
                        else
                            fp = path.join(file.base, dirName, file.flContents[k])

                        fs.readFile(fp, encoding, (err, data) => {
                            if (err)
                                return reject(err)

                            let nk = k.substr(0, k.length - 4)
                            file.flContents[nk] = data
                            delete file.flContents[k]
                            resolve()
                        })
                    }))
                }
            }

            // Once the references are loaded, pass them through async loop of files
            Promise.all(mp).then(() => {
                let i = -1

                function next(files: Array<VinylFile> | Promise<Array<VinylFile>>): Promise<Array<VinylFile>> {
                    i++
                    if (i < actions.length) {
                        if (files instanceof Promise)
                            return files.then(fls => next(actions[i](fls)))
                        else
                            return next(actions[i](files))
                    } else {
                        if (files instanceof Promise)
                            return files
                        else
                            return Promise.resolve(files)
                    }
                }

                return next([file])
            }).then((files: Array<FlamesFile>) => {
                files.forEach(file => {
                    if (file.flContents) {
                        file.path = path.join(file.base, ...file.parents, file.name + '.bson')
                        file.contents = bson.serialize(file.flContents)
                    }
                    this.push(file)
                })
                callback()
            }).catch(err => {
                console.log(err)
                callback(err)
            })
        } else {
            console.log('Files not loaded')
            this.push(file)
            callback()
        }
    }

    return through.obj(transform)
}