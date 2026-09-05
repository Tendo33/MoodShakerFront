import "server-only";

import {
  DeleteObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import {
  buildPublicUrl,
  type ObjectStore,
  type ObjectStoreConfig,
  type PutResult,
} from "@/lib/storage/object-store";

/**
 * Cloudflare R2 object store backed by the S3-compatible API.
 * Swapping to MinIO or AWS S3 only requires a different endpoint and
 * credentials — the ObjectStore contract stays the same.
 */
export function createR2ObjectStore(config: ObjectStoreConfig): ObjectStore {
  const client = new S3Client({
    region: "auto",
    endpoint: `https://${config.accountId}.r2.cloudflarestorage.com`,
    forcePathStyle: true,
    credentials: {
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
    },
  });

  return {
    id: "cloudflare-r2",

    async put(
      key: string,
      body: Buffer,
      contentType: string,
    ): Promise<PutResult> {
      await client.send(
        new PutObjectCommand({
          Bucket: config.bucket,
          Key: key,
          Body: body,
          ContentType: contentType,
          // Safe because keys are content-addressed (see buildImageKey):
          // regenerating an image produces a different digest, hence a new key
          // and a new URL. A stable key with immutable caching would make the
          // CDN serve the old image forever after a refresh.
          CacheControl: "public, max-age=31536000, immutable",
        }),
      );

      return {
        key,
        url: buildPublicUrl(config.publicBaseUrl, key),
      };
    },

    async delete(key: string): Promise<void> {
      await client.send(
        new DeleteObjectCommand({
          Bucket: config.bucket,
          Key: key,
        }),
      );
    },
  };
}
