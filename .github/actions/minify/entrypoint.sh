#!/bin/sh -l

npm i minify -g
apt-get update
apt-get -y install moreutils

cd ${INPUT_DIRECTORY}
echo "Minifying HTML, JS, and CSS files in"
pwd

find . -type f \( -iname \*.html -o -iname \*.js -o -iname \*.css \) | while read fname
do
  if minify ${fname} | sponge ${fname}; then
    echo "Minified ${fname}"
  else
    echo "Error minifying ${fname}"
  fi
done