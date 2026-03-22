# 八股文
---

# ⭐ 一、CI / CD Pipeline 设计类（必考）

1. CI 和 CD 的区别是什么
2. 一个完整的 CI/CD pipeline 一般包含哪些阶段
3. 如何设计一个支持回滚的发布流程
4. pipeline 失败如何定位
5. 如何避免 pipeline 成为瓶颈
6. 如何设计并行构建 / 并行测试
7. pipeline 如何缓存依赖提升速度
8. artifact 如何管理生命周期
9. 如何做 multi-branch pipeline
10. monorepo 如何设计 pipeline

---

# ⭐ 二、发布策略（超级高频）

11. 蓝绿发布 vs 灰度发布 vs 滚动发布
12. 如何设计 canary 发布
13. 发布失败如何自动回滚
14. 如何保证发布幂等
15. 如何避免发布过程中流量中断
16. 如何做数据库 schema 变更发布
17. 如何设计 feature flag
18. 如何冻结版本（freeze window 怎么治理）

---

# ⭐ 三、Git / 分支治理（你强项）

19. Git Flow vs Trunk Based Development
20. 如何避免长期分支带来的冲突
21. 什么是 rebase vs merge
22. 如何设计 tag 策略
23. 如何做 patch release
24. 如何保证版本一致性
25. 如何设计 MR 审批流程

---

# ⭐ 四、容器 / Kubernetes（几乎必问）

26. Pod 生命周期
27. Deployment vs StatefulSet
28. Service 类型区别
29. 如何做滚动升级
30. readiness probe vs liveness probe
31. HPA 如何工作
32. 如何排查 Pod CrashLoopBackOff
33. configmap vs secret
34. 如何做资源限制（limit / request）

---

# ⭐ 五、Linux / 系统基础（偏平台岗）

35. CPU load 高如何排查
36. 内存泄漏如何定位
37. IO 高如何分析
38. 网络延迟高排查路径
39. 什么是僵尸进程
40. systemd 如何管理服务

---

# ⭐ 六、可观测性（近几年越来越重要）

41. metrics / logs / tracing 区别
42. 什么是 SLI / SLO / SLA
43. 如何设计告警策略
44. 如何避免告警风暴
45. 如何定位线上性能下降

---

# ⭐ 七、自动化测试 / 质量体系

46. 单测 / 集成测试 / e2e 测试区别
47. 自动化测试如何接入 pipeline
48. 如何提升测试稳定性
49. flaky test 怎么处理
50. 如何设计 test report

---

# ⭐ 八、基础设施即代码（IaC）

51. Terraform 的工作原理
52. 什么是 idempotent
53. 如何管理多环境配置
54. drift detection 是什么
55. 如何做 infra 版本回滚

---

# ⭐ 九、安全 / 权限（很多人忽视）

56. CI secret 如何管理
57. 如何防止凭证泄露
58. RBAC 如何设计
59. 如何做镜像安全扫描
60. 如何限制 production 权限

---

# ⭐ 十、工程文化 / 效能（你真正的王牌）

61. 如何推动代码评审文化
62. 如何提升发布频率
63. 如何降低 lead time
64. 如何推动自动化落地
65. 如何处理开发抵触流程
66. 如何评估团队效能
67. 如何建设 engineering metrics

---

# ⭐ 十一、架构 / 高阶 DevOps（高级岗）

68. 如何设计高可用 CI 系统
69. 如何做 pipeline 分布式执行
70. 如何设计 artifact CDN
71. monolith → microservice 发布怎么过渡
72. 如何做 multi-region 发布
73. 如何设计 disaster recovery

---

# ⭐ 给你一个非常实用的刷题策略

不要像刷算法一样死记。

而是：

👉 每题用这个模板准备：

```text
① 定义
② 为什么需要
③ 实际工程中怎么做
④ 遇到过什么坑
```

你会发现：

> ⭐ 你很多题其实已经有真实案例答案

这就是你的优势。

---

如果你愿意，下一步我可以帮你做一个更狠的东西：

👉 **给你做一套 DevOps 模拟面试（连续追问那种）**
我来当面试官，你来答。

这个提升会非常快。

哈哈对 👍
你这个判断其实非常接地气。

很多国内公司的 **DevOps一面确实不是聊体系，而是：**

> ⭐ **工具熟练度 + 命令行 + 实际操作经验**

而不是：

* SLO
* Release Train
* Engineering Metrics
