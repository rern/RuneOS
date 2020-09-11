#!/bin/bash

title='Create Arch Linux Arm'
optbox=( --colors --no-shadow --no-collapse )
opt=( --backtitle "$title" ${optbox[@]} )

dialog "${optbox[@]}" --msgbox "
\Z1Insert micro SD card\Z0

(Re-insert if already inserted.)

" 0 0

sd=$( dmesg -T | tail | grep ' sd .*GB' )
dev=/dev/$( echo $sd | awk -F'[][]' '{print $4}' )
detail=$( echo $sd | sed 's/ sd /\nsd /; s/\(\[sd.\]\) /\1\n/; s/\(blocks\): /\1\n/' )

dialog "${optbox[@]}" --yesno "
Confirm micro SD card: \Z1$dev\Z0

Detail:
$detail

" 0 0

[[ $? != 0 ]] && exit

# 1. create partitions: gparted
# 2. dump partitions table for script: sfdisk -d /dev/sdx | grep '^/dev' > runepartitions
# setup partitions
umount -l ${dev}*
sfdisk $dev < runepartitions

mkdir -p /mnt/{BOOT,ROOT}
mount ${dev}1 /mnt/BOOT
mount ${dev}2 /mnt/ROOT

bash <( wget -qO - https://github.com/rern/RuneOS/raw/master/create-alarm.sh )
