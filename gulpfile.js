var del         = require('del');
var gulp        = require('gulp');
var jshint      = require('gulp-jshint');
var uglify      = require('gulp-uglify');
var concat      = require('gulp-concat');
var log         = require('fancy-log');
var minifyCSS   = require('gulp-minify-css');
var minimist    = require('minimist');
var replace     = require('gulp-replace');
var scp         = require('gulp-scp2');
var through2    = require('through2');
var workboxBuild = require('workbox-build');
var zip         = require('gulp-zip');
var vsn         = '0.0.1';

var argv = minimist(process.argv.slice(2));
var env = argv['env'] || 'dev';
log.warn('ENVIRONMENT SET TO: '+env);
var config = require('./config.js')[env];

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
  .pipe(config.js.uglify ? uglify({ mangle: true }) : through2.obj())
  .pipe(gulp.dest('dist/'+vsn+'/js'));
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
  .pipe(config.css.minify ? minifyCSS() : through2.obj())
  .pipe(gulp.dest('dist/'+vsn+'/css'));
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

gulp.task('fix-paths', function() {
  gulp.src([
      'src/**/*.html',
    ])
    .pipe(replace('/vsn/', '/'+vsn+'/'))
    .pipe(replace('http://localhost:8085', config.apiServerUrl))
    .pipe(gulp.dest('dist'));
  return gulp.src([
      'src/public/*.html'
    ])
    .pipe(replace('/vsn/', '/'+vsn+'/'))
    .pipe(replace('http://localhost:8085', config.apiServerUrl))
    .pipe(gulp.dest('dist/public'));
});

gulp.task('package', () =>
  gulp.src(['dist/*','!dist/*.zip'])
      .pipe(zip('archive.zip'))
      .pipe(gulp.dest('dist'))
);

gulp.task('install',
  gulp.series('compile', 'assets', 'gen-sw', 'fix-paths', 'package')
);

gulp.task('_deploy', function() {
  if (config.server != undefined) {
    return gulp.src(['dist/**/*','!dist/archive.zip'])
    .pipe(scp({
      host: config.server.host,
      username: config.server.usr,
      privateKey: require('fs').readFileSync(config.server.privateKey),
      dest: config.server.dir
    }))
    .on('error', function(err) {
      console.log(err);
    });
  } else {
    log.error('No config.server specified for '+env);
  }
});

gulp.task('deploy',
  gulp.series('install', '_deploy')
);
