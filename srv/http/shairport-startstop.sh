#!/bin/bash

if (( $# > 0 )); then # stop
	curl -s -X POST 'http://127.0.0.1/pub?id=notify' -d '{"title":"AirPlay","text":"Switching back to MPD ...","icon":"airplay blink","delay":"10000"}'
	systemctl start mpd
	curl -s -X POST 'http://127.0.0.1/pub?id=airplay' -d 0
	exec( '/usr/bin/sudo /usr/bin/rm -f /srv/http/data/tmp/airplay*' );
else
	mpc stop
	systemctl stop mpd mpdidle
	curl -s -X POST 'http://127.0.0.1/pub?id=airplay' -d 1
fi
