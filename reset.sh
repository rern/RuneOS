#!/bin/bash

optbox=( --colors --no-shadow --no-collapse )

dialog "${optbox[@]}" --infobox "

                   \Z1Reset RuneAudio+R\Z0
                          for
                      Image File				   
" 9 58
sleep 3

routerip=$( ip r get 1 | head -1 | cut -d' ' -f3 )
subip=${routerip%.*}.

rpiip=$( dialog "${optbox[@]}" --output-fd 1 --inputbox "
\Z1Raspberry Pi IP:\Z0
" 0 0 $subip )

sshpass -p rune ssh -t -o StrictHostKeyChecking=no root@$rpiip 'bash <( wget -qO - https://github.com/rern/RuneOS/raw/master/imagereset.sh )'
