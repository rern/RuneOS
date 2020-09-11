#!/bin/bash

optbox=( --colors --no-shadow --no-collapse )

dialog "${optbox[@]}" --infobox "

                  \Z1Create Image File\Z0\n

                      RuneAudio+R
" 9 58
sleep 3

col=$( tput cols )
banner() {
	echo
	def='\e[0m'
	bg='\e[44m'
    printf "$bg%*s$def\n" $col
    printf "$bg%-${col}s$def\n" "  $1"
    printf "$bg%*s$def\n" $col
}

dialog "${optbox[@]}" --msgbox "
\Z1Insert micro SD card\Z0

(Re-insert if already inserted.)

" 0 0

sd=$( dmesg -T | tail | grep ' sd .*GB' )
if [[ -z $sd ]]; then
	dialog "${optbox[@]}" --infobox "
\Z1No SD card found.\Z0
" 0 0
	exit
fi

dev=/dev/$( echo $sd | awk -F'[][]' '{print $4}' )
detail=$( echo $sd | sed 's/ sd /\nsd /; s/\(\[sd.\]\) /\1\n/; s/\(blocks\): /\1\n/' )

dialog "${optbox[@]}" --yesno "
Confirm micro SD card: \Z1$dev\Z0

Detail:
$detail

" 0 0

[[ $? != 0 ]] && exit

part=${dev}2
dirboot=/mnt/BOOT
dirroot=/mnt/ROOT

mount ${dev}1 $dirboot
mount $part $dirroot

if [[ $( df -Th $dirboot | tail -1 | awk '{print $2$3}' ) != vfat100M ]]; then
	echo $dev not RuneAudio+R
	umount -l ${dev}*
	exit
fi

configfile=$dirboot/config.txt
if ! grep -q force_turbo $configfile; then
	model=4
elif ! grep -q hdmi_drive $configfile; then
	model=2-3
else
	model=0-1
fi
imagefile=RuneAudio+R_$version-RPi$model.img.xz

banner 'Shrink ROOT partition ...'

partsize=$( fdisk -l $part | awk '/^Disk/ {print $2" "$3}' )
used=$( df -k | grep $part | awk '{print $3}' )

# auto expand root partition
wget https://github.com/rern/RuneOS/raw/master/x.sh -O /boot/x.sh

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

dialog "${optbox[@]}" --msgbox "
Image file created:

\Z1$imagefile\Z0
$gb GB

BOOT and ROOT unmounted.
" 12 50
