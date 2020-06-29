### Custom Package Repo
On  Windows
- Manage advanced sharing settings > All Networks - Turn off password protection sharing
- Share `Git` - read-write for Everyone
```sh
updateRepo() {
    read -n 1 -p "Arch: 6=armv6h 7=armv7h ? " arch
    echo
    read -n 1 -p "Local IP - 192.168.1.9: y/n ? " ip
    echo
    if [[ $ip == y ]]; then
        ip=192.168.1.9
    else
        read -p "Local IP: 192.168.1." ip
        ip=192.168.1.$ip
    fi
    mkdir -p /mnt/Git
    mount -t cifs //$ip/Git /mnt/Git
	currentdir=$( pwd )
    cd /mnt/Git/rern.github.io/armv${arch}h
    rm RR*
    repo-add RR.db.tar.xz *.xz
	cd "$currentdir"
    umount -l /mnt/Git
    rmdir /mnt/Git
}
updateRepo
```
- Push to `rern.github.io/armv7h`
