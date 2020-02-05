#!/bin/bash

version=e2

. /srv/http/addons-functions.sh

title "$bar Restore database and settings ..."

dirdata=/srv/http/data
dirdisplay=$dirdata/display
dirsystem=$dirdata/system

# i2s audio
audioaplayname=$( cat /srv/http/data/system/audio-aplayname 2> /dev/null )
audiooutput=$( cat /srv/http/data/system/audio-output )
if grep -q "$audiooutput.*=>.*$audioaplayname" /srv/http/settings/system-i2smodules.php; then
	echo -e "\n$( tcolor "$audiooutput" )"
	echo dtoverlay=$audioaplayname
	sed -i -e '/^dtoverlay/ d
		' -e '/^#dtparam=i2s=on/ s/^#//
		' -e 's/\(dtparam=audio=\).*/\1off/
		' -e "$ a\dtoverlay=$audioaplayname
		" /boot/config.txt
fi
# addons
rm /srv/http/data/addons/*
echo $( grep -A 2 rare /srv/http/addons-list.php | tail -1 | cut -d"'" -f4 ) > /srv/http/data/addons/rare
# accesspoint
if [[ -e /usr/bin/hostapd ]]; then
	if [[ -e $dirsystem/accesspoint ]]; then
		echo -e "\n$( tcolor 'RPi Access Point' )"
		echo Enabled
		systemctl enable hostapd
	elif [[ -e $dirsystem/accesspoint-passphrase ]]; then
		echo -e "\n$( tcolor 'RPi Access Point' )"
	fi
	if [[ -e $dirsystem/accesspoint-passphrase ]]; then
		passphrase=$( cat $dirsystem/accesspoint-passphrase )
		ip=$( cat $dirsystem/accesspoint-ip )
		iprange=$( cat $dirsystem/accesspoint-iprange )
		echo IP: $ip
		sed -i -e "/wpa\|rsn_pairwise/ s/^#\+//
			 " -e "s/\(wpa_passphrase=\).*/\1$passphrase/
			 " /etc/hostapd/hostapd.conf
		sed -i -e "s/^\(dhcp-range=\).*/\1$iprange/
			 " -e "s/^\(dhcp-option-force=option:router,\).*/\1$ip/
			 " -e "s/^\(dhcp-option-force=option:dns-server,\).*/\1$ip/
			 " /etc/dnsmasq.conf
	fi
fi
# airplay
if [[ -e /usr/bin/shairport-sync && -e $dirsystem/airplay ]]; then
	echo -e "\n$( tcolor AirPlay )"
	echo Enabled
	systemctl enable shairport-sync
fi
# color
if [[ -e $dirdisplay/color ]]; then
	echo -e "\n$( tcolor UI colors )"
	echo Color: $( cat $dirdisplay/color )
	. /srv/http/addons-functions.sh
	setColor
fi
# fstab
if ls $dirsystem/fstab-* &> /dev/null; then
	echo -e "\n$( tcolor 'NAS mounts' )"
	echo Restored
	sed -i '\|/mnt/MPD/NAS| d' /etc/fstab
	rmdir /mnt/MPD/NAS/* &> /dev/null
	files=( /srv/http/data/system/fstab-* )
	for file in "${files[@]}"; do
		cat $file >> /etc/fstab
		mkdir -p "/mnt/MPD/NAS/${file/*fstab-}"
	done
fi
# hostname
if [[ $( cat $dirsystem/hostname ) != RuneAudio ]]; then
	hostname=$( cat $dirsystem/hostname )
	echo -e "\n$( tcolor Hostname )"
	echo $hostname
	hostnamelc=$( echo $hostname | tr '[:upper:]' '[:lower:]' )
	hostnamectl set-hostname $hostnamelc
	sed -i "s/\(.*\[\).*\(\] \[.*\)/\1$hostnamelc\2/" /etc/avahi/services/runeaudio.service
	sed -i "s/^\(ssid=\).*/\1$hostname/" /etc/hostapd/hostapd.conf &> /dev/null
	sed -i "s/\(zeroconf_name           \"\).*/\1$hostname\"/" /etc/mpd.conf
	sed -i "s/\(netbios name = \"\).*/\1+ $hostnamelc +\"/" /etc/samba/smb.conf
	sed -i "/ExecStart/ s/\\w*$/$hostname/" /etc/systemd/system/wsdd.service
	sed -i "s/^\(name = \).*/\1$hostname" /etc/shairport-sync.conf &> /dev/null
	sed -i "s/^\(friendlyname = \).*/\1$hostname/" /etc/upmpdcli.conf &> /dev/null
fi
# localbrowser
if [[ -e /usr/bin/chromium ]]; then
	file=$dirsystem/localbrowser
	if [[ -e $file ]]; then
		echo -e "\n$( tcolor 'Browser on RPi' )"
		echo Enabled
		systemctl enable localbrowser
	elif ls $file-* &> /dev/null; then
		echo -e "\n$( tcolor 'Browser on RPi' )"
	fi
	if [[ -e $file-cursor ]]; then
		sed -i -e "s/\(-use_cursor \).*/\1yes \&/" /etc/X11/xinit/xinitrc
		echo Cursor: enabled
	fi
	if [[ -e $file-overscan ]]; then
		sed -i '/^disable_overscan=1/ s/^#//' /boot/config.txt
		echo Overscan: enabled
	fi
	if [[ -e $file-rotate ]]; then
		cp $file-rotatefile /etc/X11/xorg.conf.d/99-raspi-rotate.conf
		echo Rotate: $( grep rotate $file-rotate | cut -d'"' -f4 )
	fi
	if [[ -e $file-screenoff ]]; then
		screenoff=$( cat $file-screenoff )
		sed -i 's/\(xset dpms 0 0 \).*/\1'$screenoff' \&/' /etc/X11/xinit/xinitrc
		echo Screenoff: $screenoff
	fi
	if [[ -e $file-zoom ]]; then
		zoom=$( cat $file-zoom )
		sed -i 's/\(factor=.*\)/\1'$zoom'/' /etc/X11/xinit/xinitrc
		echo Zoom: $zoom
	fi
fi
# login
if [[ -e $dirsystem/login ]]; then
	echo -e "\n$( tcolor Login )"
	echo Enabled
	sed -i 's/\(bind_to_address\).*/\1         "127.0.0.1"/' /etc/mpd.conf
fi
# mpd.conf
file=$dirsystem/mpd
if ls $file-* &> /dev/null; then
	echo -e "\n$( tcolor 'MPD' )"
	if [[ -e $file-mixertype ]]; then
		mixertype=$( cat $dirsystem/mpd-mixertype )
		sed -i 's/\(mixer_type\s*\"\).*/\1'$mixertype'"/' /etc/mpd.conf
		echo Volume Control: $mixertype
	fi
	if [[ -e $file-autoupdate ]]; then
		sed -i 's/\(auto_update\s*"\).*/\1yes"/' /etc/mpd.conf
		echo Auto Update: enabled
	fi
	if [[ -e $file-buffer ]]; then
		buffer=$( cat $dirsystem/mpd-buffer )
		sed -i '1 i\audio_buffer_size       "'$buffer'"' /etc/mpd.conf
		echo Custom Buffer: $buffer
	fi
	if [[ -e $file-ffmpeg ]]; then
		sed -i '/ffmpeg/ {n;s/\(enabled\s*"\).*/\1yes"/}' /etc/mpd.conf
		echo FFmpeg: enabled
	fi
	if [[ -e $file-normalization ]]; then
		sed -i 's/\(volume_normalization\s*"\).*/\1yes"/' /etc/mpd.conf
		echo Normalization: enabled
	fi
	if [[ -e $file-replaygain ]]; then
		replaygain=$( cat $dirsystem/mpd-replaygain )
		sed -i 's/\(replaygain\s*\"\).*/\1'$replaygain'"/' /etc/mpd.conf
		echo Replay Gain: $replaygain
	fi
fi
# netctl profiles
if ls $dirsystem/netctl-* &> /dev/null; then
	echo -e "\n$( tcolor 'Wi-Fi Connections' )"
	files=( /srv/http/data/system/netctl-* )
	if [[ -n $files ]]; then
		for file in "${files[@]}"; do
			filename=$( basename $file )
			name=${filename/netctl-}
			echo $name
			cp "$file" "/etc/netctl/$name"
		done
		systemctl enable netctl-auto@wlan0
	fi
fi
# ntp
if [[ -e $dirsystem/ntp ]]; then
	ntp=$( cat $dirsystem/ntp )
	echo -e "\n$( tcolor  'NTP Servers' )"
	echo $ntp
	sed -i "s/#*NTP=.*/NTP=$ntp/" /etc/systemd/timesyncd.conf
fi
# onboard devices
if [[ ! -e $dirsystem/onboard-audio ]]; then
	echo -e "\n$( tcolor 'Onboard Audio' )"
	echo Disabled
	sed -i 's/\(dtparam=audio=\).*/\1off/' /boot/config.txt
fi
if [[ ! -e $dirsystem/onboard-bluetooth ]]; then
	echo -e "\n$( tcolor 'Onboard Bluetooth' )"
	echo Disabled
	sed -i -e '/^#dtoverlay=pi3-disable-bt/ s/^#//' -e '/^dtoverlay=bcmbt/ s/^/#/' /boot/config.txt
fi
if [[ ! -e $dirsystem/onboard-wlan ]]; then
	echo -e "\n$( tcolor 'Onboard Wi-Fi' )"
	echo Disabled
	sed -i '/^#dtoverlay=pi3-disable-wifi/ s/^#//' /boot/config.txt
fi
# samba
if [[ -e /ust/bin/samba ]]; then
	file=$dirsystem/samba
	if [[ -e $file ]]; then
		echo -e "\nEnable $( tcolor 'File Sharing' )"
		echo Enabled
		systemctl enable nmb smb wsdd
	elif ls $file-* &> /dev/null; then
		echo -e "\n$( tcolor 'File Sharing' )"
	fi
	if [[ -e $file-readonlysd ]]; then
		sed -i '/path = .*SD/,/\tread only = no/ {/read only/ d}' /etc/samba/smb.conf
		echo SD: read only
	fi
	if [[ -e $file-readonlyusb ]]; then
		sed -i '/path = .*USB/,/\tread only = no/ {/read only/ d}' /etc/samba/smb.conf
		echo USB: read only
	fi
fi
# timezone
if [[ -e $dirsystem/timezone ]]; then
	timezone=$( cat $dirsystem/timezone )
	echo -e "\n$( tcolor Timezone )"
	echo $timezone
	timedatectl set-timezone $timezone
	ln -sf /usr/share/zoneinfo/$timezone /etc/localtime
fi
# upnp
if [[ -e /usr/bin/upmpdcli && -e $dirsystem/upnp ]]; then
	file=$dirsystem/upnp
	if [[ -e $file ]]; then
		echo -e "\nEnable $( tcolor 'UPnP' )"
		systemctl enable upmpdcli
	elif ls $file-* &> /dev/null; then
		echo -e "\n$( tcolor UPnP )"
	fi
	setUpnp() {
		user=( $( cat $dirsystem/upnp-$1user ) )
		pass=( $( cat $dirsystem/upnp-$1pass ) )
		quality=( $( cat $dirsystem/upnp-$1quality 2> /dev/null ) )
		[[ $1 == qobuz ]] && qlty=formatid || qlty=quallity
		sed -i -e "s/#*\($1user = \).*/\1$user/
		 	" -e "s/#*\($1pass = \).*/\1$pass/
		 	" -e "s/#*\($1$qlty = \).*/\1$quality/
			 " /etc/upmpdcli.conf
	}
	[[ -e $file-gmusicuser ]] && setUpnp gmusic && echo Gmusic
	[[ -e $file-qobuzuser ]] && setUpnp qobuz && echo Qobuz
	[[ -e $file-tidaluser ]] && setUpnp tidal && echo Tidal
	[[ -e $file-spotifyluser ]] && setUpnp spotify && echo Spotify
	if [[ -e $file-ownqueuenot ]]; then
		sed -i '/^#ownqueue = / a\ownqueue = 0' /etc/upmpdcli.conf
		echo Remove playlist: enabled
	fi
fi
# version
echo $version > $dirsystem/version

# set permissions and ownership
chown -R http:http "$dirdata"
chown -R mpd:audio "$dirdata/mpd"

title -nt "$bar Database and settings restored successfully."
