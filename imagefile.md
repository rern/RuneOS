### Create image file

- Once started RuneAudio+R successfully
- SSH to RPi
```sh
ssh root@<RPI IP>
```
- Optional for default image:
	- reset mirror list
	- remove non-default files and journal logs
	- remove all connected Wi-Fi profile (if any)
	- fix dirty bits in BOOT partition
```sh
wget https://github.com/archlinuxarm/PKGBUILDs/raw/master/core/pacman-mirrorlist/mirrorlist -O /etc/pacman.d/mirrorlist

systemctl stop mpd
pacman -Scc --noconfirm
rm -f /srv/http/data/addons/expa
rm -f /srv/http/data/{bookmarks,coverarts,lyrics,mpd,playlists,webradios}/*
rm -rf /srv/http/data/tmp/*
echo 0 0 0 > /srv/http/data/system/mpddb
journalctl --rotate
journalctl --vacuum-time=1s

systemctl disable netctl-auto@wlan0
rm /etc/netctl/* /srv/http/data/system/netctl-* 2> /dev/null

fsck.fat -traw /dev/mmcblk0p1
rm -f /boot/FSCK*

shutdown -h now
```
- Power off

- Move micro SD card (and the USB drive, if `ROOT` partition is in USB drive) to PC
- Resize `ROOT` partition to smallest size possible with **GParted** app (smaller the size = smaller image file and less time to flash SD card)
	- menu: GParted > Devices > /dev/sd?
	- right-click `ROOT` partiton > Unmount
	- right-click `ROOT` partiton > Resize/Move
	- drag rigth triangle to fit minimum size
	- menu: Edit > Apply all operations
- Create image - **SD card mode**
	- on Windows (much faster): [Win32 Disk Imager](https://sourceforge.net/projects/win32diskimager/) > Read only allocated partitions
	- OR
```sh
# get device and verify
part=$( df | grep BOOT | awk '{print $1}' )
dev=${part:0:-1}
df | grep BOOT
echo device = $dev

# get partition end and verify
fdisk -u -l $dev
end=$( fdisk -u -l $dev | tail -1 | awk '{print $3}' )
echo end = $end

# create image
dd if=$dev of=RuneAudio+Re2.img count=$(( end + 1 )) status=progress  # remove status=progress if errors
```
- Create image - **USB drive mode**
	- Open **Disks** app - select drive > select partition > cogs button > Create Partition Image
		- Micro SD card
		- USB drive
