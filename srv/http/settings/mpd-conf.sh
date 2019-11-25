#!/bin/bash

# skip on startup - called by usbdac.rules
if [[ -e /tmp/startup ]]; then
	rm /tmp/startup
	# reenable on-board audio if nothing available for aplay
	if [[ -z $( aplay -l ) ]]; then
		sed -i 's/dtparam=audio=.*/dtparam=audio=on/' /boot/config.txt
		shutdown -r now
	fi
	exit
fi

{

dirsystem=/srv/http/data/system
audiooutput=$( cat $dirsystem/audiooutput )
sysname=$( cat $dirsystem/sysname )

model=$( cat /proc/cpuinfo | grep Revision | tail -c 4 | cut -c 1-2 )
if [[ $model == 11 ]]; then  # RPi4
	aplay=$( aplay -l | grep '^card' )
elif [[ $model == 09 || $model == 0c ]]; then  # RPi Zero
	aplay=$( aplay -l | grep '^card' | grep -v 'IEC958/HDMI1\|bcm2835 ALSA\]$' )
else
	aplay=$( aplay -l | grep '^card' | grep -v 'IEC958/HDMI1' )
fi

file=/etc/mpd.conf
mixertype=$( grep mixer_type $file | cut -d'"' -f2 )
mpdconf=$( sed '/audio_output/,/}/ d' $file ) # remove all outputs

readarray -t lines <<<"$aplay"
for line in "${lines[@]}"; do
	device=$( echo $line | sed 's/card \(.*\):.*device \(.*\):.*/hw:\1,\2/' )
	card=${device:3:1}
	if [[ $mixertype == none ]]; then
		scontents=$( amixer -c $card scontents | grep -B1 'pvolume' | grep 'Simple' | awk -F"['']" '{print $2}' )
		readarray -t mixers <<<"$scontents"
		for mixer in "${mixers[@]}"; do
			amixer -c $card sset "$mixer" 0dB
		done
	fi
	subdevice=${device: -1}
	# aplay -l > card 0: sndrpirpidac [snd_rpi_rpi_dac], device 0: RPi-DAC HiFi pcm1794a-codec-0 [RPi-DAC HiFi pcm1794a-codec-0]
	# snd_rpi_rpi_dac > rpi-dac.dtbo
	aplayname=$( echo $line | awk -F'[][]' '{print $2}' | sed 's/snd_rpi_//' | tr '_' '-' )
	aplaynameL=$( echo "$aplay" | grep -c "$name" )
	(( $aplaynameL > 1 )) && aplayname="$aplayname"_$(( subdevice + 1 ))
	# name and output route command if any
	mixer_control=
	routecmd=
	i2sfile="/srv/http/settings/i2s/$aplayname"
	[[ $aplayname == $sysname ]] && name=$audiooutput
	if [[ -e "$i2sfile" ]]; then
		mixer_control=$( grep mixer_control "$i2sfile"  | cut -d: -f2- )
		routecmd=$( grep route_cmd "$i2sfile" | cut -d: -f2 )
		[[ -n $routecmd ]] && eval ${routecmd/\*CARDID\*/$card}
		[[ -z "$name" ]] && name=$( grep extlabel "$i2sfile" | cut -d: -f2- )
	fi
	[[ -z "$name" ]] && name=$aplayname
	
	mpdconf+='

audio_output {
	name              "'$aplayname'"
	device            "'$device'"
	type              "alsa"
	auto_resample     "no"
	auto_format       "no"'
	
	if [[ -n $mixer_control ]]; then
		mpdconf+='
	mixer_control     "'$mixer_control'"
	mixer_device      "hw:'$card'"'
	
	fi
	
	if [[ -e /srv/http/data/system/mpd-dop && ${aplayname:0:-2} != 'bcm2835 ALSA' ]]; then
		mpdconf+='
	dop               "yes"'
	
	fi
	
	mpdconf+='
}'

done

echo "$mpdconf" > $file

systemctl restart mpd mpdidle

(( $# == 0 ) && exit

usbdacfile=/srv/http/data/system/usbdac
if [[ $1 == remove ]]; then
	name=$audiooutput
	rm -f $usbdacfile
else if [[ $1 == add ]]; then
	echo $aplayname > $usbdacfile
fi

# last one is new one
curl -s -X POST 'http://127.0.0.1/pub?id=notify' -d '{ "title": "Audio Output Switched", "text": "'"$name"'", "icon": "output" }'
curl -s -X POST 'http://127.0.0.1/pub?id=page' -d '{ "p": "mpd" }'

} &
