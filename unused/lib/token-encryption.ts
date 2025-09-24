const ENCRYPTION_KEY_STORAGE = 'encryption_key'

class TokenEncryption {
  private key: CryptoKey | null = null

  private async initializeKey(): Promise<CryptoKey> {
    if (this.key) return this.key

    const existingKeyData = sessionStorage.getItem(ENCRYPTION_KEY_STORAGE)

    if (existingKeyData) {
      try {
        const keyData = JSON.parse(existingKeyData)
        this.key = await crypto.subtle.importKey(
          'raw',
          new Uint8Array(keyData),
          { name: 'AES-GCM' },
          false,
          ['encrypt', 'decrypt']
        )
        return this.key
      } catch (error) {
        console.warn('Failed to import existing key, generating new one')
      }
    }

    this.key = await crypto.subtle.generateKey(
      { name: 'AES-GCM', length: 256 },
      true,
      ['encrypt', 'decrypt']
    )

    const exportedKey = await crypto.subtle.exportKey('raw', this.key)
    sessionStorage.setItem(ENCRYPTION_KEY_STORAGE, JSON.stringify(Array.from(new Uint8Array(exportedKey))))

    return this.key
  }

  async encrypt(data: string): Promise<string> {
    try {
      const key = await this.initializeKey()
      const iv = crypto.getRandomValues(new Uint8Array(12)) // 96-bit IV for GCM
      const encodedData = new TextEncoder().encode(data)

      const encryptedData = await crypto.subtle.encrypt(
        { name: 'AES-GCM', iv },
        key,
        encodedData
      )

      const combined = new Uint8Array(iv.length + encryptedData.byteLength)
      combined.set(iv)
      combined.set(new Uint8Array(encryptedData), iv.length)

      // Return as base64
      return btoa(String.fromCharCode(...combined))
    } catch (error) {
      console.error('Encryption failed:', error)
      throw new Error('Failed to encrypt data')
    }
  }

  /**
   * Decrypt data using AES-GCM
   */
  async decrypt(encryptedData: string): Promise<string> {
    try {
      const key = await this.initializeKey()
      const combined = new Uint8Array(
        atob(encryptedData).split('').map(char => char.charCodeAt(0))
      )

      const iv = combined.slice(0, 12)
      const data = combined.slice(12)

      const decryptedData = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv },
        key,
        data
      )

      return new TextDecoder().decode(decryptedData)
    } catch (error) {
      console.error('Decryption failed:', error)
      throw new Error('Failed to decrypt data')
    }
  }

  /**
   * Clear the encryption key (on logout)
   */
  clearKey(): void {
    this.key = null
    sessionStorage.removeItem(ENCRYPTION_KEY_STORAGE)
  }
}

export const tokenEncryption = new TokenEncryption()
