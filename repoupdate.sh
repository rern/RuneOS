#!/bin/bash

rm $0

arch=$( dialog --colors --output-fd 1 --menu '\n\Z1Arch:\Z0' 8 30 0 \
	0 'armv6h' \
	1 'armv7h' )
[[ $arch == 0 ]] && arch=armv6h || arch=armv7h
ip=$( dialog --colors --output-fd 1 --inputbox "\n\Z1Local Git IP:\Z0" 10 30 192.168.1.9 )

mkdir -p /mnt/Git
mount -t cifs -o password= //$ip/Git /mnt/Git
currentdir=$( pwd )
cd /mnt/Git/rern.github.io/$arch

# index.html
html='<!DOCTYPE html>
<html>
<head>
	<meta charset="utf-8">
	<title>R+R Packages</title>
	<style>
		table { font-family: monospace; white-space: pre; border: none }
		td:last-child { padding-left: 10px; text-align: right }
	</style>
</head>
<body>
<table>
	<tr><td><a href="/">../</a></td><td></td></tr>'
pkg=( $( ls *.pkg.tar.xz ) )
sizedate=$( ls -lh *.pkg.tar.xz | cut -c24-40 )
readarray -t sizedate <<<"$sizedate"
pkgL=${#pkg[@]}
for (( i=1; i < $pkgL; i++ )); do
	pkg=${pkg[$i]}
	html+='
	<tr><td><a href="'$arch'/'$pkg'">'$pkg'</a></td><td>'"${sizedate[$i]}"'</td></tr>'
done
html+='
<table>
</body>
</html>'

echo -e "$html" > ../$arch.html

# recreate database
rm RR*
repo-add -R RR.db.tar.xz *.xz

cd "$currentdir"
umount -l /mnt/Git
rmdir /mnt/Git

dialog --colors --msgbox "\n         Done.\n\n" 8 30

clear
