import {data as data1} from './iso_1.js'
import {data as data2} from './iso_2.js'
import {data as data3} from './iso_3.js'
import {data as data4} from './iso_4.js'
import {data as data5} from './iso_5.js'
import {data as data6} from './iso_6.js'
import {data as data7} from './iso_7.js'

function toArray(rawData: string): string[] {
  return rawData.split("\n");
}

export default [
  [],
  toArray(data1),
  toArray(data2),
  toArray(data3),
  toArray(data4),
  toArray(data5),
  toArray(data6),
  toArray(data7),
];
