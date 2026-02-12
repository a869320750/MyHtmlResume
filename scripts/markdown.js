async function fetchText(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Failed to fetch ${url}: ${response.status}`);
  return await response.text();
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function renderMarkdown(markdown, baseUrl) {
  const renderer = new marked.Renderer();
  renderer.code = (code, lang) => {
    const token = typeof code === 'object' && code !== null ? code : null;
    const text = token ? token.text || '' : code || '';
    const language = (token ? token.lang : lang || '').toLowerCase();
    if (language === 'mermaid') {
      return `<pre class="mermaid">${escapeHtml(text)}</pre>`;
    }
    return `<pre><code>${escapeHtml(text)}</code></pre>`;
  };

  marked.setOptions({
    gfm: true,
    breaks: false,
    renderer,
    baseUrl
  });

  marked.use({
    walkTokens(token) {
      if (token.type === 'image' && typeof token.href === 'string') {
        const href = token.href.trim();
        if (href && !/^([a-z]+:)?\/\//i.test(href) && !href.startsWith('/')) {
          token.href = new URL(href.replace(/^\.\//, ''), baseUrl).toString();
        }
      }
    }
  });

  return marked.parse(String(markdown));
}

async function initMarkdown() {
  const root = document.querySelector('#markdown-root');
  const list = document.querySelector('#markdown-list');
  const sidebar = document.querySelector('#md-sidebar');
  const toggle = document.querySelector('#md-sidebar-toggle');
  if (!root) return;

  if (window.location && window.location.protocol === 'file:') {
    root.innerHTML = '<div class="md-warning">请通过本地服务器打开页面，避免浏览器阻止读取 data/supplement.md。</div>';
    return;
  }

  const index = await fetch('../data/markdown/index.json');
  if (!index.ok) throw new Error('无法加载 Markdown 目录索引');
  const items = await index.json();

  if (!Array.isArray(items) || items.length === 0) {
    root.innerHTML = '<div class="md-warning">未找到可用的 Markdown 文件。</div>';
    return;
  }

  const params = new URLSearchParams(window.location.search);
  const requested = (params.get('doc') || '').trim();
  const firstFile = items[0].file;
  const activeFile = items.find((item) => item.file === requested)?.file || firstFile;

  if (list) {
    list.innerHTML = items
      .map((item) => {
        const isActive = item.file === activeFile;
        const title = item.title || item.file;
        return `<li><a href="#" data-file="${item.file}" class="${isActive ? 'active' : ''}">${title}</a></li>`;
      })
      .join('');

    list.querySelectorAll('a[data-file]').forEach((link) => {
      link.addEventListener('click', async (event) => {
        event.preventDefault();
        const file = link.getAttribute('data-file');
        if (!file) return;
        list.querySelectorAll('a').forEach((node) => node.classList.remove('active'));
        link.classList.add('active');
        await loadMarkdown(file, root);
      });
    });
  }

  if (toggle && sidebar) {
    toggle.addEventListener('click', () => {
      sidebar.classList.toggle('md-sidebar-collapsed');
    });
  }

  await loadMarkdown(activeFile, root);

  if (window.mermaid) {
    mermaid.initialize({ startOnLoad: false, theme: 'default' });
    mermaid.run({ querySelector: '.mermaid' });
  }
}

async function loadMarkdown(file, root) {
  const baseRoot = new URL('../data/markdown/', window.location.href);
  const fileUrl = new URL(file, baseRoot);
  const baseDir = new URL('./', fileUrl).toString();
  const markdown = await fetchText(fileUrl.toString());
  root.innerHTML = renderMarkdown(markdown, baseDir);
  if (window.mermaid) {
    mermaid.initialize({ startOnLoad: false, theme: 'default' });
    mermaid.run({ querySelector: '.mermaid' });
  }
}

initMarkdown().catch((err) => {
  const root = document.querySelector('#markdown-root');
  if (root) root.textContent = `加载失败：${err.message}`;
  console.error(err);
});
