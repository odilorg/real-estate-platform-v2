// Mock uuid for Jest tests
let counter = 0;
export const v4 = () => `test-uuid-${counter++}-${Math.random().toString(36).substring(7)}`;
