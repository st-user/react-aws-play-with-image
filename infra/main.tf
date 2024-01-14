terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

# Configure the AWS Provider
provider "aws" {
  region = "ap-northeast-1"
}

resource "aws_amplify_app" "react-aws-play-with-image" {
  name         = "react-aws-play-with-image"
  repository   = "https://github.com/st-user/react-aws-play-with-image.git"
  access_token = var.token


  # The default rewrites and redirects added by the Amplify Console.
  custom_rule {
    source = "/<*>"
    status = "404"
    target = "/index.html"
  }

  environment_variables = {
    "_CUSTOM_IMAGE" = "node:20.11.0",
  }
}

resource "aws_amplify_branch" "amplify_branch" {
  app_id      = aws_amplify_app.react-aws-play-with-image.id
  branch_name = "main"
}
