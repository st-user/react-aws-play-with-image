// dependencies
import {
    GetObjectCommand,
    PutObjectCommand,
    S3Client,
} from '@aws-sdk/client-s3'

import { Readable } from 'stream'

import { S3Event } from 'aws-lambda'
import sharp from 'sharp'
import util from 'util'

// create S3 client
const s3 = new S3Client({ region: 'ap-northeast-1' })

const ImageTypes: string[] = ['jpg', 'jpeg', 'png'] as const

// define the handler function
export const handler = async (event: S3Event) => {
    // Read options from the event parameter and get the source bucket
    console.log(
        'Reading options from event:\n',
        util.inspect(event, { depth: 5 })
    )
    const eventRecord = event.Records[0]

    if (!eventRecord) {
        throw new Error(`Unexpected event record ${event.Records}`)
    }

    const srcBucket = eventRecord.s3.bucket.name

    // Object key may have spaces or unicode non-ASCII characters
    const srcKey = decodeURIComponent(
        eventRecord.s3.object.key.replace(/\+/g, ' ')
    )
    const dstBucket = srcBucket + '-resized'
    const dstKey = 'resized-' + srcKey

    // Infer the image type from the file suffix
    const imageType = srcKey.match(/\.([^.]*)$/)?.[1]?.toLowerCase()
    if (!imageType) {
        console.log('Could not determine the image type.')
        return
    }

    if (!ImageTypes.includes(imageType)) {
        console.log(`Unsupported image type: ${imageType}`)
        return
    }

    // Get the image from the source bucket. GetObjectCommand returns a stream.
    let contentBuffer: Buffer | undefined = undefined
    try {
        const params = {
            Bucket: srcBucket,
            Key: srcKey,
        }
        const response = await s3.send(new GetObjectCommand(params))

        const stream = response.Body

        // Convert stream to buffer to pass to sharp resize function.
        if (stream instanceof Readable) {
            contentBuffer = Buffer.concat(await stream.toArray())
        } else {
            throw new Error('Unknown object stream type')
        }
    } catch (error) {
        console.log(error)
        return
    }

    // set thumbnail width. Resize will set the height automatically to maintain aspect ratio.
    const width = 200

    // Use the sharp module to resize the image and save in a buffer.
    let outputBuffer: Buffer | undefined = undefined
    try {
        outputBuffer = await sharp(contentBuffer).resize(width).toBuffer()
    } catch (error) {
        console.log(error)
        return
    }

    // Upload the thumbnail image to the destination bucket
    try {
        const destParams = {
            Bucket: dstBucket,
            Key: dstKey,
            Body: outputBuffer,
            ContentType: 'image',
        }

        await s3.send(new PutObjectCommand(destParams))
    } catch (error) {
        console.log(error)
        return
    }

    console.log(
        'Successfully resized ' +
            srcBucket +
            '/' +
            srcKey +
            ' and uploaded to ' +
            dstBucket +
            '/' +
            dstKey
    )
}
