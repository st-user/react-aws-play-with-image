resource "aws_s3_bucket" "srcBucket" {
  bucket = "tf-tomoki-sato-aws-image-study-bucket"
}

resource "aws_s3_bucket" "destBucket" {
  bucket = "tf-tomoki-sato-aws-image-study-bucket-resized"
}
