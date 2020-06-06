FROM apiaryio/emcc:1.38.11

RUN apt-get update && \
        apt-get install -y \
        wget \
        nodejs \
        npm && \
        rm -rf /var/lib/apt/lists/*

# Install npm
RUN npm install -g uglify-js@3.9.4

WORKDIR /work
