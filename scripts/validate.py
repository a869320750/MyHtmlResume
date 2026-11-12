#!/usr/bin/env python3
"""Static data validator for the resume site.

GitHub Pages serves every file under the repository root, so a broken path or a
leaked draft file is published to the public site. This script catches the
mechanical mistakes (bad JSON, dangling project path, empty project doc,
malformed period, missing image, stray draft) before they reach the remote.

Zero third-party dependencies; run with the same Python that runs dev_server.py.
"""

from __future__ import annotations

import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT / "data"

REQUIRED_META_FIELDS = ("name", "period", "oneLiner")
PERIOD_RE = re.compile(r"^\d{4}\.\d{2}(\s*-\s*(\d{4}\.\d{2}|至今))?$")
DRAFT_PATTERNS = ("caogao*.md",)

errors: list[str] = []
warnings: list[str] = []


def fail(message: str) -> None:
    errors.append(message)


def warn(message: str) -> None:
    warnings.append(message)


def load_json(path: Path):
    if not path.is_file():
        fail(f"缺少文件: {rel(path)}")
        return None
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except json.JSONDecodeError as exc:
        fail(f"JSON 解析失败: {rel(path)}: {exc}")
        return None


def rel(path: Path) -> str:
    try:
        return path.relative_to(ROOT).as_posix()
    except ValueError:
        return str(path)


def check_project_docs() -> None:
    for doc in sorted(DATA.glob("projects/**/project-doc.md")):
        if doc.stat().st_size == 0:
            warn(f"项目文档为空（点「内容」会打开空白页）: {rel(doc)}")


def check_drafts_not_published() -> None:
    for pattern in DRAFT_PATTERNS:
        for hit in ROOT.rglob(pattern):
            if ".git" in hit.parts:
                continue
            fail(f"私人草稿仍在发布目录内，会通过 GitHub Pages 公开: {rel(hit)}")


def check_index() -> None:
    index = load_json(DATA / "projects" / "index.json")
    if not isinstance(index, list):
        fail("data/projects/index.json 顶层应为数组")
        return

    seen_paths: set[str] = set()
    seen_icons: set[str] = set()

    for pos, entry in enumerate(index):
        where = f"data/projects/index.json[{pos}]"
        if not isinstance(entry, dict):
            fail(f"{where} 应为对象")
            continue

        path = entry.get("path")
        if not path:
            fail(f"{where} 缺少 path 字段")
            continue
        if path in seen_paths:
            fail(f"{where} path 重复: {path}")
        seen_paths.add(path)

        icon = entry.get("icon")
        if icon:
            if icon in seen_icons:
                warn(f"{where} icon 与其他项目重复: {icon}")
            seen_icons.add(icon)

        if not entry.get("category"):
            fail(f"{where} 缺少 category 字段")

        project_dir = DATA / "projects" / path
        if not project_dir.is_dir():
            fail(f"{where} path 指向的目录不存在: {rel(project_dir)}")
            continue

        meta = load_json(project_dir / "meta.json")
        if meta is not None:
            if not isinstance(meta, dict):
                fail(f"{rel(project_dir / 'meta.json')} 顶层应为对象")
            else:
                for field in REQUIRED_META_FIELDS:
                    if not str(meta.get(field, "")).strip():
                        fail(f"{rel(project_dir / 'meta.json')} 缺少必填字段: {field}")
                check_period(rel(project_dir / "meta.json"), meta.get("period"))
                for field in ("tags", "work", "result"):
                    if field in meta and not isinstance(meta[field], list):
                        fail(f"{rel(project_dir / 'meta.json')} 字段 {field} 应为数组")

        doc = project_dir / "project-doc.md"
        if not doc.is_file():
            fail(f"{where} 缺少 project-doc.md: {rel(doc)}")

        images_dir = project_dir / "images"
        if images_dir.is_dir():
            for img in sorted(images_dir.iterdir()):
                if not img.is_file():
                    continue
                if img.suffix == ".excalidraw":
                    warn(f"设计源文件会一并发布: {rel(img)}")

    registered = {entry.get("path") for entry in index if isinstance(entry, dict)}
    # 有意不注册的项目：目录保留在仓库供参考，但主页与简历都不展示
    unregistered_file = DATA / "projects" / "unregistered.txt"
    intentionally_unregistered = set()
    if unregistered_file.is_file():
        for line in unregistered_file.read_text(encoding="utf-8").splitlines():
            line = line.split("#", 1)[0].strip()
            if line:
                intentionally_unregistered.add(line)
    projects_root = DATA / "projects"
    if projects_root.is_dir():
        for candidate in sorted(projects_root.iterdir()):
            if not candidate.is_dir() or candidate.name in {"images", "__pycache__"}:
                continue
            for inner in sorted(candidate.iterdir()):
                if not inner.is_dir():
                    continue
                key = f"{candidate.name}/{inner.name}"
                if not (inner / "meta.json").is_file():
                    if (inner / "project-doc.md").is_file() and key not in intentionally_unregistered:
                        warn(f"项目缺少 meta.json，无法注册到 index.json: {key}")
                    continue
                if key not in registered and key not in intentionally_unregistered:
                    warn(f"项目未注册到 index.json（主页不会展示）: {key}")


def check_period(where: str, period) -> None:
    if not isinstance(period, str) or not period.strip():
        return
    if not PERIOD_RE.match(period.strip()):
        fail(f"{where} period 格式不符 YYYY.MM 或 YYYY.MM - YYYY.MM: {period!r}")


def check_work() -> None:
    work = load_json(DATA / "work.json")
    if not isinstance(work, list):
        fail("data/work.json 顶层应为数组")
        return
    for pos, job in enumerate(work):
        where = f"data/work.json[{pos}]"
        if not isinstance(job, dict):
            fail(f"{where} 应为对象")
            continue
        for field in ("company", "position", "period"):
            if not str(job.get(field, "")).strip():
                fail(f"{where} 缺少必填字段: {field}")
        check_period(where, job.get("period"))
        details = job.get("details")
        if details is not None and not isinstance(details, list):
            fail(f"{where} details 应为数组")


def check_profile() -> None:
    profile = load_json(DATA / "profile-base.json")
    if isinstance(profile, dict) and not str(profile.get("name", "")).strip():
        fail("data/profile-base.json 缺少 name")

    for profile_path in sorted((DATA / "profiles").glob("*.json")):
        config = load_json(profile_path)
        if not isinstance(config, dict):
            fail(f"{rel(profile_path)} 顶层应为对象")
            continue
        sections = config.get("sections")
        if not isinstance(sections, list) or not sections:
            fail(f"{rel(profile_path)} 缺少非空的 sections 数组")
            continue
        known = {"summary", "work", "projects", "skills", "github", "education"}
        for section in sections:
            if section not in known:
                fail(f"{rel(profile_path)} 未知 section: {section}（ats.js 无对应 case）")


def check_images() -> None:
    images_dir = ROOT / "images"
    if images_dir.is_dir():
        for img in images_dir.iterdir():
            if img.is_file() and img.stat().st_size > 1_000_000:
                warn(f"图片体积偏大，会拖慢首屏: {rel(img)} ({img.stat().st_size // 1024} KB)")


def main() -> int:
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")

    check_drafts_not_published()
    check_index()
    check_project_docs()
    check_work()
    check_profile()
    check_images()

    for message in dict.fromkeys(warnings):
        print(f"WARN  {message}")
    for message in dict.fromkeys(errors):
        print(f"ERROR {message}")

    total = len(errors) + len(warnings)
    print()
    if errors:
        print(f"校验失败: {len(errors)} 个错误, {len(warnings)} 个警告")
        return 1
    if total:
        print(f"校验通过: 0 个错误, {len(warnings)} 个警告")
        return 0
    print("校验通过: 0 个错误, 0 个警告")
    return 0


if __name__ == "__main__":
    sys.exit(main())
