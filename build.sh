emcc -Os -o main.js -g -DSTB_VORBIS_NO_INTEGER_CONVERSION -DSTB_VORBIS_NO_STDIO \
     -s WASM=1 \
     -s EXPORTED_FUNCTIONS='["_stb_vorbis_decode_memory_float"]' \
     -s EXTRA_EXPORTED_RUNTIME_METHODS='["ccall","cwrap"]' \
     -s ALLOW_MEMORY_GROWTH=1 \
     stb_vorbis.c
go run genwasmjs.go < main.wasm > pre.js
cat pre.js main.js post.js > /tmp/stbvorbis.js
uglifyjs /tmp/stbvorbis.js > ./build/stbvorbis.js
