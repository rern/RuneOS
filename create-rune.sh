#!/bin/bash

# new version:
#1   - https://github.com/rern/RuneAudio_Addons/blob/master/addons-list.json > new item with key > "rreN": {
#2   - this file > version=eN
version=e6
uibranch=main
addonalias=rr$version

trap 'rm -f /var/lib/pacman/db.lck; exit' INT

hardwarecode=$( grep Revision /proc/cpuinfo )
hwcode=${hardwarecode: -3:2}
[[ ${hardwarecode: -4:1} == 0 ]] && rpi01=1
features=$( cat /boot/features )

col=$( tput cols )
banner() {
	echo
	def='\e[0m'
	bg='\e[44m'
    printf "$bg%*s$def\n" $col
    printf "$bg%-${col}s$def\n" "  $1"
    printf "$bg%*s$def\n" $col
}

banner 'Initialize Arch Linux Arm ...'

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
" 9 58
sleep 3

# dialog package
pacman -Sy --noconfirm --needed dialog

#----------------------------------------------------------------------------
banner 'Upgrade kernel and default packages ...'

pacman -Syu --noconfirm --needed
[[ $? != 0 ]] && pacman -Syu --noconfirm --needed

packages='alsa-utils cronie dosfstools gifsicle hfsprogs ifplugd imagemagick inetutils jq man mpc mpd mpdscribble '
packages+='nfs-utils nginx-mainline-pushstream nss-mdns ntfs-3g parted php-fpm sshpass sudo udevil wget '

banner 'Install packages ...'

pacman -S --noconfirm --needed $packages $features
[[ $? != 0 ]] && pacman -S --noconfirm --needed $packages $features

banner 'Get configurations and user interface ...'

wget -q --show-progress https://github.com/rern/RuneOS/archive/master.zip -O config.zip
wget -q --show-progress https://github.com/rern/RuneAudio-R$version/archive/$uibranch.zip -O ui.zip
mkdir -p /tmp/config
bsdtar --strip 1 -C /tmp/config -xvf config.zip
bsdtar --strip 1 -C /tmp/config -xvf ui.zip
rm *.zip /tmp/config/*.* /tmp/config/.* 2> /dev/null
chmod -R go-wx /tmp/config
chmod -R u+rwX,go+rX /tmp/config
cp -r /tmp/config/* /

if [[ -n $rpi01 ]]; then
	sed -i '/^.Service/,$ d' /etc/systemd/system/mpd.service.d/override.conf
	sed -i '/ExecStart=/ d' /etc/systemd/system/spotifyd.service.d/override.conf
	rm -rf /etc/systemd/system/{shairport-sync,upmpdcli}.service.d
fi
#---------------------------------------------------------------------------------
banner 'Configure ...'

chown http:http /etc/fstab
chown -R http:http /etc/netctl /etc/systemd/network /srv/http
chmod 755 /srv/http/* /srv/http/bash/* /srv/http/settings/*

# alsa
alsactl store
# fix 'alsactl restore' errors
cp /{usr/lib,etc}/udev/rules.d/90-alsa-restore.rules
sed -i '/^TEST/ s/^/#/' /etc/udev/rules.d/90-alsa-restore.rules

# bluetooth
[[ -e /usr/bin/bluetoothctl ]] && sed -i 's/#*\(AutoEnable=\).*/\1true/' /etc/bluetooth/main.conf
# fix: 'discoverable yes'
sed -i '$ a\dtparam=krnbt=on' /boot/config.txt
systemctl enable bluetooth bluealsa

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
cp /usr/share/mpdscribble/mpdscribble.conf.example /etc/mpdscribble.conf

# disable again after upgrade
systemctl disable systemd-networkd-wait-online

# fix: pam ssh login halt
sed -i '/^-.*pam_systemd/ s/^/#/' /etc/pam.d/system-login

# password
echo root:rune | chpasswd
[[ -e /usr/bin/smbd ]] && ( echo rune; echo rune ) | smbpasswd -s -a root
sed -i 's/\(PermitEmptyPasswords \).*/#\1no/' /etc/ssh/sshd_config

# no samba
[[ ! -e /usr/bin/samba ]] && rm -rf /etc/samba /etc/systemd/system/wsdd.service /usr/local/bin/wsdd.py

# no shairport-sync
[[ ! -e /usr/bin/shairport-sync ]] && rm /etc/sudoers.d/shairport-sync /etc/systemd/system/shairport-meta.service

# no snapcast
[[ ! -e /usr/bin/snapclient ]] && rm /etc/default/snapclient

# spotifyd
[[ ! -e /usr/lib/systemd/system/spotifyd.service ]] && ln -s /usr/lib/systemd/{user,system}/spotifyd.service

# udevil
cat << EOF > /etc/conf.d/devmon
ARGS='--exec-on-drive "/srv/http/bash/sources-update.sh \"%d\""'
EOF

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
startup='avahi-daemon cronie devmon@http nginx php-fpm startup'
[[ -e /usr/bin/chromium ]] && startup+=' bootsplash localbrowser'

systemctl enable $startup

#---------------------------------------------------------------------------------
# data - settings directories
/srv/http/bash/datareset.sh $version

# remove files and package cache
rm /boot/features /etc/motd /root/create-rune.sh /var/cache/pacman/pkg/*

# usb boot - disable sd card polling
! df | grep -q /dev/mmcblk0 && echo 'dtoverlay=sdtweak,poll_once' >> /boot/config.txt

# expand partition
if (( $( sfdisk -F /dev/mmcblk0 | head -n1 | awk '{print $6}' ) )); then
	wget -q --show-progress https://github.com/rern/RuneOS/raw/master/x.sh -O /boot/x.sh
fi

if [[ -n $rpi01 && $features =~ upmpdcli ]]; then
	echo Wait for upmpdcli to finish RSA key ...
	sleep 30
fi

dialog "${optbox[@]}" --msgbox "

        \Z1RuneAudio+R $version\Z0 created successfully.
		
                Press \Z1Enter\Z0 to reboot
" 10 58

shutdown -r now
