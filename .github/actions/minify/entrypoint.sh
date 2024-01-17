#!/bin/sh -l

npm i -g lightningcss-cli uglify-js prettydiff
apt-get update
apt-get -y install moreutils

cd _site
echo "Minifying HTML, JS, and CSS files in "
pwd

find . -type f \( -iname \*.html \) | while read fname; do
    echo "Minifying ${fname}"
    prettydiff minify "${fname}" | sponge "${fname}"
done

find . -type f \( -iname \*.js \) | while read fname; do
    echo "Minifying ${fname}"
    uglifyjs "${fname}" | sponge "${fname}"
done

find . -type f \( -iname \*.css \) | while read fname; do
    echo "Minifying ${fname}"
    lightningcss --minify --bundle --targets ">= 0.25%" "${fname}" | sponge "${fname}"
done
