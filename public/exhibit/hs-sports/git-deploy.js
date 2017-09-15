const DIST_BUILD_TIME = 5000;
const chalk = require('chalk');
const { black, bgGreen, bgBlack, yellow } = chalk;

const exc = require('child-process-promise').exec;
const timestamp = require('console-timestamp');
var path = require('path');

const pipeOutput = (command, stdout, stderr) => {
  stdout.pipe(process.stdout);
  stderr.pipe(process.stderr);
};
const git = require('simple-git');
const gitH = git().outputHandler(pipeOutput);

const { name: PROJECT_NAME, version, repository: { url : repo } } = require('./package.json');
const isDev = process.argv.indexOf('--dev') !== -1;
const now = new Date();

const branchName = `build_${timestamp('MM-DD-YYYY_hh-mm-ss', now)}`;
const message = `${PROJECT_NAME} ${version}: ${isDev ? 'Dev' : 'Prod'} - ${timestamp('Automated Build on MM/DD/YYYY at hh:mm', now)}`;

const buildCommand = `npm run ${isDev ? 'dev:' : ''}build`;
const logTask = (task) => console.log(`\n${black.bgGreen(task)} - ${yellow(branchName)}\n`);
const createDistFiles = (cmd = buildCommand) => exc(cmd);

function getDistFromModifiedFiles (modified) {
  let distFiles = null;
  
  if (modified.length === 0) {
    return null;
  } else if (isDev) {
    distFiles = modified
    .filter(o => o.indexOf('dev.') !== -1);
  } else {
    distFiles = modified
    .filter(o => o.indexOf('dev.') === -1);
  }
  return distFiles.map(o => o.match(/(public\/dist\/).+/)[0]);
}

function addCommitPushFiles (files) {
  if (files) {
    gitH
      .add(files, (err) => {
        logTask('3) Added files', files);
      })
      .commit(message, () => {
        logTask('4) Committed to');
      })
      .push(['origin', branchName], () => {
        logTask('5) Pushed origin');
      })
      .checkout(['master'], () => {
        logTask('6) Checked out local master');
      });
  } else {
    logTask('No files to add ', files);
  }
}

console.log(`${PROJECT_NAME} ${version}`);
console.log(`Starting Automated Deployment for ${yellow.bgBlack(isDev ? 'Dev' : 'Prod')}`);
console.log(`${yellow.bgBlack(timestamp('MM/DD/YYYY at hh:mm', now))}\n\n`);

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
