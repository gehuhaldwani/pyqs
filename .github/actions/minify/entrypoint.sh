#!/bin/sh -l

npm i lightningcss uglify-js prettydiff -g
apt-get update
apt-get -y install moreutils

cd _site
echo "Minifying HTML, JS, and CSS files in "
pwd


find . -type f \( -iname \*.html -o -iname \*.js -o -iname \*.css \) | while read fname
    do
    echo "Minifying ${fname}"
    if [[ ${fname: -4} == ".css" ]]
    then
        lightningcss --minify --bundle --targets '>= 0.25%' "${fname}" | sponge "${fname}"
    elif [[ ${fname: -3} == ".js" ]]
    then
        uglifyjs "${fname}" | sponge "${fname}"
    elif [[ ${fname: -5} == ".html" ]]
    then
        prettydiff minify "${fname}" | sponge "${fname}"
    fi
    done
