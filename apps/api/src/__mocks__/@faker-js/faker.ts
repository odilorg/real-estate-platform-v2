// Mock faker and uuid for Jest tests
export const faker = {
  string: {
    uuid: () => 'test-uuid-' + Math.random().toString(36).substring(7),
    alphanumeric: (length: number) => 'ABCD123456'.substring(0, length),
  },
  internet: {
    email: () => 'test@example.com',
    password: () => 'testpassword123',
    username: () => 'testuser',
    url: () => 'https://example.com',
  },
  person: {
    firstName: () => 'John',
    lastName: () => 'Doe',
  },
  phone: {
    number: () => '+998901234567',
  },
  lorem: {
    sentence: () => 'Test property title',
    paragraphs: (count: number) => 'Test description paragraph. '.repeat(count),
    words: (count: number) => 'test word '.repeat(count).trim(),
    paragraph: () => 'Test paragraph for review or description.',
  },
  location: {
    streetAddress: () => '123 Test Street',
  },
  number: {
    int: (options: { min?: number; max?: number }) => {
      const min = options.min || 0;
      const max = options.max || 100;
      return Math.floor(Math.random() * (max - min + 1)) + min;
    },
  },
  image: {
    avatar: () => 'https://example.com/avatar.jpg',
    url: () => 'https://example.com/image.jpg',
  },
  company: {
    name: () => 'Test Company LLC',
  },
  helpers: {
    slugify: (text: string) => text.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
  },
};
