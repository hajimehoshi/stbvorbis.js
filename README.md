# stbvorbis.js

A JavaScript port of [stb_vorbis.c](https://github.com/nothings/stb).

## Usage

Install [Docker](https://www.docker.com/) and run `build.sh`.

Copy `build/stbvorbis.js` to your file server and load it via a script tag.

This library uses WebAssembly. If you want to use stbvorbis.js at browsers that do not support WebAssembly (e.g. iOS 9 Safari), copy `build/stbvorbis_asm.js` to the same directory as `build/stbvorbis.js` so that asm.js version is used as fallback.

## API

### `decode`

```
stbvorbis.decode(buf: ArrayBuffer|Uint8Array, callback: function(Object)): Promise
```

`decode` decodes the given Ogg/Vorbis data and returns a promise.

The given callback is called when decoding proceeded or error happens. The argument is an object that has these keys:

| name | description |
| --- | --- |
| `data`       | An array of `Float32Array` that represents decoded stream for each channel. |
| `sampleRate` | Rhe sample rate like 44100. |
| `eof`        | True if the stream ends, otherwise false. |
| `error`      | An error string if exists, otherwise null. |
