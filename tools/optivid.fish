#!/usr/bin/env fish

if test (count $argv) -lt 2
    echo "Usage: optimize_video input.mp4 output.mp4"
    return 1
end

set input $argv[1]
set output $argv[2]

ffmpeg -i $input -c:v libx264 -preset slow -crf 23 -c:a aac -b:a 128k -movflags +faststart $output
