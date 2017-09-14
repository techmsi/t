// 1) Bump version
// 2) Get config
const { name:PROJECT_NAME, version, repository: { url : repo } } = require('./package.json');
const ghpages = require('gh-pages');
const timestamp = require('console-timestamp');
var path = require('path');

const isDev = process.argv.indexOf('--dev') !== -1;
const DIST_DIR = path.join(__dirname, 'public', 'dist');
const now = new Date();

const options = {
  branch: 'master',
  dest: `public/exhibit/${PROJECT_NAME}/public/dist`,
  add: true,
  src: isDev ? '**/dev.*' : '**/app.*',
  message: `${PROJECT_NAME} ${version}: ${isDev ? 'Dev' : 'Prod'} - ${timestamp('Automated Build on MM/DD/YYYY at hh:mm', now)}`
};

// 3) Deploy to remote
ghpages.publish(DIST_DIR, options, (err) => {
  if (err) {
    console.log('err ', err);
  } else {
    console.log(`Pubilshed ${options.message}, successfully.\n${JSON.stringify(options, null, 2)}`);
  }
});
