# 被生成的熟人｜数据新闻

一个关于「AI 换脸 / AI 拟声熟人诈骗」的叙事型数据新闻静态网站。

- 线上地址：<https://nailoong.cloud>
- 技术形态：纯静态站点（HTML + CSS + 原生 JavaScript），无构建步骤、无后端、无数据库、无登录系统
- 数据来源：`cases.csv` / `data.js` 中的诈骗案例均整理自公开新闻报道，正文中的报道来源链接指向原媒体网站

## 本地预览

无需安装任何依赖，任选其一：

```bash
# Python
python -m http.server 8000

# Node.js
npx serve .
```

然后访问 <http://localhost:8000>。直接双击 `index.html` 也可以浏览，但部分交互资源在 file:// 协议下可能受限，建议使用本地服务器。

## 文件结构

```
index.html                    正式首页（唯一入口）
cover-opening-preview.html    兼容旧预览链接的同内容入口
data.js                       案例数据（window.H5DATA）
cases.csv                     案例数据 CSV 版（附公开报道来源链接）
*.css / *.js                  各章节样式与交互脚本（封面来电、四章正文、尾声动效等）
*.webp                        手绘参考图与场景插画
fonts/                        本地字体及 OFL 许可文件（不依赖外部字体服务）
部署说明.txt                   服务器部署说明（原始版本）
```

## 部署

整站是纯静态文件，把仓库内容原样放到任意 Web 服务器的站点根目录或子目录即可（Nginx / CNAME + GitHub Pages / 对象存储均可），无需编译：

- `index.html` 应直接位于站点目录中并设为默认首页
- 如部署到子目录，请以 `/` 结尾的目录网址访问
- 静态资源（css/js/图片/字体）可设置约 7 天的缓存
- 修改正文时请同步 `index.html` 与 `cover-opening-preview.html` 两个文件

## 字体许可

`fonts/` 目录内的字体以 SIL Open Font License（OFL）随包分发，许可文件见同目录 `-OFL.txt`。
