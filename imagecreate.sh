#!/bin/bash

col=$( tput cols )
banner() {
	echo
	def='\e[0m'
	bg='\e[44m'
    printf "$bg%*s$def\n" $col
    printf "$bg%-${col}s$def\n" "  $1"
    printf "$bg%*s$def\n" $col
}

banner 'Device list'
fdisk -l | grep 'Disk /dev' | cut -d, -f1  | cut -d' ' -f2-

echo
read -p 'Select SD card: /dev/sd' x
[[ -z $x ]] && echo No device selected. && exit

dev=/dev/sd$x
part=${dev}2
dirboot=/mnt/BOOT
dirroot=/mnt/ROOT

mount ${dev}1 $dirboot
mount $part $dirroot

if [[ $( df -Th $dirboot | tail -1 | awk '{print $2$3}' ) != vfat100M ]]; then
        echo ${dev}1 not BOOT partition
		umount -l ${dev}*
        exit
fi

version=$( cat $dirroot/srv/http/data/system/version )

dialog --colors --no-shadow --infobox "\n
\n
                  \Z1Create Image File\Z0\n
\n
                    RuneAudio+R $version
" 9 58
sleep 3

configfile=$dirboot/config.txt
if ! grep -q force_turbo $configfile; then
	model=4
elif ! grep -q hdmi_drive $configfile; then
	model=2-3
else
	model=0-1
fi
imagefile=RuneAudio+R_$version-RPi$model.img.xz

dialog --colors --yesno "\n
Confirm partitions:\n
\n
$( mount | awk '/dev\/sd.*\/BOOT/ {print "\\Z1"$1"\\Z0 "$2" \\Z1"$3"\\Z0"}' )\n
$( mount | awk '/dev\/sd.*\/ROOT/ {print "\\Z1"$1"\\Z0 "$2" \\Z1"$3"\\Z0"}' )\n
" 10 50

(( $? == 1 )) && exit

clear

banner 'Shrink ROOT partition ...'

partsize=$( fdisk -l $part | awk '/^Disk/ {print $2" "$3}' )
used=$( df -k | grep $part | awk '{print $3}' )

umount -l -v ${dev}*
e2fsck -fy $part

partinfo=$( tune2fs -l $part )
blockcount=$( awk '/Block count/ {print $NF}' <<< "$partinfo" )
freeblocks=$( awk '/Free blocks/ {print $NF}' <<< "$partinfo" )
blocksize=$( awk '/Block size/ {print $NF}' <<< "$partinfo" )

sectorsize=$( sfdisk -l $dev | awk '/Units/ {print $8}' )
startsector=$( fdisk -l $dev | grep $part | awk '{print $2}' )

usedblocks=$(( blockcount - freeblocks ))
targetblocks=$(( usedblocks * 105 / 100 ))
Kblock=$(( blocksize / 1024 ))
newsize=$(( ( targetblocks + Kblock - 1 ) / Kblock * Kblock ))
sectorsperblock=$(( blocksize / sectorsize  ))
endsector=$(( startsector + newsize * sectorsperblock ))

# shrink filesystem to minimum
resize2fs -fp $part $(( newsize * Kblock ))K

parted $dev ---pretend-input-tty <<EOF
unit
s
resizepart
2
$endsector
Yes
quit
EOF

banner 'Create compressed image file ...'

dd if=$dev bs=512 iflag=fullblock count=$endsector | nice -n 10 xz -9 --verbose --threads=0 > $imagefile

byte=$( stat --printf="%s" RuneAudio+R_$version-RPi$model.img.xz )
gb=$( awk "BEGIN { printf \"%.1f\n\", $byte / 1024 / 1024 }" )

dialog --colors --msgbox "\n
Image file created:\n
\n
\Z1$imagefile\Z0\n
$gb GB\n
\n
BOOT and ROOT unmounted.
" 12 50
