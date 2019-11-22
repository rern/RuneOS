#!/bin/bash

grep -q '^dtoverlay=bcmbt' /boot/config.txt && bluetooth=checked || bluetooth=
grep -q 'dtparam=audio=on' /boot/config.txt && onboardaudio=checked || onboardaudio=
grep -q '^disable_overscan=1' /boot/config.txt && overscan=0 || overscan=1
grep -q '^#dtoverlay=disable-wifi' /boot/config.txt && wlan=checked || wlan=
file='/etc/X11/xorg.conf.d/99-raspi-rotate.conf'
[[ -e $file ]] && rotate=$( grep rotate $file | cut -d'"' -f4 ) || rotate=NORMAL
xinitrc=/etc/X11/xinit/xinitrc

data+=' "accesspoint":"'$( [[ -e /srv/http/data/system/accesspoint ]] && echo 1 )'"'
data+=',"airplay":"'$( systemctl -q is-active shairport-sync && echo checked )'"'
data+=',"audiooutput":"'$( cat /srv/http/data/system/audiooutput )'"'
data+=',"avahi":"'$( systemctl -q is-active avahi-daemon && echo checked )'"'
data+=',"bluetooth":"'$bluetooth'"'
data+=',"cpuload":"'$( cat /proc/loadavg | cut -d' ' -f1 )'"'
data+=',"cputemp":"'$( cat /sys/class/thermal/thermal_zone0/temp )'"'
data+=',"cursor":"'$( grep -q 'cursor yes' $xinitrc && echo 1 || echo 0 )'"'
data+=',"date":"'$( date +'%F<gr> &bull; </gr>%R' )'"'
data+=',"gmusicpass":"'$( grep '^gmusicpass' /etc/upmpdcli.conf | cut -d' ' -f3- )'"'
data+=',"gmusicquality":"'$( grep '^gmusicquality' /etc/upmpdcli.conf | cut -d' ' -f3- )'"'
data+=',"gmusicuser":"'$( grep '^gmusicuser' /etc/upmpdcli.conf | cut -d' ' -f3- )'"'
data+=',"hardware":"'$( tr -d '\0' < /sys/firmware/devicetree/base/model )'"'
data+=',"hardwarecode":"'$( cat /proc/cpuinfo | grep Revision | awk '{print $NF}' )'"'
data+=',"hostname":"'$( cat /srv/http/data/system/hostname )'"'
data+=',"i2ssysname":"'$( cat /srv/http/data/system/i2ssysname 2> /dev/null )'"'
data+=',"ip":"'$( ip a | grep -A 2 'state UP' | grep inet | head -1 | awk '{print $2}' | cut -d/ -f1 )'"'
data+=',"kernel":"'$( uname -r )'"'
data+=',"localbrowser":"'$( systemctl -q is-enabled localbrowser && echo checked )'"'
data+=',"login":"'$( [[ -e /srv/http/data/system/login ]] && echo checked )'"'
data+=',"ntp":"'$( grep '^NTP' /etc/systemd/timesyncd.conf | cut -d= -f2 )'"'
data+=',"onboardaudio":"'$onboardaudio'"'
data+=',"overscan":"'$overscan'"'
data+=',"ownqueuenot":"'$( grep -q '^ownqueue = 0' /etc/upmpdcli.conf && echo 1 || echo 0 )'"'
data+=',"password":"'$( cat /srv/http/data/system/password )'"'
data+=',"qobuzquality":"'$( grep '^qobuzformatid' /etc/upmpdcli.conf | cut -d' ' -f3- )'"'
data+=',"qobuzpass":"'$( grep '^qobuzpass' /etc/upmpdcli.conf | cut -d' ' -f3- )'"'
data+=',"qobuzuser":"'$( grep '^qobuzuser' /etc/upmpdcli.conf | cut -d' ' -f3- )'"'
data+=',"readonlysd":"'$( sed -n '/.mnt.MPD.SD/ {n;p}' /etc/samba/smb.conf | grep -q 'read only = no' && echo 1 || echo 0 )'"'
data+=',"readonlyusb":"'$( sed -n '/.mnt.MPD.USB/ {n;p}' /etc/samba/smb.conf | grep -q 'read only = no' && echo 1 || echo 0 )'"'
data+=',"rotate":"'$rotate'"'
data+=',"samba":"'$( systemctl -q is-active smb && echo checked )'"'
data+=',"screenoff":"'$(( $( grep 'xset dpms .*' $xinitrc | cut -d' ' -f5 ) / 60 ))'"'
data+=',"soundprofile":"'$( < /srv/http/data/system/soundprofile )'"'
data+=',"spotifypass":"'$( grep '^spotifypass' /etc/upmpdcli.conf | cut -d' ' -f3- )'"'
data+=',"spotifyuser":"'$( grep '^spotifyuser' /etc/upmpdcli.conf | cut -d' ' -f3- )'"'
data+=',"since":"'$( uptime -s | cut -d: -f1-2 | sed 's| |<gr> \&bull; </gr>|' )'"'
data+=',"tidalpass":"'$( grep '^tidalpass' /etc/upmpdcli.conf | cut -d' ' -f3- )'"'
data+=',"tidalquality":"'$( grep '^tidalquality' /etc/upmpdcli.conf | cut -d' ' -f3- )'"'
data+=',"tidaluser":"'$( grep '^tidaluser' /etc/upmpdcli.conf | cut -d' ' -f3- )'"'
data+=',"timezone":"'$( timedatectl | grep zone: | awk '{print $3}' )'"'
data+=',"undervoltage":"'$( journalctl -b | grep -c 'Under-voltage' )'"'
data+=',"upnp":"'$( systemctl -q is-active upmpdcli && echo checked )'"'
data+=',"uptime":"'$( uptime | cut -d, -f1 | awk '{print $NF}' )'"'
data+=',"version":"'$( cat /srv/http/data/system/version )'"'
data+=',"wlan":"'$wlan'"'
data+=',"zoom":"'$( grep factor $xinitrc | cut -d'=' -f3 )'"'

echo -e "{$data}"
