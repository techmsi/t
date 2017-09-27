const DIST_BUILD_TIME = 5000;
const chalk = require('chalk');
const { gray, black, cyan, yellow, bgYellow, bgGreen, bgBlack } = chalk;

const spawn = require('child-process-promise').spawn;
const path = require('path');

// Git Helpers
const git = require('simple-git');

const pipeOutput = (command, stdout, stderr) => {
  stdout.pipe(process.stdout);
  stderr.pipe(process.stderr);
};

const gitH = git().outputHandler(pipeOutput);

// Set date/time to now
const timestamp = require('console-timestamp');
const now = new Date();

const config = require('./package.json');
let PROJECT_NAME = config.name;

// Get build type
const isDev = process.argv.indexOf('--dev') !== -1;
const env = isDev ? 'dev' : 'prod';

const branchDate = timestamp('MM-DD-YYYY_hh-mm-ss', now);
const branchName = `${PROJECT_NAME}-${env}-build_${branchDate}`;

const messageDate = timestamp('MM/DD/YYYY at hh:mm', now);
const message = `${PROJECT_NAME} ${config.version}: ${env} - Automated Build on ${messageDate}`;

const buildCommand = `${isDev ? 'dev:' : ''}build`;

const logTask = (task) => console.log(`\n${black.bgGreen(task)} - ${yellow(branchName)}\n`);

const createDistFiles = (cmd = buildCommand) => {
  var promise = spawn('npm', [ 'run', cmd ], { capture: [ 'stdout', 'stderr' ] });
  var childProcess = promise.childProcess;
  var prefix = cyan.bgBlack(`[spawn pid:(${childProcess.pid})]`);

  return promise
    .then(result => {
      console.log(`${prefix} stdout`, gray(result.stdout.toString()));
    })
    .then(() => {
      console.log(`${prefix} DONE`);
    })
    .catch(err => {
      console.log(`${prefix} ERROR: `, err.stderr);
    });
};

function introText () {
  console.log(`
    ${PROJECT_NAME} ${cyan.bgBlack(config.version)}
    ${'='.repeat(40)}
    Starting Automated Deployment
    ${'='.repeat(40)}
    ${cyan.bold.bgBlack(env.toUpperCase())} - ${yellow.bgBlack(messageDate)}
  `);
}

// Return only the css/js dist files
function getDistFromModifiedFiles (modified) {
  logTask(bgYellow('Filter through files'));
  printList(modified);

  let distFiles = null;
  const regex = /(public\/dist\/).+/;
  const getPaths = f => f.map(o => o.match(regex)[0]).filter(o => o);

  if (modified.length === 0) {
    return null;
  } else if (isDev) {
    distFiles = modified
      .filter(o => regex.test(o))
      .filter(o => o.indexOf('dev.') !== -1);
  } else {
    distFiles = modified
      .filter(o => regex.test(o))
      .filter(o => o.indexOf('dev.') === -1);
  }

  return getPaths(distFiles);
}

// Add, commit, push files to Github
function addCommitPushFiles (files) {
  if (files) {
    gitH
      .add(files, (err) => {
        logTask('3) Added files', files);
        printList(files, 'Add');

        if (err) logTask('3) Error Adding files', files);
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
    logTask(bgYellow('No files to add '), files);
  }
}

// Show detials before starting deployment
introText();

const printList = (arr, prefix = 'Found') => arr.forEach((o, i) => console.log(cyan.bgBlack(`${prefix} file ${++i} of ${arr.length}`), gray(o)));

// Deployment
git()
  .checkoutBranch(branchName, 'origin/master', () => {
    logTask('1) Checked out ');
  })
  .exec(() => {
    createDistFiles().then(() => {
      logTask(`2a) Dist files created`);

      let getStatus = setInterval(() => {
        gitH
          .status((err, log) => {
            if (err) logTask('2) Error getting status', err);

            logTask(bgYellow(`Look for files every ${DIST_BUILD_TIME}ms`));
            const modifiedFiles = log.files.map(({path}) => path);

            if (modifiedFiles) {
              logTask(cyan.bgBlack(`(${yellow(modifiedFiles.length)}) files found - `));
              clearInterval(getStatus);

              // Get the modified dist files
              const files = getDistFromModifiedFiles(modifiedFiles);
              addCommitPushFiles(files);
            } else {
              logTask(bgYellow('2) No files found'), modifiedFiles.length);
            }
          });
      }, DIST_BUILD_TIME);
    })
      .catch(err => console.log('Error', err));
  });
