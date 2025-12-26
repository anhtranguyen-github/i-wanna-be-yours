import Link from "next/link";



export default function Footer() {
  return (
    <footer className="bg-white border-t border-slate-100 pt-16 pb-8">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 lg:gap-12 mb-12">
          {/* Brand Column */}
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="text-2xl font-black font-display text-brand-salmon">
              hanachan.org
            </Link>
            <p className="mt-4 text-sm text-neutral-ink leading-relaxed">
              The open-source platform to master Japanese & Korean.
              Self-hostable, free, and community-driven.
            </p>
            <div className="mt-6 flex gap-4">
              <SocialLink href="https://discord.com/invite/afefVyfAkH" label="Discord" icon={
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 16 16"><path d="M13.545 2.907a13.2 13.2 0 0 0-3.257-1.011.05.05 0 0 0-.052.025c-.141.25-.297.577-.406.833a12.2 12.2 0 0 0-3.658 0 8 8 0 0 0-.412-.833.05.05 0 0 0-.052-.025c-1.125.194-2.22.534-3.257 1.011a.04.04 0 0 0-.021.018C.356 6.024-.213 9.047.066 12.032q.003.022.021.037a13.3 13.3 0 0 0 3.995 2.02.05.05 0 0 0 .056-.019q.463-.63.818-1.329a.05.05 0 0 0-.01-.059l-.018-.011a9 9 0 0 1-1.248-.595.05.05 0 0 1-.02-.066l.015-.019q.127-.095.248-.195a.05.05 0 0 1 .051-.007c2.619 1.196 5.454 1.196 8.041 0a.05.05 0 0 1 .053.007q.121.1.248.195a.05.05 0 0 1-.004.085 8 8 0 0 1-1.249.594.05.05 0 0 0-.03.03.05.05 0 0 0 .003.041c.24.465.515.909.817 1.329a.05.05 0 0 0 .056.019 13.2 13.2 0 0 0 4.001-2.02.05.05 0 0 0 .021-.037c.334-3.451-.559-6.449-2.366-9.106a.03.03 0 0 0-.02-.019m-8.198 7.307c-.789 0-1.438-.724-1.438-1.612s.637-1.613 1.438-1.613c.807 0 1.45.73 1.438 1.613 0 .888-.637 1.612-1.438 1.612m5.316 0c-.788 0-1.438-.724-1.438-1.612s.637-1.613 1.438-1.613c.807 0 1.451.73 1.438 1.613 0 .888-.631 1.612-1.438 1.612" /></svg>
              } />
              <SocialLink href="https://github.com/tristcoil/hanachan.org" label="GitHub" icon={
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 16 16"><path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27s1.36.09 2 .27c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8" /></svg>
              } />
              <SocialLink href="https://reddit.com/r/hanachan" label="Reddit" icon={
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 16 16"><path d="M6.167 8a.83.83 0 0 0-.83.83c0 .459.372.84.83.831a.831.831 0 0 0 0-1.661m1.843 3.647c.315 0 1.403-.038 1.976-.611a.23.23 0 0 0 0-.306.213.213 0 0 0-.306 0c-.353.363-1.126.487-1.67.487-.545 0-1.308-.124-1.671-.487a.213.213 0 0 0-.306 0 .213.213 0 0 0 0 .306c.564.563 1.652.61 1.977.61zm.992-2.807c0 .458.373.83.831.83s.83-.381.83-.83a.831.831 0 0 0-1.66 0z" /><path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0m-3.828-1.165c-.315 0-.602.124-.812.325-.801-.573-1.9-.945-3.121-.993l.534-2.501 1.738.372a.83.83 0 1 0 .83-.869.83.83 0 0 0-.744.468l-1.938-.41a.2.2 0 0 0-.153.028.2.2 0 0 0-.086.134l-.592 2.788c-1.24.038-2.358.41-3.17.992-.21-.2-.496-.324-.81-.324a1.163 1.163 0 0 0-.478 2.224q-.03.17-.029.353c0 1.795 2.091 3.256 4.669 3.256s4.668-1.451 4.668-3.256c0-.114-.01-.238-.029-.353.401-.181.688-.592.688-1.069 0-.65-.525-1.165-1.165-1.165" /></svg>
              } />
            </div>
          </div>

          {/* Product */}
          <div className="flex flex-col gap-4">
            <h4 className="font-bold text-slate-700">Product</h4>
            <div className="flex flex-col gap-2 text-sm text-neutral-ink">
              <Link href="/features" className="hover:text-brand-salmon transition-colors">Features</Link>
              <Link href="/pricing" className="hover:text-brand-salmon transition-colors">Pricing</Link>
              <Link href="/roadmap" className="hover:text-brand-salmon transition-colors">Roadmap</Link>
              <Link href="/changelog" className="hover:text-brand-salmon transition-colors">Changelog</Link>
            </div>
          </div>

          {/* Company/Legal */}
          <div className="flex flex-col gap-4">
            <h4 className="font-bold text-slate-700">Legal</h4>
            <div className="flex flex-col gap-2 text-sm text-neutral-ink">
              <Link href="/privacy-policy" className="hover:text-brand-salmon transition-colors">Privacy Policy</Link>
              <Link href="/terms-of-service" className="hover:text-brand-salmon transition-colors">Terms of Service</Link>
              <Link href="/about" className="hover:text-brand-salmon transition-colors">About Us</Link>
            </div>
          </div>
        </div>

        <div className="pt-8 border-t border-slate-100 flex flex-col md:flex-row justify-between items-center text-sm text-neutral-ink">
          <CurrentYear />
          <div className="flex items-center gap-4 mt-4 md:mt-0">
            <span>Made with 🌸 in Tokyo</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

const SocialLink = ({ href, icon, label }: { href: string, icon: React.ReactNode, label: string }) => (
  <a href={href} target="_blank" rel="noopener noreferrer" className="text-neutral-ink hover:text-brand-salmon hover:scale-110 transition-all p-2 bg-slate-50 rounded-lg" aria-label={label}>
    {icon}
  </a>
);







const CurrentYear: React.FC = () => {
  const currentYear = new Date().getFullYear();
  return (
    <>
      Copyright {currentYear} @
      <a href="https://hanachan.org" target="_blank" rel="noopener noreferrer">
        hanachan.org
      </a>
    </>
  );
};






