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

(Re-insert if already inserted.)

" 0 0

sd=$( dmesg -T | tail | grep ' sd .*GB' )
dev=/dev/$( echo $sd | awk -F'[][]' '{print $4}' )
detail=$( echo $sd | sed 's/ sd /\nsd /; s/\(\[sd.\]\) /\1\n/; s/\(blocks\): /\1\n/' )

dialog "${optbox[@]}" --yesno "
Confirm micro SD card: \Z1$dev\Z0

Detail:
$detail

\Z1All data on this device will be deleted.\Z0

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
