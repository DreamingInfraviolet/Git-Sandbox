"use strict;"

var gulp = require('gulp');
var ts = require('gulp-typescript');
var stylus = require('gulp-stylus');
var browserSync   = require('browser-sync').create();
var requirejsOptimize = require('gulp-requirejs-optimize');
var concatCss = require('gulp-concat-css');
var flatten = require('gulp-flatten');
var cleanCSS = require('gulp-clean-css');
var jsConcat = require('gulp-concat');
var uglify = require('gulp-uglify');
var del = require('del');
var vinylPaths = require('vinyl-paths');

var pathTypescript = 'src/js/**/*.ts';
var pathStylus     = 'src/css/**/*.styl';
var pathHtml       = 'src/html/**/*.html';
var pathThirdParty = 'src/third_party/**/*';

function onError(err) {
  console.log(err);
  this.emit('end');
}

var cleanCssOptions = {
    advanced: true,
    aggressiveMerging: true,
    compatibility: "ie8",
}

var browser = function() {
}

/////////////////////////////////// Stylus ////////////////////////////////////

gulp.task('stylus', function () {
  return gulp.src(pathStylus)
    .pipe(stylus())
    .on('error', onError)
    .pipe(cleanCSS(cleanCssOptions))
    .on('error', onError)
    .pipe(gulp.dest('build/css/'))
    .pipe(browserSync.reload({stream:true}));
});

///////////////////////////////// Typescript //////////////////////////////////

var tsProject = ts.createProject({
    declaration: true,
    module: "amd",
});

gulp.task('typescript-compile', function () {
    return gulp.src(pathTypescript)
        .pipe(ts(tsProject))
        .on('error', onError)
        .pipe(gulp.dest('build/compiled-js/'));
});

gulp.task('typescript-optimise', ['typescript-compile'], function () {
    return gulp.src('build/compiled-js/**/*.js')
        .pipe(requirejsOptimize({
            insertRequire: ['main']
        }))
        //.pipe(uglify())
        .pipe(gulp.dest('build/js/'))
        .pipe(browserSync.reload({stream:true}));
});

gulp.task('clean:typescript', ['typescript-optimise'], function () {
  return gulp.src(['build/compiled-js', 'build/js/**/*.js', '!build/js/main.js'])
    .pipe(vinylPaths(del));
});

gulp.task('typescript', ['clean:typescript']);

///////////////////////////////// Third Party /////////////////////////////////

gulp.task('third-party-js', function() {
    return gulp.src(['src/third_party/jquery.min.js',
                     'src/third_party/gitgraph/gitgraph.js',
                     'src/third_party/bootstrap.min.js',
                     'src/third_party/bootstrap-color-picker/js/bootstrap-colorpicker.min.js',
                     'src/third_party/malihu-custom-scrollbar-plugin/jquery.mCustomScrollbar.concat.min.js',
                     'src/third_party/sweetalert.min.js',
                     'src/third_party/almond.min.js',])
        .pipe(jsConcat('all.concat.min.js'))
        .pipe(uglify())
        .pipe(gulp.dest('build/third_party/'))
        .pipe(browserSync.reload({stream:true}));
});

gulp.task('third-party-css', function() {
    return gulp.src('src/third_party/**/*.css')
        .pipe(concatCss("all.concat.min.css"))
        .pipe(cleanCSS(cleanCssOptions))
        .on('error', onError)
        .pipe(gulp.dest('build/third_party/'))
        .pipe(browserSync.reload({stream:true}));
});

gulp.task('third-party-colorpicker-img', function() {
    return gulp.src(['src/third_party/bootstrap-color-picker/**/*'])
        .pipe(gulp.dest('build/third_party/bootstrap-color-picker'))
        .pipe(browserSync.reload({stream:true}));
});

gulp.task('third-party', ['third-party-js', 'third-party-css', 'third-party-colorpicker-img']);

//////////////////////////////////// Copy /////////////////////////////////////

gulp.task('copy-favicon', function() {
    return gulp.src("src/favicon.ico")
        .pipe(gulp.dest('build/'))
        .pipe(browserSync.reload({stream:true}));
});

gulp.task('copy-html', function() {
    return gulp.src(pathHtml)
        .pipe(gulp.dest('build/'))
        .pipe(browserSync.reload({stream:true}));
});

//////////////////////////////////// Main /////////////////////////////////////

gulp.task('build', ['copy-favicon', 'third-party', 'stylus', 'typescript',
                    'copy-html']);

gulp.task('watch', function() {
    gulp.watch(pathStylus, ['stylus']);
    gulp.watch(pathThirdParty, ['third-party']);
    gulp.watch(pathTypescript, ['typescript']);
    gulp.watch(pathHtml, ['copy-html']);
});

gulp.task('init-browser', function() {
    browserSync.init({
            server: "build",
            injectChanges: true
    });
    browser = function() {
        return browserSync.reload({stream:true});
    }
})

gulp.task('server', ['init-browser', 'build', 'watch']);

gulp.task('default', ['build']);
