#!/usr/bin/env bash
set -o errexit # Exit on error

timestamp=$(date +'%s');
branchName="deploy-$timestamp";
echo "Beginning automated deployment on $branchName";

git stash save 'Before deploy' # Stash all changes before deploy

git checkout $branchName;
echo "Checkout: $branchName";
# git merge master --no-edit # Merge in the master branch without prompting

# Generate the bundled Javascript and CSS
npm run dev:build
# Commit the changes, if any
if $(git commit -am $branchName); then 
  echo "Commit: Changes for $branchName";
fi

# Deploy to Github
git push origin/$branchName 
echo "Push: Changes to $branchName";

# Checkout master again
git checkout master
# And restore the changes
git stash pop