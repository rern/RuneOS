#!/bin/bash

rm $0

select=$( dialog --colors \
	   --output-fd 1 \
	   --checklist '\n\Z1Select features:\n
\Z4[space] = Select / Deselect\Z0' 9 50 0 \
			1 "Auto-expand root partition" on \
			2 "Reset MPD database" on \
			3 "Reset user data directory" on \
			4 "Clear package cache" on \
			5 "Clear system log" on \
			6 "Clear Wi-Fi connection" on )
[[ $? == 1 ]] && clear && exit

select=" $select "

if [[ $select == *' 1 '* ]]; then
	string=$( cat <<'EOF'
#!/bin/bash
rm $0
(( $( sfdisk -F /dev/mmcblk0 | head -n1 | awk '{print $6}' ) == 0 )) && exit
echo -e "d\n\nn\n\n\n\n\nw" | fdisk /dev/mmcblk0 &>/dev/null
partprobe /dev/mmcblk0
resize2fs /dev/mmcblk0p2
EOF
)
	echo "$string" > /boot/x.sh
	rm -f /srv/http/data/addons/expa
fi
if [[ $select == *' 2 '* ]]; then
	systemctl stop mpd
	echo 0 0 0 > /srv/http/data/system/mpddb
	rm -f /srv/http/data/mpd/*
fi
if [[ $select == *' 3 '* ]]; then
	rm -rf /root/.cache/* /srv/http/data/tmp/*
	rm -f /srv/http/data/{bookmarks,coverarts,lyrics,mpd,playlists,webradios}/*
fi
if [[ $select == *' 4 '* ]]; then
	pacman -Scc --noconfirm
fi
if [[ $select == *' 5 '* ]]; then
	journalctl --rotate
	journalctl --vacuum-time=1s
fi
if [[ $select == *' 6 '* ]]; then
	systemctl disable netctl-auto@wlan0
	rm /etc/netctl/* /srv/http/data/system/netctl-* 2> /dev/null
fi

wget https://github.com/archlinuxarm/PKGBUILDs/raw/master/core/pacman-mirrorlist/mirrorlist -O /etc/pacman.d/mirrorlist

fsck.fat -traw /dev/mmcblk0p1
rm -f /boot/FSCK*

dialog --colors --yesno "\Z1Finish.\Z0\n\n                  Shutdown?" 8 50
[[ $? == 0 ]] && shutdown -h now
