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
read -p 'Select SD card: /dev/sd' -n1 x
[[ -z $x ]] && echo No device selected. && exit

dev=/dev/sd$x

echo
read -p "Confirm SD card: $dev"$'\n[y/n]' -n1 yn
[[ $yn != y ]] && exit

# 1. create partitions: gparted
# 2. dump partitions table for script: sfdisk -d /dev/sdx | grep '^/dev' > runepartitions
# setup partitions
umount -l ${dev}*
sfdisk $dev < runepartitions

mkdir -p /mnt/{BOOT,ROOT}
mount ${dev}1 /mnt/BOOT
mount ${dev}2 /mnt/ROOT

bash <( wget -qO - https://github.com/rern/RuneOS/raw/master/create-alarm.sh )
