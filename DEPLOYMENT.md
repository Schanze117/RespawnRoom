# RespawnRoom Deployment Guide

This guide covers how to deploy the RespawnRoom application to AWS using either the automated shell script or CloudFormation template.

## Prerequisites

Before deploying, ensure you have:

1. **AWS CLI installed and configured**:
   ```bash
   aws configure
   ```
   You'll need AWS access keys with permissions for S3, CloudFront, and ACM.

2. **Required tools**:
   - AWS CLI
   - jq (for JSON processing)
   - bash shell (Git Bash on Windows)

## Option 1: Automated Deployment Script

### Running the Deployment Script

The deployment script handles the full deployment process in one command:

```bash
./deploy.sh
```

### What the Script Does:

1. **Validation**: Checks AWS credentials and required tools
2. **Client Build**: Installs dependencies and builds the React application
3. **S3 Upload**: Syncs the build output to the S3 bucket
4. **CloudFront Invalidation**: Clears the CloudFront cache
5. **Certificate Verification**: Ensures the SSL certificate is valid
6. **CloudFront Configuration**: Updates the CloudFront distribution with proper domain settings
7. **Testing**: Tests the deployed website URLs

### Troubleshooting

- **AWS Permissions**: Ensure your AWS user has required permissions
- **SSL Certificate**: If certificate validation fails, follow the DNS record setup instructions provided
- **Build Errors**: Resolve any npm errors if the build fails

## Option 2: CloudFormation Deployment

For infrastructure-as-code deployment:

1. **Deploy the CloudFormation stack**:
   ```bash
   aws cloudformation deploy \
     --template-file cloudformation-deploy.yaml \
     --stack-name respawnroom-frontend \
     --parameter-overrides \
       DomainName=respawnroom.online \
       WwwDomainName=www.respawnroom.online \
       CertificateArn=arn:aws:acm:us-east-1:107767828459:certificate/e3fe133f-601e-479d-8ba5-4aa5b4805d52 \
     --capabilities CAPABILITY_IAM
   ```

2. **Upload the client build to the S3 bucket**:
   ```bash
   cd client
   npm install
   npm run build
   aws s3 sync dist/ s3://respawnroom-frontend/ --delete
   ```

3. **Create a CloudFront invalidation**:
   ```bash
   # Get the distribution ID from CloudFormation outputs if needed
   DIST_ID=$(aws cloudformation describe-stacks --stack-name respawnroom-frontend --query 'Stacks[0].Outputs[?OutputKey==`CloudFrontDistributionId`].OutputValue' --output text)
   
   aws cloudfront create-invalidation --distribution-id $DIST_ID --paths "/*"
   ```

### CloudFormation Resources Created

The CloudFormation template creates:
- S3 bucket for static website hosting
- CloudFront distribution with HTTPS support
- S3 bucket policy and CloudFront origin access identity
- Custom error responses for SPA routing

## DNS Configuration

For both deployment methods, ensure your domain's DNS settings point to CloudFront:

1. Create an A record for `respawnroom.online` that's an alias to your CloudFront distribution
2. Create an A record for `www.respawnroom.online` that's an alias to your CloudFront distribution

## Verifying the Deployment

After deployment completes:

1. Wait for CloudFront to finish deploying (can take 10-15 minutes)
2. Visit `https://respawnroom.online` and `https://www.respawnroom.online`
3. Test functionality of the application

## Continuous Deployment

For continuous deployment:
1. Set up a GitHub Actions workflow that runs the deployment script on push to the main branch
2. Configure AWS credentials as GitHub repository secrets 