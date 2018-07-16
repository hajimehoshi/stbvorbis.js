docker build -t hajimehoshi/stbvorbis.js-local:latest .
docker run -t --rm -v $(pwd):/work hajimehoshi/stbvorbis.js-local:latest /bin/bash genjs.sh
