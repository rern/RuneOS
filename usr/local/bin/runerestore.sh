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
	echo -e "\nEnable and restore \e[36mRPi access point\e[m settings ...\n"
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
	echo -e "\nEnable \e[36mAirPlay\e[m ...\n"
	systemctl enable shairport-sync
else
	systemctl disable shairport-sync
fi
# color
if [[ -e $dirdisplay/color ]]; then
	echo -e "$bar Restore color settings ..."
	. /srv/http/addons-functions.sh
	setColor
fi
# fstab
if ls $dirsystem/fstab-* &> /dev/null; then
	echo -e "\nRestore \e[36mNAS\e[m mounts ...\n"
	sed -i '\|/mnt/MPD/NAS| d' /etc/fstab
	rmdir /mnt/MPD/NAS/* &> /dev/null
	files=( /srv/http/data/system/fstab-* )
	for file in "${files[@]}"; do
		cat $file >> /etc/fstab
		mkdir -p "/mnt/MPD/NAS/${file/*fstab-}"
	done
fi
# hostname
if [[ -e $dirsystem/hostname ]]; then
	echo -e "\nRestore \e[36mHostname\e[m ...\n"
	name=$( cat $dirsystem/hostname )
	namelc=$( echo $name | tr '[:upper:]' '[:lower:]' )
	hostname $namelc
	echo $namelc > /etc/hostname
	sed -i "s/^\(ssid=\).*/\1$name/" /etc/hostapd/hostapd.conf &> /dev/null
	sed -i "s/\(zeroconf_name           \"\).*/\1$name\"/" /etc/mpd.conf
	sed -i "s/\(netbios name = \).*/\1$name/" /etc/samba/smb.conf &> /dev/null
	sed -i "s/^\(name = \).*/\1$name" /etc/shairport-sync.conf &> /dev/null
	sed -i "s/^\(friendlyname = \).*/\1$name/" /etc/upmpdcli.conf &> /dev/null
	sed -i "s/\(.*\[\).*\(\] \[.*\)/\1$namelc\2/" /etc/avahi/services/runeaudio.service
	sed -i "s/\(.*localdomain \).*/\1$namelc.local $namelc/" /etc/hosts
fi
# localbrowser
if [[ -e /usr/bin/chromium && -e $dirsystem/localbrowser ]]; then
	echo -e "\nRestore \e[36mBrowser on RPi\e[m settings ...\n"
	if [[ -e $dirsystem/localbrowser-cursor ]]; then
		sed -i -e "s/\(-use_cursor \).*/\1$( cat $dirsystem/localbrowser-cursor ) \&/
			 " -e "s/\(xset dpms 0 0 \).*/\1$( cat $dirsystem/localbrowser-screenoff ) \&/" /etc/X11/xinit/xinitrc
		cp $dirsystem/localbrowser-rotatecontent /etc/X11/xorg.conf.d/99-raspi-rotate.conf
		if [[ $( cat $dirsystem/localbrowser-overscan ) == 1 ]]; then
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
	echo -e "\nEnable \e[36mLogin\e[m ...\n"
	sed -i 's/\(bind_to_address\).*/\1         "127.0.0.1"/' /etc/mpd.conf
else
	sed -i 's/\(bind_to_address\).*/\1         "0.0.0.0"/' /etc/mpd.conf
fi
# mpd.conf
if [[ -e $dirsystem/mpd-* ]]; then
	echo -e "\nRestore \e[36mMPD\e[m options ...\n"
	[[ -e $dirsystem/mpd-autoupdate ]] && sed -i 's/\(auto_update\s*"\).*/\1yes"/' /etc/mpd.conf
	[[ -e $dirsystem/mpd-buffer ]] && sed -i "s/\(audio_buffer_size\s*\"\).*/\1$( cat $dirsystem/mpd-buffer )\"/" /etc/mpd.conf
	[[ -e $dirsystem/mpd-ffmpeg ]] && sed -i '/ffmpeg/ {n;s/\(enabled\s*"\).*/\1yes"/}' /etc/mpd.conf
	[[ -e $dirsystem/mpd-mixertype ]] && sed -i "s/\(mixer_type\s*\"\).*/\1$( cat $dirsystem/mpd-mixertype )\"/" /etc/mpd.conf
	[[ -e $dirsystem/mpd-normalization ]] && sed -i 's/\(volume_normalization\s*"\).*/\1yes"/' /etc/mpd.conf
	[[ -e $dirsystem/mpd-replaygain ]] && sed -i "s/\(replaygain\s*\"\).*/\1$( cat $dirsystem/mpd-replaygain )\"/" /etc/mpd.conf
fi
# netctl profiles
if ls $dirsystem/netctl-* &> /dev/null; then
	echo -e "\nRestore \e[36mWi-Fi\e[m connections ...\n"
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
	echo -e "\nRestore \e[36mNTP\e[m servers ...\n"
	sed -i "s/#*NTP=.*/NTP=$( cat $dirsystem/ntp )/" /etc/systemd/timesyncd.conf
fi
# onboard devices
if [[ ! -e $dirsystem/onboard-audio ]]; then
	echo -e "\nDisable \e[36mOnboard audio\e[m ...\n"
	sed -i 's/\(dtparam=audio=\).*/\1off/' /boot/config.txt
else
	sed -i 's/\(dtparam=audio=\).*/\1on/' /boot/config.txt
fi
if [[ -e $dirsystem/onboard-bluetooth ]]; then
	echo -e "\nEnable \e[36mOnboard Bluetooth\e[m ...\n"
	sed -i '/^#dtoverlay=pi3-disable-bt/ s/^#//' /boot/config.txt
else
	sed -i '/^dtoverlay=pi3-disable-bt/ s/^/#/' /boot/config.txt
fi
if [[ ! -e $dirsystem/onboard-wlan ]]; then
	echo -e "\nDisable\e[36mOonboard Wi-Fi\e[m ...\n"
	sed -i '/^dtoverlay=pi3-disable-wifi/ s/^/#/' /boot/config.txt
else
	sed -i '/^#dtoverlay=pi3-disable-wifi/ s/^#//' /boot/config.txt
fi
# samba
if [[ -e /ust/bin/samba && -e $dirsystem/samba ]]; then
	echo -e "\nEnable \e[36mFile sharing\e[m ...\n"
	sed -i '/read only = no/ d' /etc/samba/smb.conf
	[[ -e $dirsystem/samba-writesd ]] && sed -i '/path = .*USB/ a\tread only = no' /etc/samba/smb.conf
	[[ -e $dirsystem/samba-writeusb ]] && sed -i '/path = .*LocalStorage/ a\tread only = no' /etc/samba/smb.conf
	systemctl enable nmb smb
else
	systemctl disable nmb smb
fi
# timezone
if [[ -e $dirsystem/timezone ]]; then
	echo -e "\nRestore \e[36mTimezone\e[m ...\n"
	ln -sf /usr/share/zoneinfo/$( cat $dirsystem/timezone ) /etc/localtime
fi
# upnp
if [[ -e /usr/bin/upmpdcli && -e $dirsystem/upnp ]]; then
	echo -e "\nRestore \e[36mUPnP\e[m settings ...\n"
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
