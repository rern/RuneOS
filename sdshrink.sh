#!/bin/bash

yesno() {
	echo
	echo -e "$1"
	echo -e '  \e[36m0\e[m No'
	echo -e '  \e[36m1\e[m Yes'
	echo
	echo -e '\e[36m0\e[m / 1 ? '
	read -n 1 answer
}

devmount=$( mount | awk '/dev\/sd.*\/ROOT/ {print $1" "$2" "$3}' )
[[ -z $devmount ]] && echo No \e[36mROOT\e[m partiton mounted. && exit

yesno "Confirm partition: $devmount"

[[ $answer != 1 ]] && exit

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
