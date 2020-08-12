#!/bin/bash

devmount=$( mount | awk '/dev\/sd.*\/ROOT/ {print $1" "$2" "$3}' )
[[ -z $devmount ]] && echo No \e[36mROOT\e[m partiton mounted. && exit

yesno "Confirm partition: $devmount"

dialog --colors --yesno "\n
Confirm partition:\n
\n
\Z1$devmount\Z0\n
" 9 50

[[ $? == 0 ]] && exit

part=$( cut -d' ' -f1 <<< $devmount )
dev=${part:0:-1}
partnum=${part: -1}

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

resize2fs -fp $part $(( newsize * Kblock ))K

parted $dev unit s resizepart $partnum $endsector yes

sync
