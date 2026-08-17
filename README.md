# dsh-agent-compact-self — 自主压缩插件

DSH（DeepSeek Harness）插件：把「何时压缩」的决策完全交给 agent 本人（爱丽丝为核心）。

## 功能特性

- **单一原语**：`session_compact` 工具——调用 compaction seam 的 compactNow
- **框架零强制**：不配置自动触发、不设阈值——压缩决策归 agent 自主判断
- **checkpoint 事务**：注入总结指令 → agent 输出 `<compacted-summary>` 完成压缩

## 安装

```bash
cd <你的 self-plugins 目录>
git clone https://github.com/jonah791/dsh-agent-compact-self.git
cd dsh-agent-compact-self
pnpm install
pnpm build
```

## 使用

agent 在判断上下文压力需要压缩时，自主调用 `session_compact`（reason 必填留痕），下一轮输出 checkpoint 即完成。

## 设计理念

机制给原语，不给剧本——压缩不是被触发的，是 agent 的选择。

## License

MIT
