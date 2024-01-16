#!/bin/sh -l

npm i minify -g
apt-get update
apt-get -y install moreutils

cd _site
echo "Minifying HTML, JS, and CSS files in "
pwd


find . -type f \( -iname \*.html -o -iname \*.js -o -iname \*.css \) | while read fname
    do
    echo "Minifying ${fname}"
    minify "${fname}" | sponge "${fname}"
    done