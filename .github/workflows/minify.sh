#!/bin/sh -l

npm i -g lightningcss-cli uglify-js prettydiff
sudo apt-get -y install moreutils

cd _site
echo "Minifying HTML, JS, and CSS files in "
pwd

find . -type f \( -iname \*.html \) | while read fname; do
    echo "Minifying ${fname}"
    prettydiff minify "${fname}" | sudo sponge "${fname}" &
done
wait

find . -type f \( -iname \*.js \) | while read fname; do
    echo "Minifying ${fname}"
    uglifyjs "${fname}" | sudo sponge "${fname}" &
done
wait

find . -type f \( -iname \*.css \) | while read fname; do
    echo "Minifying ${fname}"
    lightningcss --minify --bundle --targets ">= 0.25%" "${fname}" | sudo sponge "${fname}" &
done
wait
