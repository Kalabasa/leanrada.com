#!/usr/bin/env fish

set -l allowed "Orientation ImageWidth ImageHeight ThumnailOffset ThumbnailLength XResolution YResolution ResolutionUnit ColorSpace BitsPerSample Compression PhotometricInterpretation SamplesPerPixel ExifVersion SubfileType Copyright"

find $argv -type f \
  -not -path "*/node_modules/*" \
  -not -path "*/.git/*" \
  -exec sh -c '
    for file do
      meta=$(exiftool -s -EXIF:all -XMP:all "$file" | sed -e "s/^\([[:alnum:]]*\).*/\1/g" | grep -vE "$(echo '$allowed' | tr " " "|")")
      if [ -n "$meta" ]; then
          wipe_params=$(echo $meta | sed "s/\([[:alnum:]]*\)/-\1=/g" | tr "\n" " ")
          echo exiftool $wipe_params -overwrite_original "$file"
          exiftool $wipe_params -XMP:all= -overwrite_original "$file"
      fi
    done
  ' bash \{\} +
