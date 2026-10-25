"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import { TOOLS } from "@/lib/tools";

const SECTIONS = [
  {
    title: null,
    links: [
      { href: "/", label: "Home" },
      { href: "/history", label: "History" },
    ],
  },
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
  // Collapsible groups start closed, except the one holding the current page.
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  // Close the mobile drawer after navigating, and keep the current page's group open.
  useEffect(() => {
    setOpen(false);
    const current = SECTIONS.find((s) => s.title && s.links.some((l) => l.href === pathname));
    if (current?.title) setExpanded((prev) => ({ ...prev, [current.title as string]: true }));
  }, [pathname]);

  function toggle(title: string) {
    setExpanded((prev) => ({ ...prev, [title]: !prev[title] }));
  }

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
        {SECTIONS.map((section) => {
          const isOpen = !section.title || !!expanded[section.title];
          const listId = `nav-${(section.title ?? "main").toLowerCase()}`;
          return (
            <div className="sidebar-section" key={section.title ?? "main"}>
              {section.title && (
                <button
                  type="button"
                  className={`sidebar-toggle${isOpen ? " open" : ""}`}
                  aria-expanded={isOpen}
                  aria-controls={listId}
                  onClick={() => toggle(section.title as string)}
                >
                  {section.title}
                  <svg className="chevron" viewBox="0 0 16 16" width="14" height="14" aria-hidden="true">
                    <path
                      d="M6 4l4 4-4 4"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>
              )}
              {isOpen && (
                <div id={listId} className={section.title ? "sidebar-group" : "sidebar-list"}>
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
              )}
            </div>
          );
        })}
      </nav>
    </>
  );
}
