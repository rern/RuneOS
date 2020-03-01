#!/bin/bash

{ # always run in background >>>>>>>>>>

dirsystem=/srv/http/data/system
audiooutput=$( cat $dirsystem/audio-output )
audioaplayname=$( cat $dirsystem/audio-aplayname )
mpdfile=/etc/mpd.conf
mpdconf=$( sed '/audio_output/,/}/ d' $mpdfile ) # remove all outputs

. /srv/http/bash/mpd-devices.sh

for (( i=0; i < $cardL; i++ )); do
	card=${Acard[i]}
	hwmixer=${Ahwmixer[i]}
	name=${Aname[i]}
	aplayname=${Aaplayname[i]}
	if [[ $name == $audiooutput && $aplayname == $audioaplayname ]]; then
		routecmd=${Aroutecmd[i]}
		[[ -n $routecmd ]] && eval $routecmd
	fi
	mpdconf+='

audio_output {
	name           "'$name'"
	device         "'${Ahw[i]}'"
	type           "alsa"
	auto_resample  "no"
	auto_format    "no"'
	
	if [[ -n ${Ahwmixer[i]} ]]; then # mixer_device must be card number
		device=$( amixer -c $card scontrols | cut -d',' -f2 )
		mpdconf+='
	mixer_control  "'${Ahwmixer[i]}'"
	mixer_device   "hw:'${Acard[i]}'"'
	
	fi
	if [[ -e /srv/http/data/system/mpd-dop && $aplayname != 'bcm2835 ALSA' ]]; then
		mpdconf+='
	dop            "yes"'
	
	fi
	
	mpdconf+='
}'
done

echo "$mpdconf" > $mpdfile

if [[ ! -e /tmp/startup ]]; then
	systemctl restart mpd mpdidle  # "restart" while not running = start + stop + start
	curl -s -X POST 'http://127.0.0.1/pub?id=notify' -d '{ "page": "mpd" }'
else
	systemctl start mpd mpdidle
	rm -f /tmp/startup /srv/http/settings/usbdac
	# skip on startup - called by usbdac.rules
	exit
fi

# udev rules - usb dac
if (( $# > 0 )); then
	usbdacfile=/srv/http/data/system/usbdac
	if [[ $1 == remove ]]; then
		name=$audiooutput
		card=$( echo "$aplay" | grep "$audioaplayname" | head -1 | cut -c6 )
		hwmixer=$( amixer -c $card scontents | grep -B1 'pvolume' | head -1 | cut -d"'" -f2 )
		rm -f $usbdacfile
	else # added usb dac - last one
		echo "$mpdconf" | grep -q '^mixer_type.*none' && -n $hwmixer && amixer -c $card sset "$hwmixer" 0dB
		echo $aplayname > $usbdacfile # flag - active usb
	fi
	
	curl -s -X POST 'http://127.0.0.1/pub?id=notify' -d '{ "title": "Audio Output Switched", "text": "'"$name"'", "icon": "output" }'
	
	shairportfile=/etc/shairport-sync.conf
	sed -i '/output_device = / s/"hw:.*"/"hw:'$card'"/' $shairportfile
	# shairport-sync - uses hwmixer for volume control
	if [[ -n $hwmixer ]]; then
		sed -i '/mixer_control_name = / s/".*"/"'$hwmixer'"/; s|^/*||' $shairportfile
	else
		sed -i '/mixer_control_name = / s|^|//|' $shairportfile
	fi
	
	if systemctl -q is-active shairport-sync; then
		curl -s -X POST 'http://127.0.0.1/pub?id=airplay' -d '{"stop":"switchoutput"}'
		systemctl restart shairport-sync shairport-meta
	fi
fi

} & # always run in background <<<<<<<<<<

