export function isValidAmount(value: string): boolean {
  const num = parseFloat(value);
  return !isNaN(num) && num > 0 && num < 1000000;
}

export function isValidDescription(value: string): boolean {
  return value.trim().length > 0 && value.trim().length <= 200;
}

export function isValidApiKey(key: string): boolean {
  return key.startsWith('sk-ant-') && key.length > 20;
}

export function isValidTarget(target: number, baseline: number): boolean {
  return target > 0 && target <= baseline * 1.5;
}
