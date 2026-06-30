/**
 * 作品集数据 —— 精选项目。纯数据驱动，由 /projects 页面渲染。
 * 想增删项目，改这里即可；featured 的项目排在前面。
 *
 * 注：除本站外，部分条目对外脱敏处理（不含公司/客户名与敏感数据），
 * 重在呈现承担的角色、技术选型与解决的核心问题。
 */
export interface Project {
  /** 项目名。 */
  name: string;
  /** 一句话定位。 */
  tagline: string;
  /** 2–3 句描述：做的是什么、解决了什么问题。 */
  description: string;
  /** 我在其中承担的角色。 */
  role: string;
  /** 时间段，如 '2024 – 至今'。 */
  period: string;
  /** 状态标签。 */
  status: '在线' | '开源' | '内部项目' | '已上线';
  /** 技术栈关键词。 */
  stack: string[];
  /** 2–4 条亮点 / 我负责攻克的点。 */
  highlights: string[];
  /** 可选外链。 */
  links?: { label: string; href: string }[];
  /** 是否精选（排序靠前）。 */
  featured?: boolean;
}

export const PROJECTS: Project[] = [
  {
    name: 'zlog · 博客与知识库',
    tagline: '这个站点本身',
    description:
      '从设计系统到部署流水线完全自建的个人技术站：博客、知识库、系列学习路径、双向链接，全静态、零第三方追踪。也是我打磨工程细节的试验场。',
    role: '独立设计与开发',
    period: '2026 – 至今',
    status: '开源',
    stack: ['Astro', 'TypeScript', 'CSS Design Tokens', 'Pagefind', 'GitHub Actions'],
    highlights: [
      '基于 design token 的双主题设计系统，组件层零硬编码颜色',
      '构建期渲染 Mermaid、自动生成每篇 OG 社交卡片、纯前端全文搜索',
      '内容校验 + 双向链接图谱在构建时静态生成，链接断了构建即失败',
      'push 即部署，首屏 Lighthouse 性能稳定 100',
    ],
    links: [{ label: 'GitHub', href: 'https://github.com/zlogzr/zlog' }],
    featured: true,
  },
  {
    name: '电商店铺前台',
    tagline: '从浏览到下单的全链路',
    description:
      '面向 C 端买家的店铺前台：商品列表与详情、SKU 选择、购物车、结算下单全链路。核心挑战是高并发下的一致性与首屏性能。',
    role: '前端负责人',
    period: '2023 – 至今',
    status: '在线',
    stack: ['React', 'TypeScript', 'Next.js', 'React Query', 'Tailwind'],
    highlights: [
      '梳理 SPU/SKU 模型与多规格选择器，杜绝「选了不存在的组合」类问题',
      '下单链路做幂等与价格服务端校验，前端不可信金额一律以后端为准',
      '通过路由级代码分割 + 关键资源预取，LCP 优化约 40%',
      '沉淀购物车一致性、库存防超卖等设计经验到知识库',
    ],
    featured: true,
  },
  {
    name: '可视化店铺装修编辑器',
    tagline: '拖拽搭建，所见即所得',
    description:
      '让非技术的商家用拖拽方式搭建店铺页面的可视化编辑器：组件库、自由布局、实时预览、撤销重做、多端适配。',
    role: '核心开发',
    period: '2022 – 2023',
    status: '已上线',
    stack: ['React', 'TypeScript', 'Zustand', 'DnD', 'Schema 驱动'],
    highlights: [
      '设计 Schema 驱动的渲染引擎，编辑态与运行态共用同一套组件',
      '基于不可变状态的历史栈，实现稳定的撤销/重做与协同基础',
      '抽象出可被业务方扩展的物料协议，新组件接入成本从天级降到小时级',
    ],
    featured: true,
  },
  {
    name: '组件库与设计系统',
    tagline: '团队共用的一套地基',
    description:
      '跨多个业务线复用的组件库与设计系统：design token、双主题、完整的无障碍支持与文档站。',
    role: '设计系统维护者',
    period: '2022 – 至今',
    status: '内部项目',
    stack: ['React', 'TypeScript', 'CSS Variables', 'Storybook', 'a11y'],
    highlights: [
      '用 design token 统一颜色/间距/层级，主题切换只换一套变量',
      '以 @layer 管理样式优先级，根治第三方样式覆盖与特异性军备竞赛',
      '组件默认满足键盘可达与 ARIA 语义，无障碍作为验收项而非补丁',
    ],
  },
  {
    name: '前端工程化基建',
    tagline: '让团队跑得更快更稳',
    description:
      'monorepo 架构治理、构建提速、CI/CD 流水线与代码质量门禁，把重复劳动和低级错误挡在合并之前。',
    role: '工程化推进',
    period: '2021 – 至今',
    status: '内部项目',
    stack: ['pnpm', 'Turborepo', 'Vite', 'ESLint', 'GitHub Actions'],
    highlights: [
      'pnpm + 工作区收敛依赖，配合远程缓存把 CI 构建时间显著压缩',
      '统一 lint / 类型检查 / 测试门禁，问题在 PR 阶段暴露',
      '约束依赖方向与版本策略，控制 monorepo 的「牵一发动全身」',
    ],
  },
];
