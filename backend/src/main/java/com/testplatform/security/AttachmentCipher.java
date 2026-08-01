package com.testplatform.security;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.Cipher;
import javax.crypto.SecretKeyFactory;
import javax.crypto.spec.GCMParameterSpec;
import javax.crypto.spec.PBEKeySpec;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.GeneralSecurityException;
import java.security.SecureRandom;
import java.util.Arrays;

/**
 * Encrypts/decrypts attachment bytes (screenshots, traces) before they touch
 * Postgres, using AES-256-GCM. The key is derived from a passphrase supplied
 * via {@code ATTACHMENT_ENCRYPTION_KEY} (see application.yml) so nothing new
 * needs installing — it's just a config value.
 *
 * Ciphertext layout stored in the DB: [12-byte IV][GCM ciphertext + 16-byte tag]
 */
@Component
public class AttachmentCipher {

    private static final String AES = "AES";
    private static final String TRANSFORM = "AES/GCM/NoPadding";
    private static final int IV_LENGTH_BYTES = 12;
    private static final int TAG_LENGTH_BITS = 128;

    private final SecretKeySpec key;
    private final SecureRandom random = new SecureRandom();

    public AttachmentCipher(@Value("${app.attachment-encryption-key}") String passphrase) {
        this.key = deriveKey(passphrase);
    }

    public byte[] encrypt(byte[] plaintext) {
        try {
            byte[] iv = new byte[IV_LENGTH_BYTES];
            random.nextBytes(iv);

            Cipher cipher = Cipher.getInstance(TRANSFORM);
            cipher.init(Cipher.ENCRYPT_MODE, key, new GCMParameterSpec(TAG_LENGTH_BITS, iv));
            byte[] ciphertext = cipher.doFinal(plaintext);

            byte[] out = new byte[iv.length + ciphertext.length];
            System.arraycopy(iv, 0, out, 0, iv.length);
            System.arraycopy(ciphertext, 0, out, iv.length, ciphertext.length);
            return out;
        } catch (GeneralSecurityException ex) {
            throw new IllegalStateException("Failed to encrypt attachment", ex);
        }
    }

    public byte[] decrypt(byte[] stored) {
        try {
            byte[] iv = Arrays.copyOfRange(stored, 0, IV_LENGTH_BYTES);
            byte[] ciphertext = Arrays.copyOfRange(stored, IV_LENGTH_BYTES, stored.length);

            Cipher cipher = Cipher.getInstance(TRANSFORM);
            cipher.init(Cipher.DECRYPT_MODE, key, new GCMParameterSpec(TAG_LENGTH_BITS, iv));
            return cipher.doFinal(ciphertext);
        } catch (GeneralSecurityException ex) {
            throw new IllegalStateException("Failed to decrypt attachment (wrong key, or data predates encryption?)", ex);
        }
    }

    /** Stretches whatever passphrase is configured into a proper 256-bit AES key via PBKDF2. */
    private static SecretKeySpec deriveKey(String passphrase) {
        try {
            byte[] salt = "test-ops-console-attachment-salt".getBytes(StandardCharsets.UTF_8);
            PBEKeySpec spec = new PBEKeySpec(passphrase.toCharArray(), salt, 65536, 256);
            SecretKeyFactory factory = SecretKeyFactory.getInstance("PBKDF2WithHmacSHA256");
            byte[] keyBytes = factory.generateSecret(spec).getEncoded();
            return new SecretKeySpec(keyBytes, AES);
        } catch (GeneralSecurityException ex) {
            throw new IllegalStateException("Failed to derive attachment encryption key", ex);
        }
    }
}
