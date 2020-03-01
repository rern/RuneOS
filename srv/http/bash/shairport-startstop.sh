#!/bin/bash

path=/srv/http/data/tmp

if (( $# > 0 )); then # stop
	systemctl -q is-active mpd && exit
	
	curl -s -X POST 'http://127.0.0.1/pub?id=notify' -d '{"title":"AirPlay","text":"Stop ...","icon":"airplay blink","delay":"10000"}'
	
	systemctl start mpd mpdidle
	mpc -q volume $( grep volume /var/lib/mpd/mpdstate | cut -d' ' -f2 )
	curl -s -X POST 'http://127.0.0.1/pub?id=airplay' -d '{"stop":1}'
	
	systemctl stop shairport-meta
	# when use stop button from runeaudio playback
	[[ $1 == restart ]] && systemctl restart shairport-sync
else
	systemctl start shairport-meta
	
	mpc stop
	systemctl stop mpd mpdidle
	sleep 2
	curl -s -X POST 'http://127.0.0.1/pub?id=airplay' -d '{"start":1}'
fi
