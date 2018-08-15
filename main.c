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
  stb_vorbis* v = NULL;
  int tmp_len = 32;
  while (!v && tmp_len < len) {
    int tmp_consumed = 0;
    int error = 0;
    v = stb_vorbis_open_pushdata(mem, tmp_len, &tmp_consumed, &error, NULL);
    if (error == VORBIS_need_more_data) {
      tmp_len += 32;
      continue;
    }
    if (error) {
      return -1;
    }
    mem += tmp_consumed;
    len -= tmp_consumed;
  }

  *channels = v->channels;
  if (sample_rate) {
    *sample_rate = v->sample_rate;
  }

  float** data = (float**)malloc(v->channels * sizeof(float*));
  if (data == NULL) {
    stb_vorbis_close(v);
    return -2;
  }
  for (int i = 0; i < v->channels; i++) {
    data[i] = NULL;
  }
  int data_len = 0;
  int data_cap = 0;

  for (;;) {
    int tmp_len = 32;
    float** output = NULL;
    int samples = 0;
  retry:
    if (tmp_len > len) {
      tmp_len = len;
    }
    const int used = stb_vorbis_decode_frame_pushdata(v, mem, tmp_len, NULL, &output, &samples);
    if (used == 0) {
      if (tmp_len == len) {
        // all read.
        break;
      }
      tmp_len += 32;
      goto retry;
    }
    mem += used;
    len -= used;

    if (data_cap < data_len + samples) {
      if (!data_cap) {
        data_cap = 4096;
      } else {
        data_cap *= 2;
      }
      for (int i = 0; i < v->channels; i++) {
        float* newData = (float*)realloc(data[i], data_cap * sizeof(float));
        if (newData == NULL) {
          // TODO: Free allocated objects correctly?
          stb_vorbis_close(v);
          return -2;
        }
        data[i] = newData;
      }
    }

    for (int i = 0; i < v->channels; i++) {
      for (int j = 0; j < samples; j++) {
        // Clamp the data not to cause noises.
        float sample = output[i][j];
        if (sample > 1.0f) {
          sample = 1.0f;
        } else if (sample < -1.0f) {
          sample = -1.0f;
        }
        data[i][data_len+j] = sample;
      }
    }
    data_len += samples;
  }
  stb_vorbis_close(v);

  *output = data;
  return data_len;
}
