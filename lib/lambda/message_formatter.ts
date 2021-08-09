import { simpleParser, Source } from 'mailparser';

export default class {
  public static async format(source: Source): Promise<string> {
    const parsed = await simpleParser(source);
    const { subject, from, text } = parsed;

    return `件名：${subject}
差出人：${from?.text ?? 'なし'}
本文：
${text}`;
  }
}
