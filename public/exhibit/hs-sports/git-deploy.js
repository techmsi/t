const { name:PROJECT_NAME, version, repository: { url : repo } } = require('./package.json');
const git = require('simple-git');

const timestamp = require('console-timestamp');
var path = require('path');

const isDev = process.argv.indexOf('--dev') !== -1;
const now = new Date();
const branchName = `build_${timestamp('MM-DD-YYYY_hh-mm-ss', now)}`;
const message = `${PROJECT_NAME} ${version}: ${isDev ? 'Dev' : 'Prod'} - ${timestamp('Automated Build on MM/DD/YYYY at hh:mm', now)}`;
const distDir = 'public/dist/';

function createDistFiles () {
  const exec = require('child_process').exec;

  const child = exec('npm run dev:build',
    function (error, stdout, stderr) {
      if (error !== null) {
        console.log('exec error: ' + error);
      }
    });
}

function getDistFromModifiedFiles (modified) {
  return modified.length === 0 ? null : modified
    .filter(o => o.indexOf('dev.') !== -1)
    .map(o => o.match(/(public\/dist\/).+/)[0]);
}

git()
  // .stash({message: `Stashing changes on master at ${timestamp('MM-DD-YYYY hh:mm:ss', now)}`}, function () {
  //   console.log(`Stashing changes on master at ${timestamp('MM-DD-YYYY hh:mm:ss', now)}`)
  // })
  .checkoutBranch(branchName, 'origin/master', () => {
    console.log('Checked out ', branchName);
    createDistFiles();
  })
  .status(function (err, log) {
    console.log('Status - modified files', log.modified);
    const files = getDistFromModifiedFiles(log.modified);
    if (files) {
      git().add(files, (err) => {
        console.log('Added files ', files);
      })
        .commit(message, function () {
          console.log('Committed to ', branchName);
        })
        .push(['origin', branchName], function () {
          console.log('Pushed origin', branchName);
        });
    }
  });
  .checkout(['origin', 'master'], function () {
    console.log("Checked out origin/master")
  })
