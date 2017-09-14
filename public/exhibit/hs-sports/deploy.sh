#!/usr/bin/env bash
set -o errexit # Exit on error

timestamp=$(date +'%s');
branchName="deploy-$timestamp";

echo "Beginning automated deployment on $branchName";

# Stash all changes before deploy
git stash save 'Before deploy';

git checkout -b $branchName;
echo "Checkout: $branchName";
# Merge in the master branch without prompting
# git merge master --no-edit

# Generate the bundled Javascript and CSS
npm run dev:build
# Commit the changes, if any
if $(git commit -am "Automated deploy"); then 
  echo "Commit: Changes for $branchName";
fi

# Deploy to Github
echo "Push: Changes to $branchName";
git push origin $branchName

# Checkout master again
git checkout master
# And restore the changes
git stash pop