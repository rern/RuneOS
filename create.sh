#!/bin/bash

optbox=( --colors --no-shadow --no-collapse )

dialog "${optbox[@]}" --infobox "

               \Z1Partition Micro SD Card\Z0
                          for
                    Arch Linux Arm
" 9 58
sleep 3

mounts=$( mount | awk '/dev\/sd.*\/BOOT/ || /dev\/sd.*\/ROOT/ {print $1" "$2" "$3}' )
if [[ -n $mounts ]]; then
	dialog "${optbox[@]}" --yesno "
\Z1Unmount partitions?\Z0

$mounts

" 0 0
	[[ $? != 0 ]] && exit
	
	mounts=( $( echo "$mounts" | cut -d' ' -f1 ) )
	for mnt in "${mounts[@]}"; do
		umount -l $mnt
	done
fi

dialog "${optbox[@]}" --msgbox "
\Z1Insert micro SD card\Z0

If already inserted:
For proper detection, remove and reinsert again.

" 0 0

sd=$( dmesg -T | tail | grep ' sd .* logical blocks' )
[[ -z $sd ]] && sleep 2 && sd=$( dmesg -T | tail | grep ' sd .* logical blocks' )

if [[ -z $sd ]]; then
	dialog "${optbox[@]}" --infobox "
\Z1No SD card found.\Z0

" 0 0
	exit
fi

dev=/dev/$( echo $sd | awk -F'[][]' '{print $4}' )
detail=$( echo $sd | sed 's/ sd /\nsd /; s/\(\[sd.\]\) /\1\n/; s/\(blocks\): (\(.*\))/\1\n\\Z1\2\\Z0/' )

dialog "${optbox[@]}" --yesno "
Confirm micro SD card: \Z1$dev\Z0

Detail:
$detail

Caution:
Make sure this is the target SD card.
\Z1All data on this device will be deleted.\Z0

" 0 0

[[ $? != 0 ]] && exit

# 1. create default partitions: gparted
# 2. dump partitions table for script: sfdisk -d /dev/sdx | grep '^/dev' > alarm.sfdisk
# setup partitions
umount -l ${dev}*
wget -qO - https://github.com/rern/RuneOS/raw/master/alarm.sfdisk | sfdisk $dev

devboot=${dev}1
devroot=${dev}2

mkfs -t vfat $devboot
mkfs -F -t ext4 $devroot
fatlabel $devboot BOOT
e2label $devroot ROOT

mkdir -p /mnt/{BOOT,ROOT}
mount $devboot /mnt/BOOT
mount $devroot /mnt/ROOT

bash <( wget -qO - https://github.com/rern/RuneOS/raw/master/create-alarm.sh )
