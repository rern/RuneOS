RuneOS - DIY RuneAudio+R e
---
- For all **Raspberry Pi**: Zero, 1, 2, 3 and 4 (3+: not yet tested but should work)
- Create **RuneAudio+R e** from [**Arch Linux Arm**](https://archlinuxarm.org/about/downloads) latest releases.
- Interactive interface by [**Dialog**](https://invisible-island.net/dialog/)
- Options:
	- Run `ROOT` partition on USB drive
	- Run on USB only - no SD card (boot from USB)
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

**Option 1: Micro SD card only**
- `Unmount` > `Delete` all partitions (make sure it's the micro SD card)
- Create partitions:

| No. | Size        | Type    | Format | Label |
|-----|-------------|---------|--------|-------|
| #1  | 100MiB      | primary | fat32  | BOOT  |
| #2  | (the rest)  | primary | ext4   | ROOT  |
	
**Option 2: Micro SD card + USB drive**
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
			
**Option 3: USB drive only**

- Set boot bit on Raspberry Pi (if not already set)
- 3+ already set
- Micro SD card can still be used to boot if inserted.
```sh
# on RuneAudio
echo program_usb_boot_mode=1 | sudo tee -a /boot/config.txt

# reboot
shutdown -r now

# verify boot bit = 17:3020000a
/opt/vc/bin/vcgencmd otp_dump | grep 17:
```

- Create partitions: (Drive with existing data must be resized and rearranged respectively.)

| No. | Size        | Type    | Format | Label |
|-----|-------------|---------|--------|-------|
| #1  | 100MiB      | primary | fat32  | BOOT  |
| #2  | 3500MiB     | primary | ext4   | ROOT  |
| #3  | (the rest)  | primary | ext4   | (any) |

---
	
### Create Arch Linux Arm
- Open **Files** app 
- Click `BOOT` and `ROOT` to mount
- Note each path for next confirmation
	- Manjaro - in location bar 
	- Others - hover mouse over `BOOT` and `ROOT`
```sh
# switch user to root
su

# get script and run
wget -qN https://github.com/rern/RuneOS/raw/master/usr/local/bin/create-alarm.sh; chmod +x create-alarm.sh; ./create-alarm.sh
```
- Errors or too slow download: press `Ctrl+C` and run `./create-alarm.sh` again
- Follow instructions until PC to Raspberry Pi connection is up.
- At connecting propmt: confirm `yes` and password `alarm`
---

### Create RuneAudio+Re
```sh
# switch user to root
su
# password: root

# run script
create-rune.sh
```
- Errors or too slow download: press `Ctrl+C` and run `create-rune.sh` again
- Notification shows when finished.

---

### Optional
[**Create image file**](https://github.com/rern/RuneOS/blob/master/imagefile.md)  

**Setup Wi-Fi auto-connect** (if not set during build)
- On Linux or Windows
- Insert micro SD card
- In `BOOT`
	- Open file `wifi0` with text editor
	- Replace `"NAME` and `PASSWORD` with ones for your Wi-Fi
	- If security of your Wi-Fi is `wep`, replace `wpa` as well.
	- Save as `wifi`
- Move micro SD card to Raspberry Pi
- Power on
