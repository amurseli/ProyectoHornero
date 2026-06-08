package com.hornero.service;

import org.junit.jupiter.api.Test;

import java.util.Base64;

import static org.assertj.core.api.Assertions.*;

class EncryptionServiceTest {

    // 32-byte (256-bit) key encoded in Base64, as expected by the constructor.
    private static final String KEY = Base64.getEncoder().encodeToString(new byte[32]);

    private final EncryptionService service = new EncryptionService(KEY);

    @Test
    void constructor_whenKeyIsNot32Bytes_throwsIllegalArgument() {
        String shortKey = Base64.getEncoder().encodeToString(new byte[16]);

        assertThatThrownBy(() -> new EncryptionService(shortKey))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("32 bytes");
    }

    @Test
    void encryptThenDecrypt_returnsOriginalPlaintext() {
        String plaintext = "20-43746167-9"; // e.g. a CUIL

        String encrypted = service.encrypt(plaintext);
        String decrypted = service.decrypt(encrypted);

        assertThat(decrypted).isEqualTo(plaintext);
    }

    @Test
    void encrypt_producesCiphertextDifferentFromPlaintext() {
        String plaintext = "datos sensibles";

        String encrypted = service.encrypt(plaintext);

        assertThat(encrypted).isNotNull().isNotEqualTo(plaintext);
    }

    @Test
    void encrypt_isNonDeterministicBecauseOfRandomIv() {
        String plaintext = "mismo texto";

        String first = service.encrypt(plaintext);
        String second = service.encrypt(plaintext);

        // Distinct ciphertexts, but both decrypt back to the same value.
        assertThat(first).isNotEqualTo(second);
        assertThat(service.decrypt(first)).isEqualTo(plaintext);
        assertThat(service.decrypt(second)).isEqualTo(plaintext);
    }

    @Test
    void encryptAndDecrypt_withNull_returnNull() {
        assertThat(service.encrypt(null)).isNull();
        assertThat(service.decrypt(null)).isNull();
    }

    @Test
    void decrypt_withTamperedCiphertext_throwsRuntime() {
        String encrypted = service.encrypt("algo");
        // Flip the last Base64 character to corrupt the GCM auth tag.
        char last = encrypted.charAt(encrypted.length() - 1);
        String tampered = encrypted.substring(0, encrypted.length() - 1) + (last == 'A' ? 'B' : 'A');

        assertThatThrownBy(() -> service.decrypt(tampered))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("desencriptar");
    }
}
