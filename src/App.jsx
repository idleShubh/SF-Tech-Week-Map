import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowRight, Bookmark, CalendarDays, Check, ChevronDown, Copy, Download,
  ExternalLink, Filter, MapPin, PanelLeftClose, PanelLeftOpen, Search, SlidersHorizontal, X,
} from 'lucide-react';
import { Analytics } from '@vercel/analytics/react';
import MapView from './MapView.jsx';
import { accessLabel, allEvents, categories, categoryLabel, dates } from './events.js';
import { eventsInPlan, planIdsFromUrl, planImageDataUrl, planUrl, xIntentUrl } from './share.js';

const STORAGE_KEY = 'sftechweekmap:saved:v1';

function AlanMark() {
  return <svg width="18" height="20" viewBox="0 0 11 12" fill="currentColor" role="img" aria-label="Alan logo"><rect x="0" y="3" width="3" height="9" rx="1.5" /><rect x="4" y="0" width="3" height="6" rx="1.5" /><rect x="8" y="3" width="3" height="9" rx="1.5" /></svg>;
}

function readSaved() {
  try {
    const fromUrl = planIdsFromUrl(window.location.href);
    const knownIds = new Set(allEvents.map((event) => event.id));
    if (fromUrl) return [...new Set(fromUrl.split(',').filter((id) => knownIds.has(id)))];
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    return Array.isArray(saved) ? [...new Set(saved.filter((id) => knownIds.has(id)))] : [];
  } catch { return []; }
}

function dayParts(value) {
  const date = new Date(`${value}T12:00:00Z`);
  return {
    weekday: new Intl.DateTimeFormat('en-US', { weekday: 'short', timeZone: 'UTC' }).format(date),
    number: date.getUTCDate(),
  };
}

function EventRow({ event, selected, saved, onSelect, onToggleSave }) {
  return (
    <article className={`event-row ${selected ? 'event-row--selected' : ''}`}>
      <button className="event-row__main" onClick={() => onSelect(event.id)} aria-label={`View ${event.name}`}>
        <span className="event-row__date">{event.dateText}<small>{event.shortTime}</small></span>
        <span className="event-row__body">
          <strong>{event.name}</strong>
          <span className="event-row__location"><MapPin size={13} aria-hidden="true" />{event.neighborhood === 'unknown' ? 'Location to be announced' : event.neighborhood}{event.isOutsideSF ? ' · Bay Area' : ''}</span>
          <span className="event-row__meta"><span>{event.isFree ? 'Free' : 'Paid'}</span><span>{accessLabel(event.access)}</span></span>
        </span>
      </button>
      <button className={`icon-button save-button ${saved ? 'save-button--active' : ''}`} onClick={() => onToggleSave(event.id)} aria-label={`${saved ? 'Remove' : 'Save'} ${event.name} ${saved ? 'from' : 'to'} my plan`} title={saved ? 'Remove from plan' : 'Save to plan'}>
        <Bookmark size={18} fill={saved ? 'currentColor' : 'none'} aria-hidden="true" />
      </button>
    </article>
  );
}

function EventDetail({ event, saved, onClose, onToggleSave }) {
  const addressKnown = !/hidden|address shared|exact address|see conference site|to be announced|neighborhood unknown/i.test(event.venue);
  return (
    <aside className="detail-panel" aria-label="Event details">
      <button className="icon-button detail-panel__close" onClick={onClose} aria-label="Close event details"><X size={18} /></button>
      <div className="detail-panel__eyebrow">{event.topPick ? `TOP 50 PICK · #${String(event.rank).padStart(2, '0')}` : 'EVENT'} <span>·</span> {categoryLabel(event.category)}</div>
      <h2>{event.name}</h2>
      <p className="detail-panel__host">Hosted by {event.host}</p>
      <p className="detail-panel__why">{event.why_attend}</p>
      <div className="detail-panel__facts">
        <div><CalendarDays size={17} aria-hidden="true" /><span>{event.dateText} · {event.shortTime} PT{event.endDate !== event.date && <small>Multi-day event — check daily hours on the event page</small>}</span></div>
        <div><MapPin size={17} aria-hidden="true" /><span>{event.neighborhood === 'unknown' ? 'Location to be announced' : event.neighborhood}<small>{event.venue}</small></span></div>
        <div><Filter size={17} aria-hidden="true" /><span>{accessLabel(event.access)}<small>{event.cost}</small></span></div>
      </div>
      <div className="detail-panel__actions">
        <button className={`primary-button ${saved ? 'primary-button--saved' : ''}`} onClick={() => onToggleSave(event.id)}><Bookmark size={16} fill={saved ? 'currentColor' : 'none'} />{saved ? 'Saved to my plan' : 'Save to my plan'}</button>
        <a className="secondary-button" href={event.url} target="_blank" rel="noopener noreferrer">Event page <ExternalLink size={15} /></a>
      </div>
      {addressKnown && <a className="detail-panel__directions" href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(event.venue)}`} target="_blank" rel="noopener noreferrer">Open venue in Maps <ArrowRight size={14} /></a>}
      <details className="detail-panel__more"><summary>What to know before you go</summary><p>{event.how_to_get_in}</p>{event.stage_opportunity && event.stage_opportunity !== 'none' && <p>{event.stage_opportunity}</p>}</details>
    </aside>
  );
}

export default function App() {
  const [savedIds, setSavedIds] = useState(readSaved);
  const [selectedId, setSelectedId] = useState(null);
  const [query, setQuery] = useState('');
  const [scopeMode, setScopeMode] = useState('top');
  const [selectedDate, setSelectedDate] = useState('all');
  const [category, setCategory] = useState('all');
  const [price, setPrice] = useState('all');
  const [planOnly, setPlanOnly] = useState(() => Boolean(planIdsFromUrl(window.location.href)));
  const [copied, setCopied] = useState(false);
  const [shareError, setShareError] = useState('');
  const [planImage, setPlanImage] = useState(null);
  const [panelCollapsed, setPanelCollapsed] = useState(false);
  const dateStripRef = useRef(null);
  const searchRef = useRef(null);

  useEffect(() => { localStorage.setItem(STORAGE_KEY, JSON.stringify(savedIds)); }, [savedIds]);
  useEffect(() => {
    const isPlanPath = window.location.pathname.startsWith('/p/');
    if (!isPlanPath && !new URLSearchParams(window.location.search).has('plan')) return;
    const url = new URL(window.location.href);
    if (isPlanPath) url.pathname = savedIds.length ? `/p/${savedIds.join(',')}` : '/';
    else if (savedIds.length) url.searchParams.set('plan', savedIds.join(','));
    else url.searchParams.delete('plan');
    window.history.replaceState(null, '', url);
  }, [savedIds]);
  useEffect(() => {
    const onKey = (event) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault(); searchRef.current?.focus();
      }
      if (event.key === 'Escape') { setSelectedId(null); setPlanImage(null); searchRef.current?.blur(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    const matching = allEvents.filter((event) => {
      if (planOnly && !savedIds.includes(event.id)) return false;
      if (!planOnly && scopeMode === 'top' && !event.topPick) return false;
      if (selectedDate !== 'all' && (selectedDate < event.date || selectedDate > event.endDate)) return false;
      if (category !== 'all' && event.category !== category) return false;
      if (price === 'free' && !event.isFree) return false;
      if (price === 'paid' && event.isFree) return false;
      if (normalized && !`${event.name} ${event.host} ${event.neighborhood} ${event.category} ${event.why_attend}`.toLowerCase().includes(normalized)) return false;
      return true;
    });
    return planOnly || scopeMode === 'all'
      ? matching.sort((a, b) => a.date.localeCompare(b.date) || a.time_pt.localeCompare(b.time_pt) || a.name.localeCompare(b.name))
      : matching;
  }, [query, selectedDate, category, price, planOnly, scopeMode, savedIds]);

  const selected = allEvents.find((event) => event.id === selectedId);
  const plannedEvents = useMemo(() => eventsInPlan(allEvents, savedIds), [savedIds]);
  const shareUrl = planUrl(savedIds, import.meta.env.VITE_PUBLIC_SITE_URL || window.location.href);
  const xUrl = xIntentUrl(plannedEvents, shareUrl);
  const hasFilters = selectedDate !== 'all' || category !== 'all' || price !== 'all' || query;

  useEffect(() => {
    if (selectedId && !filtered.some((event) => event.id === selectedId)) setSelectedId(null);
  }, [filtered, selectedId]);

  function toggleSave(id) {
    setSavedIds((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  }

  function resetFilters() {
    setQuery(''); setSelectedDate('all'); setCategory('all'); setPrice('all');
  }

  function showExplore() {
    setPlanOnly(false);
    setSelectedId(null);
    resetFilters();
    if (planIdsFromUrl(window.location.href)) window.history.replaceState(null, '', '/');
  }

  async function sharePlan() {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2400);
    } catch {
      window.prompt('Copy your plan link', shareUrl);
    }
  }

  async function showPlanImage() {
    setShareError('');
    try { setPlanImage(await planImageDataUrl(plannedEvents)); }
    catch { setShareError('Could not create the image. Please try again.'); }
  }

  return (
    <div className={`app-shell ${panelCollapsed ? 'app-shell--map-focus' : ''}`}>
      <button className={`plan-button ${planOnly ? 'plan-button--active' : ''}`} aria-label={`My plan, ${savedIds.length} saved ${savedIds.length === 1 ? 'event' : 'events'}`} onClick={() => { if (planOnly) showExplore(); else setPlanOnly(true); setSelectedId(null); setPanelCollapsed(false); }}><Bookmark size={17} fill={planOnly ? 'currentColor' : 'none'} /> <span>My plan</span><span className="plan-button__count">{savedIds.length}</span></button>

      <main className="workspace">
        <section className="sidebar" aria-label="Explore events">
          <div className="sidebar__header">
            <a className="brand" href="/" onClick={(event) => { event.preventDefault(); showExplore(); }} aria-label="SF Tech Week Map home"><span className="brand__mark"><img src="/favicon.svg" alt="" width="25" height="25" /></span><span>SF Tech Week Map</span></a>
            <button className="panel-toggle" onClick={() => setPanelCollapsed(true)} aria-label="Hide event panel to enlarge map" title="Enlarge map"><PanelLeftClose size={19} /></button>
          </div>
          <div className="sidebar__intro">
            <h1>{planOnly ? 'Your Tech Week plan' : 'Find your next event'}</h1>
            <p>{planOnly ? 'A little less scrolling. A lot more showing up.' : 'Explore October across San Francisco and the Bay Area.'}</p>
          </div>

          {!planOnly && <div className="scope-switch" role="group" aria-label="Event collection">
            <button className={scopeMode === 'top' ? 'scope-switch__active' : ''} onClick={() => { setScopeMode('top'); setSelectedId(null); }} aria-pressed={scopeMode === 'top'}>Top 50 <span>handpicked</span></button>
            <button className={scopeMode === 'all' ? 'scope-switch__active' : ''} onClick={() => { setScopeMode('all'); setSelectedId(null); }} aria-pressed={scopeMode === 'all'}>All {allEvents.length} <span>events</span></button>
          </div>}

          <div className="search-field"><Search size={19} aria-hidden="true" /><input ref={searchRef} type="search" placeholder="Search events, hosts, or places" value={query} onChange={(event) => setQuery(event.target.value)} aria-label="Search events" /><kbd>⌘ K</kbd></div>

          <div className="date-strip-wrap">
            <div className="date-strip" ref={dateStripRef} aria-label="Filter by date">
              <button className={`date-tile date-tile--all ${selectedDate === 'all' ? 'date-tile--active' : ''}`} onClick={() => setSelectedDate('all')}><span>OCT</span><strong>All</strong></button>
              {dates.map((date) => {
                const parts = dayParts(date);
                return <button key={date} className={`date-tile ${selectedDate === date ? 'date-tile--active' : ''}`} onClick={() => setSelectedDate(date)}><span>{parts.weekday}</span><strong>{parts.number}</strong></button>;
              })}
            </div>
            <button className="date-strip__next" onClick={() => dateStripRef.current?.scrollBy({ left: 232, behavior: 'smooth' })} aria-label="See later dates"><ChevronDown size={17} /></button>
          </div>

          <div className="filters">
            <label className="select-wrap"><SlidersHorizontal size={16} /><select value={category} onChange={(event) => setCategory(event.target.value)} aria-label="Event type"><option value="all">All types</option>{categories.map((item) => <option value={item} key={item}>{categoryLabel(item)}</option>)}</select><ChevronDown size={14} /></label>
            <label className="select-wrap"><span className="select-wrap__dollar">$</span><select value={price} onChange={(event) => setPrice(event.target.value)} aria-label="Price"><option value="all">Any price</option><option value="free">Free only</option><option value="paid">Paid only</option></select><ChevronDown size={14} /></label>
          </div>

          {planOnly && plannedEvents.length > 0 && <div className="plan-share" aria-label="Share your event plan">
            <div className="plan-share__heading"><span>YOUR PLAN IS READY</span><span>{plannedEvents.length} SAVED</span></div>
            <p>Let people know where to find you. Your link opens this exact plan.</p>
            <div className="plan-share__actions">
              <a className="plan-share__x" href={xUrl} target="_blank" rel="noopener noreferrer" aria-label="Post my event plan on X"><span aria-hidden="true">𝕏</span> Post on X <ArrowRight size={14} /></a>
              <button className="plan-share__copy" onClick={sharePlan}>{copied ? <Check size={15} /> : <Copy size={15} />}{copied ? 'Copied' : 'Copy link'}</button>
            </div>
            <button className="plan-share__image" onClick={showPlanImage}><Download size={14} /> Preview & save your plan image</button>
            {shareError && <p className="plan-share__error" role="alert">{shareError}</p>}
          </div>}

          <div className="list-heading"><span>{filtered.length} {filtered.length === 1 ? 'event' : 'events'}{planOnly ? ' in your plan' : scopeMode === 'top' ? ' · handpicked' : ''}</span>{hasFilters && <button onClick={resetFilters}>Clear filters</button>}</div>

          <div className="event-list" aria-live="polite">
            {filtered.length ? filtered.map((event) => <EventRow key={event.id} event={event} selected={selectedId === event.id} saved={savedIds.includes(event.id)} onSelect={setSelectedId} onToggleSave={toggleSave} />) : <div className="empty-state"><span className="empty-state__icon"><Bookmark size={22} /></span><h2>{planOnly && !savedIds.length ? 'Your plan starts here' : 'No events found'}</h2><p>{planOnly && !savedIds.length ? 'Save the events you want to attend. They’ll stay here for you.' : 'Try another date, topic, or price.'}</p><button onClick={showExplore}>Explore all events <ArrowRight size={15} /></button></div>}
          </div>

          <div className="sidebar__footer">
            <div className="alan-credit"><span className="alan-credit__brand"><AlanMark /><strong>Built with Alan AI</strong></span><a className="alan-credit__try" href="https://tryalan.ai/" target="_blank" rel="noopener noreferrer">Try Alan <ArrowRight size={14} /></a></div>
            <a className="founder-link" href="https://cal.com/prasadsupatest/alan-ai" target="_blank" rel="noopener noreferrer"><span>Building with AI agents?</span><strong>Talk to founder <ArrowRight size={13} /></strong></a>
          </div>
        </section>

        <section className="map-area" aria-label="Map and selected event">
          <button className="panel-reopen" onClick={() => setPanelCollapsed(false)} aria-label="Show event panel"><PanelLeftOpen size={18} /> Show events</button>
          <MapView events={filtered} selectedId={selectedId} savedIds={savedIds} dense={!planOnly && scopeMode === 'all'} onEventSelect={setSelectedId} />
          <div className="map-note"><MapPin size={14} /><span>{filtered.filter((event) => event.position).length} approximate pins · {filtered.filter((event) => !event.position).length} locations TBA{!planOnly && scopeMode === 'all' ? '. Zoom in or filter by day.' : '.'}</span></div>
          {selected && <EventDetail event={selected} saved={savedIds.includes(selected.id)} onClose={() => setSelectedId(null)} onToggleSave={toggleSave} />}
        </section>
      </main>
      {planImage && <div className="image-overlay" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setPlanImage(null); }}>
        <div className="image-dialog" role="dialog" aria-modal="true" aria-label="Your plan image">
          <div className="image-dialog__top"><div><span>READY TO SHARE</span><h2>Your plan, as an image</h2></div><button className="icon-button" onClick={() => setPlanImage(null)} aria-label="Close image preview"><X size={17} /></button></div>
          <img src={planImage} alt={`Share image with ${plannedEvents.length} saved Tech Week events`} />
          <p>Download this image and attach it in X if you want your exact picks in the post.</p>
          <div className="image-dialog__actions"><a href={planImage} download="my-sf-tech-week-plan.png"><Download size={15} /> Download PNG</a><a href={xUrl} target="_blank" rel="noopener noreferrer"><span aria-hidden="true">𝕏</span> Post on X <ArrowRight size={14} /></a></div>
        </div>
      </div>}
      <Analytics />
    </div>
  );
}
