import { countResources, expect as expectCDK, haveResource } from '@aws-cdk/assert';
import { App } from 'aws-cdk-lib';
import * as SesToSlack from '../lib/ses_to_slack-stack';

test('Stack', () => {
  const app = new App();
  // WHEN
  const stack = new SesToSlack.SesToSlackStack(app, 'MyTestStack');
  // THEN
  expectCDK(stack).to(countResources('AWS::SES::ReceiptRule', 1));
  expectCDK(stack).to(haveResource('AWS::S3::Bucket', {
    LifecycleConfiguration: {
      Rules: [
        {
          ExpirationInDays: 30,
          Status: 'Enabled',
        },
      ],
    },
    PublicAccessBlockConfiguration: {
      BlockPublicAcls: true,
      BlockPublicPolicy: true,
      IgnorePublicAcls: true,
      RestrictPublicBuckets: true,
    },
  }));
});
