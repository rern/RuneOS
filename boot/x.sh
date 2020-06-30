#!/bin/bash
rm $0
(( $( sfdisk -F /dev/mmcblk0 | head -n1 | awk '{print $6}' ) == 0 )) && exit
echo -e "d\n\nn\n\n\n\n\nw" | fdisk /dev/mmcblk0 &>/dev/null
partprobe /dev/mmcblk0
resize2fs /dev/mmcblk0p2
