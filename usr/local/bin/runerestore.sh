#!/bin/bash

version=e2

. /srv/http/addons-functions.sh

title "$bar Restore database and settings ..."

dirdata=/srv/http/data
dirdisplay=$dirdata/display
dirsystem=$dirdata/system

# addons
rm /srv/http/data/addons/*
echo $( grep -A 2 rare /srv/http/addons-list.php | tail -1 | cut -d"'" -f4 ) > /srv/http/data/addons/rare

# accesspoint
if [[ -e /usr/bin/hostapd && -e $dirsystem/accesspoint && -e $dirsystem/accesspoint-passphrase ]]; then
	echo -e "\nEnable and restore $( tcolor 'RPi access point' ) ...\n"
	passphrase=$( cat $dirsystem/accesspoint-passphrase )
	ip=$( cat $dirsystem/accesspoint-ip )
	iprange=$( cat $dirsystem/accesspoint-iprange )
	sed -i -e "/wpa\|rsn_pairwise/ s/^#\+//
		 " -e "s/\(wpa_passphrase=\).*/\1$passphrase/
		 " /etc/hostapd/hostapd.conf
	sed -i -e "s/^\(dhcp-range=\).*/\1$iprange/
		 " -e "s/^\(dhcp-option-force=option:router,\).*/\1$ip/
		 " -e "s/^\(dhcp-option-force=option:dns-server,\).*/\1$ip/
		 " /etc/dnsmasq.conf
fi
# airplay
if [[ -e /usr/bin/shairport-sync && -e $dirsystem/airplay ]]; then
	echo -e "\nEnable $( tcolor AirPlay ) ...\n"
	systemctl enable shairport-sync
else
	systemctl disable shairport-sync
fi
# color
if [[ -e $dirdisplay/color ]]; then
	echo -e "$bar $( tcolor 'Restore color' ) ..."
	. /srv/http/addons-functions.sh
	setColor
fi
# fstab
if ls $dirsystem/fstab-* &> /dev/null; then
	echo -e "\nRestore $( tcolor 'NAS mounts' ) ...\n"
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
	echo -e "\nRestore $( tcolor Hostname ) ...\n"
	name=$( cat $dirsystem/hostname )
	namelc=$( echo $name | tr '[:upper:]' '[:lower:]' )
	hostname $namelc
	echo $namelc > /etc/hostname
	sed -i "s/^\(ssid=\).*/\1$name/" /etc/hostapd/hostapd.conf &> /dev/null
	sed -i "s/\(zeroconf_name           \"\).*/\1$name\"/" /etc/mpd.conf
	sed -i "/ExecStart/ s/\\w*$/$name/" /etc/systemd/system/wsdd.service
	sed -i "s/^\(name = \).*/\1$name" /etc/shairport-sync.conf &> /dev/null
	sed -i "s/^\(friendlyname = \).*/\1$name/" /etc/upmpdcli.conf &> /dev/null
	sed -i "s/\(.*\[\).*\(\] \[.*\)/\1$namelc\2/" /etc/avahi/services/runeaudio.service
	sed -i "s/\(.*localdomain \).*/\1$namelc.local $namelc/" /etc/hosts
fi
# localbrowser
file=$dirsystem/localbrowser
if [[ -e /usr/bin/chromium && -e $file ]]; then
	if [[ -e $file-cursor || -e $file-zoom || -e $file-screenoff || -e $file-rotate || -e $file-overscan ]]; then
		echo -e "\nRestore $( tcolor 'Browser on RPi' ) settings ...\n"
		[[ -e $file-cursor ]] && cursor=yes || cursor=no
		sed -i -e "s/\(-use_cursor \).*/\1$cursor \&/" /etc/X11/xinit/xinitrc
		[[ -e $file-zoom ]] && zoom=$( cat $file-zoom ) || zoom=1
		sed -i "s/\(factor=.*\)/\1$zoom/" /etc/X11/xinit/xinitrc
		[[ -e $file-screenoff ]] && screenoff=$( cat $file-screenoff ) || screenoff=0
		sed -i "s/\(xset dpms 0 0 \).*/\1$screenoff \&/" /etc/X11/xinit/xinitrc
		if [[ -e $file-rotate ]]; then
			cp $file-rotate /etc/X11/xorg.conf.d/99-raspi-rotate.conf
		else
			rm /etc/X11/xorg.conf.d/99-raspi-rotate.conf
		fi
		if [[ $( cat $file-overscan ) == 1 ]]; then
			sed -i '/^disable_overscan=1/ s/^#//' /boot/config.txt
		else
			sed -i '/^disable_overscan=1/ s/^/#/' /boot/config.txt
		fi
	fi
	systemctl enable localbrowser
else
	systemctl disable localbrowser
fi
# login
if [[ -e $dirsystem/login ]]; then
	echo -e "\nEnable $( tcolor Login ) ...\n"
	sed -i 's/\(bind_to_address\).*/\1         "127.0.0.1"/' /etc/mpd.conf
else
	sed -i 's/\(bind_to_address\).*/\1         "0.0.0.0"/' /etc/mpd.conf
fi
# mpd.conf
if [[ -e $dirsystem/mpd-* ]]; then
	echo -e "\nRestore $( tcolor 'MPD options' ) ...\n"
	[[ -e $dirsystem/mpd-autoupdate ]] && sed -i 's/\(auto_update\s*"\).*/\1yes"/' /etc/mpd.conf
	 sed '1 i\audio_buffer_size       "2222"'
	[[ -e $dirsystem/mpd-buffer ]] && sed -i '1 i\audio_buffer_size       "'$( cat $dirsystem/mpd-buffer )'"' /etc/mpd.conf
	[[ -e $dirsystem/mpd-ffmpeg ]] && sed -i '/ffmpeg/ {n;s/\(enabled\s*"\).*/\1yes"/}' /etc/mpd.conf
	[[ -e $dirsystem/mpd-mixertype ]] && sed -i "s/\(mixer_type\s*\"\).*/\1$( cat $dirsystem/mpd-mixertype )\"/" /etc/mpd.conf
	[[ -e $dirsystem/mpd-normalization ]] && sed -i 's/\(volume_normalization\s*"\).*/\1yes"/' /etc/mpd.conf
	[[ -e $dirsystem/mpd-replaygain ]] && sed -i "s/\(replaygain\s*\"\).*/\1$( cat $dirsystem/mpd-replaygain )\"/" /etc/mpd.conf
fi
# netctl profiles
if ls $dirsystem/netctl-* &> /dev/null; then
	echo -e "\nRestore $( tcolor 'Wi-Fi connections' ) ...\n"
	rm /etc/netctl/*
	files=( /srv/http/data/system/netctl-* )
	if [[ -n $files ]]; then
		for file in "${files[@]}"; do
			profile=${file/netctl-}
			cp "$file" "/etc/netctl/$profile"
		done
		systemctl enable netctl-auto@wlan0
	else
		systemctl disable netctl-auto@wlan0
	fi
fi
# ntp
if [[ -e $dirsystem/ntp ]]; then
	echo -e "\nRestore $( tcolor  'NTP servers' ) ...\n"
	sed -i "s/#*NTP=.*/NTP=$( cat $dirsystem/ntp )/" /etc/systemd/timesyncd.conf
fi
# onboard devices
if [[ ! -e $dirsystem/onboard-audio ]]; then
	echo -e "\nDisable $( tcolor 'Onboard audio' ) ...\n"
	sed -i 's/\(dtparam=audio=\).*/\1off/' /boot/config.txt
else
	sed -i 's/\(dtparam=audio=\).*/\1on/' /boot/config.txt
fi
if [[ -e $dirsystem/onboard-bluetooth ]]; then
	echo -e "\nEnable $( tcolor 'Onboard Bluetooth' ) ...\n"
	sed -i -e '/^dtoverlay=pi3-disable-bt/ s/^/#/' -e '/^#dtoverlay=bcmbt/ s/^#//' /boot/config.txt
else
	sed -i '/^#dtoverlay=pi3-disable-bt/ s/^#//' -e '/^dtoverlay=bcmbt/ s/^/#/' /boot/config.txt
fi
if [[ ! -e $dirsystem/onboard-wlan ]]; then
	echo -e "\nDisable $( tcolor 'Oonboard Wi-Fi' ) ...\n"
	sed -i '/^#dtoverlay=pi3-disable-wifi/ s/^#//' /boot/config.txt
else
	sed -i '/^dtoverlay=pi3-disable-wifi/ s/^/#/' /boot/config.txt
fi
# samba
if [[ -e /ust/bin/samba && -e $dirsystem/samba ]]; then
	echo -e "\nEnable $( tcolor 'File sharing' ) ...\n"
	sed -i '/read only = no/ d' /etc/samba/smb.conf
	[[ -e $dirsystem/samba-readonlysd ]] && sed -i '/path = .*SD/,/\tread only = no/ {/read only/ d}' /etc/samba/smb.conf
	[[ -e $dirsystem/samba-readonlyusb ]] && sed -i '/path = .*USB/,/\tread only = no/ {/read only/ d}' /etc/samba/smb.conf
	systemctl enable nmb smb wsdd
else
	systemctl disable nmb smb wsdd
fi
# timezone
if [[ -e $dirsystem/timezone ]]; then
	echo -e "\nRestore $( tcolor Timezone ) ...\n"
	ln -sf /usr/share/zoneinfo/$( cat $dirsystem/timezone ) /etc/localtime
fi
# upnp
if [[ -e /usr/bin/upmpdcli && -e $dirsystem/upnp ]]; then
	echo -e "\nRestore $( tcolor UPnP ) settings ...\n"
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
	[[ -e $dirsystem/upnp-gmusicuser ]] && setUpnp gmusic
	[[ -e $dirsystem/upnp-qobuzuser ]] && setUpnp qobuz
	[[ -e $dirsystem/upnp-tidaluser ]] && setUpnp tidal
	[[ -e $dirsystem/upnp-spotifyluser ]] && setUpnp spotify
	if [[ -e $dirsystem/upnp-ownqueue ]]; then
		sed -i '/^ownqueue/ d' /etc/upmpdcli.conf
	else
		sed -i '/^#ownqueue = / a\ownqueue = 0' /etc/upmpdcli.conf
	fi
	systemctl enable upmpdcli
else
	systemctl disable upmpdcli
fi
# version
echo $version > $dirsystem/version

# set permissions and ownership
chown -R http:http "$dirdata"
chown -R mpd:audio "$dirdata/mpd"

title -nt "$bar Database and settings restored successfully."
