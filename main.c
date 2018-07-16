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
  float** data = (float**)malloc(v->channels * sizeof(float*));
  if (data == NULL) {
    stb_vorbis_close(v);
    return -2;
  }
  for (int i = 0; i < v->channels; i++) {
    data[i] = (float*)malloc(total * sizeof(float));
    if (data[i] == NULL) {
      // TODO: Free allocated objects correctly?
      stb_vorbis_close(v);
      return -2;
    }
  }

  for (;;) {
    float* tmp[v->channels];
    for (int i = 0; i < v->channels; i++) {
      tmp[i] = data[i] + data_len;
    }
    int n = stb_vorbis_get_samples_float(v, v->channels, tmp, total-data_len);
    if (n == 0) {
      break;
    }
    data_len += n;
    if (data_len + limit > total) {
      total *= 2;
      for (int i = 0; i < v->channels; i++) {
        float* newData = (float*)realloc(data[i], total * sizeof(float));
        if (newData == NULL) {
          // TODO: Free allocated objects correctly?
          stb_vorbis_close(v);
          return -2;
        }
        data[i] = newData;
      }
    }
  }
  stb_vorbis_close(v);

  // Clamp the data not to cause noises.
  for (int i = 0; i < v->channels; i++) {
    float* samples = data[i];
    for (int j = 0; j < data_len; j++)  {
      float sample = samples[j];
      if (sample > 1.0f) {
        samples[j] = 1.0f;
      } else if (sample < -1.0f) {
        samples[j] = -1.0f;
      }
    }
  }

  *output = data;
  return data_len;
}
