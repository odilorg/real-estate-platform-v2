/**
 * Mock uuid module for Jest E2E tests
 * uuid@13 uses ESM which Jest doesn't support out of the box
 */

let counter = 0;

export function v4(): string {
  counter++;
  const timestamp = Date.now().toString(16).padStart(8, '0');
  const randomPart = Math.random().toString(16).substring(2, 10);
  const counterHex = counter.toString(16).padStart(4, '0');

  return `${timestamp.slice(0, 8)}-${randomPart.slice(0, 4)}-4${randomPart.slice(4, 7)}-${counterHex.slice(0, 4)}-${timestamp}${randomPart}`.slice(0, 36);
}

export function v1(): string {
  return v4();
}

export function v3(): string {
  return v4();
}

export function v5(): string {
  return v4();
}

export function v6(): string {
  return v4();
}

export function v7(): string {
  return v4();
}

export function validate(uuid: string): boolean {
  const regex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return regex.test(uuid);
}

export function parse(uuid: string): Uint8Array {
  const hex = uuid.replace(/-/g, '');
  const bytes = new Uint8Array(16);
  for (let i = 0; i < 16; i++) {
    bytes[i] = parseInt(hex.substring(i * 2, i * 2 + 2), 16);
  }
  return bytes;
}

export function stringify(bytes: Uint8Array): string {
  const hex = Array.from(bytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20, 32)}`;
}

export const NIL = '00000000-0000-0000-0000-000000000000';
export const MAX = 'ffffffff-ffff-ffff-ffff-ffffffffffff';

export default { v1, v3, v4, v5, v6, v7, validate, parse, stringify, NIL, MAX };
