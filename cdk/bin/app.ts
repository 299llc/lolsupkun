#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { ProxyStack } from '../lib/proxy-stack';

const app = new cdk.App();

new ProxyStack(app, 'RorusapoProxyStack', {
  env: {
    region: 'ap-northeast-1',
  },
});
