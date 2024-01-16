#!/bin/sh -l

npm i minify -g
apt-get update
apt-get -y install moreutils

echo "Minifying HTML, JS, and CSS files in ${GITHUB_WORKSPACE}\n"
pwd
cd ${GITHUB_WORKSPACE}
pwd
cd /_site
pwd
find . -type f \( -iname \*.html -o -iname \*.js -o -iname \*.css \) | while read fname
    do
    minify ${fname} | sponge ${fname}
    done