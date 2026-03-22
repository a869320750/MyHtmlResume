# ⭐ 一、GitLab / CI（超级高频）
## 1. GitLab 怎么部署
**名词定义**：GitLab 是一个基于Git的一站式DevOps平台，部署指将GitLab服务安装、配置并运行在服务器上，提供代码托管、CI/CD、项目管理等功能。
**实际答案**：
1. **环境准备**：准备Linux服务器（推荐Ubuntu/CentOS），配置≥4核8G内存、足够磁盘空间，开放80/443/22端口；
2. **安装方式**：首选**GitLab Omnibus一键安装包**（集成所有组件，最常用），其次是Docker部署、源码编译；
3. **一键部署步骤**：
   - 安装依赖：`sudo apt-get install -y curl openssh-server ca-certificates`
   - 添加GitLab软件源：`curl https://packages.gitlab.com/install/repositories/gitlab/gitlab-ce/script.deb.sh | sudo bash`
   - 安装社区版：`sudo apt-get install gitlab-ce`
   - 配置访问地址：修改`/etc/gitlab/gitlab.rb`的`external_url`
   - 重载配置：`sudo gitlab-ctl reconfigure`
4. **启动/管理**：`gitlab-ctl start/stop/restart` 控制服务，浏览器访问配置的地址即可使用。

## 2. GitLab runner 有几种模式
**名词定义**：GitLab Runner 是CI/CD的执行器，负责运行`.gitlab-ci.yml`中的任务，模式指Runner的注册和执行架构类型。
**实际答案**：
GitLab Runner 分**3种核心模式**：
1. **共享模式（Shared）**：GitLab实例全局可用，所有项目都能使用，管理员配置；
2. **组模式（Group）**：仅当前分组下的所有子项目/仓库可用，组管理员配置；
3. **特定项目模式（Specific）**：仅绑定的单个项目可用，最常用，安全性更高。
额外：按执行器类型划分有shell、docker、kubernetes等10+种，核心注册模式为以上3种。

## 3. shell runner 和 docker runner 区别
**名词定义**：两者都是GitLab Runner的**执行器类型**，决定CI任务的运行环境。
**实际答案**：
| 维度 | Shell Runner | Docker Runner |
| ---- | ------------ | ------------- |
| 运行环境 | 直接运行在Runner宿主机的操作系统shell中 | 运行在独立的Docker容器内 |
| 环境隔离 | 无隔离，多任务共享宿主机环境，易冲突 | 强隔离，每个任务独立容器，环境干净 |
| 依赖管理 | 需提前在宿主机安装所有依赖（JDK/Node等） | 用Docker镜像封装依赖，随任务自动拉取 |
| 适用场景 | 简单脚本、轻量任务、无环境依赖的场景 | 复杂项目、多语言项目、需要固定环境的场景 |
| 性能 | 启动快，无容器开销 | 启动稍慢，有容器创建销毁开销 |
| 安全性 | 低，任务可操作宿主机 | 高，容器无法直接入侵宿主机 |

## 4. CI pipeline 怎么写
**名词定义**：CI Pipeline 是GitLab的自动化流水线，通过`.gitlab-ci.yml`文件定义，按阶段执行构建、测试、部署等任务。
**实际答案**：
1. **核心步骤**：在项目根目录创建`.gitlab-ci.yml`文件；
2. **基础结构**：定义阶段（stages）→ 定义任务（jobs）→ 绑定阶段 → 配置执行命令；
3. **最简示例**：
```yaml
# 定义执行顺序
stages:
  - build
  - test
  - deploy

# 构建任务
build_job:
  stage: build
  script:
    - echo "执行构建"

# 测试任务
test_job:
  stage: test
  script:
    - echo "执行测试"
```
4. **提交规则**：将文件提交到Git仓库，推送后GitLab自动触发Pipeline。

## 5. `.gitlab-ci.yml` 常见字段
**名词定义**：`.gitlab-ci.yml`是GitLab CI的配置文件，字段是文件中的核心配置项，控制流水线行为。
**实际答案**：
1. **stages**：定义流水线阶段，控制执行顺序；
2. **stage**：给单个job绑定所属阶段；
3. **script**：必填，job要执行的shell命令；
4. **image**：指定Docker执行器使用的镜像；
5. **tags**：指定运行该job的Runner标签；
6. **only/except/rules**：控制job触发条件（分支、标签、MR等）；
7. **variables**：定义自定义变量；
8. **cache**：缓存依赖文件，提升构建速度；
9. **artifacts**：构建产物归档，供下载或后续job使用；
10. **needs/dependencies**：跨阶段任务依赖；
11. **when**：控制job执行时机（成功/失败/手动）；
12. **retry**：任务失败自动重试次数。

## 6. 如何缓存依赖
**名词定义**：CI缓存（cache）是将项目依赖包（node_modules、maven仓库等）持久化，避免每次构建重复下载，提升速度。
**实际答案**：
1. **基础用法**：在`.gitlab-ci.yml`中配置`cache`字段，指定缓存路径；
2. **全局缓存（所有job共享）**：
```yaml
# 全局缓存node_modules
cache:
  paths:
    - node_modules/

build:
  script:
    - npm install
```
3. **按项目/分支隔离缓存**：配置`key`，避免不同项目/分支缓存冲突；
```yaml
cache:
  key: $CI_PROJECT_NAME-$CI_COMMIT_BRANCH
  paths:
    - node_modules/
```
4. **注意**：cache是共享缓存，artifacts是任务产物，两者用途不同。

## 7. pipeline 卡住怎么排查
**名词定义**：Pipeline卡住指任务处于pending/running状态不执行、不结束，无法正常完成流水线。
**实际答案**：
1. **检查Runner状态**：项目→设置→CI/CD→Runner，查看Runner是否在线、正常运行；
2. **查看任务日志**：进入卡住的job，查看日志报错信息（依赖缺失、权限不足、网络超时）；
3. **资源检查**：Runner宿主机CPU/内存/磁盘是否耗尽，Docker是否卡死；
4. **配置检查**：job的tags是否匹配可用Runner，执行权限是否足够；
5. **任务阻塞**：是否有前置任务未完成，是否开启了手动审批；
6. **重启服务**：重启GitLab Runner、Docker服务，清理僵尸进程；
7. **GitLab服务**：检查GitLab自身服务是否异常，网络是否连通。

## 8. runner 离线怎么处理
**名词定义**：Runner离线指GitLab控制台显示Runner状态为offline，无法接收和执行CI任务。
**实际答案**：
1. **服务器连通性**：检查Runner宿主机是否开机、网络通不通，能否ping通GitLab服务器；
2. **Runner服务状态**：
   - 查看服务：`gitlab-runner status`
   - 重启服务：`sudo gitlab-runner restart`
3. **注册信息校验**：检查`/etc/gitlab-runner/config.toml`中GitLab地址、token是否正确，未被篡改；
4. **令牌失效**：若注册令牌过期，删除旧Runner，重新注册；
5. **权限/版本**：检查Runner运行用户权限，升级GitLab Runner版本兼容GitLab；
6. **日志排查**：查看Runner日志`/var/log/gitlab-runner/`定位具体错误。

## 9. 如何做多项目 pipeline
**名词定义**：多项目Pipeline指跨多个GitLab仓库，实现流水线联动（如前端构建触发后端部署、公共库更新触发业务项目构建）。
**实际答案**：
1. **方式1：trigger 触发（最常用）**
   - 主项目配置job，通过API触发子项目Pipeline；
   - 子项目配置触发器，获取主项目传递的变量；
2. **方式2：parent-child pipeline（父子流水线）**
   父项目配置文件调用子项目流水线，统一管理，适合单体多模块项目；
3. **方式3：跨项目 artifacts 依赖**
   用`needs:project`引用其他项目的构建产物；
4. **核心配置示例**：
```yaml
trigger_child:
  stage: deploy
  trigger:
    project: 用户名/子项目名
    branch: main
    strategy: depend
```

## 10. artifact 怎么保存 / 下载
**名词定义**：Artifacts（制品）是CI任务执行完成后生成的文件（构建包、日志、报告等），可保存和下载。
**实际答案**：
### 保存（归档）
1. 在job中配置`artifacts`字段，指定需要保存的文件/路径；
2. 可配置过期时间，避免占用存储空间；
```yaml
build:
  script:
    - npm run build
  artifacts:
    paths:
      - dist/  # 保存dist目录
    expire_in: 7 days  # 7天后自动删除
```
### 下载
1. **页面下载**：进入job详情页，点击右侧`Download artifacts`；
2. **流水线下载**：Pipeline详情页统一下载所有制品；
3. **API下载**：调用GitLab API通过接口下载制品；
4. **跨job使用**：后续job通过`dependencies`自动下载前置job制品。

## 11. stage、job、pipeline 的关系是什么
**名词定义**：三者是GitLab CI的核心层级概念，共同组成自动化流水线。
**实际答案**：
1. **包含关系（从大到小）**：**Pipeline > Stage > Job**；
2. **Pipeline（流水线）**：一次代码推送/MR触发的完整自动化流程，是最大单元；
3. **Stage（阶段）**：Pipeline的分组，按顺序执行（如build→test→deploy），同一阶段的job并行执行；
4. **Job（任务）**：最小执行单元，每个Stage包含1个或多个Job，真正执行脚本命令；
5. **执行逻辑**：Pipeline按Stage顺序执行，每个Stage下的Job并行运行，所有Job成功，Stage通过，最终Pipeline成功。

## 12. only / except 和 rules 有什么区别
**名词定义**：均为控制GitLab CI任务触发条件的配置，决定job在什么场景下执行/不执行。
**实际答案**：
1. **版本与定位**：
   - `only/except`：旧版配置，GitLab保留兼容；
   - `rules`：新版官方推荐配置，替代only/except，功能更强大；
2. **语法差异**：
   - only：定义**任务执行的条件**（分支、标签、事件）；
   - except：定义**任务不执行的条件**；
   - rules：逐条判断规则，支持`if`/`changes`/`exists`，灵活组合；
3. **功能差异**：
   - rules支持手动触发、变量判断、文件变更判断，only/except不支持；
4. **优先级**：同一个job不能同时混用only/except和rules，优先使用rules。

## 13. GitLab CI 变量分几类，怎么安全管理敏感信息
**名词定义**：CI变量是流水线中使用的参数，敏感信息指密码、令牌、密钥等不能明文暴露的数据。
**实际答案**：
### 变量分类（5类）
1. **项目变量**：单个项目私有，项目→设置→CI/CD→变量配置；
2. **组变量**：分组下所有项目共享；
3. **实例变量**：GitLab全局所有项目共享（管理员配置）；
4. **预定义变量**：GitLab内置变量（如$CI_COMMIT_BRANCH），直接使用；
5. **自定义变量**：`.gitlab-ci.yml`中手动定义的变量。
### 敏感信息安全管理
1. 配置变量时勾选**保护变量+掩码变量**，日志中不显示明文；
2. 绝不将密钥明文写在`.gitlab-ci.yml`中；
3. 敏感变量仅授权给保护分支/标签使用；
4. 结合GitLab Vault集成管理密钥（高级方案）。

## 14. merge request 流程里如何加自动检查
**名词定义**：MR自动检查指代码合并前，CI自动执行校验，不通过则禁止合并，保证代码质量。
**实际答案**：
1. **配置触发规则**：用`rules`或`only`指定仅MR触发检查；
2. **编写检查任务**：在CI中加入代码校验、单元测试、语法检查、安全扫描job；
3. **开启合并阻塞**：项目→设置→通用→合并请求→勾选**流水线必须成功**；
4. **示例配置**：
```yaml
mr_check:
  stage: test
  script:
    - npm run lint  # 代码规范检查
    - npm run test  # 单元测试
  rules:
    - if: $CI_PIPELINE_SOURCE == 'merge_request_event'
```
5. 效果：MR创建后自动运行检查，检查失败无法点击合并按钮。

## 15. 如何做手动审批发布
**名词定义**：手动审批发布指流水线执行到发布阶段时，需要人工点击确认才能执行部署，防止误发布。
**实际答案**：
1. **核心配置**：给发布job添加`when: manual`（手动执行）+`allow_failure: false`（必须通过）；
2. **示例**：
```yaml
stages:
  - build
  - deploy

deploy_prod:
  stage: deploy
  script:
    - echo "发布到生产环境"
  when: manual  # 手动触发
  allow_failure: false  # 必须执行成功，流水线才算通过
```
3. **增强方案**：
   - 给保护分支配置审批权限；
   - 多环境审批：测试环境自动，生产环境手动；
   - 结合GitLab角色权限，仅管理员可审批。

## 16. needs 和 dependencies 区别是什么
**名词定义**：两者均用于GitLab CI中**任务之间的依赖管理**，控制执行顺序和制品传递。
**实际答案**：
| 维度 | needs | dependencies |
| ---- | ----- | ------------ |
| **核心作用** | 打破阶段顺序，实现**跨阶段并行执行** | 仅传递前置任务制品，不改变执行顺序 |
| **执行顺序** | 依赖任务完成后立即执行，无需等待阶段结束 | 严格按stages顺序执行 |
| **制品传递** | 自动下载依赖任务的制品 | 显式指定下载哪些任务的制品 |
| **适用场景** | 优化流水线速度，并行执行无关联任务 | 单纯需要前置任务产物的场景 |
| **版本** | 新版高级功能 | 旧版基础功能 |
| **优先级** | needs优先级高于dependencies | 仅顺序依赖，无并行能力 |

## 17. GitLab runner 标签怎么设计
**名词定义**：Runner标签是用于匹配job和Runner的标识，job通过tags指定由哪个Runner执行。
**实际答案**：
### 设计原则（标准化+可扩展）
1. **环境标签**：`dev`/`test`/`prod`（区分部署环境）；
2. **执行器标签**：`shell`/`docker`/`k8s`（区分执行类型）；
3. **语言/技术栈标签**：`java`/`node`/`python`（区分项目依赖）；
4. **项目/组标签**：`frontend`/`backend`/`group-xxx`（区分业务）；
### 最佳实践示例
- 前端Docker Runner：`docker, node, frontend, test`
- 后端生产Shell Runner：`shell, java, backend, prod`
### 使用规则
- 一个Runner可打多个标签；
- job的tags必须完全匹配Runner标签才能执行。

## 18. 如何让不同分支走不同 pipeline
**名词定义**：分支差异化Pipeline指main、dev、feature等不同代码分支，执行不同的CI任务和阶段。
**实际答案**：
1. **核心方案**：用`rules`或`only/except`按分支名判断；
2. **示例配置**：
```yaml
# 开发分支：只构建+测试
build_dev:
  stage: test
  script:
    - npm run build
    - npm run test
  rules:
    - if: $CI_COMMIT_BRANCH == 'dev'

# 主分支：构建+测试+部署
deploy_prod:
  stage: deploy
  script:
    - echo "部署生产"
  rules:
    - if: $CI_COMMIT_BRANCH == 'main'
```
3. **进阶**：用`include`复用公共配置，不同分支引入不同子配置文件，实现完全独立的Pipeline。

## 19. 如何做前后端分离项目的 CI
**名词定义**：前后端分离项目CI指分别为前端（Vue/React）、后端（SpringBoot/Go）配置独立又协同的自动化流水线。
**实际答案**：
1. **仓库模式**：
   - 单仓库：前后端代码在一起，配置不同job分开构建；
   - 双仓库：前后端独立仓库，用多项目Pipeline联动；
2. **标准流水线设计**：
   - 前端：install → lint → test → build → 打包制品；
   - 后端：compile → test → build → 生成镜像；
3. **执行器**：前端用Node镜像，后端用JDK/Go镜像；
4. **部署**：前端打包上传到OSS/CDN，后端构建Docker镜像部署到服务器/K8s；
5. **核心配置**：用tags区分执行环境，用artifacts传递产物。

## 20. 如何在 CI 里做单元测试、代码扫描、制品上传
**名词定义**：CI质量+发布流程，包含单元测试（验证代码功能）、代码扫描（检测漏洞/规范）、制品上传（归档构建产物）。
**实际答案**：
### 1. 单元测试
在job中执行测试命令，依赖对应语言环境：
```yaml
unit_test:
  stage: test
  script:
    - npm run test  # 前端
    # mvn test  # Java后端
```
### 2. 代码扫描
1. **代码规范**：ESLint、CheckStyle；
2. **安全扫描**：SonarQube（最常用）、GitLab SAST；
```yaml
sonar_scan:
  script:
    - sonar-scanner -Dtoken=$SONAR_TOKEN
```
### 3. 制品上传
1. 上传到私服：Maven/NPM/Docker镜像仓库；
2. 上传到对象存储：OSS/S3；
3. 上传到GitLab制品库：用`artifacts`归档；
```yaml
upload:
  script:
    - docker push 镜像地址
    - aws s3 cp 制品 s3://存储桶
```
---

# ⭐ 二、Docker（面试最爱问）
## 21. 常用 docker 命令有哪些
**名词定义**：Docker 命令是用于操作 Docker 引擎、管理镜像、容器、网络、数据卷等资源的命令行指令，分为生命周期、运维、镜像、日志等类别。
**实际答案**：
1. **环境/信息**：`docker info`（查看 Docker 信息）、`docker version`（版本）
2. **镜像管理**：`docker pull`（拉取）、`docker push`（推送）、`docker images`（查看）、`docker rmi`（删除）、`docker build`（构建）
3. **容器生命周期**：`docker run`（创建启动）、`docker start/stop/restart`（启停）、`docker rm`（删除）、`docker pause/unpause`（暂停）
4. **容器运维**：`docker ps`（查看运行容器）、`docker ps -a`（所有容器）、`docker exec`（进入容器）、`docker logs`（查看日志）
5. **资源清理**：`docker system prune`（清理无用资源）、`docker volume prune`（清理卷）
6. **网络/数据卷**：`docker network ls`、`docker volume ls`

## 22. docker build / run / exec 区别
**名词定义**：三个最核心 Docker 命令，分别负责**镜像构建、容器创建运行、进入运行中容器**，作用阶段完全不同。
**实际答案**：
1. **docker build**
   - 作用：根据 Dockerfile 构建**自定义镜像**
   - 对象：Dockerfile + 上下文目录
   - 结果：生成一个可复用的镜像
2. **docker run**
   - 作用：基于镜像**创建 + 启动一个新容器**
   - 对象：本地/远程镜像
   - 结果：运行中的独立容器实例
3. **docker exec**
   - 作用：在**已经运行的容器内**执行命令（常用来进入容器终端）
   - 对象：运行中的容器
   - 结果：在容器内开启新进程，不影响主进程

## 23. dockerfile 常见指令
**名词定义**：Dockerfile 指令是用于定义镜像构建步骤的关键字，每一行指令对应镜像一层结构。
**实际答案**：
1. **基础指令**
   - `FROM`：指定基础镜像（必须第一行）
   - `MAINTAINER`：作者信息（新版用 LABEL）
   - `LABEL`：添加元数据
2. **操作指令**
   - `RUN`：构建镜像时执行命令（安装依赖）
   - `COPY`：从宿主机复制文件到镜像
   - `ADD`：高级复制，支持解压、远程 URL
   - `WORKDIR`：设置工作目录
   - `ENV`：设置环境变量
   - `ARG`：构建参数
3. **运行指令**
   - `CMD`：容器启动默认命令
   - `ENTRYPOINT`：容器入口点
   - `EXPOSE`：声明暴露端口
   - `VOLUME`：声明数据卷
   - `USER`：指定运行用户
   - `ONBUILD`：被继承时执行

## 24. CMD vs ENTRYPOINT
**名词定义**：两者都是指定**容器启动后默认执行的命令**，决定容器主进程，是 Dockerfile 最易混淆指令。
**实际答案**：
| 对比项 | CMD | ENTRYPOINT |
| ---- | ---- | ---------- |
| 核心用途 | 提供默认命令/参数 | 固定容器入口命令 |
| 被覆盖 | `docker run` 可直接覆盖 | 必须加 `--entrypoint` 才能覆盖 |
| 执行方式 | 可单独使用 | 可单独使用，推荐搭配 CMD |
| 组合用法 | 给 ENTRYPOINT 传默认参数 | 固定执行体，CMD 传参 |
| 最佳实践 | 提供默认参数 | 定义固定启动命令 |
**示例**：
```dockerfile
ENTRYPOINT ["nginx"]
CMD ["-g", "daemon off;"]
```
最终执行：`nginx -g daemon off;`

## 25. docker 网络模式
**名词定义**：Docker 网络模式决定容器与容器、容器与宿主机、外部网络的通信方式，默认提供 5 种标准模式。
**实际答案**：
1. **bridge（桥接，默认）**：独立网络栈，端口映射访问，隔离性好
2. **host（主机）**：与宿主机共享网络，无隔离，性能最高
3. **none**：无网络，完全隔离，仅本地回环
4. **container**：与另一个容器共享网络栈
5. **custom bridge**：自定义桥接，支持 DNS 解析，生产常用

## 26. 如何进入容器
**名词定义**：进入容器指在**运行中的容器内部**开启终端，执行命令、排查问题。
**实际答案**：
1. **标准方式（推荐）**
   ```bash
   docker exec -it 容器ID/名称 /bin/bash
   ```
   - `-i`：保持输入
   - `-t`：分配伪终端
2. **极简 shell（无 bash 时）**
   ```bash
   docker exec -it 容器ID sh
   ```
3. **启动时直接进入**
   ```bash
   docker run -it --rm 镜像 /bin/bash
   ```
4. **注意**：只能进入**运行中**的容器，停止容器需先启动。

## 27. 容器日志怎么看
**名词定义**：容器日志是容器内主进程输出到标准输出（stdout/stderr）的日志，Docker 统一收集管理。
**实际答案**：
1. **基础查看**
   ```bash
   docker logs 容器ID
   ```
2. **实时跟踪**
   ```bash
   docker logs -f 容器ID
   ```
3. **显示时间戳**
   ```bash
   docker logs -t 容器ID
   ```
4. **查看最新 N 行**
   ```bash
   docker logs --tail 100 容器ID
   ```
5. **过滤关键字**
   ```bash
   docker logs 容器ID | grep error
   ```

## 28. 如何删除无用镜像
**名词定义**：无用镜像指未被任何容器使用、悬空镜像、旧版本镜像，清理可释放磁盘空间。
**实际答案**：
1. **删除单个镜像**
   ```bash
   docker rmi 镜像ID/名称
   ```
2. **删除悬空镜像（最常用）**
   ```bash
   docker image prune
   ```
3. **删除所有未使用镜像**
   ```bash
   docker image prune -a
   ```
4. **一键清理所有无用资源（镜像/容器/网络）**
   ```bash
   docker system prune
   docker system prune -a  # 彻底清理
   ```

## 29. volume 有什么作用
**名词定义**：Volume（数据卷）是 Docker 提供的**持久化数据存储方案**，独立于容器生命周期，实现数据共享与持久化。
**实际答案**：
1. **数据持久化**：容器删除、重建，数据不丢失
2. **数据共享**：宿主机 ↔ 容器、容器 ↔ 容器共享文件
3. **性能高**：直接读写宿主机文件系统，比容器内存储快
4. **数据管理**：独立管理，备份、迁移、恢复方便
5. **解耦**：应用与数据分离，镜像轻量化
**使用方式**：
```bash
docker run -v 宿主机路径:容器路径 镜像
```

## 30. 容器启动失败怎么排查
**名词定义**：容器启动失败指 `docker run` 后容器立即退出、状态 Exited，无法正常运行。
**实际答案**：
1. **看日志（第一步）**
   ```bash
   docker logs 容器ID
   ```
2. **检查退出码**：`docker ps -a` 看 Exited (xx)
3. **命令错误**：CMD/ENTRYPOINT 写错，前台进程变后台
4. **端口冲突**：`-p` 映射端口被占用
5. **权限问题**：容器内用户无权限
6. **资源不足**：内存/CPU 不够
7. **配置文件缺失**：挂载卷路径错误
8. **临时进入排查**：启动时覆盖命令
   ```bash
   docker run -it --entrypoint sh 镜像
   ```

## 31. 镜像和容器的关系是什么
**名词定义**：镜像（Image）是静态模板，容器（Container）是镜像运行的动态实例，是 Docker 最核心概念。
**实际答案**：
1. **本质区别**
   - 镜像：**静态、只读、可复用**的模板，包含程序+依赖+环境
   - 容器：**动态、可写、运行中**的实例，由镜像创建
2. **关系**
   - 一对多：一个镜像可创建 N 个独立容器
   - 分层：容器在镜像只读层上增加**可写层**
   - 生命周期：镜像永久存储，容器可启停删除
3. **类比**
   - 镜像 = 类 / 安装包
   - 容器 = 对象 / 运行中的程序

## 32. Dockerfile 分层缓存原理是什么
**名词定义**：Docker 镜像采用分层存储，每一条指令构建一层，**分层缓存**指构建时复用未变化的层，提升速度。
**实际答案**：
1. **分层机制**
   - 每条指令 = 独立一层（只读）
   - 下层不变，上层可复用
2. **缓存规则**
   - 指令不变 + 上下文文件不变 → 复用缓存
   - 某一层变化 → 当前层 + 所有上层重新构建
3. **最佳实践**
   - 把不常变的指令（FROM、ENV）放前面
   - 把易变的（COPY 代码、RUN 编译）放后面
   - 最大化利用缓存，加速构建

## 33. 多阶段构建有什么好处
**名词定义**：多阶段构建（Multi-stage Build）指一个 Dockerfile 包含多个 FROM 阶段，分阶段构建，最终只保留运行环境。
**实际答案**：
1. **极大减小镜像体积**：丢弃编译环境、源码、构建工具
2. **安全**：不暴露源码、编译依赖、密钥
3. **简洁**：一个 Dockerfile 完成编译 + 打包 + 运行
4. **高效**：无需维护两个 Dockerfile（构建+运行）
**典型场景**：Java、Go、前端项目（编译环境大，运行环境小）

## 34. 如何减小镜像体积
**名词定义**：镜像体积优化指减少最终镜像大小，提升拉取速度、节省存储、降低安全风险。
**实际答案**：
1. **使用轻量基础镜像**：alpine > slim > 标准镜像
2. **多阶段构建**：只保留运行时文件
3. **合并 RUN 指令**：减少层数，清理缓存
   ```dockerfile
   RUN yum install -y xxx && yum clean all
   ```
4. **不拷贝无用文件**：用 `.dockerignore` 忽略 git、node_modules、日志
5. **删除临时文件**：安装依赖后立即清理包管理器缓存
6. **避免安装无用依赖**：只装运行必需组件

## 35. EXPOSE 和 -p 的区别
**名词定义**：两者都与端口有关，`EXPOSE` 是声明，`-p` 是实际映射，作用完全不同。
**实际答案**：
1. **EXPOSE（Dockerfile 内）**
   - 仅**声明**容器暴露端口
   - 不做实际端口映射
   - 文档作用、辅助通信
   - 外部无法直接访问
2. **-p / --publish（run 命令）**
   - **实际端口映射**：宿主机端口 → 容器端口
   - 让外部网络可以访问容器
   - 必须配置才能对外提供服务
3. **示例**
   ```dockerfile
   EXPOSE 80
   ```
   ```bash
   docker run -p 8080:80 镜像
   ```

## 36. bridge、host、none 网络分别适合什么场景
**名词定义**：三种默认 Docker 网络模式，对应不同隔离性、性能、通信需求。
**实际答案**：
1. **bridge（默认）**
   - 场景：**绝大多数业务容器**、微服务、需要隔离、需要端口映射
   - 优点：隔离、安全、多容器不冲突
2. **host**
   - 场景：**高性能网络需求**、日志采集、监控 agent、需要监听大量端口
   - 优点：无网络损耗，性能接近宿主机
   - 缺点：无隔离，端口冲突
3. **none**
   - 场景：**完全无网络需求**、安全隔离容器、离线计算、加密任务
   - 优点：最高安全性

## 37. docker inspect 能看什么信息
**名词定义**：`docker inspect` 是 Docker 底层信息查看命令，以 JSON 格式输出对象完整元数据。
**实际答案**：
可查看**容器/镜像/网络/卷**的所有底层信息：
1. 容器：ID、状态、启动命令、环境变量
2. 网络：IP 地址、MAC、端口映射、网关、DNS
3. 挂载：数据卷路径、读写权限
4. 资源：CPU/内存限制、PID、端口
5. 镜像：分层信息、构建历史、作者、架构
**常用过滤**：
```bash
docker inspect -f '{{.NetworkSettings.IPAddress}}' 容器ID
```

## 38. docker logs、docker stats、docker top 各看什么
**名词定义**：三个 Docker 运维命令，分别查看**日志、资源占用、进程信息**。
**实际答案**：
1. **docker logs**
   - 查看：容器**标准输出日志**（程序运行日志、报错、输出）
   - 用途：排查程序错误、查看运行状态
2. **docker stats**
   - 查看：容器**实时资源占用**（CPU、内存、网络、磁盘 IO）
   - 用途：监控性能、定位资源耗尽问题
3. **docker top**
   - 查看：容器内**运行进程**（PID、用户、命令、CPU 占比）
   - 用途：检查进程是否正常、是否多进程

## 39. 容器退出码常见含义有哪些
**名词定义**：容器退出码是主进程结束时返回的状态码，用于快速定位崩溃原因。
**实际答案**：
1. **0**：正常退出，主动停止
2. **1**：程序错误，通用错误（代码异常）
3. **137**：**OOM 被系统杀死**（内存不足）
4. **127**：命令找不到（ENTRYPOINT/CMD 错误）
5. **126**：权限不足，无法执行命令
6. **2**：参数错误、命令无效
7. **139**：段错误（程序崩溃、依赖缺失）

## 40. 如何给容器做健康检查
**名词定义**：健康检查（HEALTHCHECK）让 Docker 主动探测容器服务是否正常，自动标记健康状态。
**实际答案**：
1. **Dockerfile 配置**
```dockerfile
HEALTHCHECK --interval=5s --timeout=3s --retries=3 \
  CMD curl -f http://localhost/ || exit 1
```
2. **参数说明**
   - `--interval`：检查间隔
   - `--timeout`：超时时间
   - `--retries`：失败重试次数
3. **run 命令配置**
```bash
docker run --health-cmd="curl -f http://localhost" 镜像
```
4. **查看状态**
```bash
docker ps  # 看到 health/healthy / unhealthy
```

### 总结
这 20 道 Docker 高频面试题覆盖**命令、网络、数据卷、Dockerfile、排错、优化**全核心知识点，全部采用「名词定义 + 标准答案」格式，逻辑清晰、可直接背诵，是面试必背内容。

---

# ⭐ 三、K8s（很多岗位必问一点）

## K8s零基础前置介绍

**K8s全称Kubernetes**，是谷歌开源的**容器编排管理工具**，也是目前云原生领域的标准平台，核心作用是帮我们自动化管理大量Docker容器，解决容器多了之后手动部署、扩容、故障恢复、负载均衡、网络管理等一系列难题。简单来说，Docker是负责把应用打包成容器运行，而K8s是负责“批量管容器”的管家，适合微服务、集群部署、高可用业务场景。

K8s整体是主从架构，分为**Master节点（控制平面，大脑）**和**Node节点（工作节点，干活的）**：Master负责调度、决策、管理整个集群；Node负责运行容器（Pod）。日常我们通过kubectl命令行工具和K8s集群交互，下发各种操作指令，它的核心资源对象包括Pod、Deployment、Service、ConfigMap等，接下来的20道题，就是围绕这些核心高频考点，从基础概念到实操排错全面讲解，完全适配零基础学习。

## 41. Pod 是什么

### 名词定义

**Pod**是K8s中**最小的部署和运行单元**，不是容器本身，而是容器的“容器”，一个Pod里可以包含一个或多个紧密相关的容器（生产常用单容器Pod），这些容器共享网络、存储等资源，属于同一个业务分组，是K8s调度的最小粒度。

### 实际答案

1. **核心定位**：K8s不直接管理Docker容器，而是通过Pod管理容器，所有容器必须运行在Pod里，无法单独调度容器。

2. **内部特性**：同一个Pod内的容器共享网络命名空间（用同一个IP）、共享存储卷，容器之间可以通过localhost通信，适合耦合度高、需要协同工作的容器（比如业务容器+日志采集容器）。

3. **生命周期**：Pod是临时的、易销毁的，故障后会被K8s自动重建，重建后IP会变化，所以不能直接用Pod IP访问业务。

4. **常用命令**：查看Pod命令`kubectl get pods`，查看指定命名空间Pod`kubectl get pods -n 命名空间名`。

## 42. Deployment 怎么更新

### 名词定义

**Deployment**是K8s最常用的**无状态应用控制器**，负责管理Pod的创建、更新、扩容、删除，保证集群中始终运行指定数量的Pod，日常部署微服务、Web应用基本都用Deployment，更新操作就是修改Deployment配置，让它自动替换旧Pod。

### 实际答案

Deployment更新核心是**滚动更新**，逐步替换旧Pod，保证业务不中断，常用更新方式有两种：

1. **方式一：命令行直接更新镜像（最常用）**
适合修改镜像版本（比如发布新版本），命令格式：
`kubectl set image deployment/Deployment名称 容器名=新镜像地址:版本 -n 命名空间`
示例：`kubectl set image deployment/nginx-deploy nginx=nginx:1.25 -n default`，执行后K8s会自动滚动替换旧Pod。

2. **方式二：修改YAML配置文件更新**
编辑Deployment的YAML文件，修改镜像、资源限制、环境变量等配置，再执行应用命令：
编辑：`kubectl edit deployment/Deployment名称 -n 命名空间`
应用：`kubectl apply -f 文件名.yaml`
修改保存后，K8s会自动触发更新，无需手动重启Pod。

3. **更新验证**：查看更新状态命令`kubectl rollout status deployment/Deployment名称`，查看Pod是否更新为新配置`kubectl get pods -o wide`。

## 43. 如何扩容 Pod

### 名词定义

**Pod扩容**指根据业务流量需求，增加Pod的运行数量（缩容则是减少数量），通过Deployment控制器实现，快速提升业务并发处理能力，应对流量高峰，K8s支持手动扩容和自动扩容两种方式。

### 实际答案

1. **手动扩容（基础常用）**
通过命令直接指定Pod目标数量，命令格式：
`kubectl scale deployment/Deployment名称 --replicas=目标数量 -n 命名空间`
示例：把nginx-deploy的Pod从2个扩容到5个，命令`kubectl scale deployment/nginx-deploy --replicas=5 -n default`，执行后立即生效，K8s会快速创建新Pod。

2. **YAML文件配置扩容**
修改Deployment YAML文件里的`replicas`字段（副本数），改成目标数量，再执行`kubectl apply -f 文件名.yaml`即可。

3. **自动扩容（HPA，生产推荐）**
全称Horizontal Pod Autoscaler，根据Pod的CPU、内存使用率自动调整副本数，无需手动操作，先部署HPA资源，配置阈值（比如CPU使用率达到70%自动扩容），K8s会自动监控并调整Pod数量。

4. **扩容验证**：执行`kubectl get deployment`，查看READY列，显示“目标数量/已运行数量”即扩容成功。

## 44. service 有哪些类型

### 名词定义

**Service**是K8s的**服务发现和负载均衡组件**，核心作用是解决Pod IP不稳定的问题，给一组Pod分配一个固定的虚拟IP（Cluster IP），外部或内部通过Service访问业务，流量会自动负载均衡到后端Pod，屏蔽Pod的销毁、重建、IP变化。

### 实际答案

K8s中Service有4种核心类型，适用不同访问场景，也是面试高频考点：

1. **ClusterIP（默认类型）**
分配一个集群内部虚拟IP，只能在K8s集群内部访问，外部网络无法访问，适合集群内部服务之间调用（比如后端服务调用数据库服务），最常用。

2. **NodePort**
在ClusterIP基础上，在每个Node节点开放一个固定端口（30000-32767），通过**节点IP:NodePort端口**可以从集群外部访问业务，适合测试环境、小型外部业务访问。

3. **LoadBalancer**
依赖云厂商的负载均衡器，自动创建云厂商LB，分配一个公网IP，直接通过公网IP访问业务，适合生产环境对外提供服务的业务，仅限云服务器集群使用。

4. **ExternalName**
将集群外部服务映射到集群内部，通过域名访问外部服务，适合集群内部调用外部第三方服务，无IP分配，极少用。

## 45. 如何查看 pod 日志

### 名词定义

Pod日志就是Pod内部容器运行时输出的标准日志（和docker logs原理一致），用于排查业务启动报错、运行异常、接口调用问题，是K8s日常排错最常用操作，通过kubectl logs命令实现。

### 实际答案

1. **基础日志查看**
查看指定Pod的日志（单容器Pod），命令：`kubectl logs Pod名称 -n 命名空间`

2. **实时跟踪日志（持续刷新）**
类似Linux tail -f，实时查看最新日志，排查启动问题，命令：`kubectl logs -f Pod名称 -n 命名空间`

3. **查看历史日志（Pod崩溃重启后）**
Pod崩溃重启后，查看上一个崩溃容器的日志，命令：`kubectl logs -p Pod名称 -n 命名空间`

4. **多容器Pod查看指定容器日志**
如果Pod里有多个容器，需要指定容器名，命令：`kubectl logs -f Pod名称 -c 容器名 -n 命名空间`

5. **查看最新N行日志**
命令：`kubectl logs --tail=行数 Pod名称 -n 命名空间`，示例：`kubectl logs --tail=100 nginx-pod`查看最新100行日志。

## 46. 如何进入 pod

### 名词定义

进入Pod指进入Pod内部的容器终端，类似docker exec进入容器，用于手动排查问题、修改配置、执行命令、查看容器内文件，只能进入**运行中**的Pod，停止状态的Pod无法进入。

### 实际答案

1. **标准进入命令（最常用）**
命令格式：`kubectl exec -it Pod名称 -n 命名空间 -- /bin/bash`
参数说明：-i保持输入，-t分配伪终端，--分隔命令和Pod参数。

2. **极简进入方式（无bash环境时）**
部分轻量镜像（alpine）没有bash，用sh命令：`kubectl exec -it Pod名称 -n 命名空间 -- sh`

3. **多容器Pod进入指定容器**
指定容器名进入，命令：`kubectl exec -it Pod名称 -c 容器名 -n 命名空间 -- /bin/bash`

4. **退出容器终端**：执行`exit`命令即可退出，退出后Pod不会停止，继续运行。

## 47. 如何删除 pod

### 名词定义

删除Pod是手动销毁Pod的操作，**注意**：如果Pod是Deployment、StatefulSet等控制器管理的，删除后K8s会自动重建新Pod，实现故障自愈；只有直接创建的独立Pod，删除后才不会重建。

### 实际答案

1. **手动删除单个Pod**
命令格式：`kubectl delete pod Pod名称 -n 命名空间`
示例：`kubectl delete pod nginx-pod-xxx -n default`，执行后Pod立即销毁，控制器管理的Pod会快速重建。

2. **批量删除Pod（按标签）**
先通过`kubectl get pods --show-labels`查看Pod标签，再按标签删除：
`kubectl delete pods -l 标签键=标签值 -n 命名空间`

3. **强制删除Pod（卡住无法删除时）**
Pod卡住Terminating状态，强制删除：`kubectl delete pod Pod名称 -n 命名空间 --force --grace-period=0`

4. **彻底删除不重建（先删控制器）**
如果想让Pod删除后不重建，先删除Deployment控制器：`kubectl delete deployment 控制器名称 -n 命名空间`，再删Pod。

## 48. CrashLoopBackOff 怎么处理

### 名词定义

**CrashLoopBackOff**是K8s中Pod常见的异常状态，意思是**容器启动失败，反复崩溃、重启，进入循环崩溃状态**，是面试和实操最常遇到的排错场景，核心原因是容器内部程序无法正常启动。

### 实际答案

处理流程按“先看日志，再查原因，逐步排查”，零基础按以下步骤操作：

1. **第一步：查看Pod状态确认异常**
执行`kubectl get pods`，看到STATUS列显示CrashLoopBackOff，确定Pod异常。

2. **第二步：查看日志定位崩溃原因（最关键）**
执行`kubectl logs -p Pod名称 -n 命名空间`（查看崩溃前日志），或`kubectl logs -f Pod名称`，日志里会显示具体报错：比如配置文件缺失、端口占用、依赖缺失、权限不足、镜像启动命令错误、Java/Python代码异常等。

3. **第三步：常见原因及解决办法**

    - 镜像问题：镜像版本错误、镜像损坏、私有镜像拉取权限不足，更换正确镜像或配置镜像密钥。

    - 配置问题：ConfigMap/Secret配置错误、环境变量缺失，检查配置文件。

    - 命令问题：容器启动命令写错，程序后台运行（K8s要求容器前台运行），修改启动命令为前台执行。

    - 资源问题：内存不足（OOM），调整Pod的requests和limits资源配置。

4. **第四步：修复后重建Pod**
修改镜像、配置或命令后，删除旧Pod，让控制器重建，或重新部署Deployment。

## 49. configmap 怎么用

### 名词定义

**ConfigMap（配置映射）**是K8s用于**存储非敏感配置信息**的资源对象，把业务配置文件、环境变量、命令参数等从容器镜像中分离出来，实现配置和应用解耦，方便统一管理、修改配置，无需重新打包镜像。

### 实际答案

1. **核心作用**：存储普通配置（比如nginx配置、业务参数、环境变量），不能存密码、密钥等敏感信息。

2. **创建ConfigMap的两种方式**

    - 方式一：命令行创建（快速）
    从文件创建：`kubectl create configmap cm名称 --from-file=配置文件路径 -n 命名空间`
    从键值对创建：`kubectl create configmap cm名称 --from-literal=键=值 -n 命名空间`

    - 方式二：YAML文件创建（生产规范）
    编写ConfigMap YAML，定义配置内容，执行`kubectl apply -f cm.yaml`创建。

3. **Pod中使用ConfigMap的两种方式**

    - 作为环境变量注入：Pod配置里引用ConfigMap，容器直接读取环境变量。

    - 作为文件挂载：将ConfigMap配置挂载到容器指定目录，容器读取挂载的配置文件。

4. **修改ConfigMap**：修改后，部分支持热加载的应用会自动生效，不支持的需要重启Pod生效。

## 50. ingress 是干嘛的

### 名词定义

**Ingress**是K8s中**集群外部访问内部服务的入口控制器**，解决Service的NodePort和LoadBalancer类型的缺陷，实现**域名访问、路径路由、HTTPS、负载均衡**，相当于K8s集群的“统一网关”，替代多个NodePort端口，管理所有外部流量入口。

### 实际答案

1. **核心作用**：将外部HTTP/HTTPS流量路由到集群内部的Service，实现通过域名访问集群内不同服务，无需为每个Service开放独立端口。

2. **Ingress和Service的区别**：Service是四层负载均衡（TCP/UDP），负责集群内部流量；Ingress是七层负载均衡（HTTP/HTTPS），负责外部流量入口和路由。

3. **使用前提**：集群必须部署Ingress Controller（比如Nginx Ingress、Traefik，是Ingress的具体实现，相当于网关程序），Ingress只是规则定义，Controller负责执行规则。

4. **常用功能**：域名转发（不同域名对应不同Service）、路径转发（同一域名不同路径对应不同服务）、HTTPS证书配置、限流、重写。

5. **实操逻辑**：部署Ingress Controller → 编写Ingress YAML配置域名和Service映射 → 外部通过域名访问业务。

## 51. Deployment、StatefulSet、DaemonSet 区别

### 名词定义

三者都是K8s的**工作负载控制器**，负责管理Pod生命周期，适用场景完全不同，是K8s面试必考题，核心区别在于是否有状态、部署方式、调度规则。

### 实际答案

|对比维度|Deployment|StatefulSet|DaemonSet|
|---|---|---|---|
|**核心定位**|管理无状态应用|管理有状态应用|每个Node节点运行一个Pod|
|**应用场景**|Web服务、微服务、接口服务（无状态，Pod可随意替换）|数据库、MySQL、Redis、Zookeeper（有固定标识、数据持久化、顺序启动）|日志采集、监控Agent、网络插件（每个节点必须运行一个）|
|**Pod特性**|Pod无固定名称、IP，随机名称，可并行启动|Pod有固定名称、稳定网络标识、顺序启动/销毁，数据持久化绑定|每个Node仅一个Pod，新增Node自动部署，删除Node自动销毁Pod|
|**扩容缩容**|随意扩容缩容，无顺序|按顺序扩容缩容，需严格遵循顺序|无需手动扩容，节点数决定Pod数|
|**使用频率**|最高，日常业务首选|中等，仅有状态服务用|中等，运维组件专用|
## 52. requests 和 limits 有什么作用

### 名词定义

**requests和limits**是K8s中给Pod配置**资源限制**的参数，用于管控Pod使用的CPU和内存资源，防止单个Pod占用过多资源导致集群其他Pod异常，保证集群资源合理分配，属于Pod资源配置核心参数。

### 实际答案

1. **requests（资源请求）**

    - 作用：Pod**启动时需要的最小资源**，告诉K8s调度器，这个Pod至少需要多少CPU、内存才能运行。

    - 调度依据：K8s调度器会根据requests值，选择有足够剩余资源的Node节点部署Pod，资源不足则调度失败。

    - 配置项：cpu（CPU核心数，单位m，1核=1000m）、memory（内存，单位Mi/Gi）。

2. **limits（资源限制）**

    - 作用：Pod**能使用的最大资源上限**，限制Pod不能超过这个资源值，避免资源耗尽。

    - 强制限制：如果Pod内存超过limits，会被K8s直接杀死（OOMKill）；CPU超过limits，会被限流，不会被杀。

3. **配置示例**：
        `resources:
  requests:
    cpu: 100m
    memory: 256Mi
  limits:
    cpu: 500m
    memory: 512Mi`

4. **核心区别**：requests是“最低保障”，limits是“最高上限”，生产环境必须配置，防止资源抢占。

## 53. livenessProbe 和 readinessProbe 区别

### 名词定义

**存活探针（livenessProbe）和就绪探针（readinessProbe）**是K8s的**健康检查机制**，主动探测Pod内容器的运行状态，避免流量进入异常Pod，保证业务可用性，是生产高可用必备配置。

### 实际答案

|对比维度|livenessProbe（存活探针）|readinessProbe（就绪探针）|
|---|---|---|
|**核心作用**|检查容器是否**存活**，是否崩溃卡死|检查容器是否**就绪**，是否能正常接收业务流量|
|**失败处理**|探针失败，K8s直接杀死容器，自动重启|探针失败，将Pod从Service后端移除，不转发流量，不会重启Pod|
|**适用场景**|程序卡死、死循环、进程崩溃，无法自愈的场景|程序启动中、加载数据、连接数据库，暂时不能处理流量的场景|
|**探测时机**|容器启动后全程探测|容器启动后全程探测，就绪后才加入流量池|
|**探测方式**|三种方式：HTTP请求（探测接口）、TCP端口（探测端口连通）、Exec命令（执行命令判断）||
简单总结：存活探针管“死活”，死了就重启；就绪探针管“能不能干活”，不能干就不让接流量，两者可以同时配置。

## 54. namespace 的作用是什么

### 名词定义

**Namespace（命名空间）**是K8s用于**集群资源隔离**的逻辑分组，把一个K8s集群划分为多个虚拟集群，实现不同环境、不同项目、不同团队的资源隔离，避免资源名称冲突、权限混乱。

### 实际答案

1. **核心作用**

    - 资源隔离：不同Namespace下的Pod、Service、ConfigMap等资源相互独立，名称可以重复，互不干扰。

    - 环境分离：一个集群划分dev（开发）、test（测试）、prod（生产）命名空间，共用集群，隔离环境。

    - 权限管控：给不同团队分配不同Namespace的操作权限，实现权限隔离。

    - 资源配额：给每个Namespace设置CPU、内存、Pod数量配额，限制资源使用上限。

2. **默认命名空间**

    - default：默认命名空间，未指定Namespace的资源都在这里。

    - kube-system：K8s系统组件、插件所在命名空间，禁止随意修改。

    - kube-public：公共命名空间，所有用户可访问。

3. **常用命令**：查看命名空间`kubectl get ns`，创建命名空间`kubectl create ns 名称`，操作指定Namespace资源加`-n 名称`。

## 55. Secret 和 ConfigMap 区别

### 名词定义

Secret和ConfigMap都是K8s存储配置信息的资源对象，核心区别是**存储数据的敏感程度不同**，一个存敏感信息，一个存普通配置，面试高频对比题。

### 实际答案

|对比维度|ConfigMap|Secret|
|---|---|---|
|**存储内容**|普通非敏感配置信息|敏感机密信息|
|**具体场景**|业务参数、配置文件、环境变量、命令参数|数据库密码、Token密钥、SSH密钥、HTTPS证书、账号密码|
|**数据加密**|明文存储，无加密|Base64编码存储（非强加密，生产可结合加密插件），不会明文暴露|
|**安全性**|低，可直接查看明文|高，避免敏感信息泄露|
|**使用方式**|和ConfigMap一致，可作为环境变量注入、文件挂载到Pod||
简单总结：普通配置用ConfigMap，密码、密钥、证书这类机密内容必须用Secret，绝对不能把敏感信息写在ConfigMap或镜像里。

## 56. PVC、PV、StorageClass 分别是什么

### 名词定义

PV、PVC、StorageClass是K8s**容器数据持久化**的三大核心组件，解决容器销毁后数据丢失的问题，实现数据独立于Pod生命周期，专门管理持久化存储，零基础先理清三者层级关系。

### 实际答案

1. **PV（PersistentVolume，持久化卷）**

    - 定义：由管理员提前创建的**集群级存储资源**，对应实际的存储设备（比如服务器磁盘、云存储、NFS），是物理存储的抽象，大小、存储类型固定。

    - 特性：独立于Pod，属于集群资源，不属于某个Namespace，Pod销毁PV不会删除。

2. **PVC（PersistentVolumeClaim，持久化卷声明）**

    - 定义：用户（开发）向K8s**申请存储的凭证**，用户不需要关心底层存储是什么，只需要声明需要多大存储、读写权限，由K8s自动匹配合适的PV。

    - 特性：属于Namespace资源，Pod通过挂载PVC使用存储，PVC绑定PV后才能使用。

3. **StorageClass（存储类，SC）**

    - 定义：存储的“模板”，**自动创建PV**的工具，无需管理员手动创建PV，用户申请PVC时，StorageClass自动根据模板创建对应的PV，实现存储动态供给。

    - 特性：生产环境常用，省去手动创建PV的麻烦，支持不同存储类型（云盘、本地磁盘）。

4. **三者关系**：用户创建PVC → StorageClass自动创建PV → PVC绑定PV → Pod挂载PVC使用持久化存储，数据存在PV里，Pod销毁数据不丢。

## 57. Pod 调度失败一般怎么排查

### 名词定义

Pod调度失败指Pod状态一直显示**Pending**，无法分配到任何Node节点运行，K8s调度器找不到合适的节点部署Pod，是常见集群运维问题，核心原因是节点资源不足或调度规则冲突。

### 实际答案

排查流程按“看事件→查原因→解决问题”，零基础一步步操作：

1. **第一步：查看Pod状态**
执行`kubectl get pods`，STATUS列显示Pending，确定调度失败。

2. **第二步：查看调度事件（找具体原因）**
执行`kubectl describe pod Pod名称 -n 命名空间`，拉到最下方Events区域，里面有调度失败的详细报错，这是核心依据。

3. **第三步：常见原因及解决办法**

    - 资源不足：节点CPU、内存剩余资源小于Pod的requests值，解决：扩容节点、降低Pod资源请求、删除无用Pod释放资源。

    - 节点亲和性/污点冲突：Pod设置了节点亲和性，没有匹配的节点；或节点有污点，Pod没容忍，解决：修改亲和性配置、给Pod添加污点容忍。

    - 端口冲突：Pod需要的端口节点已被占用，解决：更换端口。

    - 存储绑定失败：PVC未绑定PV，没有可用存储，解决：创建PV或StorageClass，绑定PVC。

    - 节点不可用：节点宕机、NotReady状态，解决：修复节点状态。

4. **第四步：验证**：问题解决后，Pod会自动调度到节点，状态变为Running。

## 58. 镜像拉取失败怎么处理

### 名词定义

镜像拉取失败指Pod状态显示**ImagePullBackOff或ErrImagePull**，K8s无法从镜像仓库（DockerHub、私有仓库）下载容器镜像，导致Pod无法启动，常见于镜像地址错误、权限不足、网络不通。

### 实际答案

1. **第一步：确认失败状态**
`kubectl get pods`显示ImagePullBackOff，执行`kubectl describe pod Pod名称`查看Events里的拉取报错。

2. **第二步：常见原因及解决办法**

    - 镜像地址/版本错误：镜像名写错、版本不存在，解决：核对镜像地址和版本，修改Deployment镜像配置。

    - 镜像仓库网络不通：节点无法访问公网镜像仓库（DockerHub），解决：配置镜像加速器（阿里云、网易云），或使用私有镜像仓库。

    - 私有镜像无拉取权限：私有仓库需要账号密码，解决：创建Secret存储仓库账号密码，在Pod里配置imagePullSecrets引用Secret。

    - 镜像仓库宕机：仓库服务不可用，解决：等待仓库恢复，或更换镜像仓库。

    - 节点磁盘空间不足：无法存储镜像，解决：清理节点无用镜像、磁盘扩容。

3. **第三步：修复后操作**：修改正确配置后，删除Pod，让控制器重新拉取镜像部署。

## 59. 滚动更新和回滚怎么做

### 名词定义

**滚动更新**是Deployment逐步替换旧Pod，保证业务不中断的更新方式；**回滚**是更新后出现问题，将Pod恢复到上一个正常版本的操作，是生产发布必备的发布和回退机制。

### 实际答案

#### 一、滚动更新（默认机制，无需额外配置）

1. 原理：Deployment每次只更新少量Pod，等新Pod正常运行后，再销毁旧Pod，逐步完成全部更新，全程业务不中断。

2. 触发方式：修改Deployment镜像或配置（set image或apply YAML），自动触发滚动更新。

3. 查看更新状态：`kubectl rollout status deployment/名称 -n 命名空间`

4. 暂停/继续更新：暂停`kubectl rollout pause deployment/名称`，继续`kubectl rollout resume deployment/名称`

#### 二、版本回滚（更新出错时使用）

1. 查看历史版本：`kubectl rollout history deployment/名称 -n 命名空间`，查看所有发布版本记录。

2. 回滚到上一个版本：`kubectl rollout undo deployment/名称 -n 命名空间`

3. 回滚到指定历史版本：`kubectl rollout undo deployment/名称 --to-revision=版本号 -n 命名空间`

4. 回滚验证：执行`kubectl get pods`，Pod恢复为旧版本，状态Running，业务正常。

## 60. Service 为什么能做服务发现

### 名词定义

**服务发现**是集群内部服务之间不用知道对方Pod的IP，只需要通过服务名称就能找到并访问对方的机制，Service能实现服务发现，核心依赖K8s的**DNS组件**和标签选择器，是微服务通信的基础。

### 实际答案

1. **核心依赖：K8s DNS组件**
K8s集群默认部署CoreDNS（老版本是KubeDNS），是集群内部的DNS服务器，负责Service域名解析。

2. **标签选择器匹配Pod**
Service通过**label selector（标签选择器）**，匹配一组带有相同标签的Pod，自动将这些Pod加入Service后端，作为流量转发目标，Pod新增、销毁时，Service会自动更新后端Pod列表，无需手动配置。

3. **域名解析机制**
每个Service会自动分配一个固定域名，格式：`Service名称.命名空间.svc.cluster.local`，集群内部其他Pod通过这个域名访问Service，CoreDNS会自动将域名解析为Service的Cluster IP。

4. **负载均衡**
流量到达Service的Cluster IP后，Service会将请求均匀负载均衡到后端多个Pod，屏蔽Pod IP变化和数量变化。

5. **总结**：Service通过标签绑定Pod，DNS提供固定域名，Cluster IP提供固定访问入口，三者结合实现稳定的服务发现，即使Pod重建、IP变化，服务访问地址始终不变。
> （注：文档部分内容可能由 AI 生成）

---

# ⭐ 四、Linux 运维基础（表格精细化 · 参数全覆盖）
## 前置说明
所有题目统一格式：
1. **名词定义**：一句话讲清作用
2. **核心命令表**：表格列出「命令/参数 + 功能 + 场景」
3. **面试实操**：线上一键可用命令

---

## 61. top / ps / netstat 怎么用
### 名词定义
- top：**动态实时监控**进程、CPU、内存、负载
- ps：**静态快照**查看进程状态
- netstat：查看网络连接、端口监听、进程绑定

### ① top 参数表
| 参数/交互键 | 功能 | 使用场景 |
|------------|------|----------|
| top | 默认动态刷新进程 | 快速看整机负载 |
| top -c | 显示进程**完整启动命令** | 查进程启动参数 |
| top -b | 批量模式（不交互，输出日志） | 定时采集监控 |
| top -n 1 | 只刷新 1 次就退出 | 脚本取值 |
| P(大写) | 按 CPU 排序 | 找 CPU 高进程 |
| M(大写) | 按 内存 排序 | 找内存泄漏 |
| 1 | 展开所有 CPU 核心 | 看多核利用率 |
| shift+H | 显示线程 | 查线程 CPU 暴涨 |
| q | 退出 top | - |

### ② ps 参数表
| 命令 | 功能 | 场景 |
|------|------|------|
| ps aux | 所有进程 + CPU/内存 + 用户 | 最常用排查 |
| ps -ef | 树形父子进程关系 | 查僵尸进程 |
| ps aux --sort=-%cpu | 按 CPU 降序 | 快速定位高 CPU |
| ps aux --sort=-%mem | 按内存降序 | 定位内存大户 |
| ps -T -p PID | 查看进程所有线程 | 排查线程爆炸 |

### ③ netstat 参数表
| 参数 | 功能 |
|------|------|
| -t | 只看 TCP |
| -u | 只看 UDP |
| -l | 只看监听端口 |
| -n | 数字显示（不解析域名，更快） |
| -p | 显示绑定进程 PID |
| -a | 所有连接（含已建立/关闭） |

**实操命令**
```bash
netstat -tulnp   # 查监听端口（最常用）
```

---

## 62. 如何查端口被谁占用
### 名词定义
快速定位端口占用 PID，解决端口冲突启动失败。

### 查端口三种方法（表格）
| 命令 | 参数说明 | 优点 |
|------|----------|------|
| lsof -i :8080 | 直接匹配端口 | 最简单直观 |
| ss -tulnp | 新一代网络查询，速度快 | 推荐生产 |
| netstat -tulnp | 传统命令 | 老系统兼容 |

---

## 63. 如何查磁盘占用
### 名词定义
分区使用率、目录大小、大文件定位，磁盘爆满必查。

### 磁盘命令参数表
| 命令 | 参数 | 功能 |
|------|------|------|
| df | -h | 人类可读，查分区使用率 |
| df | -i | 查 inode 是否耗尽（常见坑） |
| du | -s | 只汇总大小 |
| du | -h | 可读单位 |
| du | -sh * | 列出当前目录所有子目录大小 |
| find | -size +1G | 查找大于 1G 文件 |

**排查链路**：`df -h → du -sh → find 找大文件`

---

## 64. 如何查 CPU 高的进程
### 名词定义
线上 CPU 飙升：定位进程 → 定位线程 → 定位代码栈。

### 实操参数表
| 命令 | 参数 | 作用 |
|------|------|------|
| top | P | 排序找高 CPU 进程 |
| top -H | -p PID | 查看该进程下所有线程 CPU |
| printf | "%x" 线程ID | 线程转 16 进制 |
| jstack | 进程ID | Java 查栈匹配死循环线程 |

---

## 65. kill 信号有哪些
### 名词定义
kill 不是杀死，是**给进程发信号**。

### 高频信号表格（面试必考）
| 信号编号 | 名称 | 作用 | 是否安全 |
|----------|------|------|----------|
| 1 | SIGHUP | 重载配置、不杀进程 | 安全 |
| 15 | SIGTERM(默认) | 优雅退出，收尾、存数据 | 安全（优先用） |
| 9 | SIGKILL | 强制杀死，直接干掉内核态 | 危险（尽量不用） |

**规范**：先 `kill PID` → 卡死再 `kill -9 PID`

---

## 66. 如何后台运行程序
### 名词定义
脱离终端后台运行，不关程序。

### 三种方式对比表
| 方式 | 命令 | 特点 |
|------|------|------|
| & | ./app & | 后台，但关终端会死 |
| nohup | nohup ./app & | 忽略挂断，简单粗暴 |
| systemd | 注册 service | 生产最佳、开机自启、自动重启 |

---

## 67. nohup 是啥
### 名词定义
nohup = no hangup，**忽略挂断信号**，防止关闭终端程序退出。

### 标准完整参数
```bash
nohup 程序 > 日志文件 2>&1 &
```
| 片段 | 含义 |
|------|------|
| nohup | 关终端不死 |
| & | 放入后台 |
| > log | 标准输出写入日志 |
| 2>&1 | 错误输出也写入日志 |

---

## 68. crontab 定时任务
### 名词定义
Linux 周期性定时调度器。

### 时间格式表
| 分 | 时 | 日 | 月 | 周 | 命令 |
|----|----|----|----|----|------|
| 0-59 | 0-23 | 1-31 | 1-12 | 0-6 | 执行脚本 |

### 常用操作参数
| 命令 | 功能 |
|------|------|
| crontab -e | 编辑定时 |
| crontab -l | 查看定时 |
| crontab -r | 清空定时（慎用） |

示例：`0 3 * * * /root/backup.sh` 凌晨3点备份

---

## 69. 如何查看系统日志
### 名词定义
查看系统启动、登录、服务异常日志。

### 日志查看对比表
| 系统版本 | 日志位置/命令 |
|----------|---------------|
| CentOS 6 | /var/log/messages、/var/log/secure |
| CentOS 7+ | journalctl、/var/log/messages |

---

## 70. 解压所有压缩包（万能表格）
### 解压命令速查表（背这一张就够）
| 后缀 | 解压命令 | 关键参数含义 |
|------|----------|--------------|
| .zip | unzip file.zip | 无需额外参数 |
| .tar | tar xvf file.tar | x解压 v查看 f文件 |
| .tar.gz | tar zxvf file.tar.gz | z = gzip |
| .tar.bz2 | tar jxvf file.tar.bz2 | j = bz2 |
| .tar.xz | tar Jxvf file.tar.xz | J = xz |

---

## 71. 如何查看内存占用
### 参数表
| 命令 | 参数 | 功能 |
|------|------|------|
| free | -h | 可读显示内存/缓存/剩余 |
| top | M | 按内存排序进程 |
| ps | aux --sort=-%mem | 内存占用排序 |

---

## 72. free / vmstat / iostat 区别
### 三剑客对照表（面试高频）
| 命令 | 监控对象 | 核心看点 | 参数 |
|------|----------|----------|------|
| free | 整机内存 | available 是否够用 | free -h |
| vmstat | 系统全局瓶颈 | wa 高 = IO 阻塞 | vmstat 1 |
| iostat | 磁盘IO | %util 接近100%=磁盘卡死 | iostat -x 1 |

---

## 73. ss 和 netstat 区别
### 对比表格
| 工具 | 速度 | 依赖 | 推荐度 |
|------|------|------|--------|
| netstat | 慢 | 老旧内核工具 | 淘汰 |
| ss | 极快 | 内核原生 | 生产首选 |

**万能替代**：`ss -tulnp`

---

## 74. lsof 常用参数
### lsof 高频用法表
| 命令 | 功能 | 场景 |
|------|------|------|
| lsof -i :端口 | 查端口占用 | 启动冲突 |
| lsof -p PID | 查进程打开文件句柄 | 文件泄漏 |
| lsof | grep deleted | 查删除但未释放文件 | 磁盘不释放大坑 |

---

## 75. systemctl 常用操作
### 全量参数表
| 命令 | 功能 |
|------|------|
| systemctl start xxx | 启动服务 |
| systemctl stop xxx | 停止服务 |
| systemctl restart xxx | 重启 |
| systemctl status xxx | 查看状态/日志 |
| systemctl enable xxx | 开机自启 |
| systemctl disable xxx | 取消自启 |

---

## 76. journalctl 筛选日志参数
### journalctl 参数表
| 参数 | 作用 |
|------|------|
| -u nginx | 只看 nginx 服务日志 |
| -f | 实时滚动 |
| --since "10 min ago" | 最近10分钟 |
| -e | 跳到日志末尾 |

---

## 77. 文件权限 rwx + chmod
### 权限数值表格
| 权限 | 字符 | 数值 | 含义 |
|------|------|------|------|
| 读 | r | 4 | 查看内容 |
| 写 | w | 2 | 修改/新增 |
| 执行 | x | 1 | 运行脚本 |

### 常用 chmod
| 命令 | 权限 |
|------|------|
| chmod 755 | rwxr-xr-x（程序） |
| chmod 644 | rw-r--r--（配置文件） |
| chown user:group file | 修改归属 |

---

## 78. find / grep / awk / sed 四剑客
### 高频组合参数表
| 工具 | 常用参数 | 用途 |
|------|----------|------|
| find | -name / -size | 找文件 |
| grep | -n 显示行号 -i 忽略大小写 | 过滤关键字 |
| sed | s/A/B/g | 全局替换 |
| awk | print $1 $3 | 分列统计 |

**实战组合**
```bash
find . -name "*.log" | xargs grep "Error"
```

---

## 79. 查看进程启动参数
| 命令 | 特点 |
|------|------|
| top -c | 直观简单 |
| ps -ef | 快速查看 |
| cat /proc/PID/cmdline | 最原始、最准确 |

---

## 80. 线上磁盘满了排查流程（表格版）
| 步骤 | 命令 | 目的 |
|------|------|------|
| 1 | df -h | 看哪个分区满 |
| 2 | du -sh /* | 定位大目录 |
| 3 | find | 找超大文件 |
| 4 | lsof | grep deleted | 查已删未释放文件（高频坑） |
| 5 | df -i | 查 inode 耗尽 |

---

# ⭐ 五、网络基础（不深但会问）
## 81. TCP 三次握手
### 名词定义
TCP 建立可靠连接的**三次握手**，是客户端与服务端互相确认**收发能力正常**的过程。

### 流程（表格版）
| 次数 | 方向 | 含义（标志位） | 目的 |
|-----|------|----------------|------|
| 1 | 客户端 → 服务端 | SYN=1 | 我要发起连接 |
| 2 | 服务端 → 客户端 | SYN=1, ACK=1 | 我收到了，我也准备好了 |
| 3 | 客户端 → 服务端 | ACK=1 | 我确认你准备好了，连接建立 |

### 一句话总结
**双方互相确认：能发、能收、对方也能发能收。**

---

## 82. 常见端口号（必背）
| 端口 | 服务 |
|------|------|
| 22 | SSH |
| 80 | HTTP |
| 443 | HTTPS |
| 21 | FTP |
| 25 | SMTP |
| 53 | DNS |
| 3306 | MySQL |
| 6379 | Redis |
| 8080 | Tomcat/备用HTTP |
| 9200 | Elasticsearch |

---

## 83. HTTP vs HTTPS
| 对比项 | HTTP | HTTPS |
|--------|------|-------|
| 端口 | 80 | 443 |
| 加密 | 无 | SSL/TLS 加密 |
| 安全性 | 明文，易窃听、篡改 | 加密传输，防窃听、防篡改 |
| 性能 | 快 | 略慢（加密解密） |
| 证书 | 不需要 | 需要 CA 证书 |

一句话：**HTTP 不安全，HTTPS 安全加密。**

---

## 84. DNS 解析流程
1. 浏览器查本地缓存
2. 查操作系统 hosts / 本地 DNS
3. 查**根 DNS**
4. 查**顶级域 DNS**（com、cn）
5. 查**权威 DNS**
6. 返回 IP 给浏览器

一句话：**从近到远，逐级查询，拿到域名对应 IP。**

---

## 85. 如何排查网络不通（标准流程）
| 命令 | 作用 |
|------|------|
| ping IP | 看是否通、丢包 |
| ping 域名 | 看 DNS 是否解析 |
| telnet IP 端口 | 看端口是否通 |
| curl 地址 | 看应用是否响应 |
| traceroute | 看路由在哪一跳断了 |
| firewall-cmd / iptables | 看防火墙是否拦截 |
| ss / netstat | 看端口是否监听 |

流程：**ping → telnet → curl → 防火墙 → 路由**

---

## 86. TCP 四次挥手为什么是四次
### 名词定义
关闭连接时，**双方都要独立关闭发送通道**，所以多一次应答。

### 流程
1. 客户端：我发完了（FIN）
2. 服务端：收到（ACK）
3. 服务端：我也发完了（FIN）
4. 客户端：收到（ACK）

### 为什么 4 次？
- 中间两次不能合并
- 服务端收到关闭后，**可能还有数据要发**，必须等发完再关闭
- 双方都要主动关闭 + 应答

一句话：**双向独立关闭，各占两次，共四次。**

---

## 87. 长连接 vs 短连接
| 类型 | 机制 | 适用 |
|------|------|------|
| 短连接 | 连 → 传 → 断 | 简单请求、偶尔访问 |
| 长连接 | 连 → 多次传输 → 超时断 | 高频请求、微服务、HTTP/1.1、gRPC |

一句话：**短连接用完就断，长连接复用。**

---

## 88. TCP 和 UDP 区别
| 对比 | TCP | UDP |
|------|-----|-----|
| 可靠性 | 可靠，重传、有序 | 不可靠，不重传 |
| 连接 | 面向连接 | 无连接 |
| 速度 | 慢 | 快 |
| 使用场景 | HTTP、文件传输、MySQL | 直播、游戏、DNS、视频 |

一句话：**TCP 可靠慢，UDP 快不可靠。**

---

## 89. 七层模型 vs 四层模型
### 七层（OSI）
应用、表示、会话、传输、网络、数据链路、物理

### 四层（TCP/IP 实际用）
应用层（HTTP/DNS）、传输层（TCP/UDP）、网络层（IP）、网络接口层

### 一句话理解
- **四层**：只管传输（端口、IP）
- **七层**：懂业务（域名、URL、请求内容）

---

## 90. 反向代理 vs 负载均衡
| 概念 | 作用 |
|------|------|
| 反向代理 | 替后端服务接收请求，隐藏真实服务器 |
| 负载均衡 | 将请求分发到多台后端，提高并发 |

一句话：**反向代理是入口，负载均衡是分发。**

---

## 91. 502 / 503 / 504 原因
| 状态码 | 含义 | 常见原因 |
|--------|------|----------|
| 502 | Bad Gateway | 后端服务挂了、重启中、端口错 |
| 503 | Service Unavailable | 服务超载、限流、未就绪 |
| 504 | Gateway Timeout | 后端服务执行太慢、超时 |

---

## 92. ping / traceroute / telnet / curl 作用
| 命令 | 查什么 |
|------|--------|
| ping | IP 是否通、网络通不通 |
| traceroute | 路由路径、哪一跳断了 |
| telnet | 端口是否开放、能连接 |
| curl | 应用是否正常响应、HTTP 服务 |

---

# ⭐ 六、Jenkins / 构建工具
## 93. Jenkins Pipeline 怎么写
Declarative 标准结构（最常用）
```groovy
pipeline {
  agent any
  stages {
    stage('拉代码') { steps { git '...' } }
    stage('编译') { steps { sh 'mvn package' } }
    stage('构建镜像') { steps { sh 'docker build...' } }
  }
}
```

---

## 94. Jenkins Master / Agent
| 角色 | 作用 |
|------|------|
| Master | 管理界面、调度任务 |
| Agent | 真正执行构建的机器（节点） |

一句话：**Master 管任务，Agent 干苦力。**

---

## 95. 如何触发构建
- 手动点击构建
- 定时构建（H/15 * * * *）
- Webhook（代码提交自动触发）
- 参数化构建
- 其他任务完成后触发

---

## 96. 构建失败怎么查
1. 看控制台日志 Console Output
2. 看代码是否拉取失败
3. 看编译报错（依赖、语法）
4. 看凭证、权限
5. 看 Agent 环境是否正常

---

## 97. 如何并行构建
```groovy
parallel {
  stage('构建A') { steps { sh '...' } }
  stage('构建B') { steps { sh '...' } }
}
```

---

## 98. Scripted vs Declarative Pipeline
| 类型 | 特点 |
|------|------|
| Declarative | 结构化、简单、推荐 |
| Scripted | 灵活、代码式、复杂 |

**生产一律用 Declarative。**

---

## 99. Jenkins 凭据管理
- 账号密码凭据
- SSH 凭据
- 秘钥文件
- 令牌
- 作用：**代码不暴露明文密码**

---

## 100. Webhook 触发 Jenkins
1. Jenkins 安装 Generic Webhook 插件
2. 配置 token
3. 代码平台（Gitee/GitHub）填 URL
4. 提交代码 → 自动触发构建

---

## 101. Agent Label 使用
```groovy
agent { label 'maven' }
```
给节点打标签，任务只在对应节点运行。

---

## 102. 参数化构建
- 字符串、布尔、选择框
- 构建时传入版本、环境
```groovy
parameters { string(name: 'VERSION', defaultValue: 'v1.0') }
```

---

## 103. 失败重试 + 超时
```groovy
options {
  retry(2)
  timeout(time: 15, unit: 'MINUTES')
}
```

---

## 104. Freestyle vs Pipeline 为什么推荐 Pipeline
| Freestyle | Pipeline |
|-----------|----------|
| 界面点选 | 代码化 |
| 不可复用、不可回溯 | 可版本管理、可复用 |
| 复杂流程难维护 | 强大、并行、条件、串行 |
| 淘汰 | 主流、标准 |

一句话：**Pipeline 即代码，可维护、可扩展、生产标准。**

---
# ⭐ 七、Shell 脚本（高频·全表格 + 可直接背）
## 105 `$?` 是什么
| 符号 | 含义 | 场景 |
|------|------|------|
| `$?` | 上一条命令**退出码** | 0成功、非0失败 |

示例：
```bash
ls /tmp; echo $?
```

## 106 `set -e` 是什么
| 参数 | 作用 |
|------|------|
| set -e | **遇到错误立刻退出脚本**，不往下跑 |

生产脚本开头必写：`set -euo pipefail`

## 107 判断文件是否存在
| 写法 | 含义 |
|------|------|
| `-f file` | 是否普通文件 |
| `-d dir` | 是否目录 |
| `-e path` | 是否存在 |
| `-r/w/x` | 读/写/执行权限 |

示例：
```bash
if [ -f /etc/profile ]; then echo ok; fi
```

## 108 awk / sed 作用
| 工具 | 定位 | 常用 |
|------|------|------|
| sed | 行处理、替换 | `sed 's/a/b/g'` |
| awk | 列处理、统计 | `awk '{print $1}'` |

## 109 循环遍历文件
```bash
for f in *.log; do echo $f; done
```

## 110 读取脚本入参
见 114

## 111 判断端口是否开放
```bash
nc -z 127.0.0.1 8080
telnet ip port
ss -tulnp | grep 8080
```

## 112 `set -o pipefail`
| 参数 | 作用 |
|------|------|
| pipefail | 管道任意一段失败 → 整体算失败 |
不加：只看最后一段返回码

## 113 单引号 vs 双引号
| 类型 | 特性 |
|------|------|
| 单引号 `' '` | 原样输出，**不解析变量** |
| 双引号 `" "` | 解析变量、保留空格 |

## 114 Shell 位置参数（面试必考）
| 符号 | 含义 |
|------|------|
| `$0` | 脚本名 |
| `$1~$9` | 第1~9个入参 |
| `$#` | 参数个数 |
| `$@` | 所有参数（分开） |
| `$*` | 所有参数（合成一个） |

## 115 函数定义 & 返回值
```bash
func() { return 1; }
```
Shell 返回值：**只能 0~255（退出码）**，不能返回字符串

## 116 if / for / while / case
```bash
if [ ]; then fi
for i in a b; do done
while true; do done
case $x in 1) ;; esac
```

## 117 trap 信号捕获
| 用法 | 作用 |
|------|------|
| trap '清理逻辑' EXIT | 脚本退出自动清理临时文件 |

## 118 Shell 调试
| 参数 | 效果 |
|------|------|
| sh -x script.sh | 逐行打印执行过程 |
| set -x | 脚本内开启调试 |

---

# ⭐ 八、发布相关（区分水平·工程化）
## 119 蓝绿发布
两套环境：蓝(旧)、绿(新)
切流量，失败秒回滚，**零停机**

## 120 如何回滚
1. 切回旧镜像/旧包
2. 恢复旧配置
3. 流量切回
4. 禁止数据库不可逆变更

## 121 版本一致
制品化：镜像/包唯一、环境变量分离、配置中心统一

## 122 灰度发布
少量机器/少量用户先放量 → 观察 → 全量

## 123 发布失败处理
停止发布 → 保留现场 → 定位 → 立刻回滚

## 124 金丝雀 vs 蓝绿
| 模式 | 流量 | 风险 |
|------|------|------|
| 蓝绿 | 一刀切 | 低、秒切 |
| 金丝雀 | 小流量试探 | 更低、平滑 |

## 125 无损发布
健康检查 + 优雅下线 + 滚动更新 + 连接排空

## 126 数据库变更
**兼容优先**：先加字段、后改代码、再删冗余
禁止：锁表、不可逆删除

## 127 制品不可变
镜像/包构建后不改，保证：可追溯、可复现、安全

## 128 发布检查清单
依赖、资源、权限、磁盘、端口、健康、备份、回滚预案

## 129 多环境一致
镜像一致、配置隔离、环境变量区分

## 130 数据库已变更如何回滚
正向兼容设计、双写、兜底脚本、禁止破坏性 DDL

---

# ⭐ 九、监控日志（可落地面试）
## 131 常用监控栈
Prometheus + Grafana + Alertmanager

## 132 日志收集
Filebeat → Loki/ES → 可视化

## 133 线上定位问题
日志 → 指标 → 链路 → 机器状态

## 134 可观测性三支柱
| 名词 | 作用 |
|------|------|
| Metrics 指标 | 看趋势、告警（CPU/耗时） |
| Logs 日志 | 看细节、定位报错 |
| Traces 链路 | 看慢调用、依赖瓶颈 |

## 135 Prometheus 拉模式
主动拉取、简单、无侵入、节点多有压力

## 136 Grafana
画图、大盘、展示指标

## 137 ELK/EFK
Filebeat采集 → ES存储 → Kibana查询

## 138 告警治理
分级、降噪、聚合、抑制、值班、SLO

## 139 服务健康指标
成功率、P99耗时、QPS、错误数、CPU、内存

## 140 接口告警排查
看P99 → 看错误日志 → 看依赖 → 机器资源 → 限流/超时

---

# ⭐ 十、真实经验杀手题（面试官压分题·送你标准答案）
我给你**可以直接口述、非常老练、贴合DevOps/云原生**的回答模板：

## 141 最复杂 Pipeline
多环境、并行构建、镜像扫描、单元测试、集成测试、制品归档、自动灰度、自动回滚、超时重试、凭据隔离

## 142 推动团队用 CI
痛点切入：减少手工错、提速、可追溯、规范化、降低事故率

## 143 减少发布失败
标准化流程、前置检查、自动化回归、制品测试、灰度、健康探测、回滚兜底

## 144 开发不配合
降低侵入、不增加负担、脚本封装、统一模板、收益可见

## 145 做过哪些自动化
自动构建、自动测试、自动镜像、自动部署、自动扩缩容、自动清理、自动告警收敛

## 146 最棘手线上故障
磁盘满/日志打满 → 熔断雪崩 → 慢SQL拖垮 → OOM雪崩（任选其一讲清：现象-定位-止血-复盘）

## 147 发布后异常定位
看监控波动 → 看日志报错 → 看依赖连通 → 看配置变更 → 快速回滚

## 148 优化构建时间
缓存依赖、并行构建、精简镜像、多阶段、Agent隔离、资源扩容

## 149 衡量 CI/CD 效果
发布时长、失败率、回滚率、人工步骤数、故障数

## 150 落地阻力
习惯阻力、复杂度顾虑、旧系统兼容、资源不足 → 小步试点、收益先行

## 151 稳定性提升
限流、熔断、重试、超时、降级、健康检查、优雅启停、资源隔离、容量规划

## 152 从零搭建交付体系
1. 代码托管 + 分支规范
2. CI 自动构建测试
3. 制品仓库 + 镜像扫描
4. CD 灰度/滚动发布
5. 可观测（指标/日志/链路）
6. 告警治理 + 复盘机制
7. 权限/凭据/安全规范

---

要不要我把 **105~152 全部压缩成「一页面试速背版」**？
纯表格、短句、无废话，你面试前 3 分钟扫一遍直接上场。
