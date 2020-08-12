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
[[ -z $devmount ]] && echo No \e[36mROOT\e[m partition mounted. && exit

yesno "Confirm partition: \e[36m$devmount\e[m"
[[ $yesno != 1 ]] && exit

targetpart=$( cut -d' ' -f1 <<< $devmount )
dev=${targetpart:0:-1}

umount -l -v $targetpart
e2fsck -fy $targetpart

partinfo=$( tune2fs -l $targetpart )
myblockcount=$( awk '/Block count/ {print $NF}' <<< "$partinfo" )
myfreeblocks=$( awk '/Free blocks/ {print $NF}' <<< "$partinfo" )
myblocksize=$( awk '/Block size/ {print $NF}' <<< "$partinfo" )
mysectorsize=$( sfdisk -l $dev | awk '/Units/ {print $8}' )
mystartsector=$( fdisk -l $dev | grep $targetpart | awk '{print $2}' )

myusedblocks=$(( $myblockcount - $myfreeblocks ))
mytargetblocks=$(( $myusedblocks * 108 / 100 ))
KBperblock=$(( $myblocksize / 1024 ))
mynewpartsize=$(( ( $mytargetblocks + $KBperblock - 1 ) / $KBperblock * $KBperblock ))

sectorsperblock=$(( $myblocksize / $mysectorsize  ))
mynewendpoint=$(( $mystartsector + $mynewpartsize * $sectorsperblock ))

resize2fs -fp $targetpart $(( $mynewpartsize * $KBperblock ))K
# NB, the -s switch does not work, putting Yes after the command is the work around.
parted $dev unit s resizepart ${targetpart: -1} ${mynewendpoint} yes
sync

#------------------------------------------------------------------------------
#  June 2016 raspi-img
#
#  Script to backup and restore Raspberry Pi SD card images on a computer
#  running GNU/Linux. DO NOT run this script on the Pi itself!
#
#  Backup:
#  Calculates the minimum size of the sd card, and then resizes filesystem
#  and partition.
#  Subsequently creates an image of the relevant partitions space, compressing
#  it on the fly using xz compression algorithms.
#
#  Restore:
#  Decompresses .img, .xz, .gz and .zip files and copies them to the SD card.
#  The file system should be expanded using raspi-config.
#
#  Initial script, backup part and all math magic by abracadabricx,
#  restore part and compression support by Kalle Friedrich
#------------------------------------------------------------------------------
#  "THE BEER-WARE LICENSE" (Revision 42):
#  <kalle@friedrich.xyz> and <abracadabricx> wrote this file. As long as you
#  retain this notice you can do whatever you want with this stuff. If we meet
#  some day, and you think this stuff is worth it, you can buy us a beer in
#  return.
#------------------------------------------------------------------------------
# variables
#------------------------------------------------------------------------------
BACKUP_PATH=~/Downloads/rpi # Where do your backups go?
COMPRESSION=6 # Accepts values between 0 (fast) and 9 (low filesize)
DEFAULT_BLK=sdb # Where does your SD-Card usually show up?
#------------------------------------------------------------------------------
# script begins here
#------------------------------------------------------------------------------
function calcMiB()
{
   # Calculate size in MiB, for easier reading.
   local partsizeblocks=$1
   local KBperblock=$2
   local partsizeKiB=$(( ${partsizeblocks} * ${KBperblock} ))
   local quotientMiB="$(( (${partsizeblocks} * ${KBperblock}) / 1024 ))"
   local modulusMiB=$(( ($partsizeKiB - ($quotientMiB * 1024))*1000/1024))
   local modulusMiB2="$(( (${partsizeblocks} % ${KBperblock}) / 1024))"
   echo "${quotientMiB},${modulusMiB} MiB."
}
#------------------------------------------------------------------------------
# ensure that xz is installed
#------------------------------------------------------------------------------
echo "Raspberry Pi Backup/Restore Script"
echo ""
if ! type "xz"; then
  read -e -p "This script requires xz compression utilities. Would you like to install [1] or abort [2]? " -i "1" yninstall

  if [[ "$yninstall" == "1" ]]; then
    if type "apt-get"; then
      sudo apt-get install xz-utils
    elif type "pacman"; then
      sudo pacman -S xz
    elif type "zypper"; then
      sudo zypper install xz
    elif type "yum"; then
      sudo yum install xz
    else
      printf "Can't detect your package manager. Please install the xz package manually and run this script again."
      exit
    fi
  fi
fi

#------------------------------------------------------------------------------
# restore
#------------------------------------------------------------------------------
read -e -p "Would you like to backup [1] or restore [2] your SD card? " -i "1" backuprestore

# since the default is '1', an input of '12' means the user's intent is probably to restore rather than backup
if [[ "$backuprestore" == "2" ]] || [[ "$backuprestore" == "12" ]]; then
  echo -e "The following filesystems have been found:"
  lsblk
  echo "Please select the SD card to restore to."
  read -e -p "Which blockdevice: " -i "${DEFAULT_BLK}" myblkdev

  echo -e "\nThe following backups have been found in $BACKUP_PATH"
  PS3='Please enter a number: '
  COLUMNS=12
  select file in $(find $BACKUP_PATH -type f | sort | sed "s#$BACKUP_PATH/##g"); do
    echo -e "\nYou have selected \e[1m$file\e[21m"
    read -e -p "Continue [1] or go back [2]: " -i "1" correct
    if [[ "$correct" == "1" ]]; then
# unmount partitions
      if grep -s "${myblkdev}" /proc/mounts; then
         echo -e "\nStart unmounting partitions"
         sudo umount -v "/dev/${myblkdev}"? # Questionmark is wildcard.
      fi
# execute action based on file extension
      exttest=$(basename "$file")
      ext="${exttest##*.}"
# raw image files get dd'ed directly
      if [[ "$ext" == "img" ]]; then
        sudo dd status=progress bs=4M if="$BACKUP_PATH/$file" of="/dev/$myblkdev"
        sync
        echo -e "\nAll done!"
        break
# xz files
      elif [[ "$ext" == "xz" ]]; then
        xz --verbose --decompress --threads=0 --stdout "$BACKUP_PATH/$file" | sudo dd status=none bs=4M of="/dev/$myblkdev"
        echo -e "\nWriting cache to device, please wait..."
        sync
        echo -e "\nAll done!"
        break
# zip files
      elif [[ "$ext" == "zip" ]]; then
        unzip -vp "$BACKUP_PATH/$file" | sudo dd status=progress bs=4M of="/dev/$myblkdev"
        echo -e "\nWriting cache to device, please wait..."
        sync
        echo -e "\nAll done!"
        break
# gzip files
      elif [[ "$ext" == "gz" ]]; then
        gunzip --keep --stdout "$BACKUP_PATH/$file" | sudo dd status=progress bs=4M of="/dev/$myblkdev"
        echo -e "\nWriting cache to device, please wait..."
        sync
        echo -e "\nAll done!"
        break
# wicked stuff
      else
        echo "Cannot recognize file format. Please provide a file ending in .xz, .img, .zip or .gz in "$BACKUP_PATH""
        exit
      fi
    fi
  done

  echo -e "\nBoot your Pi and run \e[1mraspi-config\e[21m to expand your file system again."
  exit
fi
#------------------------------------------------------------------------------
# resize
#------------------------------------------------------------------------------
# check which drive is the sd card:
echo "The following filesystems have been found:"
lsblk
echo "Please select the SD card to backup from."
read -e -p "Which blockdevice: " -i "${DEFAULT_BLK}" myblkdev
read -e -p "Which partition do you want to shrink: " -i "2" targetpartnr
targetpart="${myblkdev}${targetpartnr}"

# Unmount directories, otherwise online shrinking from resize2fs would be
# required but this throws an error.
if grep -s "${myblkdev}" /proc/mounts
then
   echo "Start unmounting partitions"
   sudo umount -v "/dev/${myblkdev}"? # Questionmark is wildcard.
fi

# Check the filesystem/partition.
sudo e2fsck -fy "/dev/${targetpart}"

myblockcount=$(sudo tune2fs -l "/dev/${targetpart}" | grep 'Block count' | awk '{print $3}')
myfreeblocks=$(sudo tune2fs -l "/dev/${targetpart}" | grep 'Free blocks' | awk '{print $3}')
myblocksize=$(sudo tune2fs -l "/dev/${targetpart}" | grep 'Block size' | awk '{print $3}')
mysectorsize=$(sudo sfdisk -l "/dev/${myblkdev}" | grep Units | awk '{print $8}')
mystartsector=$(sudo fdisk -l "/dev/${myblkdev}" | grep "${targetpart}" | awk '{print $2}')

# Calculate the smallest partition size, in blocks.
myusedblocks=$(( $myblockcount - $myfreeblocks ))
# Calculate target partion size, adding a bit of margin, about 8%.
mytargetblocks=$(( $myusedblocks + ($myusedblocks * 2 / 25) ))

# Calculate KiB per block to aid further calculation in KiB's:
if (( "${myblocksize}" >= "1024" ))
then
   KBperblock=$(( $myblocksize/1024 ))
else
   echo "Blocksize is awkward: ${myblocksize}. Not sure what to do, stopping."
   exit
fi

# Round up new part size to multiple of blocksize to facilitate creation.
mynewpartsize=$(( (($mytargetblocks + $KBperblock-1) / $KBperblock) * $KBperblock ))

# Calculate and print the existing data and target partition size.
echo ""
echo "The size of the data on partion /dev/${targetpart} is \
$( calcMiB ${myusedblocks} ${KBperblock} )"
echo ""
echo "The new size of partion /dev/${targetpart} will be \
$( calcMiB ${mytargetblocks} ${KBperblock} )"
echo ""

# Calculate multiplier from sector size to block size
sectorsperblock=$(( $myblocksize/$mysectorsize  ))
# Calculate end point in sectors, that is what fdisk requires.
mynewendpoint=$(( $mystartsector + ($mynewpartsize * $sectorsperblock) ))

# Start execution:
# Resize the filesystem, values in 1024 bytes, see the "K" at the end.
# Example, if blocksize was 4096, nr of blocks x 4 is the resize value.
sudo resize2fs -fp "/dev/${targetpart}" $(( $mynewpartsize * $KBperblock ))K
# Resize partion, to make matters complicated values are in sector sizes.
# NB, the -s switch does not work, putting Yes after the command is the work around.
sudo parted "/dev/${myblkdev}" unit s resizepart "${targetpartnr}" "${mynewendpoint}" yes
sync
#------------------------------------------------------------------------------
# backup
#------------------------------------------------------------------------------
read -e -p "Backup the resized image? [Y/N] " -i "Y" backupchoice

if [[ "${backupchoice}" =~ ^([yY][eE][sS]|[yY])$ ]]
then
  mkdir -p ${BACKUP_PATH}
  echo ""
  read -e -p "Filename :" -i "$(date +"%Y-%m-%d")_raspbianbackup" Pibackupname
  echo ""
  sudo dd if="/dev/${myblkdev}" bs=512 iflag=fullblock count="${mynewendpoint}" | nice -n 10 xz -"${COMPRESSION}" --verbose --threads=0 > "${BACKUP_PATH}"/"${Pibackupname}".img.xz
  echo ""
  echo "Backup succesful."
  echo ""
  echo "$(xz --list "${BACKUP_PATH}"/"${Pibackupname}".img.xz)"
  echo -e "\nBoot your Pi and run \e[1mraspi-config\e[21m to expand your file system again."
fi
exit
