#!/bin/bash
mpdactive=$( systemctl -q is-active mpd && echo true || echo false )
status+='"mpd":'$mpdactive

if [[ $mpdactive == false ]]; then
	path=/srv/http/data/tmp/airplay
	if [[ ! -e $path-volume ]]; then
		card=$( grep output_device /etc/shairport-sync.conf | cut -d'"' -f2 | cut -d: -f2 )
		mixer=$( grep mixer_control /etc/shairport-sync.conf | cut -d'"' -f2 )
		amixer -c $card sget $mixer | grep % | sed 's/.*\[\(.*\)%.*/\1/' > $path-volume
	fi
	for item in Artist Album coverart Title; do
		val=$( cat $path-$item | sed 's/"/\\"/g' )
		status+=', "'$item'":"'$val'"'
	done
	now=$( date +'%s' )
	start=$( cat $path-start )
	Time=$( cat $path-Time )
	volume=$( cat $path-volume )
	status+=', "Time":'$Time'
			 , "volume":'$volume'
			 , "elapsed":'$(( now - start ))
	echo {$status} | tr -d '\n\t'
	exit
fi

filter='Album\|Artist\|audio\|bitrate\|consume\|elapsed\|file\|playlistlength\|random\|repeat\|single\|^song:\|state\|Time\|Title\|updating_db\|volume'
mpdStatus() {
	mpdtelnet=$( { sleep 0.05; echo echo clearerror; echo status; echo $1; sleep 0.05; } \
		| telnet 127.0.0.1 6600 2> /dev/null \
		| grep "$filter" )
}
mpdStatus currentsong

# when playlist is empty, add song without play - currentsong = (blank)
! echo "$mpdtelnet" | grep -q 'file:' && mpdStatus 'playlistinfo 0'

readarray -t lines <<<"$mpdtelnet"
for line in "${lines[@]}"; do
	key=${line/:*}
	val=${line#*: }
	case $key in
		audio )
			samplerate=${val/:*}
			bitdepth=$( echo $val | cut -d: -f2 );;
		bitrate )
			bitrate=$(( val * 1000 ));;
		elapsed )
			elapsed=${val/.*}
			status+=', "elapsed":'$elapsed;;
		consume | playlistlength | random | repeat | single | song | Time | volume )
			printf -v $key '%s' $val
			status+=', "'$key'":'$val;;
		Album | Artist | file | Title )
			printf -v $key '%s' "$val"
			val=$( echo $val | sed 's/"/\\\"/g' | sed "s/'/\\\'/g" ) # escape quotes for json
			status+=', "'$key'":"'$val'"';;
		* )
			printf -v $key '%s' "$val"
			status+=', "'$key'":"'$val'"';;
	esac
done

[[ -z $elapsed ]] && status+=', "elapsed":0'
[[ -z $song ]] && status+=', "song":""'
[[ -z $updating_db ]] && status+=', "updating_db":""'
status+=', "volumemute":'$( cat /srv/http/data/display/volumemute 2> /dev/null || echo 0 )
status+=', "librandom":'$( systemctl -q is-active libraryrandom && echo 1 || echo 0 )

if [[ -z $playlistlength ]]; then
	echo {$status} | tr -d '\n\t'
	exit
fi

#filepullpath="/mnt/MPD/$file"
if [[ ${file:0:4} != http ]]; then
	# missing id3tags
	dirname=${file%\/*}
	filename=${file/*\/}
	ext=${file/*.}
	ext=${ext^^}
	[[ -z $Artist ]] && Artist=${dirname/*\/} && status+=', "Artist":"'$Artist'"'
	[[ -z $Title ]] && status+=', "Title":"'${filename%.*}'"'
	[[ -z $Album ]] && status+=', "Album":""'
	status+=', "ext":"'$ext'"'
	systemctl stop radiowatchdog
else
	# before webradios play: no 'Name:' - use station name from file instead
	radiofile=/srv/http/data/webradios/${file//\//|}
	stationname=$( head -1 $radiofile )
	[[ -z Name ]] && status+=', "Artist":"'$stationname'"'
	status+='
		, "Title":"'$( [[ $state != stop ]] && echo $Title )'"
		, "Album":"'$file'"
		, "time":""
		, "ext":"radio"
	'
	systemctl start radiowatchdog
fi

if [[ $1 == statusonly
	|| -z $playlistlength
	|| $playlistlength == 0
	|| ( $Artist == $1 && $Album == $2 ) # the same song
	&& $ext != radio
]]; then
	echo {$status} | tr -d '\n\t'
	exit
fi

# coverart
if [[ $ext != radio ]]; then
	coverart=$( /srv/http/bash/getcover.sh "/mnt/MPD/$file" )
elif [[ -e $radiofile ]]; then
	coverart=$( sed -n '3 p' $radiofile )
fi
status+=', "coverart":"'$coverart'"'

samplingLine() {
	bitdepth=$1
	samplerate=$2
	bitrate=$3
	ext=$4
	
	sampletext="$( awk "BEGIN { printf \"%.1f\n\", $samplerate / 1000 }" ) kHz"
	[[ -z $bitrate ]] && bitrate=$(( bitdepth * samplerate * 2 ))
	if (( $bitrate < 1000000 )); then
		bitratetext="$(( bitrate / 1000 )) kbit/s"
	else
		bitratetext="$( awk "BEGIN { printf \"%.2f\n\", $bitrate / 1000000 }" ) Mbit/s"
	fi
	
	if [[ $bitdepth == dsd ]]; then
			sampling="DSD$(( bitrate / 44100 )) &bull; $bitratetext"
	else
		if [[ $bitdepth == 'N/A' ]]; then # lossy has no bitdepth
			[[ $ext == WAV || $ext == AIFF ]] && bittext="$(( bitrate / samplerate / 2 )) bit "
		else
			[[ -n $bitdepth && $ext != MP3 ]] && bittext="$bitdepth bit "
		fi
		sampling="$bittext$sampletext $bitratetext &bull; $ext"
	fi
}

if [[ $state == play ]]; then
	[[ $ext == DSF || $ext == DFF ]] && bitdepth=dsd
	samplingLine $bitdepth $samplerate $bitrate $ext
	status+=', "sampling":"'$sampling'"'
	echo {$status} | tr -d '\n\t'
	# save only webradio: update sampling database on each play
	[[ $ext == radio ]] && echo $sampling > "/srv/http/data/sampling/$stationname"
	exit
fi

# state: stop / pause >>>>>>>>>>
# webradio
if [[ $ext == radio ]]; then
	status+=', "sampling":"'$( cat /srv/http/data/sampling/$stationname )'"'
	echo {$status} | tr -d '\n\t'
	exit
fi

# while stop no mpd info
if [[ $ext == DSF || $ext == DFF ]]; then
	# DSF: byte# 56+4 ? DSF: byte# 60+4
	[[ $ext == DSF ]] && byte=56 || byte=60;
	hex=( $( hexdump -x -s$byte -n4 "$/mnt/MPD/file" | head -1 | tr -s ' ' ) )
	dsd=$(( ${hex[1]} / 1100 * 64 )) # hex byte#57-58 - @1100:dsd64
	bitrate=$(( dsd * 44100 / 1000000, 2 ))
	status+=', "sampling":"DSD'$dsd' • '$bitrate' Mbit/s"'
else
	data=( $( ffprobe -v quiet -select_streams a:0 \
		-show_entries stream=bits_per_raw_sample,sample_rate \
		-show_entries format=bit_rate \
		-of default=noprint_wrappers=1:nokey=1 \
		"/mnt/MPD/$file" ) )
	samplerate=${data[0]}
	bitdepth=${data[1]}
	bitrate=${data[2]}
#	echo bitdepth $bitdepth - samplerate $samplerate - bitrate $bitrate - ext $ext
	samplingLine $bitdepth $samplerate $bitrate $ext
	status+=', "sampling":"'$sampling'"'
fi

echo {$status} | tr -d '\n\t'
