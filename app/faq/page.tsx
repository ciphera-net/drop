import Link from 'next/link'

export default function FAQPage() {
  return (
    <div className="container mx-auto max-w-3xl px-6 pt-12">
      <div className="prose prose-neutral dark:prose-invert max-w-none">
        <h1 className="text-4xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100 mb-8">Frequently Asked Questions</h1>
        
        <div className="space-y-12">
          <section>
            <h3 className="text-xl font-bold text-neutral-900 dark:text-neutral-100 mb-3">Is Drop secure?</h3>
            <p className="text-lg text-neutral-600 dark:text-neutral-400">
              Yes. Drop uses end-to-end encryption to protect your files. This means your files are encrypted 
              in your browser before they are ever uploaded. We cannot view, access, or sell your data because 
              we never receive the decryption keys. You can read more on our <Link href="/security" className="text-brand-orange hover:text-orange-600 font-medium underline decoration-2 underline-offset-2">Security page</Link>.
            </p>
          </section>

          <section>
            <h3 className="text-xl font-bold text-neutral-900 dark:text-neutral-100 mb-3">How long are files stored?</h3>
            <p className="text-lg text-neutral-600 dark:text-neutral-400">
              Files uploaded to Drop are automatically deleted from our servers after 24 hours. 
              This ensures that your data doesn't linger online indefinitely.
            </p>
          </section>

          <section>
            <h3 className="text-xl font-bold text-neutral-900 dark:text-neutral-100 mb-3">What is the maximum file size?</h3>
            <p className="text-lg text-neutral-600 dark:text-neutral-400">
              Currently, we support file uploads up to 2 GB. We are working on increasing this limit 
              and adding support for peer-to-peer transfer for larger files in the future.
            </p>
          </section>

          <section>
            <h3 className="text-xl font-bold text-neutral-900 dark:text-neutral-100 mb-3">Do I need an account?</h3>
            <p className="text-lg text-neutral-600 dark:text-neutral-400">
              No. You can send and receive files without creating an account. However, creating an account 
              allows you to keep track of your active transfers and manage your shared files more easily.
            </p>
          </section>

          <section>
            <h3 className="text-xl font-bold text-neutral-900 dark:text-neutral-100 mb-3">Is there a mobile app?</h3>
            <p className="text-lg text-neutral-600 dark:text-neutral-400">
              Drop is a progressive web app that works great on all modern mobile browsers on iOS and Android. 
              You don't need to install anything from an app store.
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}
