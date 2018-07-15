# stbvorbis.js

A JavaScript port of [stb_vorbis.c](https://github.com/nothings/stb).

## Usage

Import `build/stbvorbis.js` with `<script>`.

This library uses Web Assembly. If you want to use this library into the browsers that does not support Web Assembly (e.g. iOS Safari 8-10), locate `build/stbvorbis_asm.js` in the same directory as `build/stbvorbis.js`.

## API

### `decode`

```
stbvorbis.decode(buf: ArrayBuffer|Uint8Array): Promise
```

`decode` decodes the given Ogg/Vorbis data and returns a promise.

The promise result includes `data` field and `sampleRate` field. `data` is an array of `Float32Array` that represents decoded stream for each channel. `sampleRate` represents the sample rate like 44100.

The promise is rejected when decoding is failed.
