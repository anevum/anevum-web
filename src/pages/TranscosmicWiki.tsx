import { Link, useSearchParams } from "react-router-dom";
import {
  getWikiArticle, wikiAllPages, wikiCategories, wikiCategoryPages,
  wikiCategoryPath, wikiHome, wikiSearch, wikiSpecialPath,
  type WikiCategory, type WikiArticle
} from "../data/transcosmic-wiki";
import "../styles/transcosmic-wiki.css";

/**
 * A navigable wiki for the reader-cleared projection of Transcosmic canon.
 * This client never edits or reads the private canonical source. All eight
 * draft articles are explicitly compiled behind the existing preview gate.
 * No public history or citations are invented for a design-review build.
 */
const ROOT = "/design/original-works";

const categoryLabel = (category:WikiCategory) => ({
  World:"Worlds",Person:"People",Place:"Places",Infrastructure:"Infrastructure",
  Institution:"Institutions",Science:"Science",History:"History"
}[category]);

function WikiBreadcrumb({items}:{items:ReadonlyArray<{label:string;to?:string}>}) {
  return <nav className="ow-wiki-breadcrumb" aria-label="Wiki breadcrumbs">
    <Link to={wikiHome}>Wiki</Link>
    {items.map((item,i)=><span key={i} className="ow-wiki-crumb">
      <span aria-hidden="true">/</span>
      {item.to?<Link to={item.to}>{item.label}</Link>:<span aria-current="page">{item.label}</span>}
    </span>)}
  </nav>;
}


const tocSections = [
  {id:"wiki-overview",label:"Overview"},
  {id:"wiki-context",label:"Context"},
  {id:"wiki-connections",label:"Connections"},
  {id:"wiki-linked",label:"What links here"}
] as const;

/** Persistent desktop table of contents, as in a reading-first encyclopedia. */
function WikiContents() {
  return <aside className="ow-wiki-left-rail" aria-label="Article contents">
    <nav className="ow-wiki-contents" aria-label="On this page">
      <p className="ow-wiki-rail-label">Contents</p>
      <a className="ow-wiki-to-top" href="#ow-wiki-article-title">Beginning</a>
      <ol>{tocSections.map((section,index)=><li key={section.id}>
        <a href={"#"+section.id}><span>{index+1}.</span> {section.label}</a>
      </li>)}</ol>
      <Link className="ow-wiki-rail-back" to={wikiSpecialPath("all-pages")}>All articles</Link>
    </nav>
  </aside>;
}

function WikiSidebar({active}:{active?:string}) {
  return <aside className="ow-wiki-sidebar ow-wiki-left-rail" aria-label="Wiki navigation">
    <p className="ow-wiki-sidebar-label">Explore the wiki</p>
    <nav aria-label="Wiki pages" className="ow-wiki-side-links">
      <Link to={wikiHome} aria-current={active==="home"?"page":undefined}>Main page</Link>
      <Link to={wikiSpecialPath("all-pages")} aria-current={active==="all"?"page":undefined}>All articles</Link>
      <Link to={wikiSpecialPath("about")} aria-current={active==="about"?"page":undefined}>About this wiki</Link>
    </nav>
    <p className="ow-wiki-sidebar-label">By subject</p>
    <nav aria-label="Wiki categories" className="ow-wiki-side-links">
      {wikiCategories.map(category=><Link key={category}
        data-wiki-category={category}
        to={wikiCategoryPath(category)}
        aria-current={active===category?"page":undefined}>
        {categoryLabel(category)}
        <span>{wikiCategoryPages(category).length}</span>
      </Link>)}
    </nav>
    <p className="ow-wiki-side-note">Current public-queue subjects only. Later-window and private story-bible records remain withheld.</p>
  </aside>;
}

function IndexLink({article}:{article:WikiArticle}) {
  return <Link className="ow-wiki-result" data-wiki-category={article.category} to={article.href}>
    <span className="ow-wiki-result-type">{article.category} <span aria-hidden="true">/</span> {article.id}</span>
    <strong>{article.title}</strong>
    <span>{article.summary}</span>
    <span className="ow-wiki-result-action">Read article <span aria-hidden="true">↗</span></span>
  </Link>;
}

function WikiIndex() {
  const [params,setParams]=useSearchParams();
  const query=(params.get("q")||"").slice(0,80);
  const candidate=params.get("category")||"All";
  const category=(candidate==="All"||wikiCategories.some(c=>c===candidate))
    ?candidate as WikiCategory|"All":"All";
  const results=wikiSearch(query,category);
  const update=(nextQuery:string,nextCategory:WikiCategory|"All")=>{
    const newParams=new URLSearchParams();
    if(nextQuery.trim())newParams.set("q",nextQuery.slice(0,80));
    if(nextCategory!=="All")newParams.set("category",nextCategory);
    setParams(newParams,{replace:true});
  };
  return <section className="ow-wiki-layout ow-wiki-index" aria-labelledby="ow-wiki-title">
    <WikiSidebar active="home"/>
    <div className="ow-wiki-main">
      <WikiBreadcrumb items={[{label:"Main page"}]}/>
      <p className="ow-eyebrow">The Transcosmic / Reader Wiki</p>
      <h1 id="ow-wiki-title">An archive<br/><em>of worlds.</em></h1>
      <p className="ow-page-lead">A connected encyclopedia of the people, worlds, institutions, technologies, places and historical records that can be introduced without revealing later events in <cite>REPLY</cite>.</p>
      <div className="ow-wiki-banner" role="note">
        <span className="ow-wiki-live-mark" aria-hidden="true" />
        <p><strong>Public-source cleared · website review.</strong> The publishing queue marks 22 Now-window subjects public, but this redesigned wiki and its newly distilled copy still require editorial review and release signoff. Later-window and private sources remain withheld.</p>
      </div>
      <div className="ow-wiki-search-area">
        <label htmlFor="ow-wiki-search">Search the encyclopedia</label>
        <input id="ow-wiki-search" type="search" maxLength={80} autoComplete="off"
          value={query} onChange={e=>update(e.currentTarget.value,category)}
          placeholder="Search articles, concepts, places…" />
        <div className="ow-wiki-filter-row" role="group" aria-label="Filter wiki articles">
          {(["All",...wikiCategories] as const).map(option=><button key={option}
            data-wiki-category={option}
            type="button" aria-pressed={option===category} onClick={()=>update(query,option)}>
            {option==="All"?"Everything":categoryLabel(option)}
          </button>)}
        </div>
      </div>
      <div className="ow-wiki-results-heading">
        <h2>Browse the archive</h2>
        <span role="status" aria-live="polite" aria-atomic="true">{results.length} of {wikiAllPages().length} articles</span>
      </div>
      {results.length?<div className="ow-wiki-result-grid">{results.map(article=><IndexLink key={article.slug} article={article}/>)}</div>:
        <div className="ow-wiki-empty" role="region" aria-label="No matching wiki articles">
          <h2>No matching articles.</h2>
          <p>Try another term or explore the currently reviewed categories. Unreleased entries are not available from search.</p>
          <button type="button" onClick={()=>update("","All")}>Reset search</button>
        </div>}
      <div className="ow-wiki-worknote"><span>EDITORIAL INDEX / 001</span><p>Article titles, categories, summaries and links are versioned together in Git. The other seven Website Ready records are staged in later release windows; they are not part of this reader edition.</p></div>
    </div>
  </section>;
}

function WikiArticlePage({slug}:{slug:string}) {
  const article=getWikiArticle(slug);
  if(!article)return <WikiMissing />;
  return <section className="ow-wiki-layout ow-wiki-article" data-wiki-category={article.category} aria-labelledby="ow-wiki-article-title">
    <WikiContents/>
    <div className="ow-wiki-main">
      <WikiBreadcrumb items={[{label:article.category,to:wikiCategoryPath(article.category)},{label:article.title}]}/>
      <div className="ow-wiki-page-tabs" aria-label="Page status">
        <span className="ow-wiki-tab-current">Article</span>
        <span>Read-only editorial preview</span>
      </div>
      <h1 id="ow-wiki-article-title">{article.title}</h1>
      <p className="ow-wiki-article-intro">{article.summary}</p>
      <div className="ow-wiki-article-meta">
        <span>ENTRY {article.id}</span><span>Source: Now / Public queue</span><span>New website: preview only</span>
      </div>
      <details className="ow-wiki-mobile-contents">
        <summary>Contents</summary>
        <ol>{tocSections.map(section=><li key={section.id}><a href={"#"+section.id}>{section.label}</a></li>)}</ol>
      </details>
      <div className="ow-wiki-copy">
        <section id="wiki-overview" aria-labelledby="wiki-overview-title">
          <h2 id="wiki-overview-title"><span>01</span> Overview</h2>
          <p>{article.summary}</p>
        </section>
        <section id="wiki-context" aria-labelledby="wiki-context-title">
          <h2 id="wiki-context-title"><span>02</span> Context</h2>
          {article.detail.split(/\n\n+/).map((paragraph,index)=><p key={index}>{paragraph}</p>)}
          <p className="ow-wiki-editorial-note">This article contains only reader-oriented material and does not describe later plot outcomes or restricted historical provenance.</p>
        </section>
        <section id="wiki-connections" aria-labelledby="wiki-connections-title">
          <h2 id="wiki-connections-title"><span>03</span> Connections</h2>
          {article.related.length?<ul className="ow-wiki-connection-list">
            {article.related.map(link=><li key={link.slug}>
              <Link to={link.href}>{link.label}</Link><span>{link.relation}</span>
            </li>)}
          </ul>:<p>No approved connections in this reader edition.</p>}
        </section>
        <section id="wiki-linked" aria-labelledby="wiki-linked-title">
          <h2 id="wiki-linked-title"><span>04</span> What links here</h2>
          {article.backlinks.length?<ul className="ow-wiki-connection-list">
            {article.backlinks.map(link=><li key={link.slug}>
              <Link to={link.href}>{link.title}</Link><span>{link.context}</span>
            </li>)}
          </ul>:<p>Nothing in the current reader edition links to this article.</p>}
        </section>
      </div>
      <div className="ow-wiki-article-footer">
        <span>Category</span><Link to={wikiCategoryPath(article.category)}>{article.category}</Link>
        <Link to={wikiSpecialPath("all-pages")}>All wiki pages <span aria-hidden="true">↗</span></Link>
      </div>
    </div>
    <div className="ow-wiki-aside">
      <aside className="ow-wiki-infobox" aria-label={"Facts about "+article.title}>
        <p className="ow-wiki-infobox-label">THE TRANSCOSMIC / READER INDEX</p>
        <h2>{article.title}</h2>
        <p className="ow-wiki-infobox-subtitle">{article.subtitle}</p>
        <dl>
          <div><dt>Article type</dt><dd>{article.category}</dd></div>
          <div><dt>Edition</dt><dd>REPLY · Now-window reader preview</dd></div>
          <div><dt>Related records</dt><dd>{article.related.length}</dd></div>
          <div><dt>New site status</dt><dd>Review build · not deployed</dd></div>
        </dl>
        <p className="ow-wiki-infobox-foot">Canonical source material is maintained privately. The source queue is cleared for these 22 subjects; this new editorial derivative and website route still require author signoff before deployment.</p>
      </aside>
    </div>
  </section>;
}

function WikiCategoryPage({slug}:{slug:string}) {
  const category=wikiCategories.find(item=>item.toLowerCase()===slug);
  if(!category)return <WikiMissing/>;
  const pages=wikiCategoryPages(category);
  const heading=categoryLabel(category);
  return <section className="ow-wiki-layout ow-wiki-category" data-wiki-category={category} aria-labelledby="ow-wiki-category-title">
    <WikiSidebar active={category}/>
    <div className="ow-wiki-main">
      <WikiBreadcrumb items={[{label:"Categories"},{label:heading}]}/>
      <p className="ow-eyebrow">The Transcosmic / Categories</p>
      <h1 id="ow-wiki-category-title">{heading}</h1>
      <p className="ow-page-lead">{pages.length} opening-state {pages.length===1?"article":"articles"} classified under {heading.toLowerCase()}.</p>
      <div className="ow-wiki-result-grid">{pages.map(a=><IndexLink article={a} key={a.slug}/>)}</div>
    </div>
  </section>;
}

function WikiAllPages() {
  const pages=wikiAllPages();
  return <section className="ow-wiki-layout ow-wiki-directory" aria-labelledby="ow-wiki-all-title">
    <WikiSidebar active="all"/>
    <div className="ow-wiki-main">
      <WikiBreadcrumb items={[{label:"All articles"}]}/>
      <p className="ow-eyebrow">The Transcosmic / Directory</p>
      <h1 id="ow-wiki-all-title">All articles.</h1>
      <p className="ow-page-lead">Alphabetical index of the {pages.length} currently curated reader entries. Later-window and private canon are not enumerated.</p>
      <ol className="ow-wiki-alphabetical">{pages.map(a=><li key={a.slug} data-wiki-category={a.category}><Link to={a.href}>{a.title}</Link><span>{a.category}</span></li>)}</ol>
    </div>
  </section>;
}

function WikiAbout() {
  return <section className="ow-wiki-layout ow-wiki-information" aria-labelledby="ow-wiki-about-title">
    <WikiSidebar active="about"/>
    <div className="ow-wiki-main">
      <WikiBreadcrumb items={[{label:"About this wiki"}]}/>
      <p className="ow-eyebrow">The Transcosmic / Editorial desk</p>
      <h1 id="ow-wiki-about-title">About this wiki.</h1>
      <p className="ow-page-lead">A version-controlled encyclopedia for Anevum's original fictional universe, using the 22 public-queue Now-window subjects while keeping the redesigned website in editorial review.</p>
      <div className="ow-wiki-copy">
        <section><h2>Reader edition</h2><p>The wiki links approved opening-state subjects by category, related article and incoming links. It does not surface every private canon record.</p></section>
        <section><h2>Corrections and revisions</h2><p>Wiki content is maintained through reviewed changes to the repository's editorial manifest. There is not yet a public editing form, public article history or account-based contributor workflow. Those require separate moderation, identity and release design.</p></section>
        <section><h2>Publication controls</h2><p>Every new article revision still requires canon reconciliation and spoiler clearance. The source queue permits the current subjects, but this rebuilt website is not live and does not establish book availability.</p></section>
      </div>
    </div>
  </section>;
}

function WikiMissing() {
  return <section className="ow-wiki-layout ow-wiki-missing" aria-labelledby="ow-wiki-missing-title">
    <WikiSidebar/>
    <div className="ow-wiki-main">
      <WikiBreadcrumb items={[{label:"Unavailable"}]}/>
      <p className="ow-eyebrow">The Transcosmic / Wiki</p>
      <h1 id="ow-wiki-missing-title">Article unavailable.</h1>
      <p className="ow-page-lead">This page is not part of the reviewed reader edition. Guessing a URL never reveals private or unpublished canon.</p>
      <Link className="ow-action" to={wikiHome}>Return to wiki <span aria-hidden="true">↗</span></Link>
    </div>
  </section>;
}

export default function TranscosmicWiki({path=""}:{path?:string}) {
  const route=path.replace(/\/$/,"");
  return <div className="ow-page ow-container ow-wiki" data-wiki-editorial-preview="true">
    {route===""?<WikiIndex/>:
      route==="special/all-pages"?<WikiAllPages/>:
      route==="special/about"?<WikiAbout/>:
      route.startsWith("category/")?<WikiCategoryPage slug={route.slice("category/".length)}/>:
      !route.includes("/")?<WikiArticlePage slug={route}/>:
      <WikiMissing/>}
    <div className="ow-wiki-bottom"><Link to={ROOT+"/transcosmic"}>The Transcosmic</Link><span aria-hidden="true">/</span><Link to={ROOT+"/atlas"}>Opening-state Atlas</Link><span aria-hidden="true">/</span><Link to={ROOT+"/reply"}>REPLY</Link></div>
  </div>;
}
