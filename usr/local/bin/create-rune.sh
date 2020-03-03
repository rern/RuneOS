#!/bin/bash

version=e2
uibranch=UPDATE ############### change UPDATE to master once merged

trap 'rm -f /var/lib/pacman/db.lck; clear; exit' INT

hwcode=$( grep Revision /proc/cpuinfo | tail -c 4 | cut -c1-2 )
[[ $hwcode =~ ^(00|01|02|03|09|0c)$ ]] && rpi01=1
[[ $hwcode =~ ^(00|01|02|03|04|09)$ ]] && nowireless=1

cols=$( tput cols )
hr() { printf "\e[36m%*s\e[m\n" $cols | tr ' ' -; }

hr
echo -e "\n\e[36mInitialize Arch Linux Arm ...\e[m\n"
hr

pacman-key --init
pacman-key --populate archlinuxarm

# fill entropy pool (fix - Kernel entropy pool is not initialized)
systemctl start systemd-random-seed

# fix dns errors
echo DNSSEC=no >> /etc/systemd/resolved.conf
systemctl restart systemd-resolved

# rank mirrorlist
#curl -sLo /srv/http/addons-functions.sh https://github.com/rern/RuneOS/raw/master/srv/http/addons-functions.sh
#curl -sLO https://github.com/rern/RuneAudio/raw/master/rankmirrors/rankmirrors.sh
#chmod +x rankmirrors.sh
#./rankmirrors.sh

# dialog package
pacman -Sy --noconfirm --needed dialog

#----------------------------------------------------------------------------
title="Create RuneAudio+R $version"
dialog  --backtitle "$title" --colors \
	--infobox "\n\n                \Z1RuneAudio+R $version\Z0" 7 50
sleep 3

    avahi='\Z1Avahi\Z0     - URL as: runeaudio.local'
    bluez='\Z1Bluez\Z0     - Bluetooth supports'
 chromium='\Z1Chromium\Z0  - Browser on RPi'
   ffmpeg='\Z1FFmpeg\Z0    - Extended decoder'
  hostapd='\Z1hostapd\Z0   - RPi access point'
      kid='\Z1Kid3\Z0      - Metadata tag editor'
   python='\Z1Python\Z0    - Programming language'
    samba='\Z1Samba\Z0     - File sharing'
shairport='\Z1Shairport\Z0 - AirPlay'
 upmpdcli='\Z1upmpdcli\Z0  - UPnP client'

if [[ $nowireless ]]; then
	bluez='Bluez     - (no onboard)'
	onoffb=
else
	onoffb=on
fi
if [[ $rpi01 ]]; then
	chromium='Chromium  - (not for RPi Zero, 1)'
	onoffc=
else
	onoffc=on
fi

selectFeatures() {
	select=$( dialog --backtitle "$title" --colors \
	   --output-fd 1 \
	   --checklist '\Z1Select features to install:\n
\Z4[space] = Select / Deselect\Z0' 0 0 10 \
			1 "$avahi" on \
			2 "$bluez" $onoffb \
			3 "$chromium" $onoffc \
			4 "$ffmpeg" on \
			5 "$hostapd" on \
			6 "$kid" on \
			7 "$python" on \
			8 "$samba" on \
			9 "$shairport" on \
			10 "$upmpdcli" on )
	
	select=" $select "
	[[ $select == *' 1 '* ]] && features+='avahi ' && list+="$avahi\n"
	[[ $select == *' 2 '* && ! $nowireless ]] && features+='bluez bluez-utils ' && list+="$bluez\n"
	[[ $select == *' 3 '* && ! $rpi01 ]] && features+='chromium upower xorg-server xf86-video-fbdev xf86-video-vesa xorg-xinit ' && list+="$chromium\n"
	[[ $select == *' 4 '* ]] && features+='ffmpeg ' && list+="$ffmpeg\n"
	[[ $select == *' 5 '* ]] && features+='dnsmasq hostapd ' && list+="$hostapd\n"
	[[ $select == *' 6 '* ]] && kid3=1 && list+="$kid\n"
	[[ $select == *' 7 '* ]] && features+='python python-pip ' && list+="$python\n"
	[[ $select == *' 8 '* ]] && features+='samba ' && list+="$samba\n"
	[[ $select == *' 9 '* ]] && features+='shairport-sync ' && list+="$shairport\n"
	[[ $select == *' 10 '* ]] && upnp=1 && list+="$upmpdcli\n"
}
selectFeatures

dialog --backtitle "$title" --colors \
	--yesno "\n\Z1Confirm features to install:\Z0\n\n
$list\n\n" 0 0
[[ $? == 1 ]] && selectFeatures

clear

#----------------------------------------------------------------------------
pacmanFailed() {
	dialog --backtitle "$title" --colors \
		--msgbox "\n$1\n\n
Run \Z1create-rune.sh\Z0 again.\n\n" 0 0
	exit
}
echo -e "\n\e[36mSystem-wide kernel and packages upgrade ...\e[m\n"

pacman -Syu --noconfirm --needed
[[ $? != 0 ]] && pacmanFailed 'System-wide upgrades download incomplete!'

packages='alsa-utils cronie dosfstools gcc ifplugd imagemagick inetutils mpd mpc nfs-utils nss-mdns ntfs-3g parted php-fpm python python-pip sudo udevil wget '

echo -e "\n\e[36mInstall packages ...\e[m\n"

pacman -S --noconfirm --needed $packages $features
[[ $? != 0 ]] && pacmanFailed 'Packages download incomplete!'

echo -e "\n\e[36mInstall customized packages and web interface ...\e[m\n"

wget -q --show-progress https://github.com/rern/RuneOS/archive/master.zip -O packages.zip
wget -q --show-progress https://github.com/rern/RuneAudio-Re2/archive/$uibranch.zip -O ui.zip
#bsdtar --strip 1 -C / -xvf *.zip
bsdtar --strip 1 -C / -xvf packages.zip
bsdtar --strip 1 --exclude=./etc --exclude=./usr -C / -xvf ui.zip
rm *.zip /*.*

chown -R http:http /srv/http
chmod 755 /srv/http/* /srv/http/bash/* /srv/http/settings/* /usr/local/bin/*

# RPi 0, 1 - switch packages for armv6h
if [[ $rpi01 ]]; then
	rm /root/*.xz
	mv /root/armv6h/* /root
	rmdir /root/armv6h
else
	rm -r /root/armv6h
fi

[[ $nowireless ]] && sed -i '/disable-wifi\|disable-bt\|bcmbt/ d' /boot/config.txt

[[ ! -e /usr/bin/bluetoothctl ]] && rm /root/bluez* /boot/overlays/bcmbt.dtbo

[[ ! $kid3 ]] && rm /root/kid3*
[[ ! $upnp ]] && rm /etc/upmpdcli.conf /root/{libupnpp*,upmpdcli*}

pacman -U --noconfirm --needed /root/*.xz
[[ $? != 0 ]] && pacmanFailed 'Packages download incomplete!'

#---------------------------------------------------------------------------------
echo -e "\n\e[36mConfigure ...\e[m\n"

# RPi 4 - rename bluetooth file
[[ $hwcode == 11 ]] && mv /usr/lib/firmware/updates/brcm/BCM{4345C0,}.hcd

# remove config of excluded features
[[ ! -e /usr/bin/avahi-daemon ]] && rm -r /etc/avahi
[[ ! -e /usr/bin/bluetoothctl ]] && rm -r /etc/systemd/system/bluetooth.service.d /root/blue*
[[ ! -e /usr/bin/hostapd ]] && rm -r /etc/{hostapd,dnsmasq.conf}
[[ ! -e /usr/bin/smbd ]] && rm -r /etc/samba && rm /etc/systemd/system/wsdd.service
[[ ! -e /usr/bin/shairport-sync ]] && rm /etc/systemd/system/shairport*

# alsa
chmod -R 666 /var/lib/alsa  # fix permission
sed -i '/^TEST/ s/^/#/' /usr/lib/udev/rules.d/90-alsa-restore.rules   # omit test rules

# bluetooth (skip if removed bluetooth)
[[ -e /usr/bin/bluetoothctl ]] && sed -i 's/#*\(AutoEnable=\).*/\1true/' /etc/bluetooth/main.conf

# chromium
if [[ -e /usr/bin/chromium ]]; then
	# boot splash
	sed -i 's/\(console=\).*/\1tty3 plymouth.enable=0 quiet loglevel=0 logo.nologo vt.global_cursor_default=0/' /boot/cmdline.txt
	ln -sf /srv/http/assets/img/{NORMAL,start}.png
	# login prompt - remove
	systemctl disable getty@tty1
	# fix permission for rotate file
	chmod 775 /etc/X11/xorg.conf.d
else
	rm -f /etc/systemd/system/{bootsplash,localbrowser}* /etc/X11/xinit/xinitrc /srv/http/assets/img/{CW,CCW,NORMAL,UD}* /root/*matchbox* /usr/local/bin/ply-image
fi

# cron - for addons updates
( crontab -l &> /dev/null; echo '00 01 * * * /srv/http/addons-update.sh &' ) | crontab -

# lvm - remove invalid value
sed -i '/event_timeout/ s/^/#/' /usr/lib/udev/rules.d/11-dm-lvm.rules

# mpd - create missing log file
touch /var/log/mpd.log
chown mpd:audio /var/log/mpd.log

# netctl - allow write for http
chmod -R 777 /etc/netctl

# nginx - custom 50x.html
mv -f /etc/nginx/html/50x.html{.custom,}

# password - set default
echo root:rune | chpasswd
[[ -e /usr/bin/smbd ]] && ( echo rune; echo rune ) | smbpasswd -s -a root

# user - set expire to none
users=$( cut -d: -f1 /etc/passwd )
for user in $users; do
	chage -E -1 $user
done

# upmpdcli - fix: missing symlink and init RSA key
if [[ -e /usr/bin/upmpdcli ]]; then
	ln -s /lib/libjsoncpp.so.{21,20}
	mpd --no-config &> /dev/null
	upmpdcli &> /dev/null &
fi

# wireless-regdom
echo 'WIRELESS_REGDOM="00"' > /etc/conf.d/wireless-regdom

# startup services
systemctl daemon-reload
startup='cronie devmon@mpd nginx php-fpm startup '
[[ -e /usr/bin/avahi-daemon ]] && startup+='avahi-daemon '
[[ -e /usr/bin/chromium ]] && startup+='bootsplash localbrowser '

systemctl enable $startup

#---------------------------------------------------------------------------------
# data - settings directories
/srv/http/bash/resetdata.sh "$version"

# addons
wget -qN https://github.com/rern/RuneAudio_Addons/raw/master/addons-list.php -P /srv/http
echo $( grep -A 2 rare /srv/http/addons-list.php | tail -1 | cut -d"'" -f4 ) > /srv/http/data/addons/rare

# remove cache and files
rm /root/*.xz /usr/local/bin/create-* /var/cache/pacman/pkg/* /etc/motd

# usb boot - disable sd card polling
! df | grep -q /dev/mmcblk0 && echo 'dtoverlay=sdtweak,poll_once' >> /boot/config.txt

dialog --colors \
	--msgbox "\n      
      \Z1RuneAudio+R $version\Z0 created successfully.\n\n
            Press \Z1Enter\Z0 to reboot
" 9 50

# sd boot partition - fix dirty bits if any
fsck.fat -trawl /dev/mmcblk0p1 &> /dev/null

shutdown -r now
