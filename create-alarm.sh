#!/bin/bash

# required packages
if [[ -e /usr/bin/pacman ]]; then
	[[ ! -e /usr/bin/bsdtar ]] && packages+='bsdtar '
	[[ ! -e /usr/bin/dialog ]] && packages+='dialog '
	[[ ! -e /usr/bin/nmap ]] && packages+='nmap '
	[[ ! -e /usr/bin/pv ]] && packages+='pv '
	[[ -n $packages ]] && pacman -Sy --noconfirm --needed $packages
else
	[[ ! -e /usr/bin/bsdtar ]] && packages+='bsdtar libarchive-tools '
	[[ ! -e /usr/bin/dialog ]] && packages+='dialog '
	[[ ! -e /usr/bin/nmap ]] && packages+='nmap '
	[[ ! -e /usr/bin/pv ]] && packages+='pv '
	[[ -n $packages ]] && apt install -y $packages
fi

#----------------------------------------------------------------------------
title='Create Arch Linux Arm'
optbox=( --colors --no-shadow --no-collapse )
opt=( --backtitle "$title" ${optbox[@]} )

dialog "${optbox[@]}" --infobox "

                    \Z1Arch Linux Arm\Z0
                          for
                     Raspberry Pi
" 9 58
sleep 3

BOOT=$( df | grep 'BOOT$' | awk '{print $NF}' )
ROOT=$( df | grep 'ROOT$' | awk '{print $NF}' )

# check mounts
[[ -z $BOOT ]] && warnings+="
BOOT not mounted"
[[ -z $ROOT ]] && warnings+="
ROOT not mounted"
if [[ -n $BOOT && -n $ROOT  ]]; then
	# check duplicate names
	(( ${#BOOT[@]} > 1 )) && wget --no-check-certificate -qO - create-alarm.sh https://github.com/rern/RuneOS/raw/master/usr/local/bin/create-alarm.sh | sh
	(( ${#ROOT[@]} > 1 )) && warnings+="
ROOT has more than 1"
	# check empty to prevent wrong partitions
	[[ -n $( ls $BOOT | grep -v 'System Volume Information' ) ]] && warnings+="
BOOT not empty"
	[[ -n $( ls $ROOT | grep -v 'lost+found' ) ]] && warnings+="
ROOT not empty"
	# check fstype
	[[ $( df --output=fstype $BOOT | tail -1 ) != vfat ]] && warnings+="
BOOT not fat32"
	[[ $( df --output=fstype $ROOT | tail -1 ) != ext4 ]] && warnings+="\
ROOT not ext4"
fi
# partition warnings
if [[ -n $warnings ]]; then
	dialog "${opt[@]}" --msgbox "
\Z1Warnings:\Z0
$warnings

" 0 0
	clear && exit
fi

# get build data
getData() { # --menu <message> <lines exclude menu box> <0=autoW dialog> <0=autoH menu>
	dialog "${opt[@]}" --yesno "
\Z1Confirm path:\Z0

BOOT: \Z1$BOOT\Z0
ROOT: \Z1$ROOT\Z0

" 0 0
	[[ $? == 1 ]] && clear && exit

	rpi=$( dialog "${opt[@]}" --output-fd 1 --menu "
\Z1Target:\Z0
" 8 0 0 \
0 'Raspberry Pi Zero' \
1 'Raspberry Pi 1' \
2 'Raspberry Pi 2' \
3 'Raspberry Pi 3' \
4 'Raspberry Pi 4' )
	
	case $rpi in
		0 | 1 ) file=ArchLinuxARM-rpi-latest.tar.gz ;;
		2 | 3 ) file=ArchLinuxARM-rpi-2-latest.tar.gz ;;
		4 )     file=ArchLinuxARM-rpi-4-latest.tar.gz ;;
	esac
	
	[[ $rpi != 0 ]] && rpiname=$rpi || rpiname=Zero
	
	dialog "${opt[@]}" --yesno "
Connect \Z1Wi-Fi\Z0 on boot?

" 0 0
	if [[ $? == 0 ]]; then
		ssid=$( dialog "${opt[@]}" --output-fd 1 --inputbox "
\Z1Wi-Fi\Z0 - SSID:

" 0 0 $ssid )
		password=$( dialog "${opt[@]}" --output-fd 1 --inputbox "
\Z1Wi-Fi\Z0 - Password:

" 0 0 $password )
		wpa=$( dialog "${opt[@]}" --output-fd 1 --menu "
\Z1Wi-Fi\Z0 -Security:
" 0 0 0 \
1 WPA \
2 WEP \
3 None )
		if [[ $wpa == 1 ]]; then
			wpa=wpa
		elif [[ $wpa == 2 ]]; then
			wpa=wep
		else
			wpa=
		fi
		wifi="Wi-Fi settings
 SSID     : \Z1$ssid\Z0
 Password : \Z1$password\Z0
 Security : \Z1${wpa^^}\Z0"
	fi

	dialog "${opt[@]}" --yesno "
\Z1Confirm data:\Z0

BOOT path : \Z1$BOOT\Z0
ROOT path : \Z1$ROOT\Z0

Target    : \Z1Raspberry Pi $rpiname\Z0

$wifi

" 0 0
	[[ $? == 1 ]] && getData
}
getData

# if already downloaded, verify latest
if [[ -e $file ]]; then
	wget -qO $file.md5 http://os.archlinuxarm.org/os/$file.md5 \
		| dialog "${opt[@]}" --gauge "
Verify already downloaded file ...
" 9 50
	md5sum -c $file.md5 || rm $file
fi

# download
if [[ -e $file ]]; then
	dialog "${opt[@]}" --msgbox "
Existing is the latest:
\Z1$file\Z0
No download required.

" 0 0
	sleep 2
else
	( wget -O $file http://os.archlinuxarm.org/os/$file 2>&1 \
		| stdbuf -o0 awk '/[.] +[0-9][0-9]?[0-9]?%/ { \
			print "XXX\n"substr($0,63,3)
			print "\\nDownload \\Z1Arch Linux Arm\\Z0\\n"
			print "Time left: "substr($0,74,5)"\nXXX" }' ) \
		| dialog "${opt[@]}" --gauge "
Connecting ...
" 9 50
	# checksum
	wget -qO $file.md5 http://os.archlinuxarm.org/os/$file.md5
	if ! md5sum -c $file.md5; then
		rm $file
		dialog "${opt[@]}" --msgbox "
\Z1Download incomplete!\Z0

Run \Z1./create-alarm.sh\Z0 again.

" 0 0
		exit
	fi
fi

# expand
( pv -n $file \
	| bsdtar -C $BOOT --strip-components=2 --no-same-permissions --no-same-owner -xf - boot ) 2>&1 \
	| dialog "${opt[@]}" --gauge "
Expand to \Z1BOOT\Z0 ...
" 9 50
( pv -n $file \
	| bsdtar -C $ROOT --exclude='boot' -xpf - ) 2>&1 \
	| dialog "${opt[@]}" --gauge "
Expand to \Z1ROOT\Z0 ...
" 9 50

sync &

Sstart=$( date +%s )
dirty=$( awk '/Dirty:/{print $2}' /proc/meminfo )
( while (( $( awk '/Dirty:/{print $2}' /proc/meminfo ) > 10 )); do
	left=$( awk '/Dirty:/{print $2}' /proc/meminfo )
	percent=$(( $(( dirty - left )) * 100 / dirty ))
	cat <<EOF
XXX
$percent
\nWrite remaining cache to \Z1ROOT\Z0 ...
XXX
EOF
	sleep 2
done ) \
| dialog "${opt[@]}" --gauge "
Write remaining cache to \Z1ROOT\Z0 ...
" 9 50

#----------------------------------------------------------------------------
# fstab and cmdline.txt
PATH=$PATH:/sbin  # Debian not include /sbin in PATH
partuuidBOOT=$( blkid | grep $( df | grep BOOT | awk '{print $1}' ) | awk '{print $NF}' | tr -d '"' )
partuuidROOT=$( blkid | grep $( df | grep ROOT | awk '{print $1}' ) | awk '{print $NF}' | tr -d '"' )
echo "$partuuidBOOT  /boot  vfat  defaults  0  0
$partuuidROOT  /      ext4  defaults  0  0" > $ROOT/etc/fstab
[[ $rpi > 1 ]] && isolcpus=' isolcpus=3'
cmdline="root=$partuuidROOT rw rootwait selinux=0 plymouth.enable=0 smsc95xx.turbo_mode=N dwc_otg.lpm_enable=0 elevator=noop fsck.repair=yes$isolcpus console=tty1"
echo $cmdline > $BOOT/cmdline.txt

# config.txt
config="\
over_voltage=2
hdmi_drive=2
force_turbo=1
gpu_mem=32
initramfs initramfs-linux.img followkernel
max_usb_current=1
disable_splash=1
disable_overscan=1
dtparam=audio=on
"
[[ $rpi == 4 ]] && config=$( sed '/force_turbo/ d' <<<"$config" )
[[ $rpi != 0 ]] && config=$( sed '/over_voltage\|hdmi_drive/ d' <<<"$config" )

echo -n "$config" > $BOOT/config.txt

# wifi
if [[ $ssid ]]; then
	# profile
	profile="Interface=wlan0
Connection=wireless
IP=dhcp
ESSID=\"$ssid\""
	[[ -n $wpa ]] && profile+="
Security=$wpa
Key=\"$password\"
"
	echo "$profile" > "$ROOT/etc/netctl/$ssid"

	# enable startup
	pwd=$PWD
	dir=$ROOT/etc/systemd/system/sys-subsystem-net-devices-wlan0.device.wants
	mkdir -p $dir
	cd $dir
	ln -s ../../../../lib/systemd/system/netctl-auto@.service netctl-auto@wlan0.service
	cd "$pwd"
fi

# fix dns errors
echo DNSSEC=no >> $ROOT/etc/systemd/resolved.conf

# disable wait-online
rm -r $ROOT/etc/systemd/system/network-online.target.wants

# ssh - root login, blank password
sed -i -e 's/#\(PermitRootLogin \).*/\1yes/
' -e 's/#\(PermitEmptyPasswords \).*/\1yes/
' $ROOT/etc/ssh/sshd_config

# set root password
id=$( awk -F':' '/^root/ {print $3}' $ROOT/etc/shadow )
sed -i "s/^root.*/root::$id::::::/" $ROOT/etc/shadow

# fix - haveged coredump error
file=$ROOT/usr/lib/systemd/system/haveged.service
if ! grep -q SystemCallErrorNumber=EPERM $file; then
	sed -i -e '/^SystemCallFilter/ d
' -e '/SystemCallArchitectures/ a\
SystemCallFilter=@system-service\
SystemCallFilter=~@mount\
SystemCallErrorNumber=EPERM
' $file
fi

# get create-rune.sh
wget -qN https://github.com/rern/RuneOS/raw/master/create-rune.sh -P $ROOT/root
chmod 755 $ROOT/root/create-rune.sh
echo /root/create-rune.sh >> $ROOT/etc/bash.bashrc

dialog "${optbox[@]}" --msgbox "

                   Arch Linux Arm
                         for
                   \Z1Raspberry Pi $rpiname\Z0
                Created successfully.
" 11 58

#----------------------------------------------------------------------------
umount -l $BOOT
umount -l $ROOT

[[ ${partuuidBOOT:0:-3} != ${partuuidROOT:0:-3} ]] && usb=' and USB drive'
[[ $rpi == 0 ]] && wait=60 || wait=30
dialog "${optbox[@]}" --msgbox "
\Z1Finish.\Z0

\Z1BOOT\Z0 and \Z1ROOT\Z0 were unmounted.

1. Move micro SD card$usb to RPi
2. Power on
3. \Z1Wait $wait seconds\Z0
4. Press \Z1Enter\Z0 to continue

" 14 55

#----------------------------------------------------------------------------
title='Connect to Raspberry Pi'
opt=( --backtitle "$title" --colors --no-shadow )
# scan ip
routerip=$( ip r get 1 | head -1 | cut -d' ' -f3 )
subip=${routerip%.*}.
scanIP() {
	dialog "${opt[@]}" --infobox "
Scan IP address ...

" 5 50
	nmap=$( nmap -sn $subip* | grep -v 'Starting\|Host is up\|Nmap done' | head -n -1 | tac | sed 's/$/\\n/; s/Nmap.*for/IP :/; s/MAC Address/\\nMAC/' | tr -d '\n' )
	dialog "${opt[@]}" --msgbox "
\Z1Find IP address of Raspberry Pi:\Z0
(Raspberri Pi 4 may listed as Unknown)
\Z4[arrowdown] = scrolldown\Z0

$nmap

" 50 100

	dialog "${opt[@]}" --ok-label Yes --extra-button --extra-label Rescan --cancel-label No --yesno "\n
\Z1Found IP address of Raspberry Pi?\Z0
" 7 38
	ans=$?
	if [[ $ans == 3 ]]; then
		scanIP
	elif [[ $ans == 1 && -n $rescan ]]; then
		dialog "${opt[@]}" --msgbox "
Try starting over again.

" 0 0
		clear && exit
	fi
}
scanIP

if [[ $ans == 1 ]]; then
	dialog "${opt[@]}" --yesno "
\Z1Connect with Wi-Fi?\Z0

" 0 0
	if [[ $? == 0 ]]; then
		rescan=1
		dialog "${opt[@]}" --msgbox "
- Power off
- Connect wired LAN
- Power on
- Wait 30 seconds
- Press Enter to rescan

" 0 0
		scanIP
	else
		dialog "${opt[@]}" --msgbox "
- Power off
- Connect a monitor/TV
- Power on and observe errors
- Try starting over again

" 0 0
		clear && exit
	fi
fi

# connect RPi
rpiip=$( dialog "${opt[@]}" --output-fd 1 --cancel-label Rescan --inputbox "
\Z1Raspberry Pi IP:\Z0

" 0 0 $subip )
[[ $? == 1 ]] && scanIP

file=~/.ssh/known_hosts
sed -i "/$rpiip/ d" $file
ssh-keyscan -t ecdsa -H $rpiip >> $file
sed -i '$ s/.*ecdsa/'$rpiip' ecdsa/' $file

clear

ssh root@$rpiip

[[ $? != 0 ]] && ssh root@$rpiip
