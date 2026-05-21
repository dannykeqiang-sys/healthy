# CLAUDE.md

本文件作为Claude Code生码指引

## 基础架构介绍

阿里巴巴 ICE.js v3 前端框架 - 基于 React 的渐进式应用框架

### 项目结构

默认使用首页路由，非多页面诉求下不要在pages下创建新的路由

```
src/
├── app.tsx           # 应用入口
├── document.tsx      # HTML 文档模板
└── pages/
    |── components/       # 组件目录
    └── index.tsx     # 首页路由
```

### 常用模式

#### 路由组件
```tsx
export default function Home() {
  return <div>Hello ICE</div>;
}
```

#### 布局组件
```tsx
import { Outlet } from 'ice';

export default function Layout() {
  return (
    <div>
      <nav>导航栏</nav>
      <Outlet />
    </div>
  );
}
```

#### 数据加载
```tsx
import { useData } from 'ice';

export function dataLoader() {
  return fetch('/api/data').then(res => res.json());
}

export default function Page() {
  const data = useData();
  return <div>{data.title}</div>;
}
```

#### 路由导航
```tsx
import { Link, useNavigate, history } from 'ice';

// Link 组件
<Link to="/about">关于</Link>

// useNavigate 钩子
const navigate = useNavigate();
navigate('/about');

// history API
history.push('/about');
```

#### 配置
当前项目为ice3项目，启动服务后的端口默认就是3000。**不要误将Vite的server配置放入ice.config.mts，这里不适用也不需要**

```ts
// ice.config.mts
import { defineConfig } from '@ice/app';

export default defineConfig({
  ssr: false,
  ssg: false,
  plugins: ['@ice/plugin-xxx'],
});
```

### 核心概念

#### 基于文件的路由
- `src/pages/*.tsx` → 路由页面
- `layout.tsx` → 嵌套布局
- `$param.tsx` → 动态路由
- `$.tsx` → 通配路由

#### 数据加载
- `dataLoader` 函数用于 SSR 数据获取
- `useData` 钩子用于访问数据
- 嵌套路由支持并行数据加载

### 资源

#### 官方链接
- 文档：https://ice.alibaba-inc.com/
- GitHub：https://github.com/alibaba/ice

## 基础组件使用规范

本项目默认使用 shadcn/ui 作为基础组件库，项目已完成shadcn的初始化。

### 基础组件添加方式

通过 CLI 命令添加所需组件：
```bash
# 添加单个组件
npx shadcn@latest add button -o -y
# 添加多个组件
npx shadcn@latest add card input dialog -o -y
```
CLI 会自动将组件代码复制到 `src/components/shadcn/` 目录，并安装所需依赖。

### 基础组件使用原则

1. **优先使用已有 shadcn 组件**：在构建界面时，优先检查 `src/components/shadcn/` 目录下是否已有相应组件
2. **按需添加组件**：如果需要新的 shadcn 组件，自动通过 CLI 添加
3. **组件位置**：所有 shadcn 组件存放在 `src/components/shadcn/` 目录下
4. **样式定制**：通过 Tailwind 类名和 CSS 变量定制组件样式，可以直接修改组件源码

### 图标使用

项目使用 Lucide Icons 作为图标库（shadcn/ui 默认集成）：
```tsx
import { Search, Plus, Settings } from 'lucide-react';
import { Button } from '@/components/shadcn/button';
// 图标按钮
<Button size="icon"><Search className="size-4" /></Button>
// 带图标的按钮
<Button><Plus className="size-4" />新建</Button>
```
图标参考：https://lucide.dev/icons

### 基础组件扩展

如果 shadcn/ui 未提供所需组件：
1. 检查是否可以通过组合现有 shadcn 组件实现
2. 在 `src/components/` 目录下创建自定义组件，保持与 shadcn 组件风格一致
3. 可基于 Radix UI 原语创建符合项目风格的新组件
参考文档：https://ui.shadcn.com/docs

## 业务组件化开发规范

### 强制拆分规则
在开发时必须遵循以下组件拆分原则：

1. **单一职责原则**
   - 每个组件只负责一个功能模块
   - 超过 200 行代码的组件必须拆分

2. **必须拆分的场景**
   - 统计卡片 → `components/StatsCard.tsx`
   - 数据表格 → `components/DataTable.tsx`
   - 表单对话框 → `components/FormDialog.tsx`
   - 工具栏/操作栏 → `components/Toolbar.tsx`
   - 侧边栏导航 → `components/Sidebar.tsx`

3. **组件目录结构**

```
src/
├── app.tsx           # 应用入口
├── document.tsx      # HTML 文档模板
|── components/       # 通用组件（如shadcn-ui）
└── pages/
    |── components/   # 页面组件（如上面拆分出的场景）
    └── index.tsx     # 首页路由
```