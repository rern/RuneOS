### Procedure

- Create Arch Linux Arm
- Create RuneAudio+R
- Reset RuneAudio+R
- Shrink RuneAudio+R

```sh
# Linux ##################################################
wget -qO - create-alarm.sh https://github.com/rern/RuneOS/raw/master/usr/local/bin/create-alarm.sh | sh

# after connected to RPi
sed -i '/^Server/ s/\(mirror\)/sg.\1/' /etc/pacman.d/mirrorlist
createa-rune.sh

# after reboot
ssh root@<RPI IP>

wget -qO - https://github.com/rern/RuneOS/raw/master/resetforimage.sh | sh

# Linux ##################################################
# after click mount BOOT and ROOT
wget -qO - https://github.com/rern/RuneOS/raw/master/imagefile.sh | sh
```
