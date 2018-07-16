# stbvorbis.js

A JavaScript port of [stb_vorbis.c](https://github.com/nothings/stb).

## Usage

Install [Docker](https://www.docker.com/) and run `build.sh`.

Copy `build/stbvorbis.js` to your file server and load it via a script tag.

This library uses WebAssembly. If you want to use stbvorbis.js at browsers that do not support WebAssembly (e.g. iOS 9 Safari), copy `build/stbvorbis_asm.js` to the same directory as `build/stbvorbis.js` so that asm.js version is used as fallback.

## API

### `decode`

```
stbvorbis.decode(buf: ArrayBuffer|Uint8Array): Promise
```

`decode` decodes the given Ogg/Vorbis data and returns a promise.

The promise result includes `data` field and `sampleRate` field. `data` is an array of `Float32Array` that represents decoded stream for each channel. `sampleRate` represents the sample rate like 44100.

The promise is rejected when decoding is failed.
