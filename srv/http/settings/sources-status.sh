#!/bin/bash

# mounted partitions and remote shares
targets=$( df --output=target | grep /mnt/MPD/ )
if [[ -n $targets ]]; then
	readarray -t targets <<<"$targets"
	for target in "${targets[@]}"; do
		source=$( df --output=source "$target" | tail -1 )
		sources+=( "$source" )
		size=$( df -h --output=used,size "$target" | tail -1 | awk '{print $1"B/"$2"B"}' )
		[[ "${target:0:12}" == /mnt/MPD/USB ]] && icon=usbdrive || icon=network
		result+="<li data-mountpoint=\"$target\"><i class=\"fa fa-$icon\"></i>$target<a class=\"green\">&ensp;&bull;&ensp;</a><gr>$source</gr>&ensp;$size</li>\n"
	done
fi

# not mounted partitions
sources=$( fdisk -lo device | grep ^/dev/sd )
if [[ -n $sources ]]; then
	for source in $sources; do
		if ! df --output=source | grep -q $source; then
			label=$( udevil info $source | grep '^  label' | awk '{print $NF}' )
			mountpoint="/mnt/MPD/USB/$label"
			result+="<li data-mountpoint=\"$mountpoint\" data-source=\"$source\" data-unmounted=\"1\"><i class=\"fa fa-usbdrive\"></i>"
			result+="<gr>$mountpoint</gr><a class=\"red\">&ensp;&bull;&ensp;</a>$source</li>\n"
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
			result+="<li data-mountpoint=\"$mountpoint\" data-source=\"$source\" data-unmounted=\"1\"><span><i class=\"fa fa-network\"></i>"
			result+="<gr>$mountpoint</gr><a class=\"red\">&ensp;&bull;&ensp;</a>$source</span><i class=\"fa fa-minus-circle remove\"></i></li>\n"
		fi
	done
fi

printf -- "$result"
