#!/bin/bash

lines=$( nmblookup -S WORKGROUP | sed -n '/^Looking/ {N;p}' )
readarray -t lines <<<"$lines"
for line in "${lines[@]}"; do
	if [[ ${line:0:7} == Looking ]]; then
		ip=$( echo $line | awk '{print $NF}' )
	elif [[ ${line:0:8} != 'No reply' ]]; then
		host=$( echo $line | awk '{print $1}' )
		shares=$( echo '' | smbclient -L "$host" | grep '^\s\+.*Disk' | grep -v '\$' | awk '{print $1}' )
		readarray -t shares <<<"$shares"
		for share in "${shares[@]}"; do
			list+='{"host":"'$host'","ip":"'$ip'","share":"'$share'"}\n'
		done
	fi
done

list=$( echo -e "${list:0:-2}"| sort ) # already remove last \n
list=${list//\\/\\\\} # escape backslashes

echo "[$list]" # 'sort' already convert to array
