#!/bin/bash

# accesspoint
if [[ -e /usr/bin/hostapd ]]; then
	hostapd=$( systemctl -q is-active hostapd && echo true || echo false )
	ssid=$( grep ssid= /etc/hostapd/hostapd.conf | cut -d= -f2 )
	passphrase=$( grep '^wpa_passphrase' /etc/hostapd/hostapd.conf | cut -d'=' -f2 )
	hostapdip=$( grep router /etc/dnsmasq.conf | cut -d',' -f2 )
	list+='{"ssid":"'$ssid'","passphrase":"'$passphrase'","hostapdip":"'$hostapdip'","hostapd":'$hostapd'},'
fi

ipa=$( ip a | sed '/lo:/,/inet6/ d' | grep -v 'inet6\|valid' | \
	sed 's/.: \(.*\): .*state\(.*\) group.*/\1\2/; s/^ *\| brd.*//g; s/\/ether//; s/\/.*//' )
readarray -t lines <<<"$ipa"
iL=${#lines[@]}
for (( i=0; i < iL; i++ )); do
	line=${lines[i]}
	ini=${line:0:4}
	if [[ $ini == link ]]; then
		mac=${line:5}
		# patch no link (ip) lines
		nextline=${lines[i+1]}
		[[ ${nextline:0:4} != inet ]] && list+='{"interface":"'$interface'","state":"'$state'","mac":"'$mac'"},'
	elif [[ $ini == inet ]]; then
		ip=${line:5}
		route=( $( ip r | grep "default.*$interface.*dhcp" | sed 's/.*via \(.*\) dev.*proto \(.*\) src.*/\1 \2/' ) )
		gateway=${route[0]}
		dhcp=$( [[ ${route[1]} == dhcp ]] && echo true || echo false )
		if [[ $ip != $hostapdip ]]; then
		    [[ ${interface:0:-1} == wlan && $state == UP ]] && ssid=$( iwgetid $interface -r ) || ssid=
		fi
	list+='{"interface":"'$interface'","state":"'$state'","ip":"'$ip'","ssid":"'$ssid'","gateway":"'$gateway'","dhcp":'$dhcp',"mac":"'$mac'"},'
	else
		interface=${line/ *}
		state=${line/* }
	fi
done

list+='"'$( cat /srv/http/data/tmp/reboot 2> /dev/null )'"'
list=${list//\\/\\\\} # escape backslashes

echo [${list}]
