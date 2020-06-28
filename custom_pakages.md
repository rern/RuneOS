### Custom Package Repo
On  Windows
- Manage advanced sharing settings > All Networks - Turn off password protection sharing
- Share `Git` - read-write for Everyone
```sh
# $1 = `armv7h`, `armv6h`
updateDb() {
    read -n 1 -p "Arch: 6=armv6h 7=armv7h" arch
    read -n 1 -p "Local IP - 192.168.1.9: y/n" ip
    if [[ $ip == y ]]; then
        ip=192.168.1.9
    else
        read -p "Local IP: " ip
    fi
    mkdir -p /mnt/Git
    mount -t cifs //$ip/Git /mnt/Git
    cd /mnt/Git/rern.github.io/$arch
    rm RR*
    repo-add RR.db.tar.xz *.xz
    umount -l /mnt/Git
    rmdir /mny/Git
}
updateDb
```
- Push to `rern.github.io/armv7h`
