export const getRouteParam = (value: string | string[] | undefined) =>
  Array.isArray(value) ? value[0] : value ?? ''
