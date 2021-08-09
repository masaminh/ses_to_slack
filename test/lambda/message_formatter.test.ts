import fs from 'fs';
import MessageFormatter from '../../lib/lambda/message_formatter';

describe('MessageFormatter', () => {
  test.each`
    sourceFile                  | expectedFile
    ${'testdata/message-1.eml'} | ${'testdata/message-1-expected.txt'}
    ${'testdata/message-2.eml'} | ${'testdata/message-2-expected.txt'}
  `('$source', async ({ sourceFile, expectedFile }) => {
    const readStream = fs.createReadStream(sourceFile);
    const actual = await MessageFormatter.format(readStream);
    const expected = fs.readFileSync(expectedFile, 'utf8');
    expect(actual).toBe(expected);
  });
});
