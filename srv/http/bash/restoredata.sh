#!/bin/bash

dirdata=/srv/http/data
dirdisplay=$dirdata/display

systemctl stop mpd mpdidle

version=$( cat $dirdata/system/version )

if [[ $1 == restore ]]; then
	backupfile=$dirdata/tmp/backup.xz
	rm -rf $dirdata
	bsdtar -xpf $backupfile -C /srv/http
	rm $backupfile
elif [[ $1 == reset ]]; then # reset to default
	mv -f $dirdata/addons /tmp
	rm -rf $dirdata
	/srv/http/bash/resetdata.sh
	mv -f /tmp/addons $dirdata
else # from copied data
	chown -R http:http "$dirdata"
	chown -R mpd:audio "$dirdata/mpd"
fi
# version
echo $version > $dirsystem/version

# saved playlist (temp: to be remove on next release)
dirplaylists=$dirdata/playlists
[[ $( cat "$dirplaylists/$( ls $dirplaylists | head -1 )" | head -1 ) != '[' ]] && php /usr/local/bin/convertplaylist.php

# addons
rm /srv/http/data/addons/*
echo $( grep -A 2 rare /srv/http/addons-list.php | tail -1 | cut -d"'" -f4 ) > /srv/http/data/addons/rare
# hostname
if [[ $( cat $dirsystem/hostname ) != RuneAudio ]]; then
	hostname=$( cat $dirsystem/hostname )
	hostnamelc=$( echo $hostname | tr '[:upper:]' '[:lower:]' )
	hostnamectl set-hostname $hostnamelc
	sed -i "s/\(.*\[\).*\(\] \[.*\)/\1$hostnamelc\2/" /etc/avahi/services/runeaudio.service
	sed -i "s/^\(ssid=\).*/\1$hostname/" /etc/hostapd/hostapd.conf &> /dev/null
	sed -i "s/\(netbios name = \"\).*/\1+ $hostnamelc +\"/" /etc/samba/smb.conf
	sed -i "/ExecStart/ s/\\w*$/$hostname/" /etc/systemd/system/wsdd.service
	sed -i "s/^\(name = \).*/\1$hostname" /etc/shairport-sync.conf &> /dev/null
	sed -i "s/^\(friendlyname = \).*/\1$hostname/" /etc/upmpdcli.conf &> /dev/null
fi
# chromium
if [[ -e /usr/bin/chromium ]]; then
	file=$dirsystem/localbrowser
	[[ -e $file-cursor ]] && sed -i -e "s/\(-use_cursor \).*/\1yes \&/" /etc/X11/xinit/xinitrc
	[[ -e $file-overscan ]] && sed -i '/^disable_overscan=1/ s/^#//' /boot/config.txt
	[[ -e $file-rotate ]] && cp $file-rotatefile /etc/X11/xorg.conf.d/99-raspi-rotate.conf
	[[ -e $file-screenoff ]] && sed -i 's/\(xset dpms 0 0 \).*/\1'$( cat $file-screenoff )' \&/' /etc/X11/xinit/xinitrc
	[[ -e $file-zoom ]] && sed -i 's/\(factor=.*\)/\1'$( cat $file-zoom )'/' /etc/X11/xinit/xinitrc
	[[ -e $file ]] && systemctl enable --now localbrowser
fi
# color
if [[ -e $dirdisplay/color ]]; then
	. /srv/http/addons-functions.sh
	setColor
fi
# fstab
if ls $dirsystem/fstab-* &> /dev/null; then
	sed -i '\|/mnt/MPD/NAS| d' /etc/fstab
	rmdir /mnt/MPD/NAS/* &> /dev/null
	files=( /srv/http/data/system/fstab-* )
	for file in "${files[@]}"; do
		cat $file >> /etc/fstab
		mkdir -p "/mnt/MPD/NAS/${file/*fstab-}"
	done
	mount -a
fi
# hostapd
if [[ -e /usr/bin/hostapd ]]; then
	if [[ -e $dirsystem/accesspoint-passphrase ]]; then
		passphrase=$( cat $dirsystem/accesspoint-passphrase )
		ip=$( cat $dirsystem/accesspoint-ip )
		iprange=$( cat $dirsystem/accesspoint-iprange )
		sed -i -e "/wpa\|rsn_pairwise/ s/^#*//
			 " -e "s/\(wpa_passphrase=\).*/\1$passphrase/
			 " /etc/hostapd/hostapd.conf
		sed -i -e "s/^\(dhcp-range=\).*/\1$iprange/
			 " -e "s/^\(dhcp-option-force=option:router,\).*/\1$ip/
			 " -e "s/^\(dhcp-option-force=option:dns-server,\).*/\1$ip/
			 " /etc/dnsmasq.conf
	fi
	[[ -e $dirsystem/accesspoint ]] && systemctl enable --now hostapd
fi
# login
[[ -e $dirsystem/login ]] && sed -i 's/\(bind_to_address\).*/\1         "127.0.0.1"/' /etc/mpd.conf
# mpd.conf
file=$dirsystem/mpd
if ls $file-* &> /dev/null; then
	[[ -e $file-mixertype ]] && sed -i 's/\(mixer_type\s*\"\).*/\1'$( cat $dirsystem/mpd-mixertype )'"/' /etc/mpd.conf
	[[ -e $file-autoupdate ]] && sed -i 's/\(auto_update\s*"\).*/\1yes"/' /etc/mpd.conf
	[[ -e $file-buffer ]] && sed -i '1 i\audio_buffer_size       "'$( cat $dirsystem/mpd-buffer )'"' /etc/mpd.conf
	[[ -e $file-ffmpeg ]] && sed -i '/ffmpeg/ {n;s/\(enabled\s*"\).*/\1yes"/}' /etc/mpd.conf
	[[ -e $file-normalization ]] && sed -i 's/\(volume_normalization\s*"\).*/\1yes"/' /etc/mpd.conf
	[[ -e $file-replaygain ]] && sed -i 's/\(replaygain\s*\"\).*/\1'$( cat $dirsystem/mpd-replaygain )'"/' /etc/mpd.conf
fi
# netctl profiles
if ls $dirsystem/netctl-* &> /dev/null; then
	files=( /srv/http/data/system/netctl-* )
	if [[ -n $files ]]; then
		for file in "${files[@]}"; do
			filename=$( basename $file )
			cp "$file" "/etc/netctl/${filename/netctl-}"
		done
		systemctl enable netctl-auto@wlan0
	fi
fi
# ntp
[[ -e $dirsystem/ntp ]] && sed -i "s/#*NTP=.*/NTP=$( cat $dirsystem/ntp )/" /etc/systemd/timesyncd.conf
# onboard devices
[[ ! -e $dirsystem/onboard-audio ]] && sed -i 's/\(dtparam=audio=\).*/\1off/' /boot/config.txt
[[ ! -e $dirsystem/onboard-bluetooth ]] && sed -i -e '/dtoverlay=disable-bt/ s/^#*//' -e '/dtoverlay=bcmbt/ s/^/#/' /boot/config.txt
[[ ! -e $dirsystem/onboard-wlan ]] && sed -i '/dtoverlay=disable-wifi/ s/^#*//' /boot/config.txt
# samba
if [[ -e /ust/bin/samba ]]; then
	file=$dirsystem/samba
	[[ -e $file-readonlysd ]] && sed -i '/path = .*SD/,/\tread only = no/ {/read only/ d}' /etc/samba/smb.conf
	[[ -e $file-readonlyusb ]] && sed -i '/path = .*USB/,/\tread only = no/ {/read only/ d}' /etc/samba/smb.conf
	[[ -e $file ]] && systemctl enable --now nmb smb wsdd
fi
# shairport-sync
[[ -e /usr/bin/shairport-sync && -e $dirsystem/airplay ]] && systemctl enable --now shairport-sync
# timezone
[[ -e $dirsystem/timezone ]] && timedatectl set-timezone $( cat $dirsystem/timezone )
# upmpdcli
if [[ -e /usr/bin/upmpdcli && -e $dirsystem/upnp ]]; then
	file=$dirsystem/upnp
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
	[[ -e $file-gmusicuser ]] && setUpnp gmusic
	[[ -e $file-qobuzuser ]] && setUpnp qobuz
	[[ -e $file-tidaluser ]] && setUpnp tidal
	[[ -e $file-spotifyluser ]] && setUpnp spotify
	[[ -e $file-ownqueuenot ]] && sed -i '/^#ownqueue = / a\ownqueue = 0' /etc/upmpdcli.conf
	[[ -e $file ]] && systemctl enable --now upmpdcli
fi
# i2s audio
audioaplayname=$( cat /srv/http/data/system/audio-aplayname 2> /dev/null )
audiooutput=$( cat /srv/http/data/system/audio-output )
if grep -q "$audiooutput.*=>.*$audioaplayname" /srv/http/settings/system-i2smodules.php; then
	sed -i -e 's/\(dtparam=audio=\).*/\1off/
		' -e '/dtparam=i2s=on/ {N;d;}
		' /boot/config.txt
	sed -i "$ a\
dtparam=i2s=on\
dtparam=$audioaplayname
	" /boot/config.txt
	echo 'Enable I2S Module' >> /tmp/reboot
fi

systemctl start mpd mpdidle
