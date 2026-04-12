import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as ecr from 'aws-cdk-lib/aws-ecr';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import * as logs from 'aws-cdk-lib/aws-logs';

export class HorneroInfraStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const projectName = new cdk.CfnParameter(this, 'ProjectName', {
      type: 'String',
      default: 'hornero',
    });

    const environmentName = new cdk.CfnParameter(this, 'EnvironmentName', {
      type: 'String',
      default: 'prod',
    });

    const ledgerServiceImageTag = new cdk.CfnParameter(this, 'LedgerServiceImageTag', {
      type: 'String',
      default: 'latest',
    });

    const polygonRpcUrl = new cdk.CfnParameter(this, 'PolygonRpcUrl', {
      type: 'String',
      noEcho: true,
    });

    const contractAddress = new cdk.CfnParameter(this, 'ContractAddress', {
      type: 'String',
    });

    const privateKey = new cdk.CfnParameter(this, 'PrivateKey', {
      type: 'String',
      noEcho: true,
    });

    const polygonChainId = new cdk.CfnParameter(this, 'PolygonChainId', {
      type: 'String',
      default: '80002',
    });

    const polygonMinGasPriceGwei = new cdk.CfnParameter(this, 'PolygonMinGasPriceGwei', {
      type: 'String',
      default: '25',
    });

    const polygonMaxGasPriceGwei = new cdk.CfnParameter(this, 'PolygonMaxGasPriceGwei', {
      type: 'String',
      default: '100',
    });

    const polygonGasLimit = new cdk.CfnParameter(this, 'PolygonGasLimit', {
      type: 'String',
      default: '500000',
    });

    const txReferenceDefault = new cdk.CfnParameter(this, 'TxReferenceDefault', {
      type: 'String',
      default: 'sin-referencia',
    });

    const ledgerServiceDesiredCount = new cdk.CfnParameter(this, 'LedgerServiceDesiredCount', {
      type: 'Number',
      default: 0,
    });

    const prefix = `${projectName.valueAsString}-${environmentName.valueAsString}`;

    const vpc = new ec2.Vpc(this, 'Vpc', {
      natGateways: 0,
      maxAzs: 2,
      subnetConfiguration: [
        {
          name: 'public',
          subnetType: ec2.SubnetType.PUBLIC,
          cidrMask: 24,
        },
      ],
    });

    const cluster = new ecs.Cluster(this, 'Cluster', {
      vpc,
      clusterName: `${prefix}-cluster`,
      containerInsights: true,
    });

    const ledgerServiceRepository = new ecr.Repository(this, 'LedgerServiceRepository', {
      repositoryName: `${prefix}-ledger-service`,
      imageScanOnPush: true,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    const ledgerServiceLogGroup = new logs.LogGroup(this, 'LedgerServiceLogGroup', {
      logGroupName: `/ecs/${prefix}/ledger-service`,
      retention: logs.RetentionDays.TWO_WEEKS,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    const loadBalancerSecurityGroup = new ec2.SecurityGroup(this, 'LoadBalancerSecurityGroup', {
      vpc,
      description: 'Public access to the application load balancer',
      allowAllOutbound: true,
    });
    loadBalancerSecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(80),
      'Allow public HTTP traffic',
    );

    const ledgerServiceSecurityGroup = new ec2.SecurityGroup(this, 'LedgerServiceSecurityGroup', {
      vpc,
      description: 'Traffic for ledger-service tasks',
      allowAllOutbound: true,
    });
    ledgerServiceSecurityGroup.addIngressRule(
      loadBalancerSecurityGroup,
      ec2.Port.tcp(8080),
      'Allow traffic from load balancer to ledger-service',
    );

    const ledgerTaskDefinition = new ecs.FargateTaskDefinition(this, 'LedgerTaskDefinition', {
      cpu: 512,
      memoryLimitMiB: 1024,
    });

    ledgerTaskDefinition.addContainer('LedgerContainer', {
      image: ecs.ContainerImage.fromEcrRepository(
        ledgerServiceRepository,
        ledgerServiceImageTag.valueAsString,
      ),
      logging: ecs.LogDrivers.awsLogs({
        logGroup: ledgerServiceLogGroup,
        streamPrefix: 'ecs',
      }),
      environment: {
        SERVER_PORT: '8080',
        POLYGON_RPC_URL: polygonRpcUrl.valueAsString,
        CONTRACT_ADDRESS: contractAddress.valueAsString,
        PRIVATE_KEY: privateKey.valueAsString,
        POLYGON_CHAIN_ID: polygonChainId.valueAsString,
        POLYGON_MIN_GAS_PRICE_GWEI: polygonMinGasPriceGwei.valueAsString,
        POLYGON_MAX_GAS_PRICE_GWEI: polygonMaxGasPriceGwei.valueAsString,
        POLYGON_GAS_LIMIT: polygonGasLimit.valueAsString,
        TX_REFERENCE: txReferenceDefault.valueAsString,
      },
      portMappings: [{ containerPort: 8080 }],
    });

    const ledgerService = new ecs.FargateService(this, 'LedgerService', {
      cluster,
      serviceName: `${prefix}-ledger-service`,
      taskDefinition: ledgerTaskDefinition,
      desiredCount: ledgerServiceDesiredCount.valueAsNumber,
      assignPublicIp: true,
      securityGroups: [ledgerServiceSecurityGroup],
      vpcSubnets: { subnetType: ec2.SubnetType.PUBLIC },
      circuitBreaker: { rollback: true },
    });

    const loadBalancer = new elbv2.ApplicationLoadBalancer(this, 'PublicLoadBalancer', {
      vpc,
      internetFacing: true,
      loadBalancerName: `${prefix}-alb`,
      securityGroup: loadBalancerSecurityGroup,
    });

    const listener = loadBalancer.addListener('HttpListener', {
      port: 80,
      open: true,
    });

    listener.addTargets('ApiGatewayTargets', {
      port: 8080,
      targets: [ledgerService],
      healthCheck: {
        path: '/actuator/health',
        healthyHttpCodes: '200',
      },
    });

    new cdk.CfnOutput(this, 'LedgerServiceRepositoryUri', {
      value: ledgerServiceRepository.repositoryUri,
      description: 'ECR URI for ledger-service image',
    });

    new cdk.CfnOutput(this, 'LoadBalancerDnsName', {
      value: loadBalancer.loadBalancerDnsName,
      description: 'Public ALB DNS',
    });

    new cdk.CfnOutput(this, 'TransactionsEndpoint', {
      value: `http://${loadBalancer.loadBalancerDnsName}/api/v1/transactions`,
      description: 'Public transactions endpoint',
    });
  }
}
