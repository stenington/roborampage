#!/bin/bash

node bin/compile.js > /dev/null
git diff --exit-code --quiet

if [ $? -ne 0 ] 
then
  echo "There are diffs after compilation. Did you forget to add compiled files?"
  echo "Commit with --no-verify to bypass this check if appropriate."
  exit 1
fi