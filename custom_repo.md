### Custom Package Repo
On  Windows
- Manage advanced sharing settings > All Networks - Turn off password protection sharing
- Share `Git` - read-write for Everyone
```sh
updateRepo() {
    read -n 1 -p $'\nArch: \e[36m6\e[0m=armv6h \e[36m7\e[0m=armv7h ? ' arch
    [[ $arch != 6 && $arch != 7 ]] && echo -e "\nWrong Arch." && updateRepo && return
    read -n 1 -p $'\nLocal IP - 192.168.1.9: \e[36my\e[0m/n ? ' ip
    if [[ $ip != n ]]; then
        ip=192.168.1.9
    else
        read -p "Local IP: 192.168.1." ip
        [[ -z $ip ]] && echo -e "\nNo IP." && updateRepo && return
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
