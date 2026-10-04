#!/bin/sh
# Downloads the Cyrillic + Latin subsets of Russo One and Rubik used by build.js
cd "$(dirname "$0")/fonts" || exit 1
UA="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36"
curl -sS -A "$UA" "https://fonts.googleapis.com/css2?family=Russo+One&family=Rubik:wght@400;600&display=swap" -o fonts.css
for u in $(grep -B3 -A0 "src:" fonts.css | grep -o "https://[^)]*woff2" | sort -u); do curl -sS -O "$u"; done
