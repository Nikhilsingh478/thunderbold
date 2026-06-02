import { Download } from 'lucide-react';

const ApkBanner = () => (
  <a
    href="/Thunderbolt.apk"
    download="Thunderbold.apk"
    className="fixed top-0 left-0 w-full z-[130] h-9 flex items-center justify-center gap-2 cursor-pointer hover:brightness-110 transition-all duration-200"
    style={{ background: 'linear-gradient(90deg, #b8820f, #e8b93a, #b8820f)' }}
  >
    <Download size={12} strokeWidth={2.5} className="text-black/70 flex-shrink-0" />
    <span className="font-condensed font-bold text-[0.7rem] tracking-[0.2em] uppercase text-black/80">
      Download Our App
    </span>
  </a>
);

export default ApkBanner;
