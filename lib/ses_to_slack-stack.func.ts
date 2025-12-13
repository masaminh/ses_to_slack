import type * as lambda from 'aws-lambda'
import { S3Client, GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3'
import { SQSClient, SendMessageBatchRequestEntry, SendMessageBatchCommand } from '@aws-sdk/client-sqs'
import { Readable } from 'node:stream'
import MessageFormatter from './lambda/message_formatter'

export const handler: lambda.SESHandler = async (event) => {
  const bucketName = process.env.BUCKET ?? ''
  if (bucketName === '') {
    throw new Error('Environment Variable [BUCKET] is not set.')
  }

  const cdnBucketName = process.env.CDN_BUCKET ?? ''
  if (cdnBucketName === '') {
    throw new Error('Environment Variable [CDN_BUCKET] is not set.')
  }

  const messages = await Promise.all(
    event.Records.map(async (record, index): Promise<SendMessageBatchRequestEntry> => {
      const { messageId } = record.ses.mail
      const s3 = new S3Client({})
      const output = await s3.send(
        new GetObjectCommand({ Bucket: bucketName, Key: messageId })
      )

      if (!output.Body) {
        throw new Error('Body is empty.')
      }

      const messageInfo = await MessageFormatter.format(output.Body as Readable)
      const imageInfos = messageInfo.attachments.filter((x) => x.contentType.startsWith('image/'))
      imageInfos.forEach((x) => {
        s3.send(
          new PutObjectCommand({ Bucket: cdnBucketName, Key: `${messageId}/${x.fileName}`, Body: x.content })
        )
      })

      return {
        Id: `${index}`,
        MessageBody: JSON.stringify({
          webhookname: process.env.WEBHOOK_NAME,
          message: messageInfo.text,
          images: imageInfos.map(
            (x) => ({ imageUrl: `https://${process.env.CDN_DOMAIN}/${messageId}/${x.fileName}`, imageName: x.fileName })
          ),
        }),
      }
    })
  )

  const sqs = new SQSClient({ region: 'ap-northeast-1' })
  await sqs.send(
    new SendMessageBatchCommand({
      QueueUrl: process.env.QUEUE_URL ?? '',
      Entries: messages,
    })
  )
}
