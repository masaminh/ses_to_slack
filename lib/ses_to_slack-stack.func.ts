import * as lambda from 'aws-lambda';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { SQSClient, SendMessageBatchRequestEntry, SendMessageBatchCommand } from '@aws-sdk/client-sqs';
import MessageFormatter from './lambda/message_formatter';

export const handler: lambda.SESHandler = async (event) => {
  const bucketName = process.env.BUCKET ?? '';
  if (bucketName === '') {
    throw new Error('Environment Variable [BUCKET] is not set.');
  }

  const messages = await Promise.all(
    event.Records.map(async (record, index): Promise<SendMessageBatchRequestEntry> => {
      const s3 = new S3Client({});
      const output = await s3.send(
        new GetObjectCommand({ Bucket: bucketName, Key: record.ses.mail.messageId }),
      );

      return {
        Id: `${index}`,
        MessageBody: JSON.stringify({
          webhookname: process.env.WEBHOOK_NAME,
          message: await MessageFormatter.format(output.Body),
        }),
      };
    }),
  );

  const sqs = new SQSClient({ region: 'ap-northeast-1' });
  await sqs.send(
    new SendMessageBatchCommand({
      QueueUrl: process.env.QUEUE_URL ?? '',
      Entries: messages,
    }),
  );
};
