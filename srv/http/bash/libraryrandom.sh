#!/bin/bash

while :; do
	mpc idle player

	counts=$( mpc | grep '\[playing\]' | cut -d' ' -f2 | tr -d '#' )
	pos=$( echo $counts | cut -d/ -f1 )
	total=$( echo $counts | cut -d/ -f2 )

	if (( $(( total - pos )) < 2 )); then
		length=$( mpc listall | wc -l )
		mpc add "$( mpc listall | sed "$(( 1 + RANDOM % $length ))q;d" )"
	fi

done
