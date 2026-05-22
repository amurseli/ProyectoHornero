package com.hornero.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import software.amazon.awssdk.auth.credentials.AwsBasicCredentials;
import software.amazon.awssdk.auth.credentials.StaticCredentialsProvider;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.*;
import software.amazon.awssdk.services.s3.presigner.S3Presigner;
import software.amazon.awssdk.services.s3.presigner.model.GetObjectPresignRequest;

import jakarta.annotation.PostConstruct;
import java.net.InetAddress;
import java.net.URL;
import java.time.Duration;
import java.util.Locale;
import java.util.UUID;

@Service
public class S3StorageService {

    @Value("${aws.s3.bucket-name}")
    private String bucketName;

    @Value("${aws.s3.region}")
    private String region;

    @Value("${aws.s3.access-key}")
    private String accessKey;

    @Value("${aws.s3.secret-key}")
    private String secretKey;

    @Value("${aws.s3.root-prefix:}")
    private String configuredRootPrefix;

    @Value("${app.environment:local}")
    private String appEnvironment;

    @Value("${app.instance-id:}")
    private String appInstanceId;

    private S3Client s3Client;
    private S3Presigner s3Presigner;
    private String rootPrefix;

    @PostConstruct
    public void init() {
        AwsBasicCredentials credentials = AwsBasicCredentials.create(accessKey, secretKey);
        StaticCredentialsProvider credentialsProvider = StaticCredentialsProvider.create(credentials);

        s3Client = S3Client.builder()
                .region(Region.of(region))
                .credentialsProvider(credentialsProvider)
                .build();

        s3Presigner = S3Presigner.builder()
                .region(Region.of(region))
                .credentialsProvider(credentialsProvider)
                .build();

        rootPrefix = resolveRootPrefix();
    }

    /**
     * Upload a file to S3 under identity-docs/{userId}/{uuid}.{ext}
     * @return the S3 key of the uploaded file
     */
    public String uploadIdentityDocument(Long userId, String documentType, byte[] fileContent, String contentType) {
        String extension = getExtensionFromContentType(contentType);
        String key = prefixedKey(String.format("identity-docs/%d/%s-%s.%s",
                userId, documentType, UUID.randomUUID().toString(), extension));

        PutObjectRequest putRequest = PutObjectRequest.builder()
                .bucket(bucketName)
                .key(key)
                .contentType(contentType)
                .serverSideEncryption(ServerSideEncryption.AES256)
                .build();

        s3Client.putObject(putRequest, RequestBody.fromBytes(fileContent));
        return key;
    }

    public String uploadAppImage(String folder, byte[] fileContent, String contentType) {
        String extension = getExtensionFromContentType(contentType);
        String safeFolder = (folder == null || folder.isBlank()) ? "media" : folder.replaceAll("^/+", "").replaceAll("/+$", "");
        String key = prefixedKey(String.format("%s/%s.%s", safeFolder, UUID.randomUUID(), extension));

        PutObjectRequest putRequest = PutObjectRequest.builder()
                .bucket(bucketName)
                .key(key)
                .contentType(contentType)
                .serverSideEncryption(ServerSideEncryption.AES256)
                .build();

        s3Client.putObject(putRequest, RequestBody.fromBytes(fileContent));
        return key;
    }

    /**
     * Generate a pre-signed URL for admin to view a document (expires in 15 minutes).
     */
    public URL generatePresignedUrl(String s3Key) {
        GetObjectRequest getObjectRequest = GetObjectRequest.builder()
                .bucket(bucketName)
                .key(s3Key)
                .build();

        GetObjectPresignRequest presignRequest = GetObjectPresignRequest.builder()
                .signatureDuration(Duration.ofMinutes(15))
                .getObjectRequest(getObjectRequest)
                .build();

        return s3Presigner.presignGetObject(presignRequest).url();
    }

    /**
     * Delete a file from S3.
     */
    public void deleteObject(String s3Key) {
        DeleteObjectRequest deleteRequest = DeleteObjectRequest.builder()
                .bucket(bucketName)
                .key(s3Key)
                .build();

        s3Client.deleteObject(deleteRequest);
    }

    private String getExtensionFromContentType(String contentType) {
        if (contentType == null) return "bin";
        return switch (contentType) {
            case "image/jpeg" -> "jpg";
            case "image/png" -> "png";
            case "image/webp" -> "webp";
            default -> "bin";
        };
    }

    private String prefixedKey(String key) {
        if (rootPrefix == null || rootPrefix.isBlank()) return key;
        return rootPrefix + "/" + key;
    }

    private String resolveRootPrefix() {
        String explicit = sanitizePathSegment(configuredRootPrefix);
        if (explicit != null && !explicit.isBlank()) return explicit;

        String environment = appEnvironment == null ? "local" : appEnvironment.trim().toLowerCase(Locale.ROOT);
        if (environment.equals("prod") || environment.equals("production")) {
            return "production";
        }

        String instance = sanitizePathSegment(appInstanceId);
        if (instance != null && !instance.isBlank()) {
            return "test-" + instance;
        }

        String hostName = resolveHostName();
        return "test-" + sanitizePathSegment(hostName);
    }

    private String resolveHostName() {
        try {
            String host = InetAddress.getLocalHost().getHostName();
            if (host != null && !host.isBlank()) return host;
        } catch (Exception ignored) {
        }
        String envHost = System.getenv("HOSTNAME");
        if (envHost != null && !envHost.isBlank()) return envHost;
        return UUID.randomUUID().toString().substring(0, 8);
    }

    private String sanitizePathSegment(String value) {
        if (value == null) return null;
        String sanitized = value.trim()
                .toLowerCase(Locale.ROOT)
                .replaceAll("^/+", "")
                .replaceAll("/+$", "")
                .replaceAll("[^a-z0-9._/-]+", "-")
                .replaceAll("-{2,}", "-");
        return sanitized.isBlank() ? null : sanitized;
    }
}
