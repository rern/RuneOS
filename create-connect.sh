#!/bin/bash

title='Connect to Raspberry Pi'
opt=( --backtitle "$title" --colors --no-shadow )
# scan ip
routerip=$( ip r get 1 | head -1 | cut -d' ' -f3 )
subip=${routerip%.*}.
scanIP() {
	dialog "${opt[@]}" --infobox "
Scan IP address ...
" 5 50
	nmap=$( nmap -sn $subip* | grep -v 'Starting\|Host is up\|Nmap done' | head -n -1 | tac | sed 's/$/\\n/; s/Nmap.*for/IP :/; s/MAC Address/\\nMAC/' | tr -d '\n' )
	dialog "${opt[@]}" --msgbox "
\Z1Find IP address of Raspberry Pi:\Z0
(Raspberri Pi 4 may listed as Unknown)
\Z4[arrowdown] = scrolldown\Z0
$nmap
" 50 100

	dialog "${opt[@]}" --ok-label Yes --extra-button --extra-label Rescan --cancel-label No --yesno "\n
\Z1Found IP address of Raspberry Pi?\Z0
" 7 38
	ans=$?
	if [[ $ans == 3 ]]; then
		scanIP
	elif [[ $ans == 1 && -n $rescan ]]; then
		dialog "${opt[@]}" --msgbox "
Try starting over again.
" 0 0
		clear && exit
	fi
}
scanIP

if [[ $ans == 1 ]]; then
	dialog "${opt[@]}" --yesno "
\Z1Connect with Wi-Fi?\Z0
" 0 0
	if [[ $? == 0 ]]; then
		rescan=1
		dialog "${opt[@]}" --msgbox "
- Power off
- Connect wired LAN
- Power on
- Wait 30 seconds
- Press Enter to rescan
" 0 0
		scanIP
	else
		dialog "${opt[@]}" --msgbox "
- Power off
- Connect a monitor/TV
- Power on and observe errors
- Try starting over again
" 0 0
		clear && exit
	fi
fi

# connect RPi
rpiip=$( dialog "${opt[@]}" --output-fd 1 --cancel-label Rescan --inputbox "
\Z1Raspberry Pi IP:\Z0
" 0 0 $subip )
[[ $? == 1 ]] && scanIP

file=~/.ssh/known_hosts
sed -i "/$rpiip/ d" $file
ssh-keyscan -t ecdsa -H $rpiip | sed 's/.*ecdsa/'$rpiip' ecdsa/' >> $file

clear

ssh root@$rpiip
