#!/bin/bash

# 1. set and connect wi-fi if pre-configured
# 2. set sound profile if enabled
# 3. set mpd-conf.sh
#   - list sound devices
#   - populate mpd.conf
#   - start mpd, mpdidle
# 4. set autoplay if enabled
# 5. disable wlan power saving
# 6. check addons updates

# remove wireless in config.txt
hardwarecode=$( grep Revision /proc/cpuinfo | awk '{print $NF}' )
case ${hardwarecode: -3:2} in
	00 | 01 | 02 | 03 | 04 | 09 ) # not rpi 0W, 3, 4
		sed -i '/### onboard/,/dtoverlay=bcmbt/ d' /boot/config.txt
		;;
esac
sed -i '/^# remove wireless/,/^# remove wireless/ d' /srv/http/bash/startup.sh
# remove wireless

touch /tmp/startup  # flag for mpd-conf.sh > suppress audio output notification

rm -f /srv/http/data/tmp/airplay* /srv/http/data/system/bootlog

dirsystem=/srv/http/data/system

if [[ -e /boot/wifi ]]; then
	ssid=$( grep '^ESSID' /boot/wifi | cut -d'"' -f2 )
	sed -i 's/\r//' /boot/wifi
	cp /boot/wifi "$dirsystem/netctl-$ssid"
	mv /boot/wifi "/etc/netctl/$ssid"
	netctl start "$ssid"
	systemctl enable netctl-auto@wlan0
fi

if [[ -e $dirsystem/soundprofile ]]; then
	profile=$( cat $dirsystem/soundprofile )
	if [[ $profile != custom ]]; then
		/srv/http/bash/system-soundprofile.sh $profile
	else
		path=$dirsystem/sound
		eth0mtu=$( cat $path-eth0mtu )
		eth0txq=$( cat $path-eth0txq )
		sysswap=$( cat $path-sysswap )
		syslatency=$( cat $path-syslatency )
		/srv/http/bash/system-soundprofile.sh custom $eth0mtu $eth0txq $sysswap $syslatency 
	fi
fi

/srv/http/bash/mpd-conf.sh # mpd mpdidle start by this script

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

/srv/http/bash/addons-update.sh
