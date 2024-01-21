# Create an IAM role for the Lambda function
resource "aws_iam_role" "lambda_execution_role" {
  name = "lambda_execution_role"

  assume_role_policy = <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Service": "lambda.amazonaws.com"
      },
      "Action": "sts:AssumeRole"
    }
  ]
}
EOF
}

# Create a custom IAM policy for S3 access
resource "aws_iam_policy" "lambda_s3_policy" {
  name        = "lambda_s3_policy"
  description = "IAM policy for Lambda S3 access"

  policy = <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "logs:PutLogEvents",
                "logs:CreateLogGroup",
                "logs:CreateLogStream"
            ],
            "Resource": "arn:aws:logs:*:*:*"
        },
        {
            "Effect": "Allow",
            "Action": [
                "s3:GetObject"
            ],
            "Resource": [
				"arn:aws:s3:::${aws_s3_bucket.srcBucket.bucket}/*"
			]
        },
        {
            "Effect": "Allow",
            "Action": [
                "s3:PutObject"
            ],
            "Resource": [
				"arn:aws:s3:::${aws_s3_bucket.destBucket.bucket}/*" 
			]
        }
  ]
}
EOF
}

# Attach the custom IAM policy to the Lambda execution role
resource "aws_iam_role_policy_attachment" "lambda_s3_policy_attachment" {
  policy_arn = aws_iam_policy.lambda_s3_policy.arn
  role       = aws_iam_role.lambda_execution_role.name
}

data "archive_file" "lambda_zip" {
  type        = "zip"
  source_dir  = "../app/lambda-s3/work"
  output_path = "../app/lambda-s3/functions.zip"
}

# Create a Lambda function
resource "aws_lambda_function" "my_lambda_function" {
  function_name = "tf-my-lambda-create-sumbnail"
  role          = aws_iam_role.lambda_execution_role.arn
  handler       = "dist/index.handler"
  runtime       = "nodejs20.x"

  # Function code. Replace with your actual code.
  filename         = data.archive_file.lambda_zip.output_path
  source_code_hash = data.archive_file.lambda_zip.output_base64sha256

  # CloudWatch log group
  tracing_config {
    mode = "Active"
  }
}

resource "aws_lambda_permission" "allow_bucket" {
  statement_id  = "AllowExecutionFromS3Bucket"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.my_lambda_function.arn
  principal     = "s3.amazonaws.com"
  source_arn    = aws_s3_bucket.srcBucket.arn
}

# Create an S3 bucket notification for the Lambda function
resource "aws_s3_bucket_notification" "lambda_notification" {
  bucket = aws_s3_bucket.srcBucket.id

  lambda_function {
    lambda_function_arn = aws_lambda_function.my_lambda_function.arn
    events              = ["s3:ObjectCreated:*"]
  }

  depends_on = [aws_lambda_permission.allow_bucket]
}

