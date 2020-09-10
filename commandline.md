```sh
# find sd card
fdisk -l | grep 'Disk /dev'

sdx=sdX

# existing partition
mkfs -t vfat /dev/${sdx}1
mkfs -t ext4 /dev/${sdx}2

# set label
fatlabel /dev/${sdx}1 BOOT
e2label /dev/${sdx}2 ROOT

# mount
mkdir -p /mnt/{BOOT,ROOT}
mount /dev/${sdx}1 /mnt/BOOT
mount /dev/${sdx}2 /mnt/ROOT

# create arch linux arm
bash <( wget -qO - https://github.com/rern/RuneOS/raw/master/create-alarm.sh )
```
