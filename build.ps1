docker run -t --rm -v "$(pwd):/work" "$(docker build -q .)" /bin/bash genjs.sh
