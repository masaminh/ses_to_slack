import { Construct } from 'constructs';
import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as lambdaNodejs from 'aws-cdk-lib/aws-lambda-nodejs';
import * as ses from 'aws-cdk-lib/aws-ses';
import * as sesActions from 'aws-cdk-lib/aws-ses-actions';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import config from 'config';

export class SesToSlackStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
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
          noncurrentVersionExpiration: cdk.Duration.days(7),
        },
      ],
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      encryption: s3.BucketEncryption.S3_MANAGED,
      enforceSSL: true,
      versioned: true,
    });
    const bucketCdn = new s3.Bucket(this, 's3Cdn', {
      lifecycleRules: [
        {
          expiration: cdk.Duration.days(90),
          noncurrentVersionExpiration: cdk.Duration.days(7),
        },
      ],
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      encryption: s3.BucketEncryption.S3_MANAGED,
      enforceSSL: true,
      versioned: true,
    });

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
      bundling: {
        forceDockerBundling: false,
      },
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
