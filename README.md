# stbvorbis.js

A JavaScript port of [stb_vorbis.c](https://github.com/nothings/stb).

## API

### `initialize`

```
stbvorbis.initialize(): Promise
```

`initialize` initializes this library. `initialize` must be called once before the usage of this library.

`initialize` returns a promise that is resolved when initialization is done.

### `decode`

```
stbvorbis.decode(buf: ArrayBuffer|Uint8Array): Promise
```

`decode` decodes the given Ogg/Vorbis data and returns a promise.

The promise result includes `data` field and `sampleRate` field. `data` is an array of `Float32Array` that represents decoded stream for each channel. `sampleRate` represents the sample rate like 44100.

`decode` throws an exception when decoding fails.
