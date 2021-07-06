#!/bin/bash
file="./build/flatten/$1"
echo "Generate flatten file in $file"
mkdir -p "${file%/*}" && touch "$file"
mkdir -p build/flatten/contracts && yarn truffle-flattener $1 > ./build/flatten/$1 2>&1