const babel = require('gulp-babel');
const cssnano = require('cssnano');
const buffer = require('vinyl-buffer');
const del = require('del');
const eslint = require('gulp-eslint');
const gulp = require('gulp');

const merge = require('merge2');
const postcss = require('gulp-postcss');
const postcssImport = require('postcss-import');
const postcssUrl = require('postcss-url');

const rollup = require('rollup-stream');
const rollupBabelPlugin = require('rollup-plugin-babel');
const rollupIncludePathsPlugin = require('rollup-plugin-includepaths');
const runSequence = require('run-sequence');

const source = require('vinyl-source-stream');
const sourcemaps = require('gulp-sourcemaps');
const stylelint = require('gulp-stylelint');
const webserver = require('gulp-webserver');

const SRC_ROOT = './src/';
const DIST_ROOT = './dist/';

gulp.task('clobber-app', () => del(DIST_ROOT));

/**
 * Runs eslint on all javascript files found in the app and tests dirs.
 */
gulp.task('lint', () => {
  return merge(
    // Note: To have the process exit with an error code (1) on lint error,
    // return the stream and pipe to failOnError last.
    gulp.src([`${SRC_ROOT}**/*.{js,jsx}`])
        .pipe(eslint())
        .pipe(eslint.format())
        .pipe(eslint.failAfterError()),

    gulp.src([`${SRC_ROOT}**/*.css`])
        .pipe(
            stylelint({ reporters: [{ formatter: 'verbose', console: true }] })
        )
  );
});

gulp.task('webserver', () => {
  gulp.src(DIST_ROOT).pipe(
    webserver({
      port: process.env.PORT || 8000,
      host: process.env.HOSTNAME || 'localhost',
      livereload: true,
      directoryListing: false,
      open: false,
      https: { key: './certs/key.pem', cert: './certs/cert.pem' }
    })
  );
});

gulp.task('copy-app-common', () => {
  return gulp.src([
    `${SRC_ROOT}**`,
    // Don't copy documentation files.
    `!${SRC_ROOT}**/*.md`,
    // Don't copy JS, it will be compiled and copied on the compile step.
    `!${SRC_ROOT}js/**`,
    // Don't copy CSS, it will be compiled and copied on the compile step.
    `!${SRC_ROOT}**/*.css`,
  ], { nodir: true }).pipe(gulp.dest(DIST_ROOT));
});

/**
 * Pipes CSS through several postCSS plugins and outputs single CSS file.
 */
gulp.task('compile-css', () => {
  return gulp.src(`${SRC_ROOT}css/app.css`)
      .pipe(sourcemaps.init())
      .pipe(postcss([
        postcssImport(),
        postcssUrl({ url: 'rebase' }),
        cssnano(),
      ]))
      .pipe(sourcemaps.write('.'))
      .pipe(gulp.dest(`${DIST_ROOT}css/`));
});

/**
 * Compiles app source i.e. processes source with Babel and Rollup.
 */
gulp.task('compile-app-dev', () => {
  return rollup({
    entry: `${SRC_ROOT}js/app.js`,
    sourceMap: true,
    plugins: [
      rollupBabelPlugin(),
      rollupIncludePathsPlugin({ extensions: ['.js', '.jsx'] }),
    ]
  })
      .pipe(source('app.js', `${SRC_ROOT}js`))
      .pipe(buffer())
      .pipe(sourcemaps.init({ loadMaps: true }))
      .pipe(sourcemaps.write('.'))
      .pipe(gulp.dest(`${DIST_ROOT}js`));
});

/**
 * Builds the app for development.
 */
gulp.task('build-dev', (cb) => {
  process.env.BABEL_ENV = 'development';

  runSequence(
      'lint', 'clobber-app', 'copy-app-common', 'compile-app-dev',
      'compile-css', cb
  );
});

/**
 * Watch for changes on the file system, and rebuild if so.
 */
gulp.task('watch', () => {
  gulp.watch([`${SRC_ROOT}**`], ['build-dev']);
});


/**
 * The default task when `gulp` is run.
 * Adds a listener which will re-build on a file save.
 */
gulp.task('default', (cb) => {
  runSequence('build-dev', 'webserver', 'watch', cb);
});