**Raspberry Pi Hardware**

- code `EDCBBA=$( awk '/Revision/ {print $NF}' /proc/cpuinfo )`
	- `C=$( awk '/Revision/ {print $NF}' /proc/cpuinfo | cut -c3 )`
	- `BB=$( awk '/Revision/ {print $NF}' /proc/cpuinfo | cut -c4-5 )`
- example: `a22082` : 1GB - Embest - BCM2837 - Raspberry Pi 3B - revision 2

| Name       | code `BB` | no wl | no eth | SoC       | code `C` | 4 cores |
|------------|-----------|-------|--------|-----------|----------|---------|
| RPi Zero   | `09`      | x     | x      | BCM2835   | `0`      |         |
| RPi Zero W | `0c`      |       | x      | BCM2835   | `0`      |         |
| RPi B      | `00`      | x     |        | BCM2835   | `0`      |         |
| RPi A      | `00`      | x     | x      | BCM2835   | `0`      |         |
| RPi A+     | `01` `02` | x     | x      | BCM2835   | `0`      |         |
| RPi B+     | `01` `03` | x     |        | BCM2835   | `0`      |         |
|            |           |       |        |           |          |         |
| RPi 2B     | `04`      | x     |        | BCM2836   | `1`      | /       |
|            |           |       |        |           |          |         |
| RPi 2B 1.2 | `04`      | x     |        | BCM2837   | `2`      | /       |
| RPi 3B     | `08`      |       |        | BCM2837   | `2`      | /       |
|            |           |       |        |           |          |         |
| RPi 3A+    | `0e`      |       | x      | BCM2837B0 | `2`      | /       |
| RPi 3B+    | `0d`      |       |        | BCM2837B0 | `2`      | /       |
|            |           |       |        |           |          |         |
| RPi 4B     | `11`      |       |        | BCM2711   | `3`      | /       |

- `A` - PCB revision
- `BB` - model : `BB=$( awk '/Revision/ {print substr($NF, 4, 2)}' /proc/cpuinfo )`
- `C` - SoC
- `D` - manufacturer
	- `0` - Sony UK
	- `2` - Embest
	- `3` - Stadium
	- `5` - Sony Japan
- `E` - memory
	- `9` - 512KB
	- `a` - 1GB
	- `b` - 2GB
	- `c` - 4GB
- Model:
	- `A` - no ethernet
	- `B` - with ethernet
- Wi-Fi and Bluetooth
	- `[[ $BB =~ ^(08|0c|0d|0e|11)$ ]]`
- 3.5mm headphone output
	- None in Zero and Zero W
