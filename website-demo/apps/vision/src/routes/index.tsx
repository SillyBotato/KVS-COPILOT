import { createFileRoute } from "@tanstack/react-router";
import {
  Accessibility,
  BookOpen,
  ChevronDown,
  LogIn,
  Menu,
  Search,
  Share2,
  Network,
  Type,
} from "lucide-react";
import { useEffect, useState } from "react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "PM SHRI KENDRIYA VIDYALAYA" },
      {
        name: "description",
        content: "Class and social category wise enrolment position portal.",
      },
      { property: "og:title", content: "PM SHRI KENDRIYA VIDYALAYA" },
      {
        property: "og:description",
        content: "Class and social category wise enrolment position portal.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

const pageOptions = [
  "Class and Social Category Wise Enrolment Position",
  "Admission Category Wise Enrollment Status",
  "Transfer Certificate Issued",
  "Student Vacancy",
] as const;

type PageName = (typeof pageOptions)[number];

const classes = [
  "XII Science",
  "XII Commerce",
  "XII Arts",
  "XI Science",
  "XI Commerce",
  "XI Arts",
  "X",
  "IX",
  "VIII",
  "VII",
  "VI",
  "V",
  "IV",
  "III",
  "II",
  "I",
];

const columns = [
  ["Number", "of", "sections"],
  ["authorized", "capacity"],
  ["Total", "Enrolled", "Students"],
  ["boys"],
  ["girls"],
  ["scheduled", "caste"],
  ["Scheduled", "Tribes"],
  ["Other", "Backward", "Classes"],
  ["disabled"],
  ["General"],
  ["General", "minorities", "[includes", "Muslims]"],
  ["Last", "Updated"],
];

type PreviewRecord = { classId: string; className: string; shift?: string; numberOfSections: string; authorisedCapacity: string; totalStudentsEnrolled: string; boys: string; girls: string; sc: string; st: string; obc: string; ph: string; gen: string; genMinority: string; lastUpdated: string; };
type PreviewData = { records: PreviewRecord[] };

function Index() {
  const [previewData, setPreviewData] = useState<PreviewData | null>(null);
  useEffect(() => {
    const raw = new URLSearchParams(window.location.search).get("preview");
    if (!raw) return;
    try { 
      const parsed = JSON.parse(raw);
      // Support both old single-record format and new collection format
      if (parsed.records && Array.isArray(parsed.records)) {
        setPreviewData(parsed as PreviewData);
      } else if (parsed.className) {
        // Legacy single record format - wrap in array
        setPreviewData({ records: [parsed as PreviewRecord] });
      }
    } catch (error) { console.error("Invalid preview data", error); }
  }, []);
  const [menuOpen, setMenuOpen] = useState(false);
  const [activePage, setActivePage] = useState<PageName>(pageOptions[0]);

  const choosePage = (page: PageName) => {
    setActivePage(page);
    setMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-background font-portal text-foreground">
      <UtilityBar />
      <InstitutionHeader />
      <PortalNavigation
        menuOpen={menuOpen}
        activePage={activePage}
        onToggle={() => setMenuOpen((open) => !open)}
        onChoose={choosePage}
      />

      <main className="portal-content">
        <div className="flex items-start justify-between gap-6">
          <nav aria-label="Breadcrumb" className="portal-breadcrumb">
            <button type="button" onClick={() => choosePage(pageOptions[0])}>
              Home Page
            </button>
            <span aria-hidden="true">›</span>
            <button type="button" onClick={() => setMenuOpen(true)}>
              Enrollment Statistics
            </button>
            <span aria-hidden="true">›</span>
            <span className="text-foreground">{activePage}</span>
          </nav>
          <div className="hidden shrink-0 items-center gap-4 pt-7 text-muted-foreground md:flex">
            <button aria-label="Print page" className="portal-icon-action" type="button">
              <span className="text-xl">▤</span>
            </button>
            <span className="h-7 border-l border-border" />
            <button aria-label="Share page" className="portal-icon-action" type="button">
              <Share2 size={19} />
            </button>
          </div>
        </div>

        <h1 className="portal-page-title">{activePage}</h1>

        {activePage === pageOptions[0] ? (
          <EnrollmentTable previewData={previewData} />
        ) : (
          <div className="min-h-[420px] border-t border-border" aria-label={`${activePage} content`} />
        )}
      </main>
    </div>
  );
}

function UtilityBar() {
  const utilities = [
    { label: "Login", icon: LogIn },
    { label: "Search", icon: Search },
    { label: "Accessibility", icon: Accessibility },
    { label: "Sitemap", icon: Network },
    { label: "Font size", icon: Type },
  ];

  return (
    <div className="portal-utility-bar">
      <div className="portal-shell flex h-full items-center justify-between">
        <span className="text-[14px]">Ministry of Education</span>
        <div className="flex h-full items-stretch">
          {utilities.map(({ label, icon: Icon }) => (
            <button key={label} type="button" aria-label={label} title={label} className="utility-button">
              <Icon size={21} strokeWidth={2} />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function InstitutionHeader() {
  return (
    <header className="portal-institution-header">
      <div className="portal-shell flex h-full items-center justify-between gap-5 py-4">
        <div className="flex min-w-0 items-center gap-5">
          <div className="kvs-emblem" aria-label="Kendriya Vidyalaya emblem">
            <BookOpen size={42} strokeWidth={1.7} />
            <span>KVS</span>
          </div>
          <div className="min-w-0">
            <div className="institution-name">PM SHRI KENDRIYA VIDYALAYA</div>
            <p className="institution-subtitle">
              An autonomous body under the Ministry of Education, Government of India
            </p>
          </div>
        </div>
        <div className="pm-shri-mark" aria-label="PM SHRI institutional mark">
          <span className="pm-mark-small">PM</span>
          <span className="pm-mark-large">SHRI</span>
          <span className="pm-mark-caption">Schools for a rising India</span>
        </div>
      </div>
    </header>
  );
}

type NavigationProps = {
  menuOpen: boolean;
  activePage: PageName;
  onToggle: () => void;
  onChoose: (page: PageName) => void;
};

function PortalNavigation({ menuOpen, activePage, onToggle, onChoose }: NavigationProps) {
  return (
    <nav aria-label="Primary navigation" className="portal-navigation">
      <div className="portal-shell flex h-full min-w-max items-stretch">
        <NavItem label="Home Page" />
        <NavItem label="About Us" dropdown />
        <NavItem label="Academic" dropdown />
        <NavItem label="Administration" dropdown />
        <div className="relative">
          <button
            type="button"
            className={`nav-item h-full ${menuOpen ? "nav-item-active" : ""}`}
            aria-expanded={menuOpen}
            aria-haspopup="menu"
            onClick={onToggle}
          >
            Enrollment Statistics <ChevronDown size={17} />
          </button>
          {menuOpen && (
            <div className="enrollment-dropdown" role="menu">
              {pageOptions.map((page) => (
                <button
                  type="button"
                  role="menuitem"
                  key={page}
                  className={page === activePage ? "dropdown-option dropdown-option-current" : "dropdown-option"}
                  onClick={() => onChoose(page)}
                >
                  {page}
                </button>
              ))}
            </div>
          )}
        </div>
        <NavItem label="Activities" dropdown />
        <NavItem label="Gallery" dropdown />
        <NavItem label="Online Fees" />
        <NavItem label="Alumni" />
        <button type="button" className="nav-menu-button" aria-label="Open site menu">
          <Menu size={34} strokeWidth={2.5} />
        </button>
      </div>
    </nav>
  );
}

function NavItem({ label, dropdown = false }: { label: string; dropdown?: boolean }) {
  return (
    <button type="button" className="nav-item">
      {label} {dropdown && <ChevronDown size={17} />}
    </button>
  );
}

function EnrollmentTable({ previewData }: { previewData: PreviewData | null }) {
  const normalize = (value: string) => value.replace(/^Class\s+/i, "").trim().toUpperCase();
  
  const formatLastUpdated = (value: string): string => {
    if (!value) return "";
    const isoMatch = value.match(/^(\d{4})-(\d{2})-(\d{2})T/);
    if (isoMatch) {
      return `${isoMatch[3]}/${isoMatch[2]}/${isoMatch[1]}`;
    }
    return value;
  };
  
  const recordMap = new Map<string, PreviewRecord>();
  if (previewData?.records) {
    for (const record of previewData.records) {
      const key = normalize(record.className);
      recordMap.set(key, record);
    }
  }
  
  const columnFields: (keyof PreviewRecord)[] = [
    'numberOfSections',
    'authorisedCapacity',
    'totalStudentsEnrolled',
    'boys',
    'girls',
    'sc',
    'st',
    'obc',
    'ph',
    'gen',
    'genMinority',
    'lastUpdated',
  ];
  
  return (
    <div className="portal-table-scroll" tabIndex={0} aria-label="Scrollable enrollment table">
      <table className="enrollment-table">
        <thead>
          <tr>
            <th scope="col">Class</th>
            {columns.map((lines) => (
              <th scope="col" key={lines.join(" ")}>
                {lines.map((line) => (
                  <span key={line}>{line}</span>
                ))}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {classes.map((className) => {
            const normalizedClass = normalize(className);
            const record = recordMap.get(normalizedClass);
            const row = record ? columnFields.map((field) => record[field] ?? "") : [];
            return <tr key={className}>
              <th scope="row">{className}</th>
              {columns.map((lines, index) => { 
                let value = row[index] ?? ""; 
                if (index === 11) {
                  value = formatLastUpdated(value);
                }
                return <td key={`${className}-${lines.join("-")}`} aria-label={`${className} ${lines.join(" ")}: ${value || "blank"}`}>{value}</td>; 
              })}
            </tr>;
          })}
        </tbody>
      </table>
    </div>
  );
}