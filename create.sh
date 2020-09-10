#!/bin/bash

# Existing partitions
echo
echo Device list:
echo --------------------------------------
fdisk -l | grep 'Disk /dev' | cut -d, -f1
echo --------------------------------------
echo
read -p 'Select SD card: /dev/sd' x
dev=/dev/sd$x

mkdir -p /mnt/{BOOT,ROOT}
mount ${dev}1 /mnt/BOOT
mount ${dev}2 /mnt/ROOT

if [[ $( df -T ${dev}1 | tail -1 | awk '{print $2$3}' ) != vfat100M ]]; then
	echo ${dev}1 not BOOT partition
	exit
fi

umount -l ${dev}*
mkfs -t vfat ${dev}1
mkfs -t ext4 ${dev}2
fatlabel ${dev}1 BOOT
e2label ${dev}2 ROOT

mount ${dev}1 /mnt/BOOT
mount ${dev}2 /mnt/ROOT

bash <( wget -qO - https://github.com/rern/RuneOS/raw/master/create-alarm.sh )
