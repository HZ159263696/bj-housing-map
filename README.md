# 北京租房 / 买房地图 — Cloudflare + Cloudinary 部署指南

零成本、无需信用卡：
- **Cloudflare Pages** 托管前端，**Pages Functions** 跑 API，**D1** 存房源元数据
- **Cloudinary** 存图片视频（25GB 免费额度，注册不要信用卡）

---

## 一、项目结构

```
北京租房地图/
├── index.html                 ← 前端单页（顶部 CLOUDINARY 常量需要你填）
├── functions/                 ← Pages Functions（自动作为 /api 路由）
│   └── api/
│       ├── rentals.js         GET 列表 / POST 新建
│       └── rentals/[id].js    PUT 更新 / DELETE 删除
├── schema.sql                 ← D1 表结构
└── README.md                  ← 本文
```

---

## 二、注册账号

| 服务 | 用途 | 是否要信用卡 |
|---|---|---|
| [Cloudflare](https://dash.cloudflare.com/sign-up) | 托管 + 数据库 | ❌ 不要 |
| [Cloudinary](https://cloudinary.com/users/register_free) | 图片视频存储 | ❌ 不要 |

---

## 三、Cloudinary 配置（5 分钟）

1. 注册登录后，**Dashboard 顶部**能看到 `Cloud Name`（一串字母数字），先记下来
2. 左下角 ⚙️ **Settings** → 顶部 Tab **Upload** → 滚到下面找 **Upload presets** → **Add upload preset**
3. 配置：
   - **Upload preset name**：起个名字，比如 `bj-housing`（这个名字也要记下来）
   - **Signing Mode**：选 **Unsigned**（这样浏览器能直传，不需要后端密钥）
   - **Folder**（可选）：填 `bj-housing`，所有上传都会归到这个文件夹便于管理
4. 滚到底点 **Save**
5. 编辑项目根目录 `index.html`，找到顶部这段：
   ```js
   const CLOUDINARY = {
     cloudName: "",       // ← 改成你的 Cloud Name
     uploadPreset: "",    // ← 改成你的 unsigned upload preset 名
   };
   ```
   把两个空字符串改成你刚才记下的两个值。

> Cloudinary 免费额度：25 信用 / 月，1 信用 ≈ 1GB 存储或 1GB 流量或 1000 次图片转换；视频按 ~500 次播放算 1 信用。个人使用够了。

---

## 四、Cloudflare 配置

### 1. 创建 D1 数据库

1. Cloudflare Dashboard → 左侧 **Workers & Pages** → **D1 SQL Database** → **Create database**
2. 名字 `bj-housing`，地区 **APAC**，创建
3. 进入 database → 顶部 **Console** 标签 → 把 `schema.sql` 文件**内容**整段粘贴进去 → **Execute**
   - 注意是粘贴文件**内容**（CREATE TABLE 那些 SQL），不是文件名 `schema.sql`
4. 切到 **Tables** 标签验证，应该能看到 `rentals` 表

### 2. 部署 Pages 项目

**方式 A：直接拖拽（最快）**

1. 左侧 **Workers & Pages** → **Create application** → Tab **Pages** → **Upload assets**
2. 项目名填 `bj-housing` → **Create project**
3. 把项目根目录（含 `index.html`、`functions/`、`schema.sql`、`README.md`）压成 zip 拖入
4. 等部署完成（约 30 秒），得到域名 `https://bj-housing.pages.dev`

**方式 B：连 GitHub 自动部署（推荐长期用）**

1. 项目 push 到 GitHub
2. **Workers & Pages** → **Create application** → **Pages** → **Connect to Git**
3. 授权 → 选仓库 → 框架预设 **None**，构建命令留空，输出目录 `/`
4. **Save and Deploy**，以后 push 自动重新部署

### 3. 给 Pages 项目绑定 D1

1. 进入刚建的 `bj-housing` Pages 项目 → **Settings** → **Bindings**
2. **Add Binding** → 选 **D1 database**：
   - Variable name：`DB`（**必须叫这个名字**，代码里写死了）
   - D1 database：选 `bj-housing`
3. **Deployments** → 最新部署的 ⋯ 菜单 → **Retry deployment**（让 binding 生效）

---

## 五、测试

打开 `https://bj-housing.pages.dev`：

- 浏览器开发者工具 Network → 添加房源保存 → 应看到 `POST /api/rentals` 返回 200
- 上传图片 → 应看到 `POST https://api.cloudinary.com/v1_1/.../auto/upload` 返回 `secure_url`
- 刷新页面，房源仍在（这次从 D1 读取）
- 手机用同一个 URL 也能打开和录入

---

## 六、自定义域名（可选）

Pages 项目 → **Custom domains** → **Set up a custom domain** → 填你的域名（如 `map.example.com`），按提示在 DNS 那边加 CNAME 即可，自动 HTTPS。

---

## 七、免费额度小结

| 资源 | 免费额度 | 自用够不够 |
|---|---|---|
| Cloudflare Pages 静态请求 | 无限 | ✅ |
| Cloudflare Pages Functions 调用 | 100,000 次/天 | ✅ |
| D1 读 / 写 | 5M / 100k 次/天 | ✅ |
| D1 存储 | 5 GB | ✅（元数据本身很小）|
| Cloudinary 存储 | 25 信用 ≈ 25GB | ✅ |
| Cloudinary 流量 | 25 信用 ≈ 25GB / 月 | ✅（个人浏览很难超）|

---

## 八、API 速查

```
GET    /api/rentals?mode=rent       列出所有租房
GET    /api/rentals?mode=buy        列出所有买房
POST   /api/rentals                 新建/更新（body: rental JSON，按 id upsert）
PUT    /api/rentals/{id}            更新单条
DELETE /api/rentals/{id}            删除单条
```

媒体上传**不经过本后端**，浏览器直接 `POST https://api.cloudinary.com/v1_1/{cloud}/auto/upload`。

---

## 九、注意事项

- **没有登录系统**：任何人打开 URL 都能改任何房源（你选了"全员可编辑"）。要改成只读 + 密码编辑，告诉我。
- **媒体清理**：删除房源**不会**自动从 Cloudinary 删图，因为 unsigned preset 不允许浏览器删除。要么在 Cloudinary Dashboard 手动清理，要么以后加一个带 API Secret 的清理函数。
- **本地数据迁移**：之前在浏览器 IndexedDB / localStorage 录入的数据不会自动同步到云端。要导入旧数据，告诉我加一键迁移按钮。
- **Cloudinary unsigned 上传限制**：默认单文件最大 100MB（图片）/ 100MB（视频）。如果你上传的视频更大，需要在 preset 里调高 `Max file size`。
