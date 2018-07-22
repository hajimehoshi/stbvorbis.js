# Copyright 2018 The stbvorbis.js Authors
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

mkdir -p build

emcc -Os -o main.js -g -DSTB_VORBIS_NO_INTEGER_CONVERSION -DSTB_VORBIS_NO_STDIO \
     -s WASM=1 \
     -s EXPORTED_FUNCTIONS='["_stb_vorbis_decode_memory_float"]' \
     -s EXTRA_EXPORTED_RUNTIME_METHODS='["ccall","cwrap"]' \
     -s ALLOW_MEMORY_GROWTH=1 \
     main.c
go run genpre.go < main.wasm > pre.js
cat pre.js main.js main2.js post.js > /tmp/stbvorbis.js
uglifyjs /tmp/stbvorbis.js > ./build/stbvorbis.js

emcc -Os -o main_asm.js -g -DSTB_VORBIS_NO_INTEGER_CONVERSION -DSTB_VORBIS_NO_STDIO \
     -s WASM=0 \
     -s EXPORTED_FUNCTIONS='["_stb_vorbis_decode_memory_float"]' \
     -s ALLOW_MEMORY_GROWTH=1 \
     -Wno-almost-asm \
     --memory-init-file 0 \
     main.c
cat main_asm.js main2.js > /tmp/stbvorbis_asm.js
uglifyjs /tmp/stbvorbis_asm.js > ./build/stbvorbis_asm.js
