function $(selector) {
  return document.querySelector(selector);
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function truncateText(text, maxChars) {
  const value = (text ?? '').trim();
  if (!maxChars || maxChars >= value.length) return value;
  return value.slice(0, Math.max(0, maxChars - 1)).trimEnd() + '…';
}

function limitArray(arr, maxCount) {
  if (!Array.isArray(arr)) return [];
  if (!maxCount || maxCount >= arr.length) return arr;
  return arr.slice(0, maxCount);
}

const DISPLAY_LEVEL_SET = new Set(['oneLiner', 'value3', 'star', 'full']);

function pickFirstNonEmpty(...values) {
  for (const value of values) {
    if (typeof value === 'string' && value.trim()) return value.trim();
  }
  return '';
}

function normalizeLines(lines) {
  if (!Array.isArray(lines)) return [];
  return lines.map((line) => String(line || '').trim()).filter(Boolean);
}

function normalizeStar(star) {
  const source = star || {};
  return {
    situation: pickFirstNonEmpty(source.situation, source.S),
    task: pickFirstNonEmpty(source.task, source.T),
    action: pickFirstNonEmpty(source.action, source.A),
    result: pickFirstNonEmpty(source.result, source.R)
  };
}

function hasStarContent(star) {
  const normalized = normalizeStar(star);
  return Boolean(normalized.situation || normalized.task || normalized.action || normalized.result);
}

function resolveDisplayLevel(item, sectionPolicy) {
  let level = pickFirstNonEmpty(sectionPolicy?.defaultLevel) || 'full';

  const tagPolicy = sectionPolicy?.byTag || {};
  const itemTags = Array.isArray(item?.tags) ? item.tags : [];
  for (const tag of itemTags) {
    const nextLevel = tagPolicy[tag];
    if (typeof nextLevel === 'string' && nextLevel.trim()) {
      level = nextLevel.trim();
      break;
    }
  }

  const idPolicy = sectionPolicy?.byId || sectionPolicy?.overrides || {};
  if (item?.id && typeof idPolicy[item.id] === 'string' && idPolicy[item.id].trim()) {
    level = idPolicy[item.id].trim();
  }

  return DISPLAY_LEVEL_SET.has(level) ? level : 'full';
}

function getOneLiner(item, maxChars) {
  const line = pickFirstNonEmpty(item?.oneLiner, item?.brief?.[0]);
  return truncateText(line, maxChars);
}

function getValue3(item) {
  const fromTemplate = normalizeLines(item?.value3);
  if (fromTemplate.length) return fromTemplate;
  return normalizeLines(item?.brief);
}

function renderValueListHtml(lines, maxChars) {
  const values = normalizeLines(lines);
  if (!values.length) return '';
  return `<ul class="ats-value-list">${values
    .map((line) => `<li>${escapeHtml(truncateText(line, maxChars))}</li>`)
    .join('')}</ul>`;
}

function renderStarHtml(star, maxChars) {
  const normalized = normalizeStar(star);
  if (!hasStarContent(normalized)) return '';
  const rows = [
    ['S', '情境', normalized.situation],
    ['T', '任务', normalized.task],
    ['A', '行动', normalized.action],
    ['R', '结果', normalized.result]
  ]
    .filter((row) => row[2])
    .map(
      ([key, label, text]) =>
        `<li><strong>${key}(${label})：</strong>${escapeHtml(truncateText(text, maxChars))}</li>`
    )
    .join('');
  return `<ul class="ats-star-list">${rows}</ul>`;
}

async function fetchText(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Failed to fetch ${url}: ${response.status}`);
  return await response.text();
}

async function fetchJson(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Failed to fetch ${url}: ${response.status}`);
  return await response.json();
}

function getParams() {
  const params = new URLSearchParams(window.location.search);
  const profile = (params.get('profile') || 'general').trim();
  const mode = (params.get('mode') || '').trim();
  return { profile, mode };
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
  if (contacts.bilibili) contactParts.push(`BiliBili: ${escapeHtml(contacts.bilibiliLabel || contacts.bilibili)}`);

  root.insertAdjacentHTML(
    'beforeend',
    `
      <section class="ats-header">
        <div class="ats-name">${name}</div>
        ${position ? `<div class="ats-position">${escapeHtml(position)}</div>` : ''}
        ${contactParts.length ? `<div class="ats-contact">${contactParts.map((item) => `<span>${item}</span>`).join('')}</div>` : ''}
      </section>
    `.trim()
  );
}

function renderSection(title, bodyHtml) {
  const root = $('#ats-root');
  root.insertAdjacentHTML(
    'beforeend',
    `
      <section class="ats-section">
        <h2>${escapeHtml(title)}</h2>
        ${bodyHtml}
      </section>
    `.trim()
  );
}

async function renderIntro(limits) {
  const text = await fetchText('../data/intro.txt');
  const intro = truncateText(text, limits?.introMaxChars);
  renderSection('简介', `<p class="ats-line">${escapeHtml(intro)}</p>`);
}

function renderSummary(summaryBullets) {
  if (!summaryBullets?.length) return;
  renderSection('摘要', `<ul>${summaryBullets.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ul>`);
}

async function renderWork(limits, useBrief, contentPolicy) {
  const data = await fetchJson('../data/work.json');
  const companies = limitArray(data, limits?.workCompanies);
  let html = '';

  companies.forEach((item) => {
    const level = resolveDisplayLevel(item, contentPolicy);
    const effectiveLevel = useBrief && level === 'full' ? 'value3' : level;
    const oneLiner = getOneLiner(item, limits?.workDescMaxChars);
    const value3 = getValue3(item);
    const starHtml = renderStarHtml(item.star, limits?.workDescMaxChars);

    html += `
      <h3>${escapeHtml(item.company)} - ${escapeHtml(item.position)}</h3>
      <p class="ats-muted">${escapeHtml(item.period || '')}</p>
    `;

    if (oneLiner) {
      html += `<p class="ats-oneliner">${escapeHtml(oneLiner)}</p>`;
    }

    if (effectiveLevel === 'oneLiner') {
      return;
    }

    if (effectiveLevel === 'value3') {
      html += renderValueListHtml(value3, limits?.workDescMaxChars);
      return;
    }

    if (effectiveLevel === 'star') {
      html += starHtml || renderValueListHtml(value3, limits?.workDescMaxChars);
      return;
    }

    // full
    html += renderValueListHtml(value3, limits?.workDescMaxChars);
    if (starHtml) html += starHtml;

    html += `<ol>
      ${useBrief && Array.isArray(item.brief) && item.brief.length
        ? item.brief.map((detail) => `<li>${escapeHtml(detail)}</li>`).join('')
        : limitArray(item.details || [], limits?.workDetailsPerCompany)
            .map((detail) => {
              const desc = truncateText(detail.desc, limits?.workDescMaxChars);
              return `<li><strong>${escapeHtml(detail.title)}：</strong>${escapeHtml(desc)}</li>`;
            })
            .join('')}
    </ol>`;
  });

  if (html) renderSection('工作经历', html);
}

async function renderProjects(limits, useBrief, contentPolicy) {
  const data = await fetchJson('../data/projects.json');
  const projects = limitArray(data, limits?.projectCount);
  let html = '';

  projects.forEach((item) => {
    const level = resolveDisplayLevel(item, contentPolicy);
    const effectiveLevel = useBrief && level === 'full' ? 'value3' : level;
    const oneLiner = getOneLiner(item, limits?.projectTextMaxChars);
    const value3 = getValue3(item);
    const starHtml = renderStarHtml(item.star, limits?.projectTextMaxChars);

    const background = truncateText(item.background, limits?.projectTextMaxChars);
    const tech = truncateText(item.tech, limits?.projectTextMaxChars);

    html += `
      <h3>${escapeHtml(item.name)}</h3>
      <p class="ats-muted">${escapeHtml(item.period || '')}</p>
    `;

    if (oneLiner) {
      html += `<p class="ats-oneliner">${escapeHtml(oneLiner)}</p>`;
    }

    if (effectiveLevel === 'oneLiner') {
      return;
    }

    if (effectiveLevel === 'value3') {
      html += renderValueListHtml(value3, limits?.projectTextMaxChars);
      return;
    }

    if (effectiveLevel === 'star') {
      html += starHtml || renderValueListHtml(value3, limits?.projectTextMaxChars);
      return;
    }

    // full
    html += renderValueListHtml(value3, limits?.projectTextMaxChars);
    if (starHtml) html += starHtml;

    if (useBrief && Array.isArray(item.brief) && item.brief.length) {
      html += `<ul>${item.brief.map((line) => `<li>${escapeHtml(line)}</li>`).join('')}</ul>`;
      if (tech) html += `<p><strong>技术栈：</strong>${escapeHtml(tech)}</p>`;
      return;
    }

    html += `
      <p><strong>项目背景：</strong>${escapeHtml(background)}</p>
      <p><strong>主要工作：</strong></p>
      <ul>
        ${limitArray(item.work || [], limits?.projectWorkBullets)
          .map((work) => `<li>${escapeHtml(truncateText(work, limits?.projectTextMaxChars))}</li>`)
          .join('')}
      </ul>
      <p><strong>技术栈：</strong>${escapeHtml(tech)}</p>
      ${item.result?.length ? `<p><strong>成果：</strong></p><ul>${item.result
        .map((r) => `<li>${escapeHtml(truncateText(r, limits?.projectTextMaxChars))}</li>`)
        .join('')}</ul>` : ''}
    `;
  });

  if (html) renderSection('项目经历', html);
}

async function renderSkills(limits) {
  const data = await fetchJson('../data/skills.json');
  const skills = limitArray(data, limits?.skillCount);
  if (!skills.length) return;

  const normalizedSkills = skills.map((item) => {
    const keywords = Array.isArray(item.keywords)
      ? item.keywords.map((k) => String(k || '').trim()).filter(Boolean)
      : String(item.description || '')
          .split(/[，,、]/)
          .map((k) => k.trim())
          .filter(Boolean);
    const level = item.level || (typeof item.percent === 'number' ? '熟练' : '了解');
    const evidence = item.evidence || item.description || '';
    return { name: item.name || '', level, keywords, evidence };
  });

  const html = `
    <ul>
      ${normalizedSkills
        .map((item) => {
          const keywords = item.keywords?.length ? `｜${escapeHtml(item.keywords.join(' / '))}` : '';
          const evidence = item.evidence ? `<div class="ats-skill-evidence">${escapeHtml(item.evidence)}</div>` : '';
          return `<li><strong>${escapeHtml(item.name)}</strong>（${escapeHtml(item.level)}）${keywords}${evidence}</li>`;
        })
        .join('')}
    </ul>
  `;
  renderSection('技能', html);
}

async function renderEducation(useBrief) {
  const data = await fetchJson('../data/education.json');
  if (!data?.length) return;

  const html = data
    .map((item) => {
      const source = useBrief && Array.isArray(item.brief) && item.brief.length ? item.brief : item.details || [];
      const details = source.map((d) => `<li>${escapeHtml(d)}</li>`).join('');
      return `
        <h3>${escapeHtml(item.school)} - ${escapeHtml(item.major)} - ${escapeHtml(item.degree)}</h3>
        <p class="ats-muted">${escapeHtml(item.period || '')}</p>
        <ul>${details}</ul>
      `;
    })
    .join('');

  renderSection('教育经历', html);
}

async function renderGithub(limits) {
  const data = await fetchJson('../data/projects-github.json');
  const repos = limitArray(data, limits?.githubCount);
  if (!repos.length) return;

  const html = `
    <ul>
      ${repos
        .map((repo) => {
          const desc = repo.description ? ` - ${escapeHtml(repo.description)}` : '';
          const lang = repo.language ? `（${escapeHtml(repo.language)}）` : '';
          return `<li>${escapeHtml(repo.name)}${lang}${desc} - ${escapeHtml(repo.url || '')}</li>`;
        })
        .join('')}
    </ul>
  `;

  renderSection('开源项目', html);
}

async function init() {
  const { profile, mode } = getParams();
  const baseProfile = await fetchJson('../data/profile-base.json');
  const profileConfig = await fetchJson(`../data/profiles/${profile}.json`);
  const modeKey = mode || profileConfig.defaultMode || Object.keys(profileConfig.modes || {})[0] || 'detail';
  const fallbackModeConfig = profileConfig.modes?.short || profileConfig.modes?.detail || Object.values(profileConfig.modes || {})[0] || {};
  let modeConfig = profileConfig.modes?.[modeKey] || fallbackModeConfig;

  const isOnePage = modeKey === 'onepage';
  if (isOnePage) {
    document.body.classList.add('ats-two-page');
    if (!profileConfig.modes?.onepage) {
      modeConfig = {
        ...modeConfig,
        limits: {
          ...(modeConfig.limits || {}),
          introMaxChars: Math.min(modeConfig.limits?.introMaxChars || 180, 180),
          workDetailsPerCompany: Math.min(modeConfig.limits?.workDetailsPerCompany || 2, 2),
          projectWorkBullets: Math.min(modeConfig.limits?.projectWorkBullets || 2, 2),
          projectTextMaxChars: Math.min(modeConfig.limits?.projectTextMaxChars || 220, 220)
        }
      };
    }
  }

  const contentPolicy = modeConfig.contentPolicy || {};

  if (modeConfig.pageTitle) document.title = modeConfig.pageTitle;

  renderHeader(baseProfile, modeConfig.position || '');

  const useBrief = modeKey === 'onepage';
  const sectionHandlers = {
    summary: async () => renderSummary(modeConfig.summaryBullets || []),
    intro: async () => renderIntro(modeConfig.limits),
    work: async () => renderWork(modeConfig.limits, useBrief, contentPolicy.work),
    projects: async () => renderProjects(modeConfig.limits, useBrief, contentPolicy.projects),
    skills: async () => renderSkills(modeConfig.limits),
    github: async () => renderGithub(modeConfig.limits),
    education: async () => renderEducation(useBrief)
  };

  const sections = modeConfig.sections || [];
  if (!sections.includes('summary')) await renderIntro(modeConfig.limits);

  for (const section of sections) {
    const handler = sectionHandlers[section];
    if (handler) await handler();
  }

  addAtsRuler(isOnePage ? 2 : undefined);
  setupPlainTextExport({ profileKey: profile, modeKey, modeConfig, useBrief, contentPolicy });
}

init().catch((err) => {
  const root = $('#ats-root');
  if (root) root.textContent = `加载失败：${err.message}`;
  console.error(err);
});

async function buildPlainText({ modeConfig, useBrief, contentPolicy }) {
  const baseProfile = await fetchJson('../data/profile-base.json');
  const contacts = baseProfile.contacts || {};
  const lines = [];

  const pushSeparator = () => lines.push('----------------------------------------');

  lines.push(`${baseProfile.name || ''}${modeConfig.position ? ` | ${modeConfig.position}` : ''}`.trim());
  if (contacts.phone) lines.push(`电话: ${contacts.phone}`);
  if (contacts.email) lines.push(`邮箱: ${contacts.email}`);
  if (contacts.wechat) lines.push(`微信: ${contacts.wechat}`);
  if (contacts.github) lines.push(`GitHub: ${contacts.githubLabel || contacts.github}`);
  if (contacts.bilibili) lines.push(`BiliBili: ${contacts.bilibiliLabel || contacts.bilibili}`);

  pushSeparator();

  if (modeConfig.summaryBullets?.length) {
    lines.push('摘要');
    modeConfig.summaryBullets.forEach((item) => lines.push(`  - ${item}`));
    pushSeparator();
  }

  const introText = await fetchText('../data/intro.txt');
  const intro = truncateText(introText, modeConfig.limits?.introMaxChars);
  if (intro) {
    lines.push('简介');
    lines.push(`  ${intro}`);
    pushSeparator();
  }

  const workData = await fetchJson('../data/work.json');
  const companies = limitArray(workData, modeConfig.limits?.workCompanies);
  if (companies.length) {
    lines.push('工作经历');
    companies.forEach((item) => {
      const level = resolveDisplayLevel(item, contentPolicy?.work);
      const effectiveLevel = useBrief && level === 'full' ? 'value3' : level;
      const oneLiner = getOneLiner(item, modeConfig.limits?.workDescMaxChars);
      const value3 = getValue3(item);
      const star = normalizeStar(item.star);

      lines.push(`  ${item.company} - ${item.position} (${item.period || ''})`);
      if (oneLiner) lines.push(`    一句话：${oneLiner}`);

      if (effectiveLevel === 'oneLiner') {
        return;
      }

      if (effectiveLevel === 'value3') {
        value3.forEach((line) => lines.push(`    - ${truncateText(line, modeConfig.limits?.workDescMaxChars)}`));
        return;
      }

      if (effectiveLevel === 'star') {
        if (hasStarContent(star)) {
          if (star.situation) lines.push(`    S: ${truncateText(star.situation, modeConfig.limits?.workDescMaxChars)}`);
          if (star.task) lines.push(`    T: ${truncateText(star.task, modeConfig.limits?.workDescMaxChars)}`);
          if (star.action) lines.push(`    A: ${truncateText(star.action, modeConfig.limits?.workDescMaxChars)}`);
          if (star.result) lines.push(`    R: ${truncateText(star.result, modeConfig.limits?.workDescMaxChars)}`);
        } else {
          value3.forEach((line) => lines.push(`    - ${truncateText(line, modeConfig.limits?.workDescMaxChars)}`));
        }
        return;
      }

      value3.forEach((line) => lines.push(`    - ${truncateText(line, modeConfig.limits?.workDescMaxChars)}`));
      if (hasStarContent(star)) {
        if (star.situation) lines.push(`    S: ${truncateText(star.situation, modeConfig.limits?.workDescMaxChars)}`);
        if (star.task) lines.push(`    T: ${truncateText(star.task, modeConfig.limits?.workDescMaxChars)}`);
        if (star.action) lines.push(`    A: ${truncateText(star.action, modeConfig.limits?.workDescMaxChars)}`);
        if (star.result) lines.push(`    R: ${truncateText(star.result, modeConfig.limits?.workDescMaxChars)}`);
      }

      if (useBrief && Array.isArray(item.brief) && item.brief.length) {
        item.brief.forEach((detail) => lines.push(`    - ${detail}`));
      } else {
        limitArray(item.details || [], modeConfig.limits?.workDetailsPerCompany).forEach((detail) => {
          const desc = truncateText(detail.desc, modeConfig.limits?.workDescMaxChars);
          lines.push(`    - ${detail.title}：${desc}`);
        });
      }
    });
    pushSeparator();
  }

  const projectData = await fetchJson('../data/projects.json');
  const projects = limitArray(projectData, modeConfig.limits?.projectCount);
  if (projects.length) {
    lines.push('项目经历');
    projects.forEach((item) => {
      const level = resolveDisplayLevel(item, contentPolicy?.projects);
      const effectiveLevel = useBrief && level === 'full' ? 'value3' : level;
      const oneLiner = getOneLiner(item, modeConfig.limits?.projectTextMaxChars);
      const value3 = getValue3(item);
      const star = normalizeStar(item.star);

      lines.push(`  ${item.name} (${item.period || ''})`);
      if (oneLiner) lines.push(`    一句话：${oneLiner}`);

      if (effectiveLevel === 'oneLiner') {
        return;
      }

      if (effectiveLevel === 'value3') {
        value3.forEach((line) => lines.push(`    - ${truncateText(line, modeConfig.limits?.projectTextMaxChars)}`));
        return;
      }

      if (effectiveLevel === 'star') {
        if (hasStarContent(star)) {
          if (star.situation) lines.push(`    S: ${truncateText(star.situation, modeConfig.limits?.projectTextMaxChars)}`);
          if (star.task) lines.push(`    T: ${truncateText(star.task, modeConfig.limits?.projectTextMaxChars)}`);
          if (star.action) lines.push(`    A: ${truncateText(star.action, modeConfig.limits?.projectTextMaxChars)}`);
          if (star.result) lines.push(`    R: ${truncateText(star.result, modeConfig.limits?.projectTextMaxChars)}`);
        } else {
          value3.forEach((line) => lines.push(`    - ${truncateText(line, modeConfig.limits?.projectTextMaxChars)}`));
        }
        return;
      }

      value3.forEach((line) => lines.push(`    - ${truncateText(line, modeConfig.limits?.projectTextMaxChars)}`));
      if (hasStarContent(star)) {
        if (star.situation) lines.push(`    S: ${truncateText(star.situation, modeConfig.limits?.projectTextMaxChars)}`);
        if (star.task) lines.push(`    T: ${truncateText(star.task, modeConfig.limits?.projectTextMaxChars)}`);
        if (star.action) lines.push(`    A: ${truncateText(star.action, modeConfig.limits?.projectTextMaxChars)}`);
        if (star.result) lines.push(`    R: ${truncateText(star.result, modeConfig.limits?.projectTextMaxChars)}`);
      }

      if (useBrief && Array.isArray(item.brief) && item.brief.length) {
        item.brief.forEach((line) => lines.push(`    - ${line}`));
        if (item.tech) lines.push(`    技术栈：${truncateText(item.tech, modeConfig.limits?.projectTextMaxChars)}`);
      } else {
        lines.push(`    项目背景：${truncateText(item.background, modeConfig.limits?.projectTextMaxChars)}`);
        lines.push('    主要工作：');
        limitArray(item.work || [], modeConfig.limits?.projectWorkBullets).forEach((work) => {
          lines.push(`      - ${truncateText(work, modeConfig.limits?.projectTextMaxChars)}`);
        });
        lines.push(`    技术栈：${truncateText(item.tech, modeConfig.limits?.projectTextMaxChars)}`);
        if (item.result?.length) {
          lines.push('    成果：');
          item.result.forEach((result) => {
            lines.push(`      - ${truncateText(result, modeConfig.limits?.projectTextMaxChars)}`);
          });
        }
      }
    });
    pushSeparator();
  }

  const skillData = await fetchJson('../data/skills.json');
  const skills = limitArray(skillData, modeConfig.limits?.skillCount);
  if (skills.length) {
    lines.push('技能');
    skills.forEach((skill) => {
      const level = skill.level || (typeof skill.percent === 'number' ? '熟练' : '了解');
      const keywords = Array.isArray(skill.keywords)
        ? skill.keywords.join(' / ')
        : String(skill.description || '').trim();
      const evidence = String(skill.evidence || '').trim();

      lines.push(`  - ${skill.name}（${level}）${keywords ? `｜${keywords}` : ''}`);
      if (evidence) lines.push(`    证据：${evidence}`);
    });
    pushSeparator();
  }

  if (modeConfig.limits?.githubCount) {
    const repos = limitArray(await fetchJson('../data/projects-github.json'), modeConfig.limits.githubCount);
    if (repos.length) {
      lines.push('开源项目');
      repos.forEach((repo) => {
        const lang = repo.language ? `（${repo.language}）` : '';
        const desc = repo.description ? ` - ${repo.description}` : '';
        lines.push(`  - ${repo.name}${lang}${desc}`);
        if (repo.url) lines.push(`    ${repo.url}`);
      });
      pushSeparator();
    }
  }

  const eduData = await fetchJson('../data/education.json');
  if (eduData?.length) {
    lines.push('教育经历');
    eduData.forEach((item) => {
      lines.push(`  ${item.school} - ${item.major} - ${item.degree} (${item.period || ''})`);
      const source = useBrief && Array.isArray(item.brief) && item.brief.length ? item.brief : item.details || [];
      source.forEach((detail) => lines.push(`    - ${detail}`));
    });
  }

  return lines.join('\n');
}

function setupPlainTextExport({ modeKey, modeConfig, useBrief, contentPolicy }) {
  const button = document.querySelector('#copy-plain-text');
  const note = document.querySelector('#copy-plain-text-note');
  if (!button) return;

  const setNote = (message) => {
    if (!note) return;
    note.textContent = message;
    if (message) {
      setTimeout(() => {
        if (note.textContent === message) note.textContent = '';
      }, 2000);
    }
  };

  button.addEventListener('click', async () => {
    try {
      const text = await buildPlainText({ modeConfig, modeKey, useBrief, contentPolicy });
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.setAttribute('readonly', '');
        textarea.style.position = 'absolute';
        textarea.style.left = '-9999px';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        textarea.remove();
      }
      setNote('已复制到剪贴板');
    } catch (error) {
      console.error(error);
      setNote('复制失败');
    }
  });
}

function addAtsRuler(pageCount) {
  const page = document.querySelector('.ats-page');
  if (!page) return;
  if (page.querySelector('.ats-ruler')) return;

  const pxPerMm = 96 / 25.4;
  const pageHeightPx = 297 * pxPerMm;
  const estimatedPages = pageCount || Math.max(1, Math.ceil(page.scrollHeight / pageHeightPx));
  const count = Math.max(1, Math.min(estimatedPages, 6));

  const ruler = document.createElement('div');
  ruler.className = 'ats-ruler no-print';
  ruler.innerHTML = Array.from({ length: count }, (_, index) => {
    const pageNumber = index + 1;
    return `<span class="ats-ruler-label" style="top: calc(${(pageNumber - 1) * 297}mm + 6mm)">第${pageNumber}页</span>`;
  }).join('');
  page.prepend(ruler);
}
