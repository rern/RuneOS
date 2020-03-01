#!/bin/bash

dirfile="$1" 

# get coverfile
[[ -d "$dirfile" ]] && dir="$dirfile" || dir=$( dirname "$dirfile" ) 
covers='cover.jpg cover.png folder.jpg folder.png front.jpg front.png Cover.jpg Cover.png Folder.jpg Folder.png Front.jpg Front.png'
for cover in $covers; do
	coverfile="$dir/$cover"
	if [[ -e "$coverfile" ]]; then
		mimetype=${coverfile##*.}
		echo "data:image/$mimetype;base64,$( base64 "$coverfile" )"
		exit
	fi
done

# get embedded
tmpfile=/srv/http/data/tmp/coverart
kid3-cli -c "select \"$dirfile\"" -c "get picture:$tmpfile"
if [[ -e $tmpfile ]]; then
	mimetype=$( file -b --mime-type $tmpfile )
	echo "data:$mimetype;base64,$( base64 $tmpfile )" # echo base64
	rm "$tmpfile"
fi
