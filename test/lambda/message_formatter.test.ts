import fs from 'node:fs'
import { describe, expect, test } from 'vitest'
import MessageFormatter from '../../lib/lambda/message_formatter'

describe('MessageFormatter', () => {
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

  test('generates a random fileName when the attachment has no filename', async () => {
    const raw = [
      'From: sender@example.com',
      'To: recipient@example.com',
      'Subject: no filename attachment',
      'Content-Type: multipart/mixed; boundary="boundary"',
      '',
      '--boundary',
      'Content-Type: text/plain',
      '',
      'body text',
      '',
      '--boundary',
      'Content-Type: application/octet-stream',
      'Content-Transfer-Encoding: base64',
      '',
      Buffer.from('attachment content').toString('base64'),
      '--boundary--',
      '',
    ].join('\r\n')

    const actual = await MessageFormatter.format(raw)

    expect(actual.attachments).toHaveLength(1)
    const [attachment] = actual.attachments
    expect(attachment.fileName).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/
    )
  })
})
