import { S3Client, GetObjectCommand, PutObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';
import { Adapter } from 'lowdb';

export interface S3AdapterOptions {
  bucketName: string;
  key: string;
  region?: string;
  accessKeyId?: string;
  secretAccessKey?: string;
  endpoint?: string;
  forcePathStyle?: boolean;
}

export class S3Adapter<T> implements Adapter<T> {
  private s3Client: S3Client;
  private bucketName: string;
  private key: string;

  constructor(options: S3AdapterOptions) {
    this.bucketName = options.bucketName;
    this.key = options.key;
    
    const clientConfig = {
      region: options.region || process.env.AWS_REGION || 'us-east-1',
      credentials: {
        accessKeyId: options.accessKeyId || process.env.AWS_ACCESS_KEY_ID || '',
        secretAccessKey: options.secretAccessKey || process.env.AWS_SECRET_ACCESS_KEY || '',
      },
      ...(options.endpoint || process.env.S3_ENDPOINT ? {
        endpoint: options.endpoint || process.env.S3_ENDPOINT
      } : {}),
      ...(options.forcePathStyle !== undefined ? {
        forcePathStyle: options.forcePathStyle
      } : process.env.S3_FORCE_PATH_STYLE ? {
        forcePathStyle: process.env.S3_FORCE_PATH_STYLE === 'true'
      } : {}),
    };

    this.s3Client = new S3Client(clientConfig);
  }

  async read(): Promise<T | null> {
    try {
      // Check if the object exists
      await this.s3Client.send(new HeadObjectCommand({
        Bucket: this.bucketName,
        Key: this.key,
      }));

      // Get the object
      const command = new GetObjectCommand({
        Bucket: this.bucketName,
        Key: this.key,
      });
      
      const response = await this.s3Client.send(command);
      
      if (!response.Body) {
        return null;
      }

      const bodyString = await response.Body.transformToString();
      return JSON.parse(bodyString);
    } catch (error: unknown) {
      // If the file doesn't exist, return null (lowdb will handle initialization)
      if (error instanceof Error && (error.name === 'NoSuchKey' || error.name === 'NotFound')) {
        return null;
      }
      throw error;
    }
  }

  async write(data: T): Promise<void> {
    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: this.key,
      Body: JSON.stringify(data, null, 2),
      ContentType: 'application/json',
    });

    await this.s3Client.send(command);
  }
}

export default S3Adapter;