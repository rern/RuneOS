#!/bin/bash

# 1. mpd-conf.sh
#   - probe sound devices
#   - populate mpd.conf
#   - start mpd, mpdidle
# 2. set mpd sound device
# 3. set sound profile
# 4. autoplay
# 5. check addons update
# 6. disable wlan power saving

if [[ -e /boot/wifi ]]; then
	ssid=$( grep '^ESSID' /boot/wifi | cut -d'"' -f2 )
	sed -i 's/\r//' /boot/wifi
	cp /boot/wifi "/srv/http/data/system/netctl-$ssid"
	mv /boot/wifi "/etc/netctl/$ssid"
	netctl start "$ssid"
	systemctl enable netctl-auto@wlan0
fi

touch /tmp/startup  # flag for mpd-conf.sh > suppress audio output notification

/srv/http/settings/mpd-conf.sh # mpd mpdidle start here

dirsystem=/srv/http/data/system

/srv/http/settings/system-soundprofile.sh $( cat $dirsystem/soundprofile )

mountpoints=$( grep /mnt/MPD/NAS /etc/fstab | awk '{print $2}' )
if [[ -n "$mountpoints" ]]; then
	ip=$( grep '/mnt/MPD/NAS' /etc/fstab | tail -1 | cut -d' ' -f1 | sed 's|^//||; s|:*/.*$||' )
	sleep 10 # wait for network interfaces
	i=0
	while $( sleep 1 ); do
		ping -c 1 -w 1 $ip &> /dev/null && break
		
		(( i++ ))
		if (( i > 20 )); then
			echo 'NAS mount failed.<br><br><gr>Try reboot again.</gr>' > /srv/http/data/tmp/reboot
			curl -s -X POST 'http://127.0.0.1/pub?id=reload' -d 1
			exit
		fi
	done

	for mountpoint in $mountpoints; do
		mount $mountpoint
	done
fi

[[ ! -e /srv/http/data/mpd/mpd.db ]] && mpc rescan

[[ -e $dirsystem/mpd-crossfade ]] && mpc -q $( cat $dirsystem/mpd-crossfade )

[[ -e $dirsystem/autoplay ]] && mpc -q play

if [[ -z "$mountpoints" ]]; then
	sleep 10
	i=0
	while $( sleep 1 ); do
		 ip a show wlan0 &> /dev/null || (( i++ > 20 )) && break
	done
fi

wlans=$( ip a | grep 'wlan.:' | sed 's/.*: \(.*\):.*/\1/' )
if [[ -n "$wlans" ]]; then
	if [[ -e $dirsystem/accesspoint ]]; then
		ifconfig wlan0 $( grep router /etc/dnsmasq.conf | cut -d, -f2 )
		systemctl start dnsmasq hostapd
	fi
	
	sleep 15 # wait "power_save" ready for setting
	
	for wlan in $wlans; do
		iw $wlan set power_save off
	done
fi

/srv/http/addons-update.sh
