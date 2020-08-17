### Procedure

- Create Arch Linux Arm
- Create RuneAudio+R
- Reset RuneAudio+R
- Shrink RuneAudio+R

```sh
# Linux ##################################################
pacman-mirrors -c <COUNTRY>

wget -qO create-alarm.sh https://github.com/rern/RuneOS/raw/master/usr/local/bin/create-alarm.sh; chmod +x create-alarm.sh; ./create-alarm.sh

# after connected to RPi
nano /etc/pacman.d/mirrorlist

createa-rune.sh

# after reboot
ssh root@<RPI IP>

wget -qO - https://github.com/rern/RuneOS/raw/master/resetforimage.sh | sh

# Linux ##################################################
wget -qO - https://github.com/rern/RuneOS/raw/master/sdshrink.sh | sh

# Windows ##################################################
# Win32 Disk Imager - Read only allocated partitions > Read
```
