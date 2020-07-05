### Wireless Relulatory Domain
Fetch country codes
```sh
wget -qO- https://git.kernel.org/pub/scm/linux/kernel/git/sforshee/wireless-regdb.git/plain/db.txt \
    | awk -F '[ :]' '/^country/ {print $2}'
```
