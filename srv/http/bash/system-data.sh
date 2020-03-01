#!/bin/bash

data='
	  "cpuload":"'$( cat /proc/loadavg | cut -d' ' -f1-3 )'"
	, "cputemp":'$(( $( cat /sys/class/thermal/thermal_zone0/temp ) / 1000 ))'
	, "time":"'$( date +'%T %F' )'"
	, "timezone":"'$( timedatectl | grep zone: | awk '{print $3}' )'"
	, "uptime":"'$( uptime -p | tr -d 's,' | sed 's/up //; s/ day/d/; s/ hour/h/; s/ minute/m/' )'"
	, "uptimesince":"'$( uptime -s | cut -d: -f1-2 )'"
'

# for interval refresh
(( $# > 0 )) && echo -e "{$data}" && exit

hardwarecode=$( grep Revision /proc/cpuinfo | awk '{print $NF}' )
code=${hardwarecode: -3:2}
case $code in
	0c | 08 | 0e | 0d | 11 ) rpiwireless=1;;
esac
case $code in
	00 | 01 | 02 | 03 ) cpu='700MHz';;
	04 )                cpu='4 @ 900MHz';;
	09 | 0c )           cpu='1GHz';;
	08 )                cpu='4 @ 900MHz';;
	0d | 0e )           cpu='4 @ 1.4GHz';;
	11 )                cpu='4 @ 1.5GHz';;
esac
case ${hardwarecode: -4:1} in
	0 ) soc='BCM2835';;
	1 ) soc='BCM2836';;
	2 ) soc='BCM2837';;
	3 ) soc='BCM2711';;
esac
case ${hardwarecode: -6:1} in
	9 ) mem='512KB';;
	a ) mem='1GB';;
	b ) mem='2GB';;
	c ) mem='4GB';;
esac

ipa=$( ip a | grep -A 2 'state UP' | \
	sed 's/^.: \|: <.*\|^\s*\|.*ether\|inet\| brd.*\|\/.*//g' | \
	tr -d '\n' | \
	sed 's/-\+/\n/' )
iplist+=${ipa//\\n/,}

data+='
	, "audioaplayname":"'$( cat /srv/http/data/system/audio-aplayname 2> /dev/null )'"
	, "audiooutput":"'$( cat /srv/http/data/system/audio-output )'"
	, "eth0mtu":'$( cat /sys/class/net/eth0/mtu )'
	, "eth0txq":'$( cat /sys/class/net/eth0/tx_queue_len )'
	, "hardware":"'$( tr -d '\0' < /sys/firmware/devicetree/base/model )'"
	, "hostname":"'$( cat /srv/http/data/system/hostname )'"
	, "ip":"'$iplist'"
	, "kernel":"'$( uname -r )'"
	, "login":'$( [[ -e /srv/http/data/system/login ]] && echo true || echo false )'
	, "mpd":"'$( pacman -Q mpd | sed 's/mpd \(.*\)-.*/\1/' )'"
	, "ntp":"'$( grep '^NTP' /etc/systemd/timesyncd.conf | cut -d= -f2 )'"
	, "onboardaudio":'$( grep -q 'dtparam=audio=on' /boot/config.txt && echo true || echo false )'
	, "passworddefault":'$( grep -q '$2a$12$rNJSBU0FOJM/jP98tA.J7uzFWAnpbXFYx5q1pmNhPnXnUu3L1Zz6W' /srv/http/data/system/password && echo true || echo false )'
	, "reboot":"'$( cat /srv/http/data/tmp/reboot 2> /dev/null )'"
	, "rootfs":"'$( df -h / | tail -1 | awk '{print $3"B / "$2"B"}' )'"
	, "soc":"'$soc'"
	, "soccpu":"'$cpu'"
	, "socmem":"'$mem'"
	, "soundprofile":"'$( cat /srv/http/data/system/soundprofile 2> /dev/null )'"
	, "sysswap":'$( sysctl vm.swappiness | cut -d" " -f3 )'
	, "syslatency":'$( sysctl kernel.sched_latency_ns | cut -d" " -f3 )'
	, "version":"'$( cat /srv/http/data/system/version )'"
'

# features
[[ -e /usr/bin/bluetoothctl  ]] && data+='
	, "bluetooth":'$( grep -q '^#dtoverlay=disable-bt' /boot/config.txt && echo true || echo false )
[[ -e /usr/bin/shairport-sync  ]] && data+='
	, "airplay":'$( systemctl -q is-active shairport-sync && echo true || echo false )
[[ -e /usr/bin/avahi-daemon  ]] && data+='
	, "avahi":'$( systemctl -q is-active avahi-daemon && echo true || echo false )
if [[ -e /usr/bin/upmpdcli  ]]; then
	data+='
		, "ownqueuenot":'$( grep -q '^ownqueue = 0' /etc/upmpdcli.conf && echo true || echo false )'
		, "gmusicpass":"'$( grep '^gmusicpass' /etc/upmpdcli.conf | cut -d' ' -f3- )'"
		, "gmusicquality":"'$( grep '^gmusicquality' /etc/upmpdcli.conf | cut -d' ' -f3- )'"
		, "gmusicuser":"'$( grep '^gmusicuser' /etc/upmpdcli.conf | cut -d' ' -f3- )'"
		, "qobuzquality":"'$( grep '^qobuzformatid' /etc/upmpdcli.conf | cut -d' ' -f3- )'"
		, "qobuzpass":"'$( grep '^qobuzpass' /etc/upmpdcli.conf | cut -d' ' -f3- )'"
		, "qobuzuser":"'$( grep '^qobuzuser' /etc/upmpdcli.conf | cut -d' ' -f3- )'"
		, "spotifypass":"'$( grep '^spotifypass' /etc/upmpdcli.conf | cut -d' ' -f3- )'"
		, "spotifyuser":"'$( grep '^spotifyuser' /etc/upmpdcli.conf | cut -d' ' -f3- )'"
		, "tidalpass":"'$( grep '^tidalpass' /etc/upmpdcli.conf | cut -d' ' -f3- )'"
		, "tidalquality":"'$( grep '^tidalquality' /etc/upmpdcli.conf | cut -d' ' -f3- )'"
		, "tidaluser":"'$( grep '^tidaluser' /etc/upmpdcli.conf | cut -d' ' -f3- )'"
		, "upnp":'$( systemctl -q is-active upmpdcli && echo true || echo false )
fi
if [[ -e /usr/bin/smbd  ]]; then
	data+='
		, "samba":'$( systemctl -q is-active smb && echo true || echo false )'
		, "writesd":'$( grep -A1 /mnt/MPD/SD /etc/samba/smb.conf | grep -q 'read only = no' && echo true || echo false )'
		, "writeusb":'$( grep -A1 /mnt/MPD/USB /etc/samba/smb.conf | grep -q 'read only = no' && echo true || echo false )
fi
[[ -n $rpiwireless ]] && data+='
	, "wlan":'$( grep -q '^#dtoverlay=disable-wifi' /boot/config.txt && echo true || echo false )

xinitrc=/etc/X11/xinit/xinitrc
if [[ -e $xinitrc ]]; then
	file='/etc/X11/xorg.conf.d/99-raspi-rotate.conf'
	[[ -e $file ]] && rotate=$( grep rotate $file | cut -d'"' -f4 ) || rotate=NORMAL
	data+='
		, "cursor":'$( grep -q 'cursor yes' $xinitrc && echo true || echo false )'
		, "localbrowser":'$( systemctl -q is-enabled localbrowser && echo true || echo false )'
		, "overscan":'$( grep -q '^#disable_overscan=1' /boot/config.txt && echo true || echo false )'
		, "rotate":"'$rotate'"
		, "screenoff":'$(( $( grep 'xset dpms .*' $xinitrc | cut -d' ' -f5 ) / 60 ))'
		, "zoom":'$( grep factor $xinitrc | cut -d'=' -f3 )
fi

data=${data//\\/\\\\} # escape backslashes

sources=$( /srv/http/bash/sources-data.sh )

echo [{$data},$sources] | tr -d '\n\t'
