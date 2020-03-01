#!/bin/bash

hwcode=$( grep Revision /proc/cpuinfo | tail -c 4 | cut -c1-2 )
case $hwcode in
	11 )      aplay=$( aplay -l | grep '^card' );;
	09 | 0c ) aplay=$( aplay -l | grep '^card' | grep -v 'IEC958/HDMI1\|bcm2835 ALSA\]$' );;
	* )       aplay=$( aplay -l | grep '^card' | grep -v 'IEC958/HDMI1' );;
esac
cardL=$( echo "$aplay" | wc -l )

bcm2835=( 'On-board - 3.5mm' 'On-board - HDMI' 'On-board - HDMI 2' )
bcm2835device=( 1 2 3 )
wm5102=( 'WM5102 - Line' 'WM5102 - S/PDIF' 'WM5102 - 3.5mm' 'WM5102 - Speaker' )
wm5102device=( line_out spdif_out headset_out speakers_out )
audioaplayname=$( cat /srv/http/data/system/audio-aplayname )
mixerlist='
Allo Katana BossDAC IQaudIODAC PianoDAC PianoDACPlus hifiberry_dacplus justboom_dac :Digital
AudioQuest DragonFly UAC1 DAC :PCM
Geek Out HD Audio 1V0:LH Labs Clock Selector
Hugo:Hugo
raspyplay4 iqaudio_dac :Playback Digital
hifiberry_amp wm8731-audio :Master

ARCAM USB Audio 2.0:ARCAM Clock Selector
C-Media USB Headphone Set:Headphone
Devialet USB Audio 2.0:Devialet Clock Selector
DigiHug USB Audio NuForce USB Audio SA9023 USB Audio USB Audio CODEC :PCM
USB Sound Device:Speaker
'
readarray -t lines <<<"$aplay"
for line in "${lines[@]}"; do
	hw=$( echo $line | sed 's/card \(.*\):.*device \(.*\):.*/hw:\1,\2/' )
	card=${hw:3:1}
	device=${hw: -1}
	aplayname=$( echo $line | awk -F'[][]' '{print $2}' | sed 's/^snd_rpi_//' ) # aplay list i2s with prefix snd_rpi_
	if [[ $aplayname == 'bcm2835 ALSA' ]]; then
		name=${bcm2835[$device]}
		routecmd="amixer -c $card cset numid=3 ${bcm2835device[$device]} &> /dev/null"
	elif [[ $aplayname == 'rpi-cirrus-wm5102' ]]; then
		name=${wm5102[$device]}
		routecmd="/srv/http/bash/mpd-wm5102.sh $card ${wm5102device[$device]} &> /dev/null"
	elif [[ $aplayname == $audioaplayname ]]; then
		name=$( cat /srv/http/data/system/audio-output )
		routecmd=
	else
		(( $device == 0 )) && name=$aplayname || name="$aplayname $device"
		routecmd=
	fi
	amixer=$( amixer -c $card scontents | grep -B1 'pvolume .*pswitch' | grep 'Simple' | cut -d"'" -f2 )
	mixercount=$( echo "amixer" | wc -l )
	# user selected
	hwmixerfile=/srv/http/data/system/mpd-hwmixer-$card
	if [[ -e $hwmixerfile ]]; then
		hwmixer=$( cat $hwmixerfile )
		mixermanual=hwmixer
	else
		mixermanual=
		if (( $mixercount == 1 )); then
			hwmixer=$amixer
		else
			mixer=$( echo "$mixerlist" | grep "$aplayname" | cut -d: -f2 )
			if [[ -n $mixer ]]; then
				hwmixer=$mixer
			else
				hwmixer=$( echo $amixer | head -1 )
			fi
		fi
	fi
	
	Aaplayname+=( "$aplayname" )
	Acard+=( "$card" )
	Ahw+=( "$hw" )
	Ahwmixer+=( "$hwmixer" )
	Amixercount+=( "$mixercount" )
	Amixermanual+=( "$mixermanual" )
	Aname+=( "$name" )
	Aroutecmd+=( "$routecmd" )
done
