# stbvorbis.js

A JavaScript port of [stb_vorbis.c](https://github.com/nothings/stb).

## Usage

Install [Docker](https://www.docker.com/) and run `build.sh` on Posix or `build.ps1` on Windows.

Copy `build/stbvorbis.js` to your file server and load it via a script tag.

This library uses WebAssembly. But wasm on iOS Safari is STILL unstable even if it is iOS 13 :sob: , so we fallbacked it asm.js on iOS. So, if you want to use stbvorbis.js on iOS, copy `build/stbvorbis_asm.js` to the same directory as `build/stbvorbis.js` so that asm.js version is used as fallback.

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
