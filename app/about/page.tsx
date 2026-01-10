export default function AboutPage() {
  return (
    <div className="container mx-auto max-w-3xl px-6 pt-12">
      <div className="prose prose-neutral dark:prose-invert max-w-none">
        <h1 className="text-4xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100 mb-8">Why We Built Drop</h1>
        
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-neutral-800 dark:text-neutral-200 mb-4">Why don't most web services end-to-end encrypt your data?</h2>
          <p className="text-lg text-neutral-600 dark:text-neutral-400 mb-4">
            There is not really a good reason for this.
          </p>
          <p className="text-lg text-neutral-600 dark:text-neutral-400 mb-4">
            Most cloud storage services transfer your data over an encrypted connection, but once it arrives at their datacenters, 
            they possess the key to unlock your files. They can unlock your data whenever they want—whether to scan it for ads, 
            hand it over to governments, or because of a security breach.
          </p>
          <div className="bg-orange-50 dark:bg-orange-900/20 border-l-4 border-brand-orange p-4 my-6 rounded-r-lg">
            <p className="font-medium text-orange-900 dark:text-orange-100">
              The lesson is: If your data is "encrypted" but someone else has the key to unlock it, then it's not truly safe.
            </p>
          </div>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-bold text-neutral-800 dark:text-neutral-200 mb-4">The importance of end-to-end encryption</h2>
          <p className="text-lg text-neutral-600 dark:text-neutral-400 mb-4">
            With end-to-end encryption, data is encrypted and decrypted only at the "end points". That means that service providers 
            in the middle (like us) don't have access to the keys, and therefore can't read your data.
          </p>
          <p className="text-lg text-neutral-600 dark:text-neutral-400 mb-4">
            We built Drop with end-to-end encryption as the default. When you use Drop, a key is generated on your device and used 
            to encrypt your files before they even leave your browser.
          </p>
          <p className="text-lg text-neutral-600 dark:text-neutral-400 mb-4">
            When you share a Drop link, the key is included in the URL fragment (the part after the #), which is never sent to our servers. 
            This means we physically cannot see your file contents even if we wanted to.
          </p>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-bold text-neutral-800 dark:text-neutral-200 mb-4">Simple, fast, and private</h2>
          <p className="text-lg text-neutral-600 dark:text-neutral-400 mb-4">
            Privacy shouldn't be complicated. We designed Drop to be the fastest way to send files securely. 
            You don't need to create an account to send files, and we don't track your download activity.
          </p>
          <p className="text-lg text-neutral-600 dark:text-neutral-400 mb-4">
            Every design decision in Drop begins with the safety and privacy of your data in mind. 
            We can't read your files, and no one else can either.
          </p>
        </section>
      </div>
    </div>
  )
}
