RuneOS - DIY RuneAudio+R e
---
- For all **Raspberry Pi**: Zero, 1, 2, 3 and 4 (3+: not yet tested but should work)
- Create **RuneAudio+R e** from [**Arch Linux Arm**](https://archlinuxarm.org/about/downloads) latest releases.
- Interactive interface by [**Dialog**](https://invisible-island.net/dialog/)
- With option to pre-configure Wi-Fi connection (headless mode)
- With options to exclude features, it can be as light as possible in terms of build time and disk space.

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
- Linux PC (or Linux in VirtualBox on Windows with network set as `Bridge Adapter`)
	- GParted and Files app (normally already installed)
	- Basic skill of terminal command line
- Raspberry Pi
- Network connection to Raspberry Pi 
	- Wired LAN
	- Optional: Wi-Fi (if necessary)
- Micro SD card: 4GB+ for `BOOT` + `ROOT` partitions
- Optional: Micro SD card + USB drive (run RuneAudio+R from USB drive)
	- Micro SD card: 100MB+ for `BOOT` partition only
	- USB drive: 4GB+ for `ROOT` partition (or USB hard drive with existing data)
	- For hard drives or faster-than-SD-card thumb drives
- Optional: Monitor/TV to see boot process
---

### Prepare partitions
- On Linux PC

**Micro SD card only**
- Insert micro SD card
- Open **GParted** app
- `Unmount` > `Delete` all partitions (make sure it's the micro SD card)
- Create partitions:

| No. | Size        | Type    | Format | Label |
|-----|-------------|---------|--------|-------|
| #1  | 100MiB      | primary | fat32  | BOOT  |
| #2  | (the rest)  | primary | ext4   | ROOT  |
	
**Optional: Micro SD card + USB drive**
- Micro SD card
	- `Unmount` > `Delete` all partitions (Caution: make sure it's the SD card)
	- Format: `fat32`
	- Label: `BOOT`
- USB drive
	- Blank drive:
		- `Unmount` > `Delete` all partitions (Caution: make sure it's the USB drive)
		- Size: 4000MiB (the rest - another partition for storage)
		- Format: `ext4`
		- Label: `ROOT`
	- Drive with existing data:
		- No need to reformat or change format of existing partition
		- Resize the existing to get 4000MiB unallocated space (anywhere - at the end, middle or start of the disk)
		- Create a new partition in the new 4000MiB space
			- Format: `ext4`
			- Label: `ROOT`

### Create Arch Linux Arm
- Open **Files** app 
- Click `BOOT` and `ROOT` to mount
- Hover mouse over `BOOT` and `ROOT` and note the paths
```sh
# switch user to root
su

# get script and run
wget -qN https://github.com/rern/RuneOS/raw/master/usr/local/bin/create-alarm.sh; chmod +x create-alarm.sh; ./create-alarm.sh
```
- Errors or too slow download: press `Ctrl+C` and run `./create-alarm.sh` again
- Follow instructions until PC to Raspberry Pi connection is up.
- At connecting propmt: confirm `yes` and password `alarm`

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
