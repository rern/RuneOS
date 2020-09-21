#!/bin/bash

optbox=( --colors --no-shadow --no-collapse )

dialog "${optbox[@]}" --infobox "


                     \Z1RuneAudio+R\Z0

" 9 58
sleep 3

cmd=$( dialog "${optbox[@]}" --output-fd 1 --menu "
\Z1Command:\Z0
" 8 0 0 \
1 'Create RuneAudio+R' \
2 'Reset RuneAudio+R' \
3 'Image RuneAudio+R' \
4 'Package Repo Update' )

case $cmd in

create )
	bash <( wget -qO - https://github.com/rern/RuneOS/raw/master/create.sh )
	;;
reset )
	bash <( wget -qO - https://github.com/rern/RuneOS/raw/master/reset.sh )
	;;
image )
	bash <( wget -qO - https://github.com/rern/RuneOS/raw/master/imagecreate.sh )
	;;
repo )
	bash <( wget -qO - https://github.com/rern/RuneOS/raw/master/repoupdate.sh )
	;;

esac
