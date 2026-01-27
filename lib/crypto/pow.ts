export async function solvePoW(seed: string, difficulty: number): Promise<string> {
  let nonce = 0
  const encoder = new TextEncoder()
  
  while (true) {
    const nonceStr = nonce.toString()
    // The backend constructs data as: seed + nonce
    // See ciphera-captcha/internal/api/handlers.go:182
    const data = seed + nonceStr
    const buffer = encoder.encode(data)
    const hashBuffer = await crypto.subtle.digest('SHA-256', buffer)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
    
    if (hashHex.startsWith('0'.repeat(difficulty))) {
      return nonceStr
    }
    
    nonce++
    if (nonce > 5000000) { // Safety break
        throw new Error('PoW solution not found')
    }
  }
}
