#!/bin/bash

if (( $# == 0 )); then
	wget -qN --no-check-certificate https://github.com/rern/RuneAudio_Addons/raw/master/addons-list.php -O /tmp/addons-list.php
	file=/tmp/addons-list.php
else
	file=/srv/http/addons-list.php
fi

list=( $( grep -B2 "'version'" $file | grep -v 'title\|--' | sed "s/^\t*.*=> '\|' => \[\|'\|,//g" ) )

declare -A download
ilength=${#list[@]}
for (( i = 0; i < $ilength; i+= 2 )); do
	download[${list[i]}]=${list[i+1]}
done

diraddons=/srv/http/data/addons
files=$( ls $diraddons )

declare -A current
for file in $files; do
	[[ $file == update || -z $( cat $diraddons/$file ) || $( cat $diraddons/$file ) == 1 ]] && continue
	current[$file]=$( cat $diraddons/$file )
done

count=0;
for KEY in "${!current[@]}"; do
	[[ ${current[$KEY]} != ${download[$KEY]} ]] && (( count++ ))
done

if (( $count > 0 )); then
	echo $count > $diraddons/update
else
	rm -f $diraddons/update
fi
