import { countResources, expect as expectCDK } from '@aws-cdk/assert';
import * as cdk from '@aws-cdk/core';
import * as SesToSlack from '../lib/ses_to_slack-stack';

test('Empty Stack', () => {
  const app = new cdk.App();
  // WHEN
  const stack = new SesToSlack.SesToSlackStack(app, 'MyTestStack');
  // THEN
  expectCDK(stack).to(countResources('AWS::SES::ReceiptRule', 1));
});
