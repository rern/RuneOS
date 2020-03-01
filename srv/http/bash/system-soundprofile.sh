#!/bin/bash

hwcode=$( grep Revision /proc/cpuinfo | tail -c 4 | cut -c1-2 )

setConfig() {
	[[ -n $1 ]] && ip link set eth0 mtu $1
	[[ -n $2 ]] && ip link set eth0 txqueuelen $2
	[[ -n $3 ]] && sysctl vm.swappiness=$3
	sysctl kernel.sched_latency_ns=$4
}

if [[ ' 04 08 0d 0e 11 ' =~ $hwcode ]]; then # not RPi 1
	lat=( 4500000 3500075 1000000 2000000 3700000 1500000 145655 6000000 )
else
	lat=( 1500000 850000 500000 120000 500000 1500000 145655 6000000 )
fi

case $1 in
	#                     mtu  txq  sw lat
	RuneAudio ) setConfig ''   ''   0  ${lat[0]};;
	ACX )       setConfig ''   4000 0  ${lat[1]};;
	Orion )     setConfig 1000 4000 20 ${lat[2]};;
	OrionV2 )   setConfig 1000 4000 0  ${lat[3]};;
	Um3ggh1U )  setConfig ''   ''   0  ${lat[4]};;
	iqaudio )   setConfig 1000 4000 0  ${lat[5]};;
	berrynos )  setConfig 1000 4000 '' ${lat[6]};;
	default )   setConfig 1500 1000 60 18000000;;
	custom )    setConfig $2   $3   $4 $5;;
esac
