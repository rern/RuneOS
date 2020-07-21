#!/bin/bash

# any argument - custom inputs for version and branch
version=e4
uibranch=master
addonalias=rr$version

trap 'rm -f /var/lib/pacman/db.lck; clear; exit' INT

hardwarecode=$( grep Revision /proc/cpuinfo )
hwcode=${hardwarecode: -3:2}
[[ $hwcode =~ ^(00|01|02|03|04|09)$ ]] && nowireless=1
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
! grep -q '\[RR\]' /etc/pacman.conf && echo '
[RR]
SigLevel = Optional TrustAll
Server = https://rern.github.io/$arch
' >> /etc/pacman.conf

# dialog package
pacman -Sy --noconfirm --needed dialog

#----------------------------------------------------------------------------
if (( $# > 0 )); then
	version=$( dialog --colors --output-fd 1 --inputbox "\n\Z1Version:\Z0" 0 0 $version )
	uibranch=$( dialog --colors --output-fd 1 --inputbox "\n\Z1UI branch:\Z0" 0 0 $uibranch )
	addonalias=rr$version
fi

title="Create RuneAudio+R $version"
opt=( --backtitle "$title" --colors --no-shadow )
dialog --colors --no-shadow --infobox "\n
\n
                \Z1RuneAudio+R $version\Z0
" 7 50
sleep 3

    bluez='\Z1Bluez\Z0     - Bluetooth supports'
 chromium='\Z1Chromium\Z0  - Browser on RPi'
  hostapd='\Z1hostapd\Z0   - RPi access point'
      kid='\Z1Kid3\Z0      - Metadata tag editor'
   python='\Z1Python\Z0    - Programming language'
  rpigpio='\Z1RPi.GPIO\Z0  - Python RPi.GPIO module'
    samba='\Z1Samba\Z0     - File sharing'
shairport='\Z1Shairport\Z0 - AirPlay renderer'
 snapcast='\Z1Snapcast\Z0  - Synchronous multiroom player'
  spotify='\Z1Spotifyd\Z0  - Spotify renderer'
 upmpdcli='\Z1upmpdcli\Z0  - UPnP renderer'

if [[ $nowireless ]]; then
	bluez='Bluez     - (no onboard)'
	onoffbluez=off
else
	onoffbluez=on
fi
if [[ $rpi01 ]]; then
	chromium='Chromium  - (not for RPi Zero, 1)'
	onoffchromium=off
else
	onoffchromium=on
fi

selectFeatures() { # --checklist <message> <lines exclude checklist box> <0=autoW dialog> <0=autoH checklist>
	select=$( dialog "${opt[@]}" --output-fd 1 --checklist "
\Z1Select features to install:
\Z4[space] = Select / Deselect\Z0
" 9 0 0 \
1 "$bluez" $onoffbluez \
2 "$chromium" $onoffchromium \
3 "$hostapd" on \
4 "$kid" on \
5 "$rpigpio" on \
6 "$samba" on \
7 "$shairport" on \
8 "$snapcast" on \
9 "$spotify" on \
10 "$upmpdcli" on )
	
	select=" $select "
	[[ $select == *' 1 '* && ! $nowireless ]] && features+='bluez bluez-alsa-git bluez-utils ' && list+="$bluez\n"
	[[ $select == *' 2 '* && ! $rpi01 ]] && features+='chromium matchbox-window-manager upower xf86-video-fbdev xf86-video-vesa xorg-server xorg-xinit ' && list+="$chromium\n"
	[[ $select == *' 3 '* ]] && features+='dnsmasq hostapd ' && list+="$hostapd\n"
	[[ $select == *' 4 '* ]] && features+='kid3-cli ' && list+="$kid\n"
	[[ $select == *' 5 '* ]] && features+='python-pip ' && list+="$rpigpio\n" && gpio=1
	[[ $select == *' 6 '* ]] && features+='samba ' && list+="$samba\n"
	[[ $select == *' 7 '* ]] && features+='shairport-sync ' && list+="$shairport\n"
	[[ $select == *' 8 '* ]] && features+='snapcast ' && list+="$snapcast\n"
	[[ $select == *' 9 '* ]] && features+='spotifyd jq ' && list+="$spotify\n"
	[[ $select == *' 10 '* ]] && features+='upmpdcli ' && list+="$upmpdcli\n"
}
selectFeatures

dialog "${opt[@]}" --yesno "\n
\Z1Confirm features to install:\Z0\n
\n
$list\n
\n
" 0 0
[[ $? == 1 ]] && selectFeatures

clear

#----------------------------------------------------------------------------
pacmanFailed() {
	dialog "${opt[@]}" --msgbox "\n
$1\n
\n
Run \Z1create-rune.sh\Z0 again.\n
\n
" 0 0
	exit
}
echo -e "\n\e[36mSystem-wide kernel and packages upgrade ...\e[m\n"

pacman -Syu --noconfirm --needed
[[ $? != 0 ]] && pacmanFailed 'System-wide upgrades download incomplete!'

packages='alsa-utils cronie dosfstools gcc hfsprogs ifplugd imagemagick inetutils man mpc mpd mpdscribble '
packages+='nfs-utils nginx-mainline-pushstream nss-mdns ntfs-3g parted php-fpm python-wheel sshpass sudo udevil wget '

echo -e "\n\e[36mInstall packages ...\e[m\n"

pacman -S --noconfirm --needed $packages $features
[[ $? != 0 ]] && pacmanFailed 'Packages download incomplete!'

[[ $gpio ]] && yes 2> /dev/null | pip --no-cache-dir install RPi.GPIO

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

[[ $nowireless ]] && sed -i '/disable-wifi\|disable-bt\|bcmbt/ d' /boot/config.txt

# RPi 4 - rename bluetooth file
[[ $hwcode == 11 ]] && mv /usr/lib/firmware/updates/brcm/BCM{4345C0,}.hcd

chown http:http /etc/fstab
chown -R http:http /etc/netctl /etc/systemd/network /srv/http
chmod 755 /srv/http/* /srv/http/bash/* /srv/http/settings/* /usr/local/bin/*

# alsa
alsactl store
# fix 'alsactl restore' errors
cp /{usr/lib,etc}/udev/rules.d/90-alsa-restore.rules
sed -i '/^TEST/ s/^/#/' /etc/udev/rules.d/90-alsa-restore.rules

# avahi
sed -i 's/\(use-ipv6=\).*/\1no/' /etc/avahi/avahi-daemon.conf

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

# password - set default
echo root:rune | chpasswd
[[ -e /usr/bin/smbd ]] && ( echo rune; echo rune ) | smbpasswd -s -a root

# no samba
[[ ! -e /usr/bin/samba ]] && rm -rf /etc/samba /etc/systemd/system/wsdd.service /usr/local/bin/wsdd.py

# no shairport-sync
[[ ! -e /usr/bin/shairport-sync ]] && rm /etc/sudoers.d/shairport-sync /etc/systemd/system/shairport-meta.service

# no snapcast
[[ ! -e /usr/bin/snapclient ]] && rm /etc/default/snapclient

# user - set expire to none
users=$( cut -d: -f1 /etc/passwd )
for user in $users; do
	chage -E -1 $user
done

# upmpdcli - fix: missing symlink and init RSA key
if [[ -e /usr/bin/upmpdcli ]]; then
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
# symlink /mnt for coverart files
ln -s /mnt /srv/http/

# data - settings directories
/srv/http/bash/data-reset.sh "$version"

# addons
diraddons=/srv/http/data/addons
wget -qN https://github.com/rern/RuneAudio_Addons/raw/master/addons-list.json -P $diraddons
jq -r .rre4.version /srv/http/data/addons/addons-list.json > $diraddons/$addonalias

# remove cache and files
rm /root/*.xz /usr/local/bin/create-* /etc/motd
pacman -Scc --noconfirm

# usb boot - disable sd card polling
! df | grep -q /dev/mmcblk0 && echo 'dtoverlay=sdtweak,poll_once' >> /boot/config.txt

dialog --colors --no-shadow --msgbox "\n
\n
    \Z1RuneAudio+R $version\Z0 created successfully.\n
\n
            Press \Z1Enter\Z0 to reboot
" 10 50

shutdown -r now
