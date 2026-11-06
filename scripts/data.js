/* eslint-disable no-console */

// 共享数据访问层。主页与简历页都从这里取数据，避免 fetch 与项目合并逻辑各写一份。

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

// index.json 是注册表（顺序 / 分类 / 图标 / path / githubUrl），meta.json 存项目内容；
// 两者字段本不重叠，万一重叠以注册表为准。
async function loadProjectsUncached() {
  const registry = await fetchJson('../data/projects/index.json');
  return Promise.all(
    registry.map(async (entry) => {
      const meta = await fetchJson(`../data/projects/${entry.path}/meta.json`);
      return { ...meta, ...entry };
    })
  );
}

let projectsPromise = null;

// 一次页面生命周期内只加载一遍，主页渲染与纯文本导出共用同一份结果。
function loadProjects() {
  if (!projectsPromise) {
    projectsPromise = loadProjectsUncached().catch((err) => {
      projectsPromise = null;
      throw err;
    });
  }
  return projectsPromise;
}
