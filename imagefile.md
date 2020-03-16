### Create image file

- Once start RuneAudio+R successfully

	- Optional for default image:
```sh
# remove MPD database (force auto rescan on initial startup)
systemctl restart mpd
rm /srv/http/data/mpd/mpd.db

# remove all connected Wi-Fi data
systemctl disable netctl-auto@wlan0
rm /etc/netctl/* /srv/http/data/system/netctl-* 2> /dev/null
```
- Power off or CLI: `shutdown -h now`

- Move micro SD card (and the USB drive, if `ROOT` partition is in USB drive) to PC
- Resize `ROOT` partition to smallest size possible with **GParted** app (smaller the size, less time to write image)
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
