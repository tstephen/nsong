var del         = require('del');
var gulp        = require('gulp');
var jshint      = require('gulp-jshint');
var uglify      = require('gulp-uglify');
var concat      = require('gulp-concat');
var less        = require('gulp-less');
var minifyCSS   = require('gulp-minify-css');
var prefix      = require('gulp-autoprefixer');
var replace     = require('gulp-replace');
var scp         = require('gulp-scp2');
var workboxBuild = require('workbox-build');
var zip         = require('gulp-zip');

gulp.task('clean', function(done) {
  return del(['dist'], done);
});

gulp.task('assets', function() {
  return gulp.src([ 'src/**/*.html', 'src/**/*.json' ])
      .pipe(gulp.dest('dist'));
});

gulp.task('scripts', function() {
  return gulp.src([
    'src/js/**/*.js'
  ])
  /*.pipe(concat('main.min.js'))
  .pipe(uglify())*/
  .pipe(gulp.dest('dist/js'));
});

gulp.task('test', function() {
  return gulp.src([
    'src/js/**/*.js',
    '!src/js/vendor/**/*.js'
  ])
  .pipe(jshint())
  .pipe(jshint.reporter('default'))
  .pipe(jshint.reporter('fail'));
});

gulp.task('styles', function() {
  return gulp.src([
    'src/css/**/*.css'
  ])
  .pipe(gulp.dest('dist/css'));
  /*return gulp.src('src/styles/main.less')
    .pipe(less())
    .pipe(minifyCSS())
    .pipe(prefix())
    .pipe(gulp.dest('dist/src/css'));*/
});

gulp.task('compile',
  gulp.series(/*'test',*/ 'scripts', 'styles')
);

gulp.task('gen-sw', function() {
  return workboxBuild.generateSW({
    globDirectory: 'dist',
    globPatterns: [
      '**\/*.{html,json,js,css}',
    ],
    swDest: 'dist/sw.js',
  });
});

gulp.task('dev2prod', function() {
  gulp.src([
      'src/**/*.html',
    ])
    .pipe(replace('http://localhost:8083', 'https://api.knowprocess.com'))
    .pipe(gulp.dest('dist'));
  return gulp.src([
      'src/public/*.html'
    ])
    .pipe(replace('http://localhost:8083', 'https://api.knowprocess.com'))
    .pipe(gulp.dest('dist/public'));
});

gulp.task('package', () =>
  gulp.src(['dist/*','!dist/*.zip'])
      .pipe(zip('archive.zip'))
      .pipe(gulp.dest('dist'))
);

gulp.task('install',
  gulp.series('compile', 'assets', 'gen-sw', 'dev2prod', 'package')
);

gulp.task('deploy', function() {
  return gulp.src(['dist/**/*','!dist/archive.zip'])
  .pipe(scp({
    host: 'cloud.knowprocess.com',
    username: 'tstephen',
    privateKey: require('fs').readFileSync('/home/tstephen/.ssh/id_rsa'),
    dest: '/var/www-cloud/'
  }))
  .on('error', function(err) {
    console.log(err);
  });
});
