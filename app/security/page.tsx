import Link from 'next/link'

export default function SecurityPage() {
  return (
    <div className="container mx-auto max-w-3xl px-6 pt-12">
      <div className="prose prose-neutral max-w-none">
        <h1 className="text-4xl font-bold tracking-tight text-neutral-900 mb-8">Security Design</h1>
        
        <p className="text-xl text-neutral-600 mb-12">
          Security is not just a feature. It's our mission. Every design decision in Drop begins with 
          the safety and privacy of your data in mind.
        </p>

        <section className="mb-12">
          <h2 className="text-2xl font-bold text-neutral-800 mb-4">End-to-End Encryption</h2>
          <p className="text-lg text-neutral-600 mb-4">
            Your files are end-to-end encrypted, and only you hold the keys to decrypt them. 
            We can't see your files, so we can't use them, share them, or sell them.
          </p>
          <p className="text-lg text-neutral-600 mb-4">
            Drop encrypts all files with **AES-GCM encryption** before they leave the browser. 
            This standard provides authenticated encryption to ensure that your files can't be seen 
            or modified by an attacker once they leave your device.
          </p>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-bold text-neutral-800 mb-4">Key Management</h2>
          <p className="text-lg text-neutral-600 mb-4">
            The secret key used for encryption is never shared with our servers. It is sent directly 
            to your intended recipient when you send them the share link. The secret key is added to the 
            URL fragment which is never sent to the server.
          </p>
          <div className="bg-neutral-100 p-4 rounded-md font-mono text-sm text-neutral-800 mb-4 overflow-x-auto">
            https://drop.ciphera.com/share/d525...#&lt;YOUR_SECRET_KEY&gt;
          </div>
          <p className="text-lg text-neutral-600 mb-4">
            When a browser requests a web resource, it sends the URL to the server but does 
            not send the fragment (the part after the #).
          </p>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-bold text-neutral-800 mb-4">Web Crypto API</h2>
          <p className="text-lg text-neutral-600 mb-4">
            We use the browser's built-in cryptography primitives via the Web Crypto API to encrypt 
            files in the browser. This ensures high performance and security without relying on 
            third-party JavaScript libraries for core encryption tasks.
          </p>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-bold text-neutral-800 mb-4">Transport Layer Security (TLS)</h2>
          <p className="text-lg text-neutral-600 mb-4">
            TLS (formerly known as SSL) is the industry-standard encryption protocol used to encrypt 
            communications between your browser and our servers. It ensures that the webpage code is 
            not modified by attackers and provides an additional layer of protection on top of the 
            client-side end-to-end encryption.
          </p>
        </section>
      </div>
    </div>
  )
}
