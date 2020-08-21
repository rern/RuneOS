#!/bin/bash

devmount=$( mount | awk '/dev\/sd.*\/ROOT/ {print $1" "$2" "$3}' )
dirboot=$( mount | awk '/dev\/sd.*\/BOOT/ {print $3}' )

[[ -z $dirboot ]] && notmount+='\Z1BOOT\Z0'
[[ -n $notmount ]] && notmount+=' and '
[[ -z $devmount ]] && notmount+='\Z1ROOT\Z0'

if [[ -n $notmount ]]; then
	dialog --colors --msgbox "\n
\Z1Warning:\Z0\n
\n
$notmount not mounted.\n
\n
" 0 0
	exit
fi

dialog --colors --no-shadow --infobox "\n
\n
                  \Z1Create Image File\Z0\n
\n
                     RuneAudio+R
" 9 58
sleep 3

mountpoint=$( cut -d' ' -f3 <<< $devmount )
version=$( cat $mountpoint/srv/http/data/system/version )
configfile=${mountpoint/ROOT/BOOT}/config.txt
if ! grep -q force_turbo $configfile; then
	model=4
elif ! grep -q hdmi_drive $configfile; then
	model=0-1
else
	model=2-3
fi
imagefile=RuneAudio+R_$version-RPi$model.img.xz

dialog --colors --yesno "\n
Confirm \Z1ROOT\Z0 partition:\n
\n
\Z1$devmount\Z0\n
" 9 50

[[ $? == 1 ]] && exit

part=$( cut -d' ' -f1 <<< $devmount )
dev=${part:0:-1}
partnum=${part: -1}

partsize=$( fdisk -l $part | awk '/^Disk/ {print $2" "$3}' )
used=$( df -k | grep $part | awk '{print $3}' )

umount -l -v $part
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
$partnum
$endsector
Yes
quit
EOF

partsizenew=$( fdisk -l $part | awk '/^Disk/ {print $3" GB"}' )
dialog --colors --msgbox "\n
\Z1ROOT\Z0 partition shrinked.\n
\n
$partsize to \Z1$partsizenew\Z0\n
\n
" 0 0

dd if=$dev bs=512 iflag=fullblock count=$endsector | nice -n 10 xz -9 --verbose --threads=0 > $imagefile

dialog --colors --msgbox "\n
Image file created:\n
\n
\Z1$imagefile\Z0\n
\n
" 0 0
