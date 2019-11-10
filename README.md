# stbvorbis.js

A JavaScript port of [stb_vorbis.c](https://github.com/nothings/stb).

## Usage

Download files from [Releases](https://github.com/hajimehoshi/stbvorbis.js/releases). Copy `stbvorbis.js` and `stbvorbis_asm.js` to your file server and load `stbvorbis.js` via a script tag.

This library basically uses WebAssembly. stbvorbis.js also has asm.js implementation for environments where WebAssembly is not available. On iOS, stbvorbis.js always uses asm.js instead due to instability of iOS WebAssembly implementation. If `stbvorbis_asm.js` is in the same directory as `stbvorbis.js`, asm.js version works as fallback.

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
| `data`       | An array of `Float32Array` that represents decoded stream for each channel. The length can be more than or equal to 0. |
| `sampleRate` | The sample rate like 44100. |
| `eof`        | True if the stream ends, otherwise false. If this is true, `data` is null. |
| `error`      | An error string if exists, otherwise null. |

The returned function is used to push input strem. The argument is an object that has these keys:

| name | description |
| --- | --- |
| `data` | `ArrayBuffer` or `Uint8Array` that represents encoded stream. |
| `eof`  | True if the stream ends, otherwise false. If this is true, `data` is ignored. |

## Compile

Install [Docker](https://www.docker.com/) and run `build.sh` on Posix or `build.ps1` on Windows.
