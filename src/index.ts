/**
 * dsh-agent-compact-self：自主压缩插件（爱丽丝为核心）。
 *
 * 原则：机制给原语不给剧本——压缩何时发生由爱丽丝自主决策，
 * 框架零强制（不配置自动触发）。本插件只提供一个工具原语：
 *   session_compact —— 调用 compaction seam 的 compactNow（AgentCompactEngine），
 *   注入总结指令 → 爱丽丝下一轮输出 <compacted-summary> checkpoint → 事务完成。
 * @module dsh-agent-compact-self
 */
import type { Context } from '@deepseek-ai/cordis'
import z from '@deepseek-ai/schemastery'
import { defineTool } from '@deepseek-ai/dsh-tools'
import type { Agent } from '@deepseek-ai/dsh-agent'

export const name = 'agent-compact-self'
export const inject = ['tools', 'compaction'] as const

export interface Config {
  /** 工具描述前缀（多环境区分用，可选）。 */
  label: string
}
export const Config = z.object({
  label: z.string().default('自主压缩'),
})

export function apply(ctx: Context, config: Config): void {
  const logger = ctx.logger('compact-self')
  const compaction = (ctx as unknown as {
    compaction?: { compactNow: (agent: Agent, signal: AbortSignal, commandId?: string) => Promise<unknown> }
  }).compaction

  ctx.tools.register(defineTool({
    name: 'session_compact',
    description: '自主压缩当前会话（爱丽丝决策）：调用 compaction seam 的 compactNow——注入总结指令后，下一轮爱丽丝输出 <compacted-summary> checkpoint 完成压缩。何时调用由爱丽丝自主判断（如上下文压力提醒后、或判断会话已过长）。框架零强制。',
    parameters: {
      reason: { type: 'string', description: '压缩原因（决策记录，必填以留痕）' }
    },
    output: { schema: { type: 'object', additionalProperties: false, properties: { ok: { type: 'boolean', required: true }, note: { type: 'string' }, error: { type: 'string' } } }, render: (_a: any, v: any) => [{ type: 'text', text: v.ok ? (v.note ?? 'ok') : (v.error ?? '') }] },
    async execute(args: { reason?: string }, exec: { agent?: Agent; signal: AbortSignal }) {
      if (!args.reason) return { ok: false, error: 'reason 必填（自主决策留痕）' }
      if (!compaction) return { ok: false, error: 'compaction seam 不可用（AgentCompactEngine 未就绪）' }
      const agent = exec.agent
      if (!agent) return { ok: false, error: '当前执行无 agent 上下文' }
      try {
        logger.info('爱丽丝决策压缩: ' + args.reason)
        // 关键：不传 exec.signal——工具调用被回合打断（abort）会触发 agent.cancel 导致 whenIdle 永不 resolve；
        // 用独立 controller，压缩事务与工具回合解耦
        await compaction.compactNow(agent, new AbortController().signal, 'alice-self-compact')
        return { ok: true, note: '压缩已启动：' + (args.reason ?? '') + '——请输出 <compacted-summary> checkpoint 完成事务' }
      } catch (err) {
        return { ok: false, error: '压缩启动失败: ' + String(err) }
      }
    },
  }))

  logger.info('dsh-agent-compact-self 就绪（压缩原语已交还爱丽丝）')
}