"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import { TOOLS } from "@/lib/tools";

const SECTIONS = [
  { title: null, links: [{ href: "/", label: "Home" }] },
  { title: "Tools", links: TOOLS },
  {
    title: "More",
    links: [
      { href: "/about", label: "About" },
      { href: "/contact", label: "Contact" },
    ],
  },
];

export default function NavBar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  // Close the mobile drawer after navigating.
  useEffect(() => setOpen(false), [pathname]);

  return (
    <>
      <header className="topbar">
        <button
          type="button"
          className="menu-button"
          aria-label="Open menu"
          aria-expanded={open}
          aria-controls="sidebar"
          onClick={() => setOpen(true)}
        >
          ☰
        </button>
        <Link href="/" className="brand">
          AI Resume Analyzer
        </Link>
      </header>

      {open && <div className="sidebar-backdrop" onClick={() => setOpen(false)} />}

      <nav id="sidebar" className={`sidebar${open ? " open" : ""}`}>
        <div className="sidebar-head">
          <Link href="/" className="brand">
            AI Resume Analyzer
          </Link>
          <button
            type="button"
            className="menu-button close-button"
            aria-label="Close menu"
            onClick={() => setOpen(false)}
          >
            ✕
          </button>
        </div>
        {SECTIONS.map((section) => (
          <div className="sidebar-section" key={section.title ?? "main"}>
            {section.title && <p className="sidebar-title">{section.title}</p>}
            {section.links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`nav-link${pathname === link.href ? " active" : ""}`}
              >
                {link.label}
              </Link>
            ))}
          </div>
        ))}
      </nav>
    </>
  );
}
