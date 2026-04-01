declare module 'fuzzball' {
  export function ratio(s1: string, s2: string): number
  export function partial_ratio(s1: string, s2: string): number
  export function token_sort_ratio(s1: string, s2: string): number
  export function token_set_ratio(s1: string, s2: string): number
}
