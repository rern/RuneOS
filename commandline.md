```sh
# find sd card
fdisk -l

# set partitions
# d - delete > (all)
# n - new > #1 - 100MB, #2 - (the rest)
fdisk /dev/sdX

# set label
fatlabel /dev/sdX1 BOOT
e2label /dev/sdX2 ROOT

# mount
mkdir -p /mnt/{BOOT,ROOT}
mount /dev/sdX1 /mnt/BOOT
mount /dev/sdX2 /mnt/ROOT

# create arch linux arm
wget -qO create-alarm.sh https://github.com/rern/RuneOS/raw/master/usr/local/bin/create-alarm.sh; chmod +x create-alarm.sh; ./create-alarm.sh
```
