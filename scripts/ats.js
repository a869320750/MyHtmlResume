/* eslint-disable no-console */

function $(selector) { return document.querySelector(selector); }

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

async function fetchJson(url) {
  const response = await fetch(url, { cache: 'no-store' });
  if (!response.ok) throw new Error(`Failed to fetch ${url}: ${response.status}`);
  return await response.json();
}

async function fetchText(url) {
  const response = await fetch(url, { cache: 'no-store' });
  if (!response.ok) throw new Error(`Failed to fetch ${url}: ${response.status}`);
  return await response.text();
}

// ----- Render helpers -----

function renderSection(title, bodyHtml) {
  const root = $('#ats-root');
  root.insertAdjacentHTML('beforeend', `
    <section class="ats-section">
      <h2>${escapeHtml(title)}</h2>
      ${bodyHtml}
    </section>
  `.trim());
}

function renderHeader(baseProfile, position) {
  const root = $('#ats-root');
  const name = escapeHtml(baseProfile.name || '');
  const contacts = baseProfile.contacts || {};
  const contactParts = [];
  if (contacts.phone) contactParts.push(`电话: ${escapeHtml(contacts.phone)}`);
  if (contacts.email) contactParts.push(`邮箱: ${escapeHtml(contacts.email)}`);
  if (contacts.wechat) contactParts.push(`微信: ${escapeHtml(contacts.wechat)}`);
  if (contacts.github) contactParts.push(`GitHub: ${escapeHtml(contacts.githubLabel || contacts.github)}`);

  root.insertAdjacentHTML('beforeend', `
    <section class="ats-header">
      <div class="ats-name">${name}</div>
      ${position ? `<div class="ats-position">${escapeHtml(position)}</div>` : ''}
      ${contactParts.length ? `<div class="ats-contact">${contactParts.map(item => `<span>${item}</span>`).join('')}</div>` : ''}
    </section>
  `.trim());
}

// ----- Section renderers -----

async function renderSummary(bullets) {
  if (!bullets?.length) return;
  renderSection('摘要', `<ul>${bullets.map(item => `<li>${escapeHtml(item)}</li>`).join('')}</ul>`);
}

async function renderIntro() {
  const text = await fetchText('../data/intro.txt');
  renderSection('简介', `<p class="ats-line">${escapeHtml(text.trim())}</p>`);
}

async function renderWork() {
  const data = await fetchJson('../data/work.json');
  if (!data?.length) return;

  let html = '';
  data.forEach(item => {
    html += `
      <h3>${escapeHtml(item.company)} - ${escapeHtml(item.position)}</h3>
      <p class="ats-muted">${escapeHtml(item.period || '')}</p>
    `;

    const details = item.details || [];
    if (details.length) {
      html += '<ol>';
      details.forEach(d => {
        html += `<li><strong>${escapeHtml(d.title)}：</strong>${escapeHtml(d.desc || '')}</li>`;
      });
      html += '</ol>';
    }
  });

  if (html) renderSection('工作经历', html);
}

async function renderProjects() {
  const indexData = await fetchJson('../data/projects/index.json');
  if (!indexData?.length) return;

  // 加载所有项目 meta.json
  const items = await Promise.all(
    indexData.map(async (entry) => {
      const meta = await fetchJson(`../data/projects/${entry.path}/meta.json`);
      return { ...meta, ...entry };
    })
  );

  let html = '';
  items.forEach(item => {
    html += `
      <h3>${escapeHtml(item.name)}</h3>
      <p class="ats-muted">${escapeHtml(item.period || '')}</p>
    `;

    if (item.oneLiner) {
      html += `<p class="ats-oneliner">${escapeHtml(item.oneLiner)}</p>`;
    }

    if (item.background) {
      html += `<p><strong>项目背景：</strong>${escapeHtml(item.background)}</p>`;
    }

    const work = item.work || [];
    if (work.length) {
      html += '<p><strong>主要工作：</strong></p><ul>';
      work.forEach(w => html += `<li>${escapeHtml(w)}</li>`);
      html += '</ul>';
    }

    if (item.tech) {
      html += `<p><strong>技术栈：</strong>${escapeHtml(item.tech)}</p>`;
    }

    const result = item.result || [];
    if (result.length) {
      html += '<p><strong>成果：</strong></p><ul>';
      result.forEach(r => html += `<li>${escapeHtml(r)}</li>`);
      html += '</ul>';
    }
  });

  if (html) renderSection('项目经历', html);
}

async function renderSkills() {
  const data = await fetchJson('../data/skills.json');
  if (!data?.length) return;

  const html = `<ul>${
    data.map(item => {
      const keywords = Array.isArray(item.keywords)
        ? item.keywords.map(k => String(k || '').trim()).filter(Boolean)
        : String(item.description || '').split(/[，,、]/).map(k => k.trim()).filter(Boolean);
      const level = item.level || (typeof item.percent === 'number' ? '熟练' : '了解');
      const kw = keywords.length ? `｜${escapeHtml(keywords.join(' / '))}` : '';
      const evidence = item.evidence ? `<div class="ats-skill-evidence">${escapeHtml(item.evidence)}</div>` : '';
      return `<li><strong>${escapeHtml(item.name)}</strong>（${escapeHtml(level)}）${kw}${evidence}</li>`;
    }).join('')
  }</ul>`;

  renderSection('技能', html);
}

async function renderEducation() {
  const data = await fetchJson('../data/education.json');
  if (!data?.length) return;

  const html = data.map(item => {
    const details = item.details || [];
    return `
      <h3>${escapeHtml(item.school)} - ${escapeHtml(item.major)} - ${escapeHtml(item.degree)}</h3>
      <p class="ats-muted">${escapeHtml(item.period || '')}</p>
      ${details.length ? `<ul>${details.map(d => `<li>${escapeHtml(d)}</li>`).join('')}</ul>` : ''}
    `;
  }).join('');

  renderSection('教育经历', html);
}

async function renderGithub() {
  const data = await fetchJson('../data/projects-github.json');
  if (!data?.length) return;

  const html = `<ul>${
    data.map(repo => {
      const desc = repo.description ? ` - ${escapeHtml(repo.description)}` : '';
      const lang = repo.language ? `（${escapeHtml(repo.language)}）` : '';
      return `<li>${escapeHtml(repo.name)}${lang}${desc} - ${escapeHtml(repo.url || '')}</li>`;
    }).join('')
  }</ul>`;

  renderSection('开源项目', html);
}

// ----- Plain text export -----

async function buildPlainText(baseProfile, position, summaryBullets) {
  const contacts = baseProfile.contacts || {};
  const lines = [];
  const sep = () => lines.push('----------------------------------------');

  lines.push(`${baseProfile.name || ''}${position ? ` | ${position}` : ''}`.trim());
  if (contacts.phone) lines.push(`电话: ${contacts.phone}`);
  if (contacts.email) lines.push(`邮箱: ${contacts.email}`);
  if (contacts.wechat) lines.push(`微信: ${contacts.wechat}`);
  if (contacts.github) lines.push(`GitHub: ${contacts.githubLabel || contacts.github}`);
  sep();

  if (summaryBullets?.length) {
    lines.push('摘要');
    summaryBullets.forEach(item => lines.push(`  - ${item}`));
    sep();
  }

  const intro = (await fetchText('../data/intro.txt')).trim();
  if (intro) { lines.push('简介'); lines.push(`  ${intro}`); sep(); }

  const workData = await fetchJson('../data/work.json');
  if (workData.length) {
    lines.push('工作经历');
    workData.forEach(item => {
      lines.push(`  ${item.company} - ${item.position} (${item.period || ''})`);
      (item.details || []).forEach(d => lines.push(`    - ${d.title}：${d.desc || ''}`));
    });
    sep();
  }

  // 项目经历（从 index.json + meta.json 加载）
  const projectIndex = await fetchJson('../data/projects/index.json');
  if (projectIndex.length) {
    const projectItems = await Promise.all(
      projectIndex.map(async (entry) => {
        const meta = await fetchJson(`../data/projects/${entry.path}/meta.json`);
        return { ...meta, ...entry };
      })
    );
    lines.push('项目经历');
    projectItems.forEach(item => {
      lines.push(`  ${item.name} (${item.period || ''})`);
      if (item.oneLiner) lines.push(`    一句话：${item.oneLiner}`);
      if (item.background) lines.push(`    项目背景：${item.background}`);
      lines.push('    主要工作：');
      (item.work || []).forEach(w => lines.push(`      - ${w}`));
      lines.push(`    技术栈：${item.tech || ''}`);
      if (item.result?.length) {
        lines.push('    成果：');
        item.result.forEach(r => lines.push(`      - ${r}`));
      }
    });
    sep();
  }

  const skillData = await fetchJson('../data/skills.json');
  if (skillData.length) {
    lines.push('技能');
    skillData.forEach(skill => {
      const level = skill.level || '熟练';
      const keywords = Array.isArray(skill.keywords) ? skill.keywords.join(' / ') : '';
      const evidence = skill.evidence || '';
      lines.push(`  - ${skill.name}（${level}）${keywords ? `｜${keywords}` : ''}`);
      if (evidence) lines.push(`    证据：${evidence}`);
    });
    sep();
  }

  const eduData = await fetchJson('../data/education.json');
  if (eduData?.length) {
    lines.push('教育经历');
    eduData.forEach(item => {
      lines.push(`  ${item.school} - ${item.major} - ${item.degree} (${item.period || ''})`);
      (item.details || []).forEach(d => lines.push(`    - ${d}`));
    });
  }

  return lines.join('\n');
}

function setupPlainTextExport(baseProfile, position, summaryBullets) {
  const button = $('#copy-plain-text');
  const note = $('#copy-plain-text-note');
  if (!button) return;

  const setNote = (msg) => {
    if (!note) return;
    note.textContent = msg;
    if (msg) setTimeout(() => { if (note.textContent === msg) note.textContent = ''; }, 2000);
  };

  button.addEventListener('click', async () => {
    try {
      const text = await buildPlainText(baseProfile, position, summaryBullets);
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        const ta = document.createElement('textarea');
        ta.value = text;
        ta.setAttribute('readonly', '');
        ta.style.position = 'absolute';
        ta.style.left = '-9999px';
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        ta.remove();
      }
      setNote('已复制到剪贴板');
    } catch (err) {
      console.error(err);
      setNote('复制失败');
    }
  });
}

// ----- Init -----

async function init() {
  const baseProfile = await fetchJson('../data/profile-base.json');
  const config = await fetchJson('../data/profiles/general.json');

  const position = config.position || '';
  const sections = config.sections || ['summary', 'work', 'projects', 'skills', 'github', 'education'];
  const summaryBullets = config.summaryBullets || [];

  document.title = `${baseProfile.name} - 简历`;

  renderHeader(baseProfile, position);

  if (!sections.includes('summary')) await renderIntro();
  for (const section of sections) {
    switch (section) {
      case 'summary': await renderSummary(summaryBullets); break;
      case 'intro': await renderIntro(); break;
      case 'work': await renderWork(); break;
      case 'projects': await renderProjects(); break;
      case 'education': await renderEducation(); break;
    }
  }

  setupPlainTextExport(baseProfile, position, summaryBullets);
}

init().catch(err => {
  const root = $('#ats-root');
  if (root) root.textContent = `加载失败：${err.message}`;
  console.error(err);
});
