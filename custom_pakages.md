### Custom Package Repo
On  Windows
- Manage advanced sharing settings > All Networks - Turn off password protection sharing
- Share `Git` - Everyone read-write
```sh
# mount Git
mkdir -p /mnt/Git
mount -t cifs //192.168.1.9/Git /mnt/Git
cd /mnt/Git/rern.github.io/armv7h

# remove existing
rm RR*

# recreate new db file
repo-add RR.db.tar.xz *.xz
```
*`armv6h` - for RPi 0-1
- Push to `rern.github.io/armv7h`
