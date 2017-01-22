# Flames

> *Static*
>
> *But dynamic*
>
> *But still static*
>
> &ndash; (almost) James Franco

## Quickstart

Flames contains a Gulp plugin for building static content, and an Expressjs middleware to deliver that content. Install with `npm install --save flames-cms`, then use in a Gulp task:

```javascript
const gulp = require('gulp')
const flames = require('flames')
const md = require('markdown-it')()

gulp.task('default', () => {
    return gulp.src('./src/content/**/*.json') 
        .pipe(flames.chain([

            // A simple function to parse markdown content
            (files) => {
                return new Promise((resolve, reject) => {
                    files.forEach(file => {
                        // Only transform Flames content files
                        if (file.flContents)
                            file.flContents.content = md.render(file.flContents.content)
                    })
                    resolve(files)
                })
            }

        ]))

        .pipe(gulp.dest('./content'))
})
```

and in your Expressjs app:

```javascript
const flames = require('flames')

const flame = new flames.Flames({
    // Where to look for Flames content files (the destination directory of the Gulp task)
    path: path.join(__dirname, 'content'),

    // Default template (files may define custom templates)
    defaultTpl: 'first',

    // Any common data (will be added to the loaded content)
    globalData: {
        siteName: 'My great site',
        metaTitle: 'Generic meta title'
    }
})

/**
 * Use Flames for paths starting with /blog, e.g. /blog/2017-01-22 will render
 * the data from /content/2017-01-22.bson file (if /content/2017-01-22 is a directory,
 * the /content/2017-01-22/__index.bson file will be loaded instead)
 */
app.use('/blog', flame.router)
```

## It's static, except when it's not

You compile your LESS / SASS, you transpile and minify your scripts, you precompile your templates - all to make the site lighter and faster. And the next thing you do is upload these files, along with a some of photos / images and a nice admin interface, to your server. 

And when you're waiting for the whole thing to upload, a thought occurs: '**Does my website really need all that?**'

The truth is in most cases it doesn't. An average site has only a few contributors, and even if parts of the website are dynamic, the majority of content isn't. A list of blog posts only changes when you publish a new post, the documentation and the download link for your part-time project only change when you publish a new release, the content of a gallery only changes when you upload / delete photos, and the higly dynamic pages usually don't affect the navigation bar items.

### Isn't that what the cache is for?

In some cases yes. However, the cache system has only a limited understanding of how different parts of the website interact. And if you're going to use it, you may as well upload the precompiled cache files to the server to speed up the proces.

## So what's the deal?

The deployed site should use as little resources as possible - that's why you bother uploading minified versions of scripts and stylesheets. With Flames, you can extrapolate that approach to the resot of the site. Instead of installing plugins and modules on your server, you install them on your computer.

### With Falmes, you can:

 * Let your computer do the hard work, such as resizing images or converting videos
 * Use the same precompiled content either to render your site on the server, to dynamicly load and render it client-side, or as a content endpoint for your app
 * Use any Expressjs-compatible template engine
 * Pick from [one the world's largest extensions repositories](https://www.npmjs.com/)
 * Use a [single build system](http://gulpjs.com/) for the whole website
 * Have a [good versioning system](https://git-scm.com/) for your content
 * Edit and preview changes locally before publishing them
 * Use tools without having to worry about installing them on a shared hosting server