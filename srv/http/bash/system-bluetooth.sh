#!/bin/bash

bluetoothctl system-alias "$( cat /srv/http/data/system/hostname )"
bluetoothctl pairable on
sleep 1
bluetoothctl discoverable on
bluetoothctl discoverable-timeout 0
