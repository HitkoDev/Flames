const gulp = require('gulp')
const flames = require('./dist')
const md = require('markdown-it')()

gulp.task('default', () => {
    return gulp.src('./src/content/**/*.json')
        .pipe(flames.chain([
            (files) => {
                return new Promise((resolve, reject) => {
                    files.forEach(file => {
                        if (file.flContents)
                            file.flContents.content = md.render(file.flContents.content)
                    })
                    resolve(files)
                })
            }
        ]))
        .pipe(gulp.dest('./content'))
})