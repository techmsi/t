#!/usr/bin/env bash
set -o errexit # Exit on error

timestamp=$(date +'%s');
echo $timestamp;
git stash save 'Before deploy' # Stash all changes before deploy
git checkout deploy
# git merge master --no-edit # Merge in the master branch without prompting
npm run dev:build # Generate the bundled Javascript and CSS
if $(git commit -am Deploy); then # Commit the changes, if any
  echo 'Changes Committed'
fi
git push origin/deploy # Deploy to Github
git checkout master # Checkout master again
git stash pop # And restore the changes