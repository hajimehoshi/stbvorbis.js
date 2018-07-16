emcc -Os -o main.js -g -DSTB_VORBIS_NO_INTEGER_CONVERSION -DSTB_VORBIS_NO_STDIO \
     -s WASM=1 \
     -s EXPORTED_FUNCTIONS='["_stb_vorbis_decode_memory_float"]' \
     -s EXTRA_EXPORTED_RUNTIME_METHODS='["ccall","cwrap"]' \
     -s ALLOW_MEMORY_GROWTH=1 \
     main.c
go run genpre.go < main.wasm > pre.js
cat pre.js main.js post.js api.js > /tmp/stbvorbis.js
uglifyjs /tmp/stbvorbis.js > ./build/stbvorbis.js

emcc -Os -o asm.js -g -DSTB_VORBIS_NO_INTEGER_CONVERSION -DSTB_VORBIS_NO_STDIO \
     -s WASM=0 \
     -s EXPORTED_FUNCTIONS='["_stb_vorbis_decode_memory_float"]' \
     -s ALLOW_MEMORY_GROWTH=1 \
     --memory-init-file 0 \
     main.c
cat asm.js post.js > /tmp/stbvorbis_asm.js
uglifyjs /tmp/stbvorbis_asm.js > ./build/stbvorbis_asm.js
