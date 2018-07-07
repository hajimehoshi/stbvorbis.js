// Copyright 2018 Hajime Hoshi
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

#include "stb_vorbis.c"

int stb_vorbis_decode_memory_float(const uint8 *mem, int len, int *channels, int *sample_rate, float ***output) {
  int error = 0;
  stb_vorbis* v = stb_vorbis_open_memory(mem, len, &error, NULL);
  if (v == NULL) {
    return -1;
  }
  int limit = v->channels * 4096;
  *channels = v->channels;
  if (sample_rate) {
    *sample_rate = v->sample_rate;
  }
  int data_len = 0;
  int offset = 0;
  int total = limit;
  float* data = (float*)malloc(total * sizeof(*data));
  if (data == NULL) {
    stb_vorbis_close(v);
    return -2;
  }
  for (;;) {
    // TODO: Not to use interleaved version.
    int n = stb_vorbis_get_samples_float_interleaved(v, v->channels, data+offset, total-offset);
    if (n == 0) {
      break;
    }
    data_len += n;
    offset += n * v->channels;
    if (offset + limit > total) {
      float* data2;
      total *= 2;
      data2 = (float*)realloc(data, total * sizeof(*data));
      if (data2 == NULL) {
        free(data);
        stb_vorbis_close(v);
        return -2;
      }
      data = data2;
    }
  }
  stb_vorbis_close(v);

  *output = (float**)malloc(v->channels * sizeof(float*));
  for (int i = 0; i < v->channels; i++) {
    (*output)[i] = (float*)malloc(data_len * sizeof(float));
  }
  for (int i = 0; i < data_len; i++) {
    for (int j = 0; j < v->channels; j++) {
      (*output)[j][i] = data[v->channels*i+j];
    }
  }
  free(data);

  return data_len;
}
