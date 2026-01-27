#!/bin/bash

# -------- Pastebin-Lite Code Dump Script --------
# Dumps all project source files into a single text file

OUTPUT="CODEDUMP.txt"

echo "Creating code dump..."

echo "===== PROJECT TREE =====" > $OUTPUT
tree . -I 'node_modules|dist|.git|pastebin.db' >> $OUTPUT
echo -e "\n\n" >> $OUTPUT

dump_file () {
  echo "===== FILE: $1 =====" >> $OUTPUT
  sed 's/\t/  /g' "$1" >> $OUTPUT
  echo -e "\n\n" >> $OUTPUT
}

# Backend files
for file in backend/*.js backend/*.json backend/*.sql; do
  if [ -f "$file" ]; then
    dump_file "$file"
  fi
done

# Frontend root files
for file in frontend/*.js frontend/*.json frontend/*.html frontend/*.md frontend/*.config.js; do
  if [ -f "$file" ]; then
    dump_file "$file"
  fi
done

# Frontend src files
find frontend/src -type f \( -name "*.jsx" -o -name "*.js" -o -name "*.css" \) | while read file; do
  dump_file "$file"
done

# Root README
if [ -f README.md ]; then
  dump_file README.md
fi

echo "Done. Output saved to $OUTPUT"

