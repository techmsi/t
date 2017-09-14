const { name:PROJECT_NAME, version, repository: { url : repo } } = require('./package.json');
const git = require('simple-git');

const timestamp = require('console-timestamp');
var path = require('path');

const isDev = process.argv.indexOf('--dev') !== -1;
const now = new Date();
const branchName = `build_${timestamp('MM-DD-YYYY_hh-mm-ss', now)}`;
const message = `${PROJECT_NAME} ${version}: ${isDev ? 'Dev' : 'Prod'} - ${timestamp('Automated Build on MM/DD/YYYY at hh:mm', now)}`;

git()
.checkoutBranch(branchName, 'origin/master', (err) => {
 console.log("Checked out ", branchName);
})
.add('./*')
.commit(message)
.push(['origin', branchName], function () {
 console.log("Pushed ", branchName);
})
// .checkout('origin/master', function () {
//   console.log("Checked out origin/master");
// });