#!/bin/bash

version=e2
addoversion=20191101

cols=$( tput cols )
hr() {
	printf %"$cols"s | tr ' ' -
}

hr
echo -e "\n\e[36mRuneAudio+Re systm ...\e[m\n"
hr

echo -e "\n\e[36mInitialize PGP key ...\e[m\n"
pacman-key --init
pacman-key --populate archlinuxarm

# fill entropy pool (fix - Kernel entropy pool is not initialized)
systemctl start systemd-random-seed

# fix dns errors
systemctl stop systemd-resolved

echo -e "\n\e[36mSystem-wide kernel and packages upgrade ...\e[m\n"
pacman -Syu --noconfirm --needed

packages='alsa-utils cronie dosfstools gcc ifplugd imagemagick mpd mpc nfs-utils nss-mdns ntfs-3g parted php-fpm python python-pip sudo udevil wget '

# get RPi hardware code
hwcode=$( cat /proc/cpuinfo | grep Revision | tail -c 4 | cut -c 1-2 )
echo 00 01 02 03 04 09 | grep -q $hwcode && nobt=1 || nobt=

#-------------------------------------------------------------------
echo -e "\n\e[m36Features ...\e[m\n"

read -ren 1 -p $'Install \e[36mall packages\e[m [y/n]: ' ans; echo
if [[ $ans == y || $ans == Y ]]; then
    packages+='avahi dnsmasq ffmpeg hostapd python python-pip samba shairport-sync '
    # RPi 0W, 3, 4
    [[ -n $nobt ]] && packages+='bluez bluez-utils '
    # RPi 2, 3, 4
    echo 04 08 0d 0e 11 | grep -q $hwcode && packages+='chromium xorg-server xf86-video-fbdev xf86-video-vesa xorg-xinit '
else
    read -ren 1 -p $'Install \e[36mAvahi\e[m - Connect by: runeaudio.local [y/n]: ' ans; echo
    [[ $ans == y || $ans == Y ]] && packages+='avahi '
    if [[ -n $nobt ]]; then
        read -ren 1 -p $'Install \e[36mBluez\e[m - Bluetooth supports [y/n]: ' blue; echo
        [[ $blue == y || $blue == Y ]] && packages+='bluez bluez-utils '
    fi
    if echo 04 08 0d 0e 11 | grep -q $hwcode; then
        read -ren 1 -p $'Install \e[36mChromium\e[m - Browser on RPi [y/n]: ' ans; echo
        [[ $ans == y || $ans == Y ]] && packages+='chromium xorg-server xf86-video-fbdev xf86-video-vesa xorg-xinit '
    fi
    read -ren 1 -p $'Install \e[36mFFmpeg\e[m - Extended decoder[y/n]: ' ans; echo
    [[ $ans == y || $ans == Y ]] && packages+='ffmpeg '
    read -ren 1 -p $'Install \e[36mhostapd\e[m - RPi access point [y/n]: ' ans; echo
    [[ $ans == y || $ans == Y ]] && packages+='dnsmasq hostapd '
    read -ren 1 -p $'Install \e[36mKid3\e[m - Metadata tag editor [y/n]: ' kid3; echo
	read -ren 1 -p $'Install \e[36mPython\e[m - programming language [y/n]: ' pyt; echo
    [[ $pyt == y || $pyt == Y ]] && packages+='python python-pip '
    read -ren 1 -p $'Install \e[36mSamba\e[m - File sharing [y/n]: ' ans; echo
    [[ $ans == y || $ans == Y ]] && packages+='samba '
    read -ren 1 -p $'Install \e[36mShairport-sync\e[m - AirPlay [y/n]: ' ans; echo
    [[ $ans == y || $ans == Y ]] && packages+='shairport-sync '
    read -ren 1 -p $'Install \e[36mupmpdcli\e[m - UPnP [y/n]: ' upnp; echo
fi
#-------------------------------------------------------------------

echo -e "\n\e[36mInstall packages ...\e[m\n"
pacman -S --noconfirm --needed $packages
[[ $pyt == y || $pyt == Y ]] && yes | pip --no-cache-dir install RPi.GPIO

echo -e "\n\e[36mInstall custom packages and web interface ...\e[m\n"
wget -q --show-progress https://github.com/rern/RuneOS/archive/master.zip
bsdtar xvf *.zip --strip 1 --exclude=.* --exclude=*.md -C /

# no onboard wireless
[[ $nobt ]] && rm /root/bluealsa* /root/armv6h/bluealsa* /boot/overlays/bcmbt.dtbo

# RPi 0, 1
if echo 00 01 02 03 09 0c | grep -q $hwcode; then
    rm /root/*.xz
    mv /root/armv6h/* /root
fi

chmod 755 /srv/http/* /srv/http/settings/* /usr/local/bin/*
chown -R http:http /srv/http

# remove config of excluded packages
[[ ! -e /usr/bin/avahi-daemon ]] && rm -r /etc/avahi/services
if [[ ! -e /usr/bin/chromium ]]; then
    rm -f libmatchbox* matchbox*
    rm /etc/systemd/system/localbrowser*
    rm /etc/X11/xinit/xinitrc
fi
[[ ! -e /usr/bin/bluetoothctl ]] && rm -r /etc/systemd/system/bluetooth.service.d /root/blue*
[[ ! -e /usr/bin/hostapd ]] && rm -r /etc/{hostapd,dnsmasq.conf}
[[ $kid3 == n || $kid3 == N ]] && rm /root/kid3*
[[ ! -e /usr/bin/smbd ]] && rm -r /etc/samba
[[ ! -e /usr/bin/shairport-sync ]] && rm /etc/systemd/system/shairport*
[[ $upnp == n || $upnp == N ]] && rm /etc/upmpdcli.conf /root/{libupnpp*,upmpdcli*}

pacman -U --noconfirm *.xz

#---------------------------------------------------------------------------------
echo -e "\n\e[36[mConfigure ...\e[m\n"

# remove cache and custom package files
rm /var/cache/pacman/pkg/* /root/{*.xz,*.zip} /usr/local/bin/create-*
rm -r /root/armv6h

# bluetooth - RPi 4 filename
hwcode=$( cat /proc/cpuinfo | grep Revision | tail -c 4 | cut -c 1-2 )
[[ $hwcode == 11 ]] && mv /usr/lib/firmware/updates/brcm/BCM{4345C0,}.hcd

# boot splash
if echo 04 08 0d 0e 11 | grep -q $hwcode; then
	cmdline='root=/dev/mmcblk0p2 rw rootwait console=ttyAMA0,115200 selinux=0 fsck.repair=yes smsc95xx.turbo_mode=N dwc_otg.lpm_enable=0 '
	cmdline+='kgdboc=ttyAMA0,115200 elevator=noop console=tty3 plymouth.enable=0 quiet loglevel=0 logo.nologo vt.global_cursor_default=0'
	echo $cmdline > $BOOT/boot/cmdline.txt
fi

# no onboard wireless
[[ $nobt ]] && sed -i '/disable-wifi\|disable-bt/ d' /boot/config.txt

# RPi 0 - fix: kernel panic
[[ $hwcode == 09 || $hwcode == 0c ]] && sed -i -e '/force_turbo=1/ i\over_voltage=2' -e '/dtparam=audio=on/ a\hdmi_drive=2' /boot/config.txt

# alsa
chmod -R 666 /var/lib/alsa  # fix permission
sed -i '/^TEST/ s/^/#/' /usr/lib/udev/rules.d/90-alsa-restore.rules   # omit test rules

# bluetooth (skip if removed bluetooth)
[[ -e /usr/bin/bluetoothctl ]] && sed -i 's/#*\(AutoEnable=\).*/\1true/' /etc/bluetooth/main.conf

# cron - for addons updates
( crontab -l &> /dev/null; echo '00 01 * * * /srv/http/addons-update.sh &' ) | crontab -

# lvm - remove invalid value
sed -i '/event_timeout/ s/^/#/' /usr/lib/udev/rules.d/11-dm-lvm.rules

# mpd - music directories
mkdir -p /mnt/MPD/{NAS,SD,USB}
chown -R mpd:audio /mnt/MPD

# mpd - create missing log file
touch /var/log/mpd.log
chown mpd:audio /var/log/mpd.log

# motd - remove default
rm /etc/motd

# netctl - allow write for http
chmod -R 777 /etc/netctl

# nginx - custom 50x.html
mv -f /etc/nginx/html/50x.html{.custom,}

# password - set default
echo root:rune | chpasswd

# ssh - permit root
sed -i 's/#PermitRootLogin.*/PermitRootLogin yes/' /etc/ssh/sshd_config

# user - set expire to none
users=$( cut -d: -f1 /etc/passwd )
for user in $users; do
    chage -E -1 $user
done

# upmpdcli - fix: missing symlink
[[ -e /usr/bin/upmpdcli ]] && ln -s /lib/libjsoncpp.so.{21,20}

# wireless-regdom
echo 'WIRELESS_REGDOM="00"' > /etc/conf.d/wireless-regdom

# startup services
systemctl daemon-reload

startup='avahi-daemon bootsplash cronie devmon@mpd localbrowser nginx php-fpm startup'

if [[ -e /usr/bin/chromium ]]; then
    # bootsplash - set default image
    ln -s /srv/http/assets/img/{NORMAL,start}.png
    
    # login prompt - remove
    systemctl disable getty@tty1
else
    startup=${startup/bootsplash }
    startup=${startup/localbrowser }
fi

[[ ! -e /usr/bin/avahi-daemon ]] && startup=${startup/avahi-daemon }

systemctl enable $startup

# fix sd card dirty bits if any
fsck.fat -trawl /dev/mmcblk0p1 | grep -i 'dirty bit'

echo -e "\n\e[m36Setup default settings ...\e[m\n"
# data and subdirectories
dirdata=/srv/http/data
dirdisplay=$dirdata/display
dirsystem=$dirdata/system
mkdir "$dirdata"
for dir in addons bookmarks coverarts display gpio lyrics mpd playlists sampling system tmp webradios; do
	mkdir "$dirdata/$dir"
done
# addons
echo $addoversion > /srv/http/data/addons/rr$version
echo $version > $dirsystem/version
# display
playback="bars buttons cover time volume"
library="album artist albumartist composer coverart genre nas sd usb webradio"
miscel="count label plclear playbackswitch"
for item in $playback $library $miscel; do
	echo 1 > $dirdisplay/$item
done
# system
echo runeaudio > /etc/hostname
sed -i 's/#NTP=.*/NTP=pool.ntp.org/' /etc/systemd/timesyncd.conf
ln -sf /usr/share/zoneinfo/UTC /etc/localtime
echo bcm2835 ALSA_1 > $dirsystem/audiooutput
echo 1 | tee $dirsystem/{localbrowser,onboard-audio,onboard-wlan} > /dev/null
echo RuneAudio | tee $dirsystem/{hostname,soundprofile} > /dev/null
echo 0 0 0 > $dirsystem/mpddb
echo '$2a$12$rNJSBU0FOJM/jP98tA.J7uzFWAnpbXFYx5q1pmNhPnXnUu3L1Zz6W' > $dirsystem/password

# set permissions and ownership
chown -R http:http "$dirdata"
chown -R mpd:audio "$dirdata/mpd"

echo -e "\n\e[36mDone\e[m\n"
hr
