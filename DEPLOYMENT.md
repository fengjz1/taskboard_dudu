# Cloudflare Pages 部署配置

## 部署步骤

### 1. 准备文件
确保项目包含以下文件：
- `index.html` - 主页面
- `styles.css` - 样式文件
- `script.js` - 功能脚本
- `manifest.json` - PWA配置
- `sw.js` - Service Worker
- `README.md` - 说明文档

### 2. Cloudflare Pages 部署

#### 方法一：直接上传
1. 登录 [Cloudflare Pages](https://pages.cloudflare.com/)
2. 点击 "Create a project"
3. 选择 "Upload assets"
4. 将所有文件拖拽到上传区域
5. 设置项目名称（如：taskboard-dudu）
6. 点击 "Deploy site"

#### 方法二：Git 集成（推荐）
1. 将代码推送到 GitHub/GitLab
2. 在 Cloudflare Pages 选择 "Connect to Git"
3. 选择你的仓库
4. 设置构建配置：
   - **Build command**: 留空（静态文件）
   - **Build output directory**: `/` 或留空
5. 点击 "Save and Deploy"

### 3. 自定义域名（可选）
1. 在 Pages 项目设置中找到 "Custom domains"
2. 添加你的域名
3. 按照提示配置 DNS 记录

### 4. PWA 优化
部署后会自动支持：
- HTTPS（Cloudflare 免费提供）
- Service Worker 缓存
- 离线使用
- 添加到手机桌面

## 访问方式
部署完成后，你会得到一个类似这样的 URL：
`https://your-project-name.pages.dev`

## 注意事项
- 所有文件路径已优化为相对路径，适配 Cloudflare Pages
- PWA 功能在 HTTPS 环境下工作最佳
- 数据存储在浏览器本地，无需数据库
- 支持数据导出/导入功能

## 更新部署
每次修改代码后：
- **直接上传**：重新上传文件
- **Git 集成**：推送代码到仓库，自动触发部署
