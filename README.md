# stbvorbis.js

A JavaScript port of [stb_vorbis.c](https://github.com/nothings/stb).

## Usage

Install [Docker](https://www.docker.com/) and run `build.sh`.

Copy `build/stbvorbis.js` to your file server and load it via a script tag.

This library uses WebAssembly. If you want to use stbvorbis.js at browsers that do not support WebAssembly (e.g. iOS 9 Safari), copy `build/stbvorbis_asm.js` to the same directory as `build/stbvorbis.js` so that asm.js version is used as fallback.

## API

### `decode`

```
stbvorbis.decode(buf: ArrayBuffer|Uint8Array, callback: function(event: Object))
```

`decode` decodes the given Ogg/Vorbis data.

The given callback is called when decoding proceeded or error happens. The argument is an object that has these keys:

| name | description |
| --- | --- |
| `data`       | An array of `Float32Array` that represents decoded stream for each channel. |
| `sampleRate` | The sample rate like 44100. |
| `eof`        | True if the stream ends, otherwise false. If this is true, `data` is null. |
| `error`      | An error string if exists, otherwise null. |

### `decodeStream`

```
stbvorbis.decodeStream(callback: function(event: Object)): function(event: Object)
```

`decodeStream` decodes the given Ogg/Vorbis stream.

The given callback is called when decoding proceeded or error happens. The argument is an object that has these keys:

| name | description |
| --- | --- |
| `data`       | An array of `Float32Array` that represents decoded stream for each channel. |
| `sampleRate` | The sample rate like 44100. |
| `eof`        | True if the stream ends, otherwise false. If this is true, `data` is null. |
| `error`      | An error string if exists, otherwise null. |

The returned function is used to push input strem. The argument is an object that has these keys:

| name | description |
| --- | --- |
| `data` | `ArrayBuffer` or `Uint8Array` that represents encoded stream. |
| `eof`  | True if the stream ends, otherwise false. If this is true, `data` is ignored. |
