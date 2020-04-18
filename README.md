RuneOS - DIY RuneAudio+R e
---
- For all **Raspberry Pi**: Zero, 1, 2, 3 and 4
- Create **RuneAudio+R e** from latest releases of [**Arch Linux Arm**](https://archlinuxarm.org/about/downloads)
- Interactive interface
- Options:
	- Run `ROOT` partition on USB drive
	- Run on USB only - no SD card ([boot from USB](https://www.raspberrypi.org/documentation/hardware/raspberrypi/bootmodes/msd.md))
	- Pre-configure Wi-Fi connection (headless mode)
	- Exclude features (can be as light as possible in terms of build time and disk space)

**Procedure**
- Prepare partitions
- Create **Arch Linux Arm**
	- Verify partitions
	- Optional - pre-configure Wi-Fi
	- Download and verify
	- Write `BOOT` and `ROOT` partitions
	- Connect PC to Raspberry Pi
- Create **RuneAudio+R e**
	- Select features:
		- Avahi - URL as: runeaudio.local`
		- Bluez - Bluetooth support
		- Chromium - Browser on RPi (Not available for RPi Zero and 1 - too much for CPU)
		- FFmpeg - [Extended decoders](https://github.com/rern/RuneOS/blob/master/ffmpeg.md)
		- hostapd - RPi access point
		- Kid3 - Metadata tag editor
		- Python - Programming language
		- Samba - File sharing
		- Shairport-sync - AirPlay
		- upmpdcli - UPnP
	- Upgrade kernel and default packages
	- Install feature packages and web interface
	- Configure
	- Set default settings

**Need**
- PC
	- Linux - any distro
	- or Linux on USB e.g., [Manjaro](https://itsfoss.com/create-live-usb-manjaro-linux/) - Arch Linux
	- or Linux in VirtualBox on Windows (with network set as `Bridge Adapter`)
- Raspberry Pi
- Network connection to Raspberry Pi 
	- Wired LAN
	- Optional: Wi-Fi (if necessary)
- Media:
	- Option 1: Micro SD card: 4GB+ for `BOOT` + `ROOT` partitions
	- Option 2: Micro SD card + USB drive (`ROOT` partition on USB drive)
		- Micro SD card: 100MB+ for `BOOT` partition only
		- USB drive: 4GB+ for `ROOT` partition (or USB hard drive with existing data)
	- Option 3: USB drive only - no SD card (Boot from USB drive)
		- Raspberry Pi 3 and 2 v1.2 only (4 not yet supported)
		- USB drive: 4GB+ for `BOOT` + `ROOT` partition
	- Note for USB drive:
		- Suitable for hard drives or faster-than-SD-card thumb drives.
		- It takes less than 20 minutes for the whole process with a decent download speed.
		- Boot from USB drive:
			- Suitable for solid state drives.
			- Normal hard drive needs external power, e.g., powered USB hub, to have it spin up 5+ seconds before boot.
			- Boot takes 10+ seconds longer (detect no sd card > read boot loader into memory > boot)
---

### Prepare partitions
- On Linux PC
- Open **GParted** app (Manjaro root password: `manjaro`)
- 3 Alternatives:
	- Micro SD card only
	- Micro SD card + USB drive
	- USB drive only

**Alternative 1: Micro SD card only**
- `Unmount` > `Delete` all partitions (make sure it's the micro SD card)
- Create partitions:

| No. | Size        | Type    | Format | Label |
|-----|-------------|---------|--------|-------|
| #1  | 100MiB      | primary | fat32  | BOOT  |
| #2  | (the rest)  | primary | ext4   | ROOT  |
	
**Alternative 2: Micro SD card + USB drive**
- Micro SD card
	- `Unmount` > `Delete` all partitions (Caution: make sure it's the SD card)
	- Create a partition:

| No. | Size        | Type    | Format | Label |
|-----|-------------|---------|--------|-------|
| #1  | 100MiB      | primary | fat32  | BOOT  |

- USB drive - Blank:
	- `Unmount` > `Delete` all partitions (Caution: make sure it's the USB drive)
	- Create partitions:
	
| No. | Size        | Type    | Format | Label |
|-----|-------------|---------|--------|-------|
| #1  | 3500MiB     | primary | ext4   | ROOT  |
| #2  | (the rest)  | primary | ext4   | (any) |
	
- or USB drive - with existing data:
	- No need to reformat or change format of existing partition
	- Resize the existing to get 3500MiB unallocated space (anywhere - at the end, middle or start of the disk)
	- Create a partition in the space:
		
| No.   | Size        | Type    | Format | Label |
|-------|-------------|---------|--------|-------|
| (any) | (existing)  | primary | (any)  | (any) |
| (any) | 3500MiB     | primary | ext4   | ROOT  |
			
**Alternative 3: USB drive only**

- Enable boot from USB: [Set boot bit](https://www.raspberrypi.org/documentation/hardware/raspberrypi/bootmodes/msd.md) (Micro SD card can still be used as usual if inserted.)
- Create partitions: (Drive with existing data must be resized and rearranged respectively.)

| No. | Size        | Type    | Format | Label |
|-----|-------------|---------|--------|-------|
| #1  | 100MiB      | primary | fat32  | BOOT  |
| #2  | 3500MiB     | primary | ext4   | ROOT  |
| #3  | (the rest)  | primary | ext4   | (any) |

---
	
### Create Arch Linux Arm
- Open **Files** app (**File Manager** on Manjaro)
- Click `BOOT` and `ROOT` to mount
- Note each path in location bar or hover mouse over `BOOT` and `ROOT` for confirmation
```sh
# switch user to root
su

# on Manjaro only - update package list
# specific servers by country (list: grep -i COUNTRY /etc/pacman.d/mirrorlist)
pacman-mirrors -c COUNRTY
# if not listed, rank all servers: pacman-mirrors -f

# get script and run
wget -qO create-alarm.sh https://github.com/rern/RuneOS/raw/master/usr/local/bin/create-alarm.sh; chmod +x create-alarm.sh; ./create-alarm.sh
```
- Errors or too slow download: press `Ctrl+C` and run `./create-alarm.sh` again
- Follow instructions until PC to Raspberry Pi connection is up.
---

### Create RuneAudio+Re
```sh
# run script
create-rune.sh
```
- Errors or too slow download: press `Ctrl+C` and run `create-rune.sh` again
- Notification shows when finished.

### Known errors in boot log `journalctl -b`
- `Error: Driver 'sdhost-bcm2835' already registered` - not error just information
- `Error: bcm2708_fb soc:fb: ...` - on RPi 4 when no connected screen
---

### Optionals
- [**Create image file**](https://github.com/rern/RuneOS/blob/master/imagefile.md)  

- **Setup Wi-Fi auto-connect** for headless/no screen (if not set during build)
	- On Linux or Windows
	- Insert micro SD card
	- In `BOOT`
		- Open file `wifi0` with text editor
		- Replace `"NAME` and `PASSWORD` with ones for your Wi-Fi
		- If security of your Wi-Fi is `wep`, replace `wpa` as well.
		- Save as `wifi`
	- Move micro SD card to Raspberry Pi
	- Power on
