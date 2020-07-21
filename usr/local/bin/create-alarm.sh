#!/bin/bash

# required packages
if [[ -e /usr/bin/pacman ]]; then
	[[ ! -e /usr/bin/bsdtar ]] && packages+='bsdtar '
	[[ ! -e /usr/bin/dialog ]] && packages+='dialog '
	[[ ! -e /usr/bin/nmap ]] && packages+='nmap '
	[[ ! -e /usr/bin/pv ]] && packages+='pv '
	[[ ! -e /usr/bin/sshpass ]] && packages+='sshpass '
	if [[ -n $packages ]]; then
		[[ -e pacman-mirrors ]] && pacman-mirrors -f5  # only if manjaro
		pacman -Sy --noconfirm --needed $packages
	fi
else
	[[ ! -e /usr/bin/bsdtar ]] && packages+='bsdtar libarchive-tools '
	[[ ! -e /usr/bin/dialog ]] && packages+='dialog '
	[[ ! -e /usr/bin/nmap ]] && packages+='nmap '
	[[ ! -e /usr/bin/pv ]] && packages+='pv '
	[[ ! -e /usr/bin/sshpass ]] && packages+='sshpass '
	[[ -n $packages ]] && apt install -y $packages
fi

#----------------------------------------------------------------------------
title='Create Arch Linux Arm'
opt=( --backtitle "$title" --colors --no-shadow )

dialog --colors --no-shadow --infobox "\n
\n
                    \Z1Arch Linux Arm\Z0\n
                          for\n
                     Raspberry Pi
" 9 58

sleep 3

BOOT=$( df | grep 'BOOT$' | awk '{print $NF}' )
ROOT=$( df | grep 'ROOT$' | awk '{print $NF}' )

# check mounts
[[ -z $BOOT ]] && warnings+='BOOT not mounted\n'
[[ -z $ROOT ]] && warnings+='ROOT not mounted\n'
if [[ -n $BOOT && -n $ROOT  ]]; then
	# check duplicate names
	[[ ${#[BOOT[@]} -gt 1 ]] && warnings+='BOOT has more than 1\n'
	[[ ${#[ROOT[@]} -gt 1 ]] && warnings+='ROOT has more than 1\n'
	# check empty to prevent wrong partitions
	[[ -n $( ls $BOOT | grep -v 'System Volume Information' ) ]] && warnings+='BOOT not empty\n'
	[[ -n $( ls $ROOT | grep -v 'lost+found' ) ]] && warnings+='ROOT not empty\n'
	# check fstype
	[[ $( df --output=fstype $BOOT | tail -1 ) != vfat ]] && warnings+='BOOT not fat32\n'
	[[ $( df --output=fstype $ROOT | tail -1 ) != ext4 ]] && warnings+='ROOT not ext4\n'
fi
# partition warnings
if [[ -n $warnings ]]; then
	dialog "${opt[@]}" --msgbox "\n
\Z1Warnings:\Z0\n
\n
$warnings\n
\n
" 0 0
	clear && exit
fi

# get build data
getData() { # --menu <message> <lines exclude menu box> <0=autoW dialog> <0=autoH menu>
	dialog "${opt[@]}" --yesno "\n
\Z1Confirm path:\Z0\n
\n
BOOT: \Z1$BOOT\Z0\n
ROOT: \Z1$ROOT\Z0\n
\n
" 0 0
	[[ $? == 1 ]] && clear && exit

	rpi=$( dialog "${opt[@]}" --output-fd 1 --menu "\n
\Z1Target:\Z0
" 0 0 0 \
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
	
	dialog "${opt[@]}" --yesno "\n
Connect \Z1Wi-Fi\Z0 on boot?\n
\n
" 0 0
	if [[ $? == 0 ]]; then
		ssid=$( dialog "${opt[@]}" --output-fd 1 --inputbox "\n
\Z1Wi-Fi\Z0 - SSID:\n
\n
" 0 0 $ssid )
		password=$( dialog "${opt[@]}" --output-fd 1 --inputbox "\n
\Z1Wi-Fi\Z0 - Password:\n
\n
" 0 0 $password )
		wpa=$( dialog "${opt[@]}" --output-fd 1 --menu "\n
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
		wifi="Wi-Fi settings\n\
 SSID     : \Z1$ssid\Z0\n\
 Password : \Z1$password\Z0\n\
 Security : \Z1${wpa^^}\Z0\n"
	fi

	dialog "${opt[@]}" --yesno "\n
\Z1Confirm data:\Z0\n
\n
BOOT path : \Z1$BOOT\Z0\n
ROOT path : \Z1$ROOT\Z0\n
Target    : \Z1Raspberry Pi $rpiname\Z0\n
\n
$wifi\n
\n
" 0 0
	[[ $? == 1 ]] && getData
}
getData

# if already downloaded, verify latest
if [[ -e $file ]]; then
	wget -qO $file.md5 http://os.archlinuxarm.org/os/$file.md5
	md5sum -c $file.md5 || rm $file
fi

# download
if [[ -e $file ]]; then
	dialog "${opt[@]}" --msgbox "\n
Existing \Z1$file\Z0\n
is the latest.\n
No download required.\n
\n
" 0 0
	sleep 2
else
	( wget -O $file http://os.archlinuxarm.org/os/$file 2>&1 \
		| stdbuf -o0 awk '/[.] +[0-9][0-9]?[0-9]?%/ { \
			print "XXX\n"substr($0,63,3)
			print "\\n\\Z1Download Arch Linux Arm\\Z0\\n"
			print "Time left: "substr($0,74,5)"\nXXX" }' ) \
		| dialog "${opt[@]}" --gauge "\n
Connecting ...
" 9 50
	# checksum
	wget -qO $file.md5 http://os.archlinuxarm.org/os/$file.md5
	if ! md5sum -c $file.md5; then
		rm $file
		dialog "${opt[@]}" --msgbox "\n
\Z1Download incomplete!\Z0\n
\n
Run \Z1./create-alarm.sh\Z0 again.\n
\n
" 0 0
		exit
	fi
fi

# expand
( pv -n $file \
	| bsdtar -C $BOOT --strip-components=2 --no-same-permissions --no-same-owner -xf - boot ) 2>&1 \
	| dialog "${opt[@]}" --gauge "\n
Expand to \Z1BOOT\Z0 ...
" 9 50
( pv -n $file \
	| bsdtar -C $ROOT --exclude='boot' -xpf - ) 2>&1 \
	| dialog "${opt[@]}" --gauge "\n
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
| dialog "${opt[@]}"--gauge "\n
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
systemctl disable systemd-networkd-wait-online
# ssh - permit root
sed -i 's/#PermitRootLogin.*/PermitRootLogin yes/' $ROOT/etc/ssh/sshd_config
# suppress warnings
echo 'StrictHostKeyChecking no' >> $ROOT/etc/ssh/ssh_config

# get create-rune.sh
wget -qN --no-check-certificate https://github.com/rern/RuneOS/raw/master/usr/local/bin/create-rune.sh -P $ROOT/usr/local/bin
chmod 755 $ROOT/usr/local/bin/*.sh

dialog --colors --no-shadow --msgbox "\n
\n
         Arch Linux Arm for \Z1Raspberry Pi $rpiname\Z0\n
                created successfully.
" 10 58

rm create-alarm.sh

#----------------------------------------------------------------------------
umount -l $BOOT
umount -l $ROOT

[[ ${partuuidBOOT:0:-3} != ${partuuidROOT:0:-3} ]] && usb=' and USB drive'
[[ $rpi == 0 ]] && wait=60 || wait=30
dialog --colors --no-shadow --msgbox "\n
\Z1Finish.\Z0\n
\n
\Z1BOOT\Z0 and \Z1ROOT\Z0 were unmounted.\n
Move micro SD card$usb to RPi.\n
Power on.\n
\Z1Wait $wait seconds\Z0 then press \Z1Enter\Z0 to continue.\n
\n
" 12 55

#----------------------------------------------------------------------------
title='Connect to Raspberry Pi'
opt=( --backtitle "$title" --colors --no-shadow )
# scan ip
routerip=$( ip r get 1 | head -1 | cut -d' ' -f3 )
subip=${routerip%.*}.
scanIP() {
	dialog "${opt[@]}" --infobox "\n
Scan IP address ...\n
\n
" 5 50
	nmap=$( nmap -sn $subip* | grep -v 'Starting\|Host is up\|Nmap done' | head -n -1 | tac | sed 's/$/\\n/; s/Nmap.*for/IP :/; s/MAC Address/\\nMAC/' | tr -d '\n' )
	dialog "${opt[@]}" --msgbox "\n
\Z1Find IP address of Raspberry Pi:\Z0\n
(Raspberri Pi 4 may listed as Unknown)\n
\Z4[arrowdown] = scrolldown\Z0\n
\n
$nmap\n
\n
" 50 100

	dialog "${opt[@]}" --ok-label Yes --extra-button --extra-label Rescan --cancel-label No --yesno "\n
\Z1Found IP address of Raspberry Pi?\Z0
" 7 38
	ans=$?
	if [[ $ans == 3 ]]; then
		scanIP
	elif [[ $ans == 1 && -n $rescan ]]; then
		dialog "${opt[@]}" --msgbox "\n
Try starting over again.\n
\n
" 0 0
		clear && exit
	fi
}
scanIP

if [[ $ans == 1 ]]; then
	dialog "${opt[@]}" --yesno "\n
\Z1Connect with Wi-Fi?\Z0\n
\n
" 0 0
	if [[ $? == 0 ]]; then
		rescan=1
		dialog "${opt[@]}" --msgbox "\n
- Power off\n
- Connect wired LAN\n
- Power on\n
- Wait 30 seconds\n
- Press Enter to rescan\n
\n
" 0 0
		scanIP
	else
		dialog "${opt[@]}" --msgbox "\n
- Power off\n
- Connect a monitor/TV\n
- Power on and observe errors\n
- Try starting over again\n
\n
" 0 0
		clear && exit
	fi
fi

# connect RPi
rpiip=$( dialog "${opt[@]}" --output-fd 1 --cancel-label Rescan --inputbox "\n
\Z1Raspberry Pi IP:\Z0\n
\n
" 0 0 $subip )
[[ $? == 1 ]] && scanIP

clear

cat /dev/zero | ssh-keygen -q -N "" &> /dev/null
ssh-keygen -R $rpiip &> /dev/null
sshpass -p root ssh -o StrictHostKeyChecking=no root@$rpiip
