#!/bin/bash

rm -f $0

if [[ ! -e /srv/http/data/addons ]]; then
	echo This is not RuneAudio+R
	exit
fi

col=$( tput cols )
banner() {
	def='\e[0m'
	bg='\e[44m'
    printf "$bg%*s$def\n" $col
    printf "$bg%-${col}s$def\n" "  $1"
    printf "$bg%*s$def\n" $col
}

select=$( dialog --colors \
	   --output-fd 1 \
	   --checklist '\n\Z1Select features:\n
\Z4[space] = Select / Deselect\Z0' 9 50 0 \
			1 "Reset MPD database" on \
			2 "Reset user data directory" on \
			3 "Clear package cache" on \
			4 "Clear system log" on \
			5 "Clear Wi-Fi connection" on )

clear
[[ $? == 1 ]] && exit

select=" $select "

if [[ $select == *' 1 '* ]]; then
	banner 'Reset MPD database ...'
	systemctl stop mpd
	rm /srv/http/data/mpd/*
fi
if [[ $select == *' 2 '* ]]; then
	banner 'Reset user data directory ...'
	rm -rf /root/.cache/* /srv/http/data/tmp/* /mnt/MPD/USB/*/ /mnt/MPD/NAS/*/
	rm -f /srv/http/data/{bookmarks,coverarts,lyrics,mpd,playlists,webradios}/* /srv/http/data/system/gpio
	wget -qO - https://github.com/rern/RuneOS/raw/master/radioparadise.tar.xz | bsdtar xvf - -C /
	echo '{
  "name": {
    "11": "DAC",
    "13": "PreAmp",
    "15": "Amp",
    "16": "Subwoofer"
  },
  "on": {
    "on1": 11,
    "ond1": 2,
    "on2": 13,
    "ond2": 2,
    "on3": 15,
    "ond3": 2,
    "on4": 16
  },
  "off": {
    "off1": 16,
    "offd1": 2,
    "off2": 15,
    "offd2": 2,
    "off3": 13,
    "offd3": 2,
    "off4": 11
  },
  "timer": 5
}' > /srv/http/data/system/gpio.json
	chown http:http /srv/http/data/system/gpio.json
fi
if [[ $select == *' 3 '* ]]; then
	banner 'Clear package cache ...'
	rm /var/cache/pacman/pkg/*
fi
if [[ $select == *' 4 '* ]]; then
	banner 'Clear system log ...'
	journalctl --rotate
	journalctl --vacuum-time=1s
fi
if [[ $select == *' 5 '* ]]; then
	banner 'Clear Wi-Fi connection ...'
	systemctl disable netctl-auto@wlan0
	rm /etc/netctl/* /srv/http/data/system/netctl-* 2> /dev/null
fi

wget https://github.com/archlinuxarm/PKGBUILDs/raw/master/core/pacman-mirrorlist/mirrorlist -O /etc/pacman.d/mirrorlist

fsck.fat -traw /dev/mmcblk0p1
rm -f /boot/FSCK*

wget https://github.com/rern/RuneOS/raw/master/x.sh -O /boot/x.sh

dialog --colors --yesno "\n
\Z1Finish.\Z0\n
\n           Shutdown Raspberry Pi?\n
" 9 50

[[ $? == 0 ]] && shutdown -h now
