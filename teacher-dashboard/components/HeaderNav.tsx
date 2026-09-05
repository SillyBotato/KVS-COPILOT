import Link from "next/link";

export default function HeaderNav() {
  return (
    <nav className="flex items-center gap-4">
      <Link
        href="/"
        className="text-sm text-muted hover:text-foreground transition-colors"
      >
        Upload
      </Link>
      <Link
        href="/dashboard"
        className="text-sm text-muted hover:text-foreground transition-colors"
      >
        Dashboard
      </Link>
      <a
        href="https://kvs-copilot-demo-5q9e.vercel.app/"
        target="_blank"
        rel="noopener noreferrer"
        className="rounded-lg bg-success px-3 py-1.5 text-xs font-medium text-white hover:bg-success/90 transition-colors"
      >
        Open Portal
      </a>
    </nav>
  );
}
