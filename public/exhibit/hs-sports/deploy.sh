#!/usr/bin/env bash
set -o errexit # Exit on error

timestamp=$(date +'%s');
echo $timestamp;
branchName="deploy-$timestamp";
git stash save 'Before deploy' # Stash all changes before deploy
git checkout $branchName;
# git merge master --no-edit # Merge in the master branch without prompting
npm run dev:build # Generate the bundled Javascript and CSS
if $(git commit -am $branchName); then # Commit the changes, if any
  echo "Committed changes for $branchName";
fi
# git push origin/$branchName # Deploy to Github
echo "Pushed changes to $branchName";
git checkout master # Checkout master again
git stash pop # And restore the changes