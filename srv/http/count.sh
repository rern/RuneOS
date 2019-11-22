#!/bin/bash

albumartist=$( mpc list albumartist | awk NF | wc -l )
composer=$( mpc list composer | awk NF | wc -l )
genre=$( mpc list genre | awk NF | wc -l )

count="$count $( mpc stats | head -n3 | awk '{print $2,$4,$6}' )"
artist=$( echo $count | cut -d' ' -f1 )
album=$( echo $count | cut -d' ' -f2 )
song=$( echo $count | cut -d' ' -f3 )
mpddb="$albumartist $composer $genre"
nas=$( df | grep -c '/mnt/MPD/NAS' )
usb=$( df | grep -c '/mnt/MPD/USB' )
webradio=$( ls -U /srv/http/data/webradios/* 2> /dev/null | wc -l )
sd=$( mpc listall SD 2> /dev/null | wc -l )

echo $artist $album $song $mpddb $nas $usb $webradio $sd

echo $mpddb > /srv/http/data/system/mpddb
