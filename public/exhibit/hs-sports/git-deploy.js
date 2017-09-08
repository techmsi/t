const DIST_BUILD_TIME = 5000;
const chalk = require('chalk');
const { black, bgGreen, yellow } = chalk;

const { name:PROJECT_NAME, version, repository: { url : repo } } = require('./package.json');
const pipeOutput = (command, stdout, stderr) => {
  stdout.pipe(process.stdout);
  stderr.pipe(process.stderr);
};
const git = require('simple-git');
const gitH = git().outputHandler(pipeOutput);

const exc = require('child-process-promise').exec;
const timestamp = require('console-timestamp');
var path = require('path');

const isDev = process.argv.indexOf('--dev') !== -1;
const now = new Date();
const branchName = `build_${timestamp('MM-DD-YYYY_hh-mm-ss', now)}`;
const message = `${PROJECT_NAME} ${version}: ${isDev ? 'Dev' : 'Prod'} - ${timestamp('Automated Build on MM/DD/YYYY at hh:mm', now)}`;
const distDir = 'public/dist/';

const logTask = (task) => console.log(`${black.bgGreen(task)} - ${yellow(branchName)}`);

function getDistFromModifiedFiles (modified) {
  return modified.length === 0 ? null : modified
    .filter(o => o.indexOf('dev.') !== -1)
    .map(o => o.match(/(public\/dist\/).+/)[0]);
}

const createDistFiles = (cmd = 'npm run dev:build') => exc(cmd);

function addCommitPushFiles (files) {
  if (files) {
    gitH
      .add(files, (err) => {
        logTask('3) Added files', files);
      })
      .commit(message, function () {
        logTask('4) Committed to');
      })
      .push(['origin', branchName], function () {
        logTask('5) Pushed origin');
      })
      .checkout(['master'], function () {
        logTask('6) Checked out local master');
      });
  } else {
    logTask('No files to add ', files);
  }
}

git()
  .checkoutBranch(branchName, 'origin/master', () => {
    logTask('1) Checked out ');
  })
  .exec(() => {
    createDistFiles().then(() => {
      setTimeout(() => {
        gitH
          .status((err, log) => {
            logTask('2) Status - modified files', log.modified);
            const files = getDistFromModifiedFiles(log.modified);
            logTask(`Delay adding files for ${DIST_BUILD_TIME}ms`, files);
            addCommitPushFiles(files);
          });
      }, DIST_BUILD_TIME);
    });
  });
