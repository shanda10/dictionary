/*
 * Usage:
 *
 * gulp watch --port 80 --backend localhost:8080
 *
 */

var gulp  = require('gulp');
var gutil = require('gulp-util');

var connect = require('gulp-connect');
var proxy = require('http-proxy-middleware');

gulp.task('connect', function () {
  var backend = gutil.env.backend || 'localhost:8080';
  connect.server({
    port: +gutil.env.port || 80,
    root: './src',
    middleware: function(connect, opt) {
      var middlewares = [];
      if (backend) middlewares.push([
        proxy('/api', {
          target: 'http://' + backend,
          changeOrigin: true,
          pathRewrite: { '^/api' : '' },
        })
      ]);
      middlewares.push(function (req, res, next) {
        gutil.log(req.method, req.url);
        next();
      });
      return middlewares;
    }
  });
});

gulp.task('watch', ['connect'], function () { });
gulp.task('default', function () { });
