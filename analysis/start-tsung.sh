#!/usr/bin/bash

RED='\033[0;31m'
NC='\033[0m' # No Color

# check presence of tsung DTD in /usr/local/share/tsung
TSUNG_DTD_DIR="/usr/local/share/tsung"
TSUNG_DTD="tsung-1.0.dtd"

if [[ ! -f $TSUNG_DTD_DIR"/"$TSUNG_DTD ]]
then
    >&2 echo -e "${RED}ERROR:${NC} file \`$TSUNG_DTD\` not found in your system."
    echo "Please copy it from your local tsung installation into "$TSUNG_DTD_DIR":"
    echo "    cp <tsung_dir>/"$TSUNG_DTD $TSUNG_DTD_DIR"/"
    exit 1
fi

if [[ $# < 1 ]]
then
    >&2 echo -e "${RED}ERROR:${NC} no configuration file provided for tsung"
    echo "Please provide a configuration file as first argument:"
    echo "    $0 <config_file>"
    exit 1
fi

# launch tsung
SCRIPT=$1
tsung -f $SCRIPT start


# run this script in the directory containing the logs of the run
# $ perl <tsung_dir>/src/tsung_stats.pl
