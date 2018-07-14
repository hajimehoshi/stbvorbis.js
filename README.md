# stbvorbis.js

A JavaScript port of [stb_vorbis.c](https://github.com/nothings/stb).
Locate `build/stbvorbis.js` and `build/stbvorbis_worker_wasm.js` on the same directory, and import ONLY `stbvorbis.js` by `<script>`.

## API

### `decode`

```
stbvorbis.decode(buf: ArrayBuffer|Uint8Array): Promise
```

`decode` decodes the given Ogg/Vorbis data and returns a promise.

The promise result includes `data` field and `sampleRate` field. `data` is an array of `Float32Array` that represents decoded stream for each channel. `sampleRate` represents the sample rate like 44100.

The promise is rejected when decoding is failed.
