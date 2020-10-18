#!/bin/bash
clear
echo -e "\e[38;5;6m$( < /etc/motd.logo )\e[0m
R+R $( cat /srv/http/data/system/version )"
printf "\e[38;5;45m%*s\e[0m\n" $( tput cols ) | tr ' ' -
