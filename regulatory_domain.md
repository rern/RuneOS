### Wireless Relulatory Domain

```sh
# fetch country codes
wget -qO- https://git.kernel.org/pub/scm/linux/kernel/git/sforshee/wireless-regdb.git/plain/db.txt \
    | awk -F '[ :]' '/^country/ {print $2}'

# list
codes="\
AT
Austria
AU
Australia
BE
Belgium
BR
Brazil
CA
Canada
CH
Switzerland
CN
China
CY
Cyprus
CZ
Czech Republic
DE
Germany
DK
Denmark
EE
Estonia
ES
Spain
FI
Finland
FR
France
GB
United Kingdom
GR
Greece
HK
Hong Kong
HU
Hungary
ID
Indonesia
IE
Ireland
IL
Israel
IN
India
IS
Iceland
IT
Italy
JP
Japan
KR
Republic of Korea
LT
Lithuania
LU
Luxembourg
LV
Latvia
MY
Malaysia
NL
Netherlands
NO
Norway
NZ
New Zealand
PH
Philippines
PL
Poland
PT
Portugal
SE
Sweden
SG
Singapore
SI
Slovenia
SK
Slovak Republic
TH
Thailand
TW
Taiwan
US
United States of America
ZA
South Africa
"
```
