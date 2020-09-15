#!/bin/bash

create() {
	bash <( wget -qO - https://github.com/rern/RuneOS/raw/master/create.sh )
}
reset() {
	bash <( wget -qO - https://github.com/rern/RuneOS/raw/master/reset.sh )
}
image() {
	bash <( wget -qO - https://github.com/rern/RuneOS/raw/master/imagecreate.sh )
}
repo
	bash <( wget -qO - https://github.com/rern/RuneOS/raw/master/repoupdate.sh )
}
