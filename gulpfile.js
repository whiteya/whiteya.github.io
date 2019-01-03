const gulp = require('gulp');
const gulpIf = require('gulp-if');
const eslint = require('gulp-eslint');
const newer = require('gulp-newer');
const imagemin = require('gulp-imagemin');
const useref = require('gulp-useref');
const uglify = require('gulp-uglify');
const sass = require('gulp-sass');
const cssnano = require('gulp-cssnano');
const htmlmin = require('gulp-htmlmin');
const del = require('del');
const babel = require('gulp-babel');

// Not sure about this^, hides dependencies
const path = {
  build: 'dist/',
  tmp: '.tmp/',
  src: 'src/'
};

/* Future
 * - watches
 */

gulp.task('lint', function() {
  return gulp.src(path.src + 'scripts/**/*.js')
    .pipe(eslint())
    .pipe(eslint.format());
});

gulp.task('js', function() {
  return gulp.src(path.src + 'scripts/**/*.js')
    .pipe(babel())
    .pipe(gulp.dest(path.tmp + 'scripts/'));
});

gulp.task('images', function() {
  var out = path.build + 'images/';
  return gulp.src(path.src + 'images/**/*')
    .pipe(newer(out))
    .pipe(imagemin({
      optimizationLevel: 5,
      interlaced: true
    }))
    .pipe(gulp.dest(out));
});

gulp.task('styles', function() {
  var out = path.tmp + 'styles/';
  return gulp.src(path.src + 'styles/**/*.+(css|scss)')
    .pipe(newer(out))
    .pipe(sass())
    .pipe(gulp.dest(out));
});

gulp.task('html', function() {
  return gulp.src(path.src + '**/*.html')
    .pipe(gulp.dest(path.tmp));
});

gulp.task('concat-min', function() {
  return gulp.src(path.tmp + '**/*.html')
    .pipe(useref())
    .pipe(gulpIf('*.js', uglify()))
    .pipe(gulpIf('*.css', cssnano({
      preset: ['default', {
        normalizeUrl: true
      }]
    })))
    .pipe(gulpIf('*.html', htmlmin()))
    .pipe(gulp.dest(path.build));
});

gulp.task('clean', function() {
  return del([path.build, path.tmp]);
});

gulp.task('default',
  gulp.series(
    'clean',
    gulp.parallel('lint', 'js', 'images', 'styles', 'html'),
    'concat-min'
  )
);
