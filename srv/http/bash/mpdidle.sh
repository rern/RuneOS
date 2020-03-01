#!/bin/bash

mpc idleloop | while read changed; do
	curl -s -X POST 'http://127.0.0.1/pub?id=idle' -d '{ "changed": "'"$changed"'" }'
done
