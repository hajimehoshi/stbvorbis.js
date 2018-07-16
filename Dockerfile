FROM apiaryio/emcc:1.37

RUN apt-get clean
RUN apt-get update
RUN apt-get -qq update

# Install Go
RUN apt-get install -y wget
RUN wget -O go.tar.gz https://dl.google.com/go/go1.10.3.linux-amd64.tar.gz && \
    tar -C /usr/local -xzf go.tar.gz
ENV PATH "/usr/local/go/bin:${PATH}"

# Install npm
RUN apt-get install -y nodejs npm
RUN npm install -g uglify-js@3.4.4

WORKDIR /work
