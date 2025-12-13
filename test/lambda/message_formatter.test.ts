import fs from 'fs'
import MessageFormatter from '../../lib/lambda/message_formatter'

describe('MessageFormatter', () => {
  jest.setTimeout(10000)

  test.each`
    sourceFile                  | expectedFile
    ${'testdata/message-1.eml'} | ${'testdata/message-1-expected.json'}
    ${'testdata/message-2.eml'} | ${'testdata/message-2-expected.json'}
    ${'testdata/message-3.eml'} | ${'testdata/message-3-expected.json'}
  `('$source', async ({ sourceFile, expectedFile }) => {
    const readStream = fs.createReadStream(sourceFile)
    const actual = await MessageFormatter.format(readStream)
    const expected = JSON.parse(fs.readFileSync(expectedFile, 'utf8'))
    expect(actual.text).toBe(expected.text)
    const actualAttachments = actual.attachments.map(
      (x) => ({ contentType: x.contentType, fileName: x.fileName })
    )
    expect(actualAttachments).toEqual(expected.attachments)
  })
})
