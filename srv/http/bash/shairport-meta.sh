#!/bin/bash

cat /tmp/shairport-sync-metadata | while read line; do
	# remove Artist+Genre line
	[[ $line =~ 'encoding="base64"' || $line =~ '<code>'.*'<code>' ]] && continue
	
	# var: (none) - get matched hex code line
	[[ $line =~ '>61736172<' ]] && code=Artist   && continue
	[[ $line =~ '>6d696e6d<' ]] && code=Title    && continue
	[[ $line =~ '>6173616c<' ]] && code=Album    && continue
	[[ $line =~ '>50494354<' ]] && code=coverart && continue
	[[ $line =~ '>70726772<' ]] && code=Time     && continue
	[[ $line =~ '>70766f6c<' ]] && code=volume   && continue
	
	# var: code - next line if no code yet
	[[ -z $code ]] && continue
	
	base64=${line/<\/data><\/item>}
	base64=$( echo $base64 | tr -d '\000' ) # remove null bytes
	# null or not base64 string - reset code= and next line
	if [[ -z $base64 || ! $base64 =~ ^([A-Za-z0-9+/]{4})*([A-Za-z0-9+/]{3}=|[A-Za-z0-9+/]{2}==)?$ ]]; then
		code= # reset code= and start over
		continue
	fi
	
	# var: code base64 - make json for curl
	if [[ $code == coverart ]]; then
		data="data:image/jpeg;base64,$base64"
		echo $data > /srv/http/data/tmp/airplay-coverart
	else
		data=$( echo $base64 | base64 --decode 2> /dev/null )
		if [[ $code == Time ]]; then # format: start/elapsed/end @44100
			start=$(( ${data/\/*} / 44100 ))
			current=$(( $( echo $data | cut -d/ -f2 ) / 44100 ))
			end=$(( ${data/*\/} / 44100 ))
			data=$(( end - start ))
			
			elapsed=$(( current - start )) # 
			(( $elapsed < 0 )) && elapsed=0
			curl -s -X POST 'http://127.0.0.1/pub?id=airplay' -d '{"elapsed":'$elapsed'}'
			
			now=$( date +'%s' )
			starttime=$(( now - elapsed ))
			echo $starttime > /srv/http/data/tmp/airplay-start
		elif [[ $code == volume ]]; then # format: airplay/current/limitH/limitL
			airplayvolume=${data/,*} # -30:0% - 0:100%
			data=$( awk "BEGIN { printf \"%.0f\n\", ( 30 + $airplayvolume ) / 30 * 100 }" )
			echo $data > /srv/http/data/tmp/airplay-volume
		fi
		echo $data > /srv/http/data/tmp/airplay-$code
		data=$( echo $data | sed "s/\(['{\":,}]\)/\\\&/g" ) # escape in json
	fi
	# pushstream channel airplay - separate numbers and strings
	[[ ' start Time volume ' =~ " $code " ]] && data='{"'$code'":'$data'}' || data='{"'$code'":"'$data'"}'
	curl -s -X POST 'http://127.0.0.1/pub?id=airplay' -d "$data"
	
	code= # reset code= and start over
done
