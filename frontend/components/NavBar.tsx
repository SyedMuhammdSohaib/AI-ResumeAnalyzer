"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { TOOLS } from "@/lib/tools";

export default function NavBar() {
  const pathname = usePathname();

  return (
    <nav className="nav">
      <div className="nav-inner">
        <Link href="/" className="brand">
          AI Resume Analyzer
        </Link>
        <div className="nav-links">
          {[
            { href: "/", label: "Home" },
            ...TOOLS,
            { href: "/about", label: "About" },
            { href: "/contact", label: "Contact" },
          ].map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`nav-link${pathname === link.href ? " active" : ""}`}
            >
              {link.label}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
}
