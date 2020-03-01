#!/bin/bash

# $1-source $2-target $3-name

file="/srv/http/data/playlists/$1"
lines=$( sed -n '/"index": '$2',/,/{/ p' "$file" )
insertline=$(( $( sed -n '/"index": '$3',/ =' "$file" ) - 1 ))

sed "$insertline r /dev/stdin" "$file" <<<"$lines"
sed -i '/"index": '$2',/,/{/ d' "$file"
sed -i 's/
