# jappractice

基于《新版中日交流标准日本语》词库的本地 Web 拼写练习应用。

## 当前功能

- 可选择动词、形容词或全部词条进行随机测试。
- 动词接受辞书形、假名辞书形、ます形和假名ます形；形容词接受汉字或假名。
- 每个词首次作答决定正确/错误归类；答错后保留当前题，直到重新输入正确答案。
- 展示音调、词类、活用、自／他动词、课次和备注等词条详情。
- 实时显示测试进度、正确数、错误数和错题列表。
- 支持将当前错题重新组成一轮错题测试；新一轮计数从零开始。
- 测试结束后汇总正确率，并可按日期导出错题 CSV。

## 词库来源

- `doc/新标日初级上册动词表.xlsx`：153 条动词记录
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
node tests/test_error_test.mjs
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
