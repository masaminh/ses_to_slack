import * as cdk from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { SesToSlackStack } from '../lib/ses_to_slack-stack';

test('snapshot test', () => {
  const app = new cdk.App();
  const stack = new SesToSlackStack(app, 'MyTestStack');
  // スタックからテンプレート(JSON)を生成
  const template = Template.fromStack(stack).toJSON();

  // 生成したテンプレートとスナップショットが同じか検証
  expect(template).toMatchSnapshot();
});
