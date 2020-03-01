#!/bin/bash

[[ -n $1 ]] && wlan=$1 || wlan=wlan0

ifconfig $wlan up

netctllist=$( netctl list | grep -v eth | sed 's/^\s*\**\s*//' )
if [[ -n $netctllist ]]; then
	readarray -t netctllist_ar <<<"$netctllist"
	# pre-scan saved profile to force display hidden ssid
	for name in "${netctllist_ar[@]}"; do
		grep -q '^Hidden=yes' "/etc/netctl/$name" && iwlist $wlan scan essid "$name" &> /dev/null
	done
fi

connectedssid=$( iwgetid $wlan -r )

iwlistscan=$( iwlist wlan0 scan | \
	grep '^\s*Qu\|^\s*En\|^\s*ES\|WPA' | \
	sed 's/^\s*//; s/Quality.*level\| dBm *\|En.*:\|ES.*://g; s/IE: .*\/\(.*\) .* .*/\1/' | \
	tr '\n' ' ' | \
	sed 's/=/\n/g' |
	sort )
iwlistscan=${iwlistscan:1} # remove leading \n
readarray -t line <<<"$iwlistscan"
for line in "${line[@]}"; do
	line=( $line )
	dbm=${line[0]}
	encrypt=${line[1]}
	ssid=${line[2]//\"}
	ssid=${ssid/\\x00}
	[[ ${line[3]:0:3} == WPA ]] && wpa=wpa || wpa=
	if [[ -n $netctllist ]]; then
		for name in "${netctllist_ar[@]}"; do
			[[ $ssid == $name ]] && profile=$netctllist_ar || profile=
		done
	fi
	if [[ $ssid == $connectedssid ]]; then
		connected=1
		gw_ip=( $( ip r | grep "default.*$wlan" | awk '{print $3" "$9}' ) )
		gw=${gw_ip[0]}
		ip=${gw_ip[1]}
	else
		connected=
		gw=
		ip=
	fi
	list+=',{"dbm":"'$dbm'","ssid":"'$ssid'","encrypt":"'$encrypt'","wpa":"'$wpa'","wlan":"'$wlan'","profile":"'$profile'","connected":"'$connected'","gateway":"'$gw'","ip":"'$ip'"}'
done

list=${list//\\/\\\\} # escape backslashes

echo [${list:1}] # 'remove leading ,
