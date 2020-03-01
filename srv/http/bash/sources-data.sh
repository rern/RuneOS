#!/bin/bash

# mounted partitions and remote shares
dftarget=$( df --output=target | grep /mnt/MPD/ )
if [[ -n $dftarget ]]; then
	readarray -t mountpoints <<<"$dftarget"
	for mountpoint in "${mountpoints[@]}"; do
		source=$( df --output=source "$mountpoint" | tail -1 )
		size=$( df -h --output=used,size "$mountpoint" | tail -1 | awk '{print $1"B/"$2"B"}' )
		[[ "${mountpoint:0:12}" == /mnt/MPD/USB ]] && icon=usbdrive || icon=network
		list+='{"icon":"'$icon'","mountpoint":"'$mountpoint'","mounted":true,"source":"'$source'","size":"'$size'"},'
	done
fi

# not mounted partitions
sources=$( fdisk -lo device | grep ^/dev/sd )
if [[ -n $sources ]]; then
	for source in $sources; do
		if ! df --output=source | grep -q $source; then
			label=$( udevil info $source | grep '^  label' | awk '{print $NF}' )
			mountpoint="/mnt/MPD/USB/$label"
			list+='{"icon":"usbdrive","mountpoint":"'$mountpoint'","mounted":false,"source":"'$source'"},'
		fi
	done
fi

# not mounted remote shares
targets=$( grep '/mnt/MPD/NAS/' /etc/fstab | awk '{print $2}' )
if [[ -n $targets ]]; then
	for target in $targets; do
		mountpoint=${target//\\040/ }  # \040 > space
		if ! df --output=target | grep -q "$mountpoint"; then
			source=$( grep "${mountpoint// /.040}" /etc/fstab | awk '{print $1}' | sed 's/\\040/ /g' )
			list+='{"icon":"network","mountpoint":"'$mountpoint'","mounted":false,"source":"'$source'"},'
		fi
	done
fi

list+='"'$( cat /srv/http/data/tmp/reboot 2> /dev/null )'"'
list=${list//\\/\\\\} # escape backslashes

echo [${list}]
