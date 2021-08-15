import { simpleParser, Source } from 'mailparser';
import * as uuid from 'uuid';

interface Attachment {
  contentType: string;
  content: Buffer;
  fileName: string;
}

interface MessageInfo {
  text: string;
  attachments: Attachment[];
}

export default class {
  public static async format(source: Source): Promise<MessageInfo> {
    const parsed = await simpleParser(source);
    const { subject, from, text } = parsed;

    const messageText = `件名：${subject}\n差出人：${from?.text ?? 'なし'}\n本文：\n${text}`;

    return {
      text: messageText,
      attachments: parsed.attachments.map((x) => (
        { contentType: x.contentType, content: x.content, fileName: x.filename ?? uuid.v4() })),
    };
  }
}
