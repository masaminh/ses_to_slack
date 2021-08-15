import * as cdk from '@aws-cdk/core';
import * as lambda from '@aws-cdk/aws-lambda';
import * as lambdaNodejs from '@aws-cdk/aws-lambda-nodejs';
import * as ses from '@aws-cdk/aws-ses';
import * as sesActions from '@aws-cdk/aws-ses-actions';
import * as s3 from '@aws-cdk/aws-s3';
import * as sqs from '@aws-cdk/aws-sqs';
import * as cloudfront from '@aws-cdk/aws-cloudfront';
import config from 'config';

export class SesToSlackStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const ruleSetName = config.get<string>('ruleSetName');
    const recipient = config.get<string>('recipient');
    const stage = config.get<string>('stage');
    const webhookName = config.get<string>('webhook');
    const queueUrl = config.get<string>('queue');
    const queueArn = config.get<string>('queuearn');

    const bucket = new s3.Bucket(this, 's3', {
      lifecycleRules: [
        {
          expiration: cdk.Duration.days(30),
        },
      ],
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
    });
    const bucketCdn = new s3.Bucket(this, 's3Cdn', { blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL });

    const oai = new cloudfront.OriginAccessIdentity(this, 'oai');

    const distribution = new cloudfront.CloudFrontWebDistribution(this, 'distribution', {
      originConfigs: [
        {
          s3OriginSource: {
            s3BucketSource: bucketCdn,
            originAccessIdentity: oai,
          },
          behaviors: [
            { isDefaultBehavior: true },
          ],
        },
      ],
    });

    const lambdaFunction = new lambdaNodejs.NodejsFunction(this, 'func', {
      timeout: cdk.Duration.seconds(30),
      environment: {
        BUCKET: bucket.bucketName,
        WEBHOOK_NAME: webhookName,
        QUEUE_URL: queueUrl,
        CDN_BUCKET: bucketCdn.bucketName,
        CDN_DOMAIN: distribution.distributionDomainName,
      },
      tracing: lambda.Tracing.ACTIVE,
    });

    bucket.grantRead(lambdaFunction);
    bucketCdn.grantWrite(lambdaFunction);

    const queue = sqs.Queue.fromQueueArn(this, 'queue', queueArn);
    queue.grantSendMessages(lambdaFunction);

    const ruleSet = ses.ReceiptRuleSet.fromReceiptRuleSetName(this, 'ruleset', ruleSetName);
    ruleSet.addRule('rule', {
      receiptRuleName: `ToSlackRule${stage}`,
      recipients: [recipient],
      actions: [
        new sesActions.S3({
          bucket,
        }),
        new sesActions.Lambda({
          function: lambdaFunction,
        }),
      ],
    });
  }
}
