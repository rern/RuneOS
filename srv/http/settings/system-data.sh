#!/bin/bash

grep -q '^#dtoverlay=disable-bt' /boot/config.txt && bluetooth=checked || bluetooth=
grep -q 'dtparam=audio=on' /boot/config.txt && onboardaudio=checked || onboardaudio=
grep -q '^disable_overscan=1' /boot/config.txt && overscan=0 || overscan=1
grep -q '^#dtoverlay=disable-wifi' /boot/config.txt && wlan=checked || wlan=

data+=' "accesspoint":"'$( [[ -e /srv/http/data/system/accesspoint ]] && echo 1 )'"'
data+=',"airplay":"'$( systemctl -q is-active shairport-sync && echo checked )'"'
data+=',"audioaplayname":"'$( cat /srv/http/data/system/audio-aplayname 2> /dev/null )'"'
data+=',"audiooutput":"'$( cat /srv/http/data/system/audio-output )'"'
data+=',"avahi":"'$( systemctl -q is-active avahi-daemon && echo checked )'"'
data+=',"bluetooth":"'$bluetooth'"'
data+=',"cpuload":"'$( cat /proc/loadavg | cut -d' ' -f1-3 )'"'
data+=',"cputemp":"'$(( $( cat /sys/class/thermal/thermal_zone0/temp ) / 1000 ))'"'
data+=',"date":"'$( date +'%F<gr> &bull; </gr>%R' )'"'
data+=',"gmusicpass":"'$( grep '^gmusicpass' /etc/upmpdcli.conf | cut -d' ' -f3- )'"'
data+=',"gmusicquality":"'$( grep '^gmusicquality' /etc/upmpdcli.conf | cut -d' ' -f3- )'"'
data+=',"gmusicuser":"'$( grep '^gmusicuser' /etc/upmpdcli.conf | cut -d' ' -f3- )'"'
data+=',"hardware":"'$( tr -d '\0' < /sys/firmware/devicetree/base/model )'"'
data+=',"hardwarecode":"'$( cat /proc/cpuinfo | grep Revision | awk '{print $NF}' )'"'
data+=',"hostname":"'$( cat /srv/http/data/system/hostname )'"'
data+=',"ip":"'$( ip a | grep -A 2 'state UP' | tr '\n' d | sed 's/^.: \(.*\):.*ether *\(.*\) brd.*inet \(.*\)\/.*/\3 <gr>\&bull; \2 \&bull; \1<\/gr>/' )'"'
data+=',"kernel":"'$( uname -r )'"'
data+=',"login":"'$( [[ -e /srv/http/data/system/login ]] && echo checked )'"'
data+=',"mpd":"'$( mpd -V | head -n1 | awk '{print $NF}' | tr -d '()' )'"'
data+=',"netbios":"'$( systemctl -q is-active wsdd && echo 1 || echo 0 )'"'
data+=',"ntp":"'$( grep '^NTP' /etc/systemd/timesyncd.conf | cut -d= -f2 )'"'
data+=',"onboardaudio":"'$onboardaudio'"'
data+=',"overscan":"'$overscan'"'
data+=',"ownqueuenot":"'$( grep -q '^ownqueue = 0' /etc/upmpdcli.conf && echo 1 || echo 0 )'"'
data+=',"password":"'$( cat /srv/http/data/system/password )'"'
data+=',"qobuzquality":"'$( grep '^qobuzformatid' /etc/upmpdcli.conf | cut -d' ' -f3- )'"'
data+=',"qobuzpass":"'$( grep '^qobuzpass' /etc/upmpdcli.conf | cut -d' ' -f3- )'"'
data+=',"qobuzuser":"'$( grep '^qobuzuser' /etc/upmpdcli.conf | cut -d' ' -f3- )'"'
data+=',"rootfs":"'$( df -h / | tail -1 | awk '{print $3"B / "$2"B"}' )'"'
data+=',"rotate":"'$( cat /srv/http/data/system/localbrowser-rotate 2> /dev/null )'"'
data+=',"samba":"'$( systemctl -q is-active smb && echo checked )'"'
data+=',"since":"'$( uptime -s | cut -d: -f1-2 | sed 's| |<gr> \&bull; </gr>|' )'"'
data+=',"soundprofile":"'$( < /srv/http/data/system/soundprofile )'"'
data+=',"spotifypass":"'$( grep '^spotifypass' /etc/upmpdcli.conf | cut -d' ' -f3- )'"'
data+=',"spotifyuser":"'$( grep '^spotifyuser' /etc/upmpdcli.conf | cut -d' ' -f3- )'"'
data+=',"tidalpass":"'$( grep '^tidalpass' /etc/upmpdcli.conf | cut -d' ' -f3- )'"'
data+=',"tidalquality":"'$( grep '^tidalquality' /etc/upmpdcli.conf | cut -d' ' -f3- )'"'
data+=',"tidaluser":"'$( grep '^tidaluser' /etc/upmpdcli.conf | cut -d' ' -f3- )'"'
data+=',"timezone":"'$( timedatectl | grep zone: | awk '{print $3}' )'"'
data+=',"undervoltage":"'$( journalctl -b | grep -c 'Under-voltage' )'"'
data+=',"upnp":"'$( systemctl -q is-active upmpdcli && echo checked )'"'
data+=',"uptime":"'$( uptime -p | tr -d 's,' | sed 's/up //; s/ day/d/; s/ hour/h/; s/ minute/m/' )'"'
data+=',"version":"'$( cat /srv/http/data/system/version )'"'
data+=',"wlan":"'$wlan'"'
data+=',"writesd":"'$( sed -n '/.mnt.MPD.SD/ {n;p}' /etc/samba/smb.conf | grep -q 'read only = no' && echo 1 || echo 0 )'"'
data+=',"writeusb":"'$( sed -n '/.mnt.MPD.USB/ {n;p}' /etc/samba/smb.conf | grep -q 'read only = no' && echo 1 || echo 0 )'"'

xinitrc=/etc/X11/xinit/xinitrc
if [[ -e $xinitrc ]]; then
	data+=',"localbrowser":"'$( systemctl -q is-enabled localbrowser && echo checked )'"'
	data+=',"cursor":"'$( grep -q 'cursor yes' $xinitrc && echo 1 || echo 0 )'"'
	data+=',"screenoff":"'$(( $( grep 'xset dpms .*' $xinitrc | cut -d' ' -f5 ) / 60 ))'"'
	data+=',"zoom":"'$( grep factor $xinitrc | cut -d'=' -f3 )'"'
	file='/etc/X11/xorg.conf.d/99-raspi-rotate.conf'
	[[ -e $file ]] && rotate=$( grep rotate $file | cut -d'"' -f4 ) || rotate=NORMAL
fi

echo -e "{$data}"
