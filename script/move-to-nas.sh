#!/bin/sh
SOURCE="/mnt/nas"
DEST="/mnt/nas-biometrics"
ROOTDIR="/consultation-app/script"
LOGDIR="$ROOTDIR/logs"
TODAY=$(date '+%d-%m-%Y')
LOGFILE="$LOGDIR/move-$TODAY.log"

mkdir -p "$SOURCE" "$DEST" "$ROOTDIR" "$LOGDIR"

echo "  Starting NAS Video Move Script: $(date)" | tee -a "$LOGFILE"
echo "----------------------------------------" | tee -a "$LOGFILE"

if [ ! -d "$SOURCE" ]; then
  echo "❌ Source folder not found: $SOURCE" | tee -a "$LOGFILE"
  exit 1
fi

for folder in "$SOURCE"/*; do
  [ -d "$folder" ] || continue

  folder_name=$(basename "$folder")
  target_folder="$DEST/$folder_name"

  echo "  Processing folder: $folder_name" | tee -a "$LOGFILE"

  mkdir -p "$target_folder"

  find "$folder" -type f -name "*.webm" -exec mv -v {} "$target_folder"/ \; | tee -a "$LOGFILE"

  echo "✅ Moved files to: $target_folder" | tee -a "$LOGFILE"
done

echo "✅✅ All videos moved successfully to NAS at $DEST" | tee -a "$LOGFILE"
