### Existing partitions
```sh
su

setdev() {
    fdisk -l | grep 'Disk /dev' | cut -d, -f1
    read -p 'Select SD card: ' x
    dev=/dev/sd$x
}

mkfs -t vfat ${dev}1
mkfs -t ext4 ${dev}2
fatlabel ${dev}1 BOOT
e2label ${dev}2 ROOT

mkdir -p /mnt/{BOOT,ROOT}
mount ${dev}1 /mnt/BOOT
mount ${dev}2 /mnt/ROOT

bash <( wget -qO - https://github.com/rern/RuneOS/raw/master/create-alarm.sh )
```
