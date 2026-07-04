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
import java.time.Instant;
import java.util.Locale;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

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

    // Cache de URLs pre-firmadas para imágenes PÚBLICAS (campañas/rewards/team):
    // devolvemos la MISMA URL por s3Key durante ~20h para que el navegador pueda
    // deduplicar y cachear. Sin esto, cada respuesta firma una URL nueva y el
    // navegador re-descarga la imagen aunque sea idéntica.
    private static final Duration APP_IMAGE_SIGNATURE_TTL = Duration.ofHours(24);
    private static final Duration APP_IMAGE_URL_CACHE_TTL = Duration.ofHours(20);
    private final ConcurrentHashMap<String, CachedUrl> appImageUrlCache = new ConcurrentHashMap<>();

    private record CachedUrl(String url, Instant regenerateAfter) {}

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
                // Objetos con key UUID = inmutables → el navegador puede cachearlos "para siempre".
                .cacheControl("public, max-age=31536000, immutable")
                .serverSideEncryption(ServerSideEncryption.AES256)
                .build();

        s3Client.putObject(putRequest, RequestBody.fromBytes(fileContent));
        return key;
    }

    /**
     * Pre-signed URL de corta duración (15 min) para documentos PRIVADOS (KYC).
     */
    public URL generatePresignedUrl(String s3Key) {
        return presign(s3Key, Duration.ofMinutes(15));
    }

    /**
     * URL de imagen PÚBLICA (campaña/reward/team) ESTABLE: se cachea por s3Key
     * (~20h) y se firma con TTL largo (24h). Al devolver la misma URL entre
     * respuestas, el navegador deduplica y cachea en vez de re-descargar cada vez.
     */
    public String generateAppImageUrl(String s3Key) {
        if (s3Key == null || s3Key.isBlank()) return null;
        Instant now = Instant.now();
        CachedUrl cached = appImageUrlCache.compute(s3Key, (key, existing) -> {
            if (existing != null && now.isBefore(existing.regenerateAfter())) {
                return existing;
            }
            String signed = presign(key, APP_IMAGE_SIGNATURE_TTL).toString();
            return new CachedUrl(signed, now.plus(APP_IMAGE_URL_CACHE_TTL));
        });
        return cached.url();
    }

    private URL presign(String s3Key, Duration ttl) {
        GetObjectRequest getObjectRequest = GetObjectRequest.builder()
                .bucket(bucketName)
                .key(s3Key)
                .build();

        GetObjectPresignRequest presignRequest = GetObjectPresignRequest.builder()
                .signatureDuration(ttl)
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
