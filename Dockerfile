FROM apiaryio/emcc:1.38.11

RUN apt-get update && \
        apt-get install -y \
        wget \
        nodejs \
        npm && \
        rm -rf /var/lib/apt/lists/*

# Install Go
RUN wget -O go.tar.gz https://dl.google.com/go/go1.14.4.linux-amd64.tar.gz && \
        tar -C /usr/local -xzf go.tar.gz && \
        rm go.tar.gz
ENV PATH "/usr/local/go/bin:${PATH}"

# Install npm
RUN npm install -g uglify-js@3.9.4

WORKDIR /work
