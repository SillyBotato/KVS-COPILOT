import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { BarChart3, BookOpen, BriefcaseBusiness, CalendarDays, ChevronDown, ClipboardList, FileArchive, FileImage, FileText, GalleryVerticalEnd, Hammer, Image, LayoutDashboard, Menu, MessageSquare, Newspaper, Palette, PanelLeft, PenLine, SlidersHorizontal, Trash2, UserRound, Users, Video, X } from 'lucide-react';
import { Link, Route, Switch, useLocation, useParams, Router as WouterRouter } from 'wouter';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';
import type { LucideIcon } from 'lucide-react';

const queryClient = new QueryClient();
const KVS_DEMO_URL = import.meta.env.VITE_KVS_DEMO_URL || "http://localhost:5173";
const STORAGE_PREFIX = 'kvs-demo-statistics:';
const PROGRESS_STORAGE_KEY = 'kvs-demo-statistics-progress';

type ProgressState = Record<string, boolean>;

const readProgress = (): ProgressState => {
  try {
    const saved = window.localStorage.getItem(PROGRESS_STORAGE_KEY);
    if (!saved) return {};
    const parsed = JSON.parse(saved) as unknown;
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {};
    return Object.fromEntries(
      Object.entries(parsed).filter(([, value]) => typeof value === 'boolean'),
    );
  } catch {
    return {};
  }
};

type SavedRecord = {
  classId: string;
  className: string;
  shift: string;
  numberOfSections: string;
  authorisedCapacity: string;
  totalStudentsEnrolled: string;
  boys: string;
  girls: string;
  sc: string;
  st: string;
  obc: string;
  ph: string;
  gen: string;
  genMinority: string;
  lastUpdated: string;
};

const getAllClassIds = (): string[] => {
  const ids: string[] = [];
  for (let i = 0; i < window.localStorage.length; i++) {
    const key = window.localStorage.key(i);
    if (key?.startsWith(STORAGE_PREFIX)) {
      ids.push(key.slice(STORAGE_PREFIX.length));
    }
  }
  return ids;
};

const getSavedRecord = (classId: string): SavedRecord | null => {
  try {
    const saved = window.localStorage.getItem(`${STORAGE_PREFIX}${classId}`);
    if (!saved) return null;
    const parsed = JSON.parse(saved);
    return { ...parsed, classId } as SavedRecord;
  } catch {
    return null;
  }
};

const getAllSavedRecords = (): SavedRecord[] => {
  const ids = getAllClassIds();
  return ids.map((id) => getSavedRecord(id)).filter((r): r is SavedRecord => r !== null);
};

const isSectionBasedClass = (classId: string): boolean => {
  return /^class-(1[0-2]|[1-9])-(a|b)$/i.test(classId);
};

const getBaseClassId = (classId: string): string => {
  const match = classId.match(/^class-(\d+)-([ab])$/i);
  if (match) {
    return `class-${match[1]}`;
  }
  return classId;
};

const getRomanNumeral = (grade: string): string => {
  const romanNumerals: Record<string, string> = {
    '1': 'I', '2': 'II', '3': 'III', '4': 'IV', '5': 'V', '6': 'VI',
    '7': 'VII', '8': 'VIII', '9': 'IX', '10': 'X', '11': 'XI', '12': 'XII',
  };
  return romanNumerals[grade] || grade;
};

const aggregateSectionRecords = (records: SavedRecord[]): SavedRecord[] => {
  const sectionGroups: Record<string, SavedRecord[]> = {};
  
  for (const record of records) {
    if (isSectionBasedClass(record.classId)) {
      const baseId = getBaseClassId(record.classId);
      if (!sectionGroups[baseId]) sectionGroups[baseId] = [];
      sectionGroups[baseId].push(record);
    }
  }
  
  const aggregated: SavedRecord[] = [];
  
  for (const [baseId, sectionRecords] of Object.entries(sectionGroups)) {
    if (sectionRecords.length === 0) continue;
    
    const grade = baseId.replace('class-', '');
    const romanGrade = getRomanNumeral(grade);
    
    const sumField = (field: keyof SavedRecord): string => {
      let hasValidValue = false;
      const sum = sectionRecords
        .map((r) => {
          const parsed = parseInt(r[field], 10);
          if (!isNaN(parsed)) {
            hasValidValue = true;
            return parsed;
          }
          return NaN;
        })
        .filter((n) => !isNaN(n))
        .reduce((a, b) => a + b, 0);
      return hasValidValue ? String(sum) : '';
    };
    
    const firstRecord = sectionRecords[0];
    // Use the most recent lastUpdated from sections for aggregated record
    const latestUpdated = sectionRecords
      .map((r) => r.lastUpdated)
      .filter((d) => d)
      .sort()
      .pop() || '';
    
    aggregated.push({
      classId: baseId,
      className: `CLASS ${romanGrade}`,
      shift: firstRecord.shift,
      numberOfSections: sumField('numberOfSections'),
      authorisedCapacity: sumField('authorisedCapacity'),
      totalStudentsEnrolled: sumField('totalStudentsEnrolled'),
      boys: sumField('boys'),
      girls: sumField('girls'),
      sc: sumField('sc'),
      st: sumField('st'),
      obc: sumField('obc'),
      ph: sumField('ph'),
      gen: sumField('gen'),
      genMinority: sumField('genMinority'),
      lastUpdated: latestUpdated,
    });
  }
  
  return aggregated;
};

const buildPreviewPayload = (): { records: SavedRecord[] } => {
  const savedRecords = getAllSavedRecords();
  const aggregatedRecords = aggregateSectionRecords(savedRecords);
  
  const nonSectionRecords = savedRecords.filter((r) => !isSectionBasedClass(r.classId));
  const sectionBaseIds = new Set(aggregatedRecords.map((r) => r.classId));
  
  const finalRecords = [
    ...nonSectionRecords,
    ...aggregatedRecords,
  ].sort((a, b) => {
    const gradeA = parseInt(a.classId.replace('class-', '').split('-')[0], 10) || 99;
    const gradeB = parseInt(b.classId.replace('class-', '').split('-')[0], 10) || 99;
    if (gradeA !== gradeB) return gradeA - gradeB;
    return a.classId.localeCompare(b.classId);
  });
  
  return { records: finalRecords };
};

type FieldValues = {
  className: string;
  shift: string;
  numberOfSections: string;
  authorisedCapacity: string;
  totalStudentsEnrolled: string;
  boys: string;
  girls: string;
  sc: string;
  st: string;
  obc: string;
  ph: string;
  gen: string;
  genMinority: string;
};

const emptyFields = (className: string): FieldValues => ({
  className,
  shift: 'Any',
  numberOfSections: '',
  authorisedCapacity: '',
  totalStudentsEnrolled: '',
  boys: '',
  girls: '',
  sc: '',
  st: '',
  obc: '',
  ph: '',
  gen: '',
  genMinority: '',
});

const navItems: { label: string; href: string; icon: LucideIcon }[] = [
  { label: 'Dashboard', href: '/', icon: LayoutDashboard },
  { label: 'Posts', href: '/posts', icon: PenLine },
  { label: 'Media', href: '/media', icon: Image },
  { label: 'Pages', href: '/pages', icon: FileText },
  { label: 'Directory', href: '/directory', icon: Users },
  { label: 'Documents', href: '/documents', icon: FileArchive },
  { label: 'Events', href: '/events', icon: CalendarDays },
  { label: 'Contact', href: '/contact', icon: MessageSquare },
  { label: 'Footer Carousels', href: '/footer-carousels', icon: GalleryVerticalEnd },
  { label: 'Forms', href: '/forms', icon: ClipboardList },
  { label: 'Holidays', href: '/holidays', icon: CalendarDays },
  { label: 'Image Gallery', href: '/image-gallery', icon: FileImage },
  { label: 'Notices', href: '/notices', icon: Newspaper },
  { label: 'Sliders', href: '/sliders', icon: SlidersHorizontal },
  { label: 'Testimonials', href: '/testimonials', icon: MessageSquare },
  { label: 'Videos', href: '/videos', icon: Video },
  { label: 'Staff Details', href: '/staff-details', icon: BriefcaseBusiness },
  { label: 'Appearance', href: '/appearance', icon: Palette },
  { label: 'Profile', href: '/profile', icon: UserRound },
  { label: 'Tools', href: '/tools', icon: Hammer },
];

const statisticTypes = [
  '--',
  'Teacher Achievement',
  'Student Achievement',
  'Teacher Vacancy',
  'Class-Wise Enrolment Position',
  'Category-Wise Enrolment Position',
  'TC Issued',
  'Student Vacancy',
];

const classGroups = [
  { grade: '1', streams: ['A', 'B'] },
  { grade: '2', streams: ['A', 'B'] },
  { grade: '3', streams: ['A', 'B'] },
  { grade: '4', streams: ['A', 'B'] },
  { grade: '5', streams: ['A', 'B'] },
  { grade: '6', streams: ['A', 'B'] },
  { grade: '7', streams: ['A', 'B'] },
  { grade: '8', streams: ['A', 'B'] },
  { grade: '9', streams: ['A', 'B'] },
  { grade: '10', streams: ['A', 'B'] },
  { grade: '11', streams: ['ARTS', 'SCIENCE', 'COMMERCE'] },
  { grade: '12', streams: ['ARTS', 'SCIENCE', 'COMMERCE'] },
];

const romanNumerals: Record<string, string> = {
  '1': 'I', '2': 'II', '3': 'III', '4': 'IV', '5': 'V', '6': 'VI',
  '7': 'VII', '8': 'VIII', '9': 'IX', '10': 'X', '11': 'XI', '12': 'XII',
};

const slugForClass = (grade: string, stream: string) => `class-${grade}-${stream.toLowerCase()}`;
const displayClass = (grade: string, stream: string) => `${romanNumerals[grade]} ${stream[0] + stream.slice(1).toLowerCase()}`;

function AdminShell({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [noticeVisible, setNoticeVisible] = useState(true);
  const statisticsActive = location.startsWith('/statistics');

  return (
    <div className="admin-shell">
      <aside className={`admin-sidebar ${menuOpen ? 'open' : ''}`} data-testid="sidebar-admin">
        <div className="brand-lockup">
          <div className="brand-seal">KVS</div>
          <div>
            <div className="brand-title">PM SHRI KENDRIYA<br />VIDYALAYA</div>
            <div className="brand-subtitle">Demo Administration</div>
          </div>
        </div>
        <nav className="nav-section" aria-label="Admin navigation">
          <Link href="/" className={`nav-item ${location === '/' ? 'active' : ''}`} data-testid="link-dashboard">
            <LayoutDashboard className="nav-icon" size={15} /><span>Dashboard</span>
          </Link>
          {navItems.slice(1, 4).map((item) => <SidebarLink key={item.href} item={item} location={location} />)}
          <Link href="/statistics" className={`nav-item ${statisticsActive ? 'active' : ''}`} data-testid="nav-statistics">
            <BarChart3 className="nav-icon" size={15} /><span>Statistics</span><ChevronDown size={13} style={{ marginLeft: 'auto' }} />
          </Link>
          <Link href="/statistics" className={`nav-item nav-sub ${location === '/statistics' || location === '/statistics/class-wise' ? 'active' : ''}`} data-testid="link-all-statistics">
            <span>All Statistics</span>
          </Link>
          <Link href="/statistics/new" className={`nav-item nav-sub ${location === '/statistics/new' ? 'active' : ''}`} data-testid="link-add-statistics">
            <span>Add New Statistics</span>
          </Link>
          <div className="nav-divider" />
          {navItems.slice(4).map((item) => <SidebarLink key={item.href} item={item} location={location} />)}
        </nav>
      </aside>
      <div className="admin-main">
        <header className="admin-topbar">
          <div className="topbar-left">
            <button className="mobile-menu" type="button" onClick={() => setMenuOpen((open) => !open)} aria-label="Toggle navigation" data-testid="button-toggle-navigation"><Menu size={19} /></button>
            <PanelLeft size={15} />
            <span className="topbar-menu">ADMIN WORKSPACE</span>
            <span>/</span>
            <span>PM SHRI KENDRIYA VIDYALAYA — DEMO</span>
          </div>
          <div className="topbar-right">
            <span>Screen Options</span>
            <span className="topbar-user">portal_admin</span>
            <UserRound size={16} />
          </div>
        </header>
        <main className="content-wrap">
          {noticeVisible && (
            <div className="notice" data-testid="notice-license">
              <span>Demo workspace active. All records shown here are fictional and stored only in this browser.</span>
              <button type="button" onClick={() => setNoticeVisible(false)} aria-label="Dismiss notice" data-testid="button-dismiss-notice"><X size={15} /></button>
            </div>
          )}
          {children}
        </main>
      </div>
    </div>
  );
}

function SidebarLink({ item, location }: { item: { label: string; href: string; icon: LucideIcon }; location: string }) {
  const Icon = item.icon;
  return (
    <Link href={item.href} className={`nav-item ${location === item.href ? 'active' : ''}`} data-testid={`link-${item.label.toLowerCase().replaceAll(' ', '-')}`}>
      <Icon className="nav-icon" size={15} /><span>{item.label}</span>
    </Link>
  );
}

function PageHeading({ title, action = 'Add New Statistics', actionHref = '/statistics/new' }: { title: string; action?: string; actionHref?: string }) {
  return (
    <div className="page-heading">
      <h1 data-testid={`heading-${title.toLowerCase().replaceAll(' ', '-')}`}>{title}</h1>
      {action && <Link className="button secondary" href={actionHref} data-testid="link-add-new-statistics">{action}</Link>}
    </div>
  );
}

function DashboardPage() {
  return (
    <>
      <PageHeading title="Dashboard" action="" />
      <div className="dashboard-grid">
        <section className="dashboard-panel">
          <div className="panel-heading">Welcome to the Demo Administration Workspace</div>
          <div className="panel-body">
            <h2 className="welcome-title">Good morning, portal administrator.</h2>
            <p className="welcome-copy">Use the navigation menu to maintain the fictional school website. The Statistics area contains the complete Class-Wise Enrolment Position demonstration flow.</p>
            <div className="stat-strip">
              <div className="stat-box"><span className="stat-number">34</span><span className="stat-label">Demo statistics</span></div>
              <div className="stat-box"><span className="stat-number">26</span><span className="stat-label">Class entries</span></div>
              <div className="stat-box"><span className="stat-number">0</span><span className="stat-label">Pending reviews</span></div>
            </div>
          </div>
        </section>
        <section className="dashboard-panel">
          <div className="panel-heading">Quick links</div>
          <div className="panel-body">
            <ul className="quick-list">
              <li><Link href="/statistics" data-testid="quick-link-all-statistics">View All Statistics</Link></li>
              <li><Link href="/statistics/class-wise" data-testid="quick-link-class-wise">Class-Wise Enrolment Position</Link></li>
              <li><Link href="/statistics/new" data-testid="quick-link-add-statistics">Add New Statistics</Link></li>
            </ul>
          </div>
        </section>
      </div>
      <section className="dashboard-panel">
        <div className="panel-heading">System status</div>
        <div className="panel-body">
          <p className="welcome-copy">This is a screen-recording prototype. No authentication, server database, or live school information is connected.</p>
        </div>
      </section>
    </>
  );
}

function StatisticsToolbar({ selectedType, setSelectedType, onFilter, search, setSearch, onSearch, onApply }: { selectedType: string; setSelectedType: (value: string) => void; onFilter: () => void; search: string; setSearch: (value: string) => void; onSearch: () => void; onApply: () => void }) {
  return (
    <div className="toolbar" data-testid="statistics-toolbar">
      <select aria-label="Bulk actions" defaultValue="" data-testid="select-bulk-actions">
        <option value="">Bulk actions</option><option value="publish">Publish</option><option value="trash">Move to Trash</option>
      </select>
      <button className="button secondary" type="button" onClick={onApply} data-testid="button-apply-bulk">Apply</button>
      <select aria-label="Filter by date" defaultValue="all" data-testid="select-date"><option value="all">All dates</option><option value="current">Demo month</option><option value="previous">Previous month</option></select>
      <select className="type-select" aria-label="Statistics type" value={selectedType} onChange={(event) => setSelectedType(event.target.value)} data-testid="select-statistics-type">
        {statisticTypes.map((type) => <option key={type} value={type}>{type}</option>)}
      </select>
      <button className="button secondary" type="button" onClick={onFilter} data-testid="button-filter-statistics">Filter</button>
      <div className="search-group">
        <input type="search" value={search} onChange={(event) => setSearch(event.target.value)} aria-label="Search Statistics" data-testid="input-search-statistics" />
        <button className="button secondary" type="button" onClick={onSearch} data-testid="button-search-statistics">Search Statistics</button>
      </div>
    </div>
  );
}

function StatusLinks() {
  return (
    <div className="status-links" data-testid="status-links">
      <Link href="/statistics" data-testid="status-all">All (34)</Link><Link href="/statistics" data-testid="status-published">Published (28)</Link><Link href="/statistics" data-testid="status-scheduled">Scheduled (4)</Link><Link href="/statistics" data-testid="status-draft">Draft (2)</Link><Link href="/statistics" data-testid="status-trash">Trash (0)</Link>
    </div>
  );
}

function StatisticsPage() {
  const [, setLocation] = useLocation();
  const [selectedType, setSelectedType] = useState('--');
  const [search, setSearch] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');
  const [bulkMessage, setBulkMessage] = useState('');
  const genericRows = ['Demo annual report', 'Demo achievement record', 'Demo vacancy record', 'Demo attendance summary', 'Demo school notice'];
  const rows = useMemo(() => genericRows.filter((row) => row.toLowerCase().includes(appliedSearch.toLowerCase())), [appliedSearch]);

  return (
    <>
      <PageHeading title="Statistics" />
      <StatusLinks />
      {bulkMessage && <div className="confirmation" data-testid="text-bulk-confirmation">{bulkMessage}</div>}
      <StatisticsToolbar selectedType={selectedType} setSelectedType={setSelectedType} onFilter={() => selectedType === 'Class-Wise Enrolment Position' ? setLocation('/statistics/class-wise') : setBulkMessage('Select Class-Wise Enrolment Position to open the class listing.')} search={search} setSearch={setSearch} onSearch={() => setAppliedSearch(search)} onApply={() => setBulkMessage('Bulk action is ready for the selected demo records.')} />
      <div className="table-frame">
        <table className="admin-table">
          <thead><tr><th className="checkbox-cell"><input type="checkbox" aria-label="Select all records" data-testid="checkbox-select-all" /></th><th>Title <span className="muted-line">↕</span></th><th>Date <span className="muted-line">↕</span></th><th>Type</th><th>Status</th></tr></thead>
          <tbody>
            {rows.map((row, index) => <tr key={row}><td className="checkbox-cell"><input type="checkbox" aria-label={`Select ${row}`} data-testid={`checkbox-statistic-${index}`} /></td><td><span className="title-link" data-testid={`text-statistic-title-${index}`}>{row}</span><div className="muted-line">Edit&nbsp; | &nbsp;Quick Edit&nbsp; | &nbsp;Trash&nbsp; | &nbsp;View</div></td><td><span className="muted-line">Published</span><br />Demo date, 10:{20 + index} am</td><td>General demo</td><td><span className="muted-line">Published</span></td></tr>)}
            {rows.length === 0 && <tr><td colSpan={5} className="empty-table" data-testid="empty-statistics">No demo records found.</td></tr>}
          </tbody>
        </table>
      </div>
      <div className="pagination-row"><span>34 items</span><button className="pager" type="button" data-testid="button-first-page">«</button><button className="pager" type="button" data-testid="button-previous-page">‹</button><button className="pager current" type="button" data-testid="button-current-page">1</button><button className="pager" type="button" data-testid="button-next-page">›</button><button className="pager" type="button" data-testid="button-last-page">»</button></div>
    </>
  );
}

function NewStatisticsPage() {
  return (
    <>
      <PageHeading title="Add New Statistics" action="" />
      <div className="demo-placeholder" data-testid="demo-section-add-statistics">
        <h2>Demo Section</h2>
        <p>This entry point is reserved for creating additional statistic types. For the demonstration workflow, open All Statistics and filter by Class-Wise Enrolment Position.</p>
      </div>
    </>
  );
}

type ListingRow = { kind: 'total' | 'entry'; label?: string; grade?: string; stream?: string; language?: 'English' | 'Hindi' };
const listingRows: ListingRow[] = classGroups.flatMap((group) => [
  ...group.streams.flatMap((stream) => [
    { kind: 'entry' as const, label: `CLASS-${group.grade} ${stream}`, grade: group.grade, stream, language: 'English' as const },
    { kind: 'entry' as const, label: `कक्षा-${group.grade} ${stream === 'A' || stream === 'B' ? stream : stream === 'ARTS' ? 'कला' : stream === 'SCIENCE' ? 'विज्ञान' : 'वाणिज्य'}`, grade: group.grade, stream, language: 'Hindi' as const },
  ]),
  { kind: 'total' as const, label: `TOTAL — CLASS-${group.grade}` },
]);

function ClassListingPage() {
  const [, setLocation] = useLocation();
  const [search, setSearch] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');
  const [progress, setProgress] = useState<ProgressState>(() => readProgress());
  const [resetMessage, setResetMessage] = useState('');
  const filteredRows = useMemo(() => listingRows.filter((row) => row.kind === 'total' || row.label?.toLowerCase().includes(appliedSearch.toLowerCase())), [appliedSearch]);
  const completedCount = Object.values(progress).filter(Boolean).length;

  const handleResetProgress = () => {
    window.localStorage.removeItem(PROGRESS_STORAGE_KEY);
    setProgress({});
    setResetMessage('Progress reset successfully.');
  };

  return (
    <>
      <PageHeading title="Class-Wise Enrolment Position" />
      <StatusLinks />
      <div className="progress-toolbar" data-testid="progress-toolbar">
        <span><strong>{completedCount}</strong> of 26 class sections completed</span>
        <button className="button secondary" type="button" onClick={handleResetProgress} data-testid="button-reset-progress">Reset Progress</button>
      </div>
      {resetMessage && <div className="confirmation" data-testid="text-progress-reset">{resetMessage}</div>}
      <StatisticsToolbar selectedType="Class-Wise Enrolment Position" setSelectedType={() => undefined} onFilter={() => undefined} search={search} setSearch={setSearch} onSearch={() => setAppliedSearch(search)} onApply={() => undefined} />
      <div className="table-frame">
        <table className="admin-table">
          <thead><tr><th className="checkbox-cell"><input type="checkbox" aria-label="Select all class records" data-testid="checkbox-select-all-classes" /></th><th>Title <span className="muted-line">↕</span></th><th>Date <span className="muted-line">↕</span></th><th>English</th><th>हिन्दी</th></tr></thead>
          <tbody>
            {filteredRows.map((row, index) => row.kind === 'total' ? (
              <tr key={`total-${row.label}`}><td colSpan={5} style={{ background: 'hsl(232 38% 96%)', color: 'hsl(231 52% 42%)', fontWeight: 600, letterSpacing: '.04em' }} data-testid={`row-total-${index}`}>{row.label}</td></tr>
            ) : (
              <tr key={`${row.label}-${row.language}`} data-testid={`row-class-${row.grade}-${row.stream}-${row.language}`}>
                <td className="checkbox-cell"><input type="checkbox" aria-label={`Select ${row.label}`} data-testid={`checkbox-class-${row.grade}-${row.stream}-${row.language}`} /></td>
                <td>{row.language === 'English' ? <Link href={`/statistics/edit/${slugForClass(row.grade!, row.stream!)}`} className="title-link" data-testid={`link-class-${row.grade}-${row.stream}`}>{row.label}</Link> : <button type="button" className="title-link" style={{ border: 0, background: 'transparent', padding: 0 }} onClick={() => undefined} data-testid={`button-hindi-class-${row.grade}-${row.stream}`}>{row.label}</button>}{progress[slugForClass(row.grade!, row.stream!)] && <span className="completion-mark" title="Completed" aria-label="Completed">✓</span>}<div className="muted-line">— {row.language === 'English' ? 'Published' : 'Published'}</div></td>
                <td><span className="muted-line">Published</span><br />Demo date, 11:05 am</td>
                <td>{row.language === 'English' ? <span className="table-icon" aria-label="English entry"><BookOpen size={15} /></span> : <span className="muted-line">—</span>}</td>
                <td>{row.language === 'Hindi' ? <span className="table-icon" aria-label="Hindi entry"><BookOpen size={15} /></span> : <span className="muted-line">—</span>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="pagination-row"><span>34 items</span><button className="pager current" type="button" data-testid="button-class-page">1</button></div>
    </>
  );
}

const numericFields: { id: keyof FieldValues; label: string }[] = [
  { id: 'numberOfSections', label: 'Number of Section/s' },
  { id: 'authorisedCapacity', label: 'Authorised Capacity' },
  { id: 'totalStudentsEnrolled', label: 'Total Students Enrolled' },
  { id: 'boys', label: 'Boys' },
  { id: 'girls', label: 'Girls' },
  { id: 'sc', label: 'S. C.' },
  { id: 'st', label: 'S. T.' },
  { id: 'obc', label: 'O. B. C.' },
  { id: 'ph', label: 'P. H.' },
  { id: 'gen', label: 'GEN' },
  { id: 'genMinority', label: 'GEN Minority [Inc. Muslim]' },
];

function EditStatisticsPage() {
  const params = useParams<{ classId: string }>();
  const [, setLocation] = useLocation();
  const classId = params.classId || 'class-12-science';
  const matched = classId.match(/^class-(\d+)-(.+)$/);
  const grade = matched?.[1] || '12';
  const stream = (matched?.[2] || 'science').toUpperCase();
  const className = displayClass(grade, stream);
  const [values, setValues] = useState<FieldValues>(() => emptyFields(className));
  const [updated, setUpdated] = useState(false);
  const [completed, setCompleted] = useState(() => readProgress()[classId] === true);

  useEffect(() => {
    const saved = window.localStorage.getItem(`${STORAGE_PREFIX}${classId}`);
    if (saved) {
      try { setValues({ ...emptyFields(className), ...JSON.parse(saved) as Partial<FieldValues>, className }); } catch { setValues(emptyFields(className)); }
    }
    setCompleted(readProgress()[classId] === true);
  }, [classId, className]);

  const updateField = (key: keyof FieldValues, value: string) => {
    setValues((current) => ({ ...current, [key]: value }));
    setUpdated(false);
  };

  const handleMoveToTrash = () => {
    window.localStorage.removeItem(`${STORAGE_PREFIX}${classId}`);
    const nextProgress = { ...readProgress() };
    delete nextProgress[classId];
    window.localStorage.setItem(PROGRESS_STORAGE_KEY, JSON.stringify(nextProgress));
    setValues(emptyFields(className));
    setCompleted(false);
    setUpdated(false);
  };

  const handleUpdate = () => {
    const readLiveValue = (id: string, fallback: string) => {
      const element = document.getElementById(id) as HTMLInputElement | HTMLSelectElement | null;
      return element?.value ?? fallback;
    };
    const structured = {
      className: readLiveValue('class', className),
      shift: readLiveValue('shift', values.shift),
      numberOfSections: readLiveValue('number-of-sections', values.numberOfSections),
      authorisedCapacity: readLiveValue('authorised-capacity', values.authorisedCapacity),
      totalStudentsEnrolled: readLiveValue('total-students-enrolled', values.totalStudentsEnrolled),
      boys: readLiveValue('boys', values.boys),
      girls: readLiveValue('girls', values.girls),
      sc: readLiveValue('sc', values.sc),
      st: readLiveValue('st', values.st),
      obc: readLiveValue('obc', values.obc),
      ph: readLiveValue('ph', values.ph),
      gen: readLiveValue('gen', values.gen),
      genMinority: readLiveValue('gen-minority', values.genMinority),
      lastUpdated: new Date().toISOString(),
    };
    window.localStorage.setItem(`${STORAGE_PREFIX}${classId}`, JSON.stringify(structured));
    const nextProgress = { ...readProgress(), [classId]: true };
    window.localStorage.setItem(PROGRESS_STORAGE_KEY, JSON.stringify(nextProgress));
    setValues(structured);
    setCompleted(true);
    setUpdated(true);
  };

  return (
    <>
      <PageHeading title="Edit Statistics" />
      {completed && <div className="completion-banner" data-testid="text-section-completed"><span className="completion-mark" aria-hidden="true">✓</span> This class section is completed.</div>}
      {updated && <div className="confirmation" data-testid="text-update-confirmation">Statistics updated successfully.</div>}
      <div className="form-layout">
        <form className="form-main" onSubmit={(event) => { event.preventDefault(); handleUpdate(); }} data-testid="form-edit-statistics">
          <section className="form-panel">
            <div className="form-panel-title">Statistics</div>
            <div className="form-panel-body">
              <p className="permalink">Permalink: <span>https://demo.kvs.example/statistics/{classId}</span> <button className="button secondary" type="button" data-testid="button-edit-permalink">Edit</button></p>
              <div className="field-row"><label htmlFor="type">Type</label><input className="field-input" id="type" value="Class-Wise Enrolment Position" readOnly data-field="type" /></div>
              <div className="field-row"><label htmlFor="class">Class</label><input className="field-input" id="class" value={values.className} readOnly data-field="class" /></div>
              <div className="field-row"><label htmlFor="shift">Shift</label><select className="field-select" id="shift" value={values.shift} onChange={(event) => updateField('shift', event.target.value)} data-field="shift"><option value="Any">Any</option><option value="Morning">Morning</option><option value="Evening">Evening</option></select></div>
            </div>
          </section>
          <section className="form-panel">
            <div className="form-panel-title">Enrolment Position</div>
            <div className="form-panel-body">
              {numericFields.map(({ id, label }) => {
                const htmlId = id === 'genMinority' ? 'gen-minority' : id.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`);
                return <div className="field-row" key={id}><label htmlFor={htmlId}>{label}</label><input className="field-input" id={htmlId} data-field={htmlId} data-testid={`input-${htmlId}`} type="number" min="0" value={values[id]} onChange={(event) => updateField(id, event.target.value)} /></div>;
              })}
            </div>
          </section>
          <button className="button" type="submit" data-testid="button-update-statistics">Update</button>
        </form>
        <aside className="publish-panel">
          <div className="form-panel-title">Publish</div>
<div className="publish-body">
              <button className="button secondary preview-button" type="button" onClick={() => { const payload = buildPreviewPayload(); const previewData = encodeURIComponent(JSON.stringify(payload)); window.location.assign(`${KVS_DEMO_URL}?preview=${previewData}`); }} data-testid="button-preview-changes">Preview Changes</button>
            <ul className="publish-meta">
              <li><b>Status:</b><span>Published <button className="title-link" type="button" onClick={() => undefined} data-testid="button-edit-status">Edit</button></span></li>
              <li><b>Visibility:</b><span>Public <button className="title-link" type="button" onClick={() => undefined} data-testid="button-edit-visibility">Edit</button></span></li>
              <li><b>Published on:</b><span>Demo Date <button className="title-link" type="button" onClick={() => undefined} data-testid="button-edit-date">Edit</button></span></li>
            </ul>
            <div className="publish-footer">
              <button className="button danger" type="button" onClick={handleMoveToTrash} data-testid="button-move-to-trash"><Trash2 size={13} style={{ verticalAlign: 'middle', marginRight: 4 }} />Move to Trash</button>
              <button className="button" type="button" onClick={handleUpdate} data-testid="button-publish-update">Update</button>
            </div>
          </div>
        </aside>
      </div>
    </>
  );
}

function PlaceholderPage() {
  const [location] = useLocation();
  const section = location.slice(1).replaceAll('-', ' ');
  return (
    <>
      <PageHeading title={section ? section.replace(/\b\w/g, (letter) => letter.toUpperCase()) : 'Demo Section'} action="" />
      <div className="demo-placeholder" data-testid={`demo-section-${section.replaceAll(' ', '-') || 'default'}`}>
        <h2>Demo Section</h2>
        <p>This administrative section is included for navigation continuity. The Statistics workflow is available from the sidebar.</p>
      </div>
    </>
  );
}

function RoutedErrorBoundary({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  return <ErrorBoundary resetKey={location}>{children}</ErrorBoundary>;
}

function Router() {
  return (
    <AdminShell>
      <RoutedErrorBoundary>
        <Switch>
          <Route path="/" component={DashboardPage} />
          <Route path="/statistics" component={StatisticsPage} />
          <Route path="/statistics/new" component={NewStatisticsPage} />
          <Route path="/statistics/class-wise" component={ClassListingPage} />
          <Route path="/statistics/edit/:classId" component={EditStatisticsPage} />
          <Route path="/:section" component={PlaceholderPage} />
          <Route component={NotFound} />
        </Switch>
      </RoutedErrorBoundary>
    </AdminShell>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;