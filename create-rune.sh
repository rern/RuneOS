#!/bin/bash

# create-rune.sh any - custom inputs for version and branch
# new version:
#1   - https://github.com/rern/RuneAudio_Addons/blob/master/addons-list.json > new item with key > "rreN": {
#2   - this file > version=eN
version=e5
uibranch=master
addonalias=rr$version

trap 'rm -f /var/lib/pacman/db.lck; exit' INT

hardwarecode=$( grep Revision /proc/cpuinfo )
hwcode=${hardwarecode: -3:2}
if [[ $hwcode =~ ^(00|01|02|03|04|09)$ ]]; then
	nowireless=1
	sed -i '/disable-wifi\|disable-bt\|bcmbt/ d' /boot/config.txt
	sed -i 's/bluez bluez-alsa-git bluez-utils //' /root/features
fi
[[ ${hardwarecode: -4:1} == 0 ]] && rpi01=1

cols=$( tput cols )
hr() { printf "\e[36m%*s\e[m\n" $cols | tr ' ' -; }

hr
echo -e "\n\e[36mInitialize Arch Linux Arm ...\e[m\n"
hr

pacman-key --init
pacman-key --populate archlinuxarm

# fill entropy pool (fix - Kernel entropy pool is not initialized)
systemctl start systemd-random-seed

# add private repo
if ! grep -q '^\[RR\]' /etc/pacman.conf; then
	sed -i '/\[core\]/ i\
[RR]\
SigLevel = Optional TrustAll\
Server = https://rern.github.io/$arch\

' /etc/pacman.conf
fi

title="Create RuneAudio+R $version"
optbox=( --colors --no-shadow --no-collapse )
opt=( --backtitle "$title" ${optbox[@]} )

dialog "${optbox[@]}" --infobox "

                \Z1RuneAudio+R $version\Z0
" 7 50
sleep 3

# dialog package
pacman -Sy --noconfirm --needed dialog

#----------------------------------------------------------------------------
if (( $# > 0 )); then
	version=$( dialog --colors --output-fd 1 --inputbox "\n\Z1Version:\Z0" 0 0 $version )
	uibranch=$( dialog --colors --output-fd 1 --inputbox "\n\Z1UI branch:\Z0" 0 0 $uibranch )
	addonalias=rr$version
fi

#----------------------------------------------------------------------------
pacmanFailed() {
	dialog "${opt[@]}" --msgbox "
$1

Run \Z1create-rune.sh\Z0 again.

" 0 0
	exit
}

echo -e "\n\e[36mSystem-wide kernel and packages upgrade ...\e[m\n"

pacman -Syu --noconfirm --needed
[[ $? != 0 ]] && pacmanFailed 'System-wide upgrades download incomplete!'

packages='alsa-utils cronie dosfstools hfsprogs ifplugd imagemagick inetutils jq man mpc mpd mpdscribble '
packages+='nfs-utils nginx-mainline-pushstream nss-mdns ntfs-3g parted php-fpm sshpass sudo udevil wget '

echo -e "\n\e[36mInstall packages ...\e[m\n"

pacman -S --noconfirm --needed $packages $( cat /root/features )
[[ $? != 0 ]] && pacmanFailed 'Packages download incomplete!'

echo -e "\n\e[36mInstall configurations and web interface ...\e[m\n"

wget -q --show-progress https://github.com/rern/RuneOS/archive/master.zip -O config.zip
wget -q --show-progress https://github.com/rern/RuneAudio-R$version/archive/$uibranch.zip -O ui.zip
mkdir -p /tmp/config
bsdtar --strip 1 -C /tmp/config -xvf config.zip
bsdtar --strip 1 -C /tmp/config -xvf ui.zip
rm *.zip /tmp/config/*.* /tmp/config/.* 2> /dev/null
chmod -R go-wx /tmp/config
chmod -R u+rwX,go+rX /tmp/config
cp -r /tmp/config/* /

#---------------------------------------------------------------------------------
echo -e "\n\e[36mConfigure ...\e[m\n"

# RPi 4 - rename bluetooth file
[[ $hwcode == 11 ]] && mv /usr/lib/firmware/updates/brcm/BCM{4345C0,}.hcd

chown http:http /etc/fstab
chown -R http:http /etc/netctl /etc/systemd/network /srv/http
chmod 755 /srv/http/* /srv/http/bash/* /srv/http/settings/*

# alsa
alsactl store
# fix 'alsactl restore' errors
cp /{usr/lib,etc}/udev/rules.d/90-alsa-restore.rules
sed -i '/^TEST/ s/^/#/' /etc/udev/rules.d/90-alsa-restore.rules

# bluetooth
if [[ -e /usr/bin/bluetoothctl ]]; then
	sed -i 's/#*\(AutoEnable=\).*/\1true/' /etc/bluetooth/main.conf
else
	rm -rf /boot/overlays/bcmbt.dtbo /etc/systemd/system/bluetooth.service.d /srv/http/bash/system-bluetooth.sh /root/bluez*
fi

# chromium
if [[ -e /usr/bin/chromium ]]; then
	# boot splash
	sed -i 's/\(console=\).*/\1tty3 quiet loglevel=0 logo.nologo vt.global_cursor_default=0/' /boot/cmdline.txt
	# login prompt
	systemctl disable getty@tty1
	# fix permission for rotate file
	chmod 775 /etc/X11/xorg.conf.d
else
	rm -f /etc/systemd/system/{bootsplash,localbrowser}* /etc/X11/xinit/xinitrc /srv/http/assets/img/{CW,CCW,NORMAL,UD}* /root/*matchbox* /usr/local/bin/ply-image
fi

# cron - for addons updates
( crontab -l &> /dev/null; echo '00 01 * * * /srv/http/addons-update.sh &' ) | crontab -

# no hostapd
[[ ! -e /usr/bin/hostapd ]] && rm -rf /etc/{hostapd,dnsmasq.conf}

# mpd
[[ $rpi01 ]] && sed -i 's|/usr/bin/taskset -c 3 ||' /etc/systemd/system/mpd.service
cp /usr/share/mpdscribble/mpdscribble.conf.example /etc/mpdscribble.conf

# disable again after upgrade
systemctl disable systemd-networkd-wait-online

# fix: pam ssh login bug (wrong comment - not #)
sed -i '/^-.*pam_systemd/ s/^-/#/' /etc/pam.d/system-login

# password
echo root:rune | chpasswd
[[ -e /usr/bin/smbd ]] && ( echo rune; echo rune ) | smbpasswd -s -a root
sed -i 's/\(PermitEmptyPasswords \).*/#\1no' /etc/ssh/sshd_config

# no samba
[[ ! -e /usr/bin/samba ]] && rm -rf /etc/samba /etc/systemd/system/wsdd.service /usr/local/bin/wsdd.py

# no shairport-sync
[[ ! -e /usr/bin/shairport-sync ]] && rm /etc/sudoers.d/shairport-sync /etc/systemd/system/shairport-meta.service

# no snapcast
[[ ! -e /usr/bin/snapclient ]] && rm /etc/default/snapclient

# spotifyd
[[ ! -e /usr/lib/systemd/system/spotifyd.service ]] && ln -s /usr/lib/systemd/{user,system}/spotifyd.service

# user - set expire to none
users=$( cut -d: -f1 /etc/passwd )
for user in $users; do
	chage -E -1 $user
done

# upmpdcli - fix: missing symlink and init RSA key
if [[ -e /usr/bin/upmpdcli ]]; then
	# fix - missing symlink
	[[ ! -e /usr/lib/libjsoncpp.so.22 ]] && ln -s /usr/lib/libjsoncpp.so.{24,22}
	mpd --no-config &> /dev/null
	upmpdcli &> /dev/null &
else
	rm -rf /etc/systemd/system/upmpdcli.service.d /etc/upmpdcli.conf
fi

# wireless-regdom
echo 'WIRELESS_REGDOM="00"' > /etc/conf.d/wireless-regdom

# startup services
systemctl daemon-reload
startup='avahi-daemon cronie devmon@mpd nginx php-fpm startup'
[[ -e /usr/bin/chromium ]] && startup+=' bootsplash localbrowser'

systemctl enable $startup

#---------------------------------------------------------------------------------
# data - settings directories
/srv/http/bash/data-reset.sh "$version"

# remove files and package cache
rm /etc/motd /root/{create-rune.sh,features} /var/cache/pacman/pkg/*

# usb boot - disable sd card polling
! df | grep -q /dev/mmcblk0 && echo 'dtoverlay=sdtweak,poll_once' >> /boot/config.txt

if [[ $rpi01 && $features =~ upmpdcli ]]; then
	echo Wait for upmpdcli to finish RSA key ...
	sleep 30
fi

dialog "${optbox[@]}" --msgbox "

    \Z1RuneAudio+R $version\Z0 created successfully.

            Press \Z1Enter\Z0 to reboot
" 10 50

shutdown -r now
