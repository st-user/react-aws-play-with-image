# Create a CloudWatch log group
resource "aws_cloudwatch_log_group" "lambda_log_group" {
  name = "/aws/lambda/${aws_lambda_function.my_lambda_function.function_name}"
}
