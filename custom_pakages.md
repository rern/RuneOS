### Custom Package Repo
On  Windows
- Manage advanced sharing settings > All Networks - Turn off password protection sharing
- Share `Git` - read-write for Everyone
```sh
# mount Git
mkdir -p /mnt/Git
mount -t cifs //192.168.1.9/Git /mnt/Git
cd /mnt/Git/rern.github.io/armv7h

# remove existing db files
rm RR*

# recreate new db files
repo-add RR.db.tar.xz *.xz

# unmount
umount -l /mnt/Git
```
*`armv6h` - for RPi 0-1
- Push to `rern.github.io/armv7h`
