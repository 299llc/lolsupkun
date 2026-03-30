import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import { Construct } from 'constructs';
import * as path from 'path';

export class ProxyStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Gemini API キーを格納する Secrets Manager シークレット
    // デプロイ後に AWS コンソールまたは CLI で実際のキーを設定する:
    //   aws secretsmanager put-secret-value --secret-id lolsup/gemini-api-key --secret-string "YOUR_KEY"
    const geminiSecret = new secretsmanager.Secret(this, 'GeminiApiKey', {
      secretName: 'lolsup/gemini-api-key',
      description: 'Gemini API key for ろるさぽくん',
    });

    // アプリ固有シークレット（Lambda URL 直叩き防止用）
    const appSecret = new secretsmanager.Secret(this, 'AppSecret', {
      secretName: 'lolsup/app-secret',
      description: 'App secret for request validation',
      generateSecretString: {
        excludePunctuation: true,
        passwordLength: 32,
      },
    });

    // Gemini Proxy Lambda
    // ※ NodejsFunction は日本語パスで esbuild spawn に失敗するため、
    //    事前ビルド済みの dist/ を lambda.Code.fromAsset で参照する
    const proxyFn = new lambda.Function(this, 'GeminiProxy', {
      functionName: 'lolsup-gemini-proxy',
      code: lambda.Code.fromAsset(path.join(__dirname, '..', 'lambda', 'dist')),
      handler: 'gemini-proxy.handler',
      runtime: lambda.Runtime.NODEJS_22_X,
      architecture: lambda.Architecture.ARM_64,
      memorySize: 256,
      timeout: cdk.Duration.seconds(30),
      environment: {
        SECRET_NAME: geminiSecret.secretName,
        APP_SECRET_ARN: appSecret.secretArn,
      },
    });

    // Lambda に Secrets Manager 読み取り権限を付与
    geminiSecret.grantRead(proxyFn);
    appSecret.grantRead(proxyFn);

    // Lambda Function URL（認証なし = パブリック）
    const fnUrl = proxyFn.addFunctionUrl({
      authType: lambda.FunctionUrlAuthType.NONE,
      cors: {
        allowedOrigins: ['*'],
        allowedHeaders: ['Content-Type', 'X-App-Secret'],
        allowedMethods: [lambda.HttpMethod.POST],
      },
    });

    // 出力
    new cdk.CfnOutput(this, 'ProxyUrl', {
      value: fnUrl.url,
      description: 'Gemini Proxy Lambda Function URL',
    });

    new cdk.CfnOutput(this, 'AppSecretArn', {
      value: appSecret.secretArn,
      description: 'App Secret ARN (retrieve value after deploy)',
    });
  }
}
