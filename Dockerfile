FROM trzeci/emscripten-upstream:sdk-tag-1.39.16-64bit

RUN apt-get update && \
        apt-get install -y \
        wget \
        nodejs \
        npm && \
        rm -rf /var/lib/apt/lists/*

# Install npm
RUN npm install -g uglify-js@3.9.4

WORKDIR /work
