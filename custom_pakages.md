### Custom Package Repo
- Create repo directory on Arch Linux Arm
- Copy all package files to repo directory
```sh
cd armv7h

# remove existing
rm RR*

# recreate new db file
repo-add RR.db.tar.xz *.xz
```
*`armv6h` - for RPi 0-1
- Upload to `rern.github.io/armv7h`
