# jappractice

日语单词拼写练习项目。当前阶段只完成开发环境与会话规则初始化，具体产品细节将在后续会话中逐步确认。

## 词库来源

- `doc/新标日初级上册动词表.xlsx`：151 条动词记录
- `doc/新标日初级上册形容词表.xlsx`：96 行形容词数据，包含首次收录与跨课复现条目

源文件中的音调字段尚未完成核验，当前不应作为自动判题依据。

## 开发环境

项目采用 Python `src` 布局，使用 `uv` 管理本地虚拟环境。界面为本地 Web 应用，启动时直接读取 `doc/` 下的 Excel 词库。

```bash
uv sync
uv run jappractice
```

启动后访问 <http://127.0.0.1:8000>。

运行测试：

```bash
uv run python -m unittest discover -s tests
```

## 当前结构

```text
doc/                    原始词库（只读）
discussion/             按 index.md 规则保存会话整理结果
src/jappractice/        Python 包
tests/                  自动化测试
index.md                会话指导文件
RTK.md                  仓库级工作约束
AGENTS.md               新会话入口
```
