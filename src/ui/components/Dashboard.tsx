import React, { useState, useEffect, useCallback } from 'react';
import { Box, Text, useInput, useApp } from 'ink';
import Spinner from 'ink-spinner';
import { Logo } from './Logo.js';
import { Header } from './Header.js';
import { StatusBadge, PriorityBadge, ProgressBar, Money, Divider, KeyValue } from './Badges.js';
import { listClients, getClient } from '../../store/client.js';
import { listProjects, getProject } from '../../store/project.js';
import { listTasks, getTask, getTaskStats } from '../../store/task.js';
import { VERSION } from '../theme.js';
import { formatMoney } from '../utils.js';

type Screen = 'home' | 'clients' | 'projects' | 'tasks' | 'task-board' | 'week' | 'detail-client' | 'detail-project' | 'detail-task';
type DetailItem = { type: string; data: any };

/** Bottom key hints bar */
function KeyHints({ hints }: { hints: string[] }) {
  return (
    <Box borderStyle="round" borderColor="gray" paddingX={1}>
      {hints.map((h, i) => (
        <Text key={i}>
          {i > 0 && <Text color="gray"> │ </Text>}
          <Text color="cyan" bold>{h.split(' ')[0]}</Text>
          <Text dimColor>{h.slice(h.indexOf(' '))}</Text>
        </Text>
      ))}
    </Box>
  );
}

/** Selection list item */
function ListItem({ label, sub, selected, icon }: { label: string; sub?: string; selected: boolean; icon?: string }) {
  return (
    <Box paddingLeft={1}>
      <Text color={selected ? 'cyan' : 'gray'}>{selected ? '❯' : ' '}</Text>
      <Text bold={selected} color={selected ? 'white' : 'gray'}>{' '}{icon || '●'}{' '}</Text>
      <Text color={selected ? 'white' : '#d1d5db'}>
        {label}
      </Text>
      {sub && <Text dimColor> {sub}</Text>}
    </Box>
  );
}

/** Home screen */
function HomeScreen({ onSelect }: { onSelect: (screen: Screen) => void }) {
  const [cursor, setCursor] = useState(0);
  const items: { key: Screen; label: string; icon: string; sub: string }[] = [
    { key: 'clients', label: '客户管理', icon: '👤', sub: '' },
    { key: 'projects', label: '项目管理', icon: '📦', sub: '' },
    { key: 'tasks', label: '任务列表', icon: '📋', sub: '' },
    { key: 'task-board', label: '任务看板', icon: '📊', sub: 'Kanban' },
    { key: 'week', label: '本周周报', icon: '📅', sub: '' },
  ];

  useInput((input, key) => {
    if (key.upArrow || input === 'k') setCursor(c => Math.max(0, c - 1));
    if (key.downArrow || input === 'j') setCursor(c => Math.min(items.length - 1, c + 1));
    if (key.return || input === 'l') onSelect(items[cursor].key);
    if (input === 'q') process.exit(0);
  });

  return (
    <Box flexDirection="column">
      <Box marginBottom={1} />
      {items.map((item, i) => (
        <ListItem key={item.key} label={item.label} sub={item.sub} selected={i === cursor} icon={item.icon} />
      ))}
    </Box>
  );
}

/** Clients screen */
function ClientsScreen({ onBack, onDetail }: { onBack: () => void; onDetail: (item: DetailItem) => void }) {
  const [cursor, setCursor] = useState(0);
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    const list = await listClients() as any[];
    setClients(list);
    setLoading(false);
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  useInput((input, key) => {
    if (key.upArrow || input === 'k') setCursor(c => Math.max(0, c - 1));
    if (key.downArrow || input === 'j') setCursor(c => Math.min(clients.length - 1, c + 1));
    if (key.return && clients[cursor]) onDetail({ type: 'client', data: clients[cursor] });
    if (key.escape || input === 'h' || input === 'q') onBack();
  });

  if (loading) return <Text><Spinner type="dots" /> 加载中...</Text>;

  return (
    <Box flexDirection="column">
      <Header title="客户管理" subtitle={`${clients.length} 位客户`} />
      {clients.length === 0 ? (
        <Text dimColor padding={1}>  💤 暂无客户，按 h 返回</Text>
      ) : (
        clients.map((c, i) => (
          <ListItem key={c.id} label={c.name} sub={c.company || c.contact || ''} selected={i === cursor} icon={i === cursor ? '👤' : '○'} />
        ))
      )}
    </Box>
  );
}

/** Projects screen */
function ProjectsScreen({ onBack, onDetail }: { onBack: () => void; onDetail: (item: DetailItem) => void }) {
  const [cursor, setCursor] = useState(0);
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    const list = await listProjects() as any[];
    setProjects(list);
    setLoading(false);
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  useInput((input, key) => {
    if (key.upArrow || input === 'k') setCursor(c => Math.max(0, c - 1));
    if (key.downArrow || input === 'j') setCursor(c => Math.min(projects.length - 1, c + 1));
    if (key.return && projects[cursor]) onDetail({ type: 'project', data: projects[cursor] });
    if (key.escape || input === 'h' || input === 'q') onBack();
  });

  if (loading) return <Text><Spinner type="dots" /> 加载中...</Text>;

  return (
    <Box flexDirection="column">
      <Header title="项目管理" subtitle={`${projects.length} 个项目`} />
      {projects.length === 0 ? (
        <Text dimColor padding={1}>  💤 暂无项目</Text>
      ) : (
        projects.map((p, i) => (
          <Box key={p.id} paddingLeft={1}>
            <Text color={i === cursor ? 'cyan' : 'gray'}>{i === cursor ? '❯' : ' '}</Text>
            <Text bold={i === cursor} color={i === cursor ? 'white' : '#d1d5db'}>{' '}{i === cursor ? '📦' : '○'} {p.name}</Text>
            <Box marginLeft={1}>
              <StatusBadge status={p.status} />
            </Box>
            <Box marginLeft={1}>
              <Money amount={p.budget || 0} />
            </Box>
          </Box>
        ))
      )}
    </Box>
  );
}

/** Tasks screen */
function TasksScreen({ onBack, onDetail }: { onBack: () => void; onDetail: (item: DetailItem) => void }) {
  const [cursor, setCursor] = useState(0);
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    const list = await listTasks() as any[];
    setTasks(list);
    setLoading(false);
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  useInput((input, key) => {
    if (key.upArrow || input === 'k') setCursor(c => Math.max(0, c - 1));
    if (key.downArrow || input === 'j') setCursor(c => Math.min(tasks.length - 1, c + 1));
    if (key.return && tasks[cursor]) onDetail({ type: 'task', data: tasks[cursor] });
    if (key.escape || input === 'h' || input === 'q') onBack();
  });

  if (loading) return <Text><Spinner type="dots" /> 加载中...</Text>;

  return (
    <Box flexDirection="column">
      <Header title="任务列表" subtitle={`${tasks.length} 个任务`} />
      {tasks.length === 0 ? (
        <Text dimColor padding={1}>  💤 暂无任务</Text>
      ) : (
        tasks.map((t, i) => (
          <Box key={t.id} paddingLeft={1}>
            <Text color={i === cursor ? 'cyan' : 'gray'}>{i === cursor ? '❯' : ' '}</Text>
            <Text bold={i === cursor} color={i === cursor ? 'white' : '#d1d5db'}>{' '}{i === cursor ? '📋' : '○'} {t.title}</Text>
            <Box marginLeft={1}>
              <StatusBadge status={t.status} />
              <PriorityBadge priority={t.priority} />
            </Box>
            {t.time_spent > 0 && <Text dimColor> ⏱{t.time_spent}h</Text>}
          </Box>
        ))
      )}
    </Box>
  );
}

/** Task Board screen */
function TaskBoardScreen({ onBack }: { onBack: () => void }) {
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const list = await listTasks() as any[];
      setTasks(list);
      setLoading(false);
    })();
  }, []);

  useInput((input, key) => {
    if (key.escape || input === 'h' || input === 'q') onBack();
  });

  if (loading) return <Text><Spinner type="dots" /> 加载中...</Text>;

  const groups = [
    { label: '📋 待办', status: 'todo', color: 'gray' },
    { label: '🔄 进行中', status: 'doing', color: 'yellow' },
    { label: '✅ 已完成', status: 'done', color: 'green' },
  ];

  return (
    <Box flexDirection="column">
      <Header title="任务看板" subtitle="Kanban" />
      <Box>
        {groups.map(g => {
          const items = tasks.filter(t => t.status === g.status);
          return (
            <Box key={g.status} flexDirection="column" marginRight={2} width={30}>
              <Box>
                <Text bold color={g.color}>{g.label}</Text>
                <Text dimColor> ({items.length})</Text>
              </Box>
              <Text color="gray">{'─'.repeat(28)}</Text>
              {items.length === 0 && <Text dimColor>  (空)</Text>}
              {items.map(t => (
                <Box key={t.id} flexDirection="column" marginBottom={1}>
                  <Text>  {t.title}</Text>
                  <Box>
                    {t.priority !== 'medium' && (
                      <Text color={t.priority === 'high' ? 'red' : 'gray'} dimColor>
                        {t.priority === 'high' ? '🔴' : '⚪'} {t.priority}
                      </Text>
                    )}
                    {t.time_spent > 0 && <Text dimColor> ⏱ {t.time_spent}h</Text>}
                    {t.due_date && <Text dimColor> 📅 {t.due_date}</Text>}
                  </Box>
                </Box>
              ))}
            </Box>
          );
        })}
      </Box>
    </Box>
  );
}

/** Week report screen */
function WeekScreen({ onBack }: { onBack: () => void }) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const db = await (await import('../../store/db.js')).ensureDb();
      const completed = db.prepare(`
        SELECT t.*, p.name as project_name FROM task t
        LEFT JOIN project p ON t.project_id = p.id
        WHERE t.status = 'done'
          AND t.updated_at >= datetime('now', '-7 days', 'weekday 1', 'start of day')
      `).all() as any[];
      const hours = db.prepare(`
        SELECT COALESCE(SUM(time_spent), 0) as total FROM task
        WHERE updated_at >= datetime('now', '-7 days', 'weekday 1', 'start of day')
      `).get() as any;
      const payments = db.prepare(`
        SELECT COALESCE(SUM(received), 0) as total FROM project
        WHERE updated_at >= datetime('now', '-7 days', 'weekday 1', 'start of day')
          AND received > 0
      `).get() as any;
      const stats = db.prepare(`
        SELECT status, COUNT(*) as count FROM task
        WHERE updated_at >= datetime('now', '-7 days', 'weekday 1', 'start of day')
        GROUP BY status
      `).all() as any[];
      const overdue = db.prepare(`
        SELECT t.*, p.name as project_name FROM task t
        LEFT JOIN project p ON t.project_id = p.id
        WHERE t.status != 'done' AND t.due_date != '' AND t.due_date < date('now')
      `).all() as any[];
      setData({ completed, hours: hours.total, payments: payments.total, stats, overdue });
      setLoading(false);
    })();
  }, []);

  useInput((input, key) => {
    if (key.escape || input === 'h' || input === 'q') onBack();
  });

  if (loading) return <Text><Spinner type="dots" /> 生成周报中...</Text>;

  const labels: Record<string, string> = { todo: '待办', doing: '进行中', done: '已完成' };
  const total = (data.stats || []).reduce((s: number, r: any) => s + r.count, 0);

  return (
    <Box flexDirection="column">
      <Header title="本周周报" subtitle={new Date().toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' })} />
      <Box marginY={1} flexDirection="column" paddingLeft={1}>
        <Text>  📊 任务变动: {(data.stats || []).map((s: any) => `${labels[s.status] || s.status}: ${s.count}`).join(', ') || '无'}</Text>
        <Text>  ⏱️  累计工时: <Text bold>{data.hours}h</Text></Text>
        <Text>  💰 本周收款: <Text color="green" bold>{formatMoney(data.payments)}</Text></Text>

        {data.completed.length > 0 && (
          <Box marginTop={1} flexDirection="column">
            <Text bold>  ✅ 已完成 ({data.completed.length}):</Text>
            {data.completed.map((t: any) => (
              <Text key={t.id} dimColor>     · {t.title}{t.project_name ? ` [${t.project_name}]` : ''}</Text>
            ))}
          </Box>
        )}

        {data.overdue.length > 0 && (
          <Box marginTop={1} flexDirection="column">
            <Text color="red" bold>  ⚠️  逾期 ({data.overdue.length}):</Text>
            {data.overdue.map((t: any) => (
              <Text key={t.id} dimColor>     · {t.title} (截止: {t.due_date}){t.project_name ? ` [${t.project_name}]` : ''}</Text>
            ))}
          </Box>
        )}
      </Box>
    </Box>
  );
}

/** Detail view for client/project/task */
function DetailScreen({ item, onBack }: { item: DetailItem; onBack: () => void }) {
  useInput((input, key) => {
    if (key.escape || input === 'h' || input === 'q') onBack();
  });

  if (item.type === 'client') {
    const c = item.data;
    return (
      <Box flexDirection="column">
        <Header title="客户详情" subtitle={c.name} />
        <Box flexDirection="column" paddingLeft={2} marginY={1}>
          {c.company && <KeyValue label="公司">{c.company}</KeyValue>}
          {c.contact && <KeyValue label="联系人">{c.contact}</KeyValue>}
          {c.email && <KeyValue label="邮箱">{c.email}</KeyValue>}
          {c.notes && <KeyValue label="备注">{c.notes}</KeyValue>}
          <KeyValue label="创建">{c.created_at}</KeyValue>
          <KeyValue label="ID">{c.id.slice(0, 8)}</KeyValue>
        </Box>
      </Box>
    );
  }

  if (item.type === 'project') {
    const p = item.data;
    return (
      <Box flexDirection="column">
        <Header title="项目详情" subtitle={p.name} />
        <Box flexDirection="column" paddingLeft={2} marginY={1}>
          <KeyValue label="状态"><StatusBadge status={p.status} /></KeyValue>
          <KeyValue label="预算"><Money amount={p.budget || 0} bold /></KeyValue>
          <KeyValue label="已收"><Money amount={p.received || 0} /></KeyValue>
          {p.budget > 0 && (
            <KeyValue label="进度">
              <ProgressBar value={p.received || 0} max={p.budget} />
            </KeyValue>
          )}
          {p.notes && <KeyValue label="备注">{p.notes}</KeyValue>}
          <KeyValue label="创建">{p.created_at}</KeyValue>
          <KeyValue label="ID">{p.id.slice(0, 8)}</KeyValue>
        </Box>
      </Box>
    );
  }

  if (item.type === 'task') {
    const t = item.data;
    return (
      <Box flexDirection="column">
        <Header title="任务详情" subtitle={t.title} />
        <Box flexDirection="column" paddingLeft={2} marginY={1}>
          <Box>
            <KeyValue label="状态"><StatusBadge status={t.status} /></KeyValue>
          </Box>
          <Box>
            <KeyValue label="优先级"><PriorityBadge priority={t.priority} /></KeyValue>
          </Box>
          {t.description && <KeyValue label="描述">{t.description}</KeyValue>}
          {t.due_date && <KeyValue label="截止">{t.due_date}</KeyValue>}
          {t.time_spent > 0 && <KeyValue label="工时">{t.time_spent}h</KeyValue>}
          <KeyValue label="创建">{t.created_at}</KeyValue>
          <KeyValue label="ID">{t.id.slice(0, 8)}</KeyValue>
        </Box>
      </Box>
    );
  }

  return <Text>Unknown</Text>;
}

/** Main App */
export default function App() {
  const [screen, setScreen] = useState<Screen>('home');
  const [detail, setDetail] = useState<DetailItem | null>(null);
  const [history, setHistory] = useState<Screen[]>([]);

  const navigate = (s: Screen) => {
    setHistory(prev => [...prev, screen]);
    setScreen(s);
  };

  const goBack = () => {
    if (detail) {
      setDetail(null);
      return;
    }
    if (history.length > 0) {
      const prev = history[history.length - 1];
      setHistory(h => h.slice(0, -1));
      setScreen(prev);
    } else {
      setScreen('home');
    }
  };

  const goDetail = (item: DetailItem) => {
    setDetail(item);
  };

  // Global quit
  useInput((input) => {
    if (input === 'q' && screen === 'home' && !detail) process.exit(0);
  });

  const currentHints = detail
    ? ['h/Esc 返回']
    : screen === 'home'
      ? ['↑↓/jk 导航', 'Enter 进入', 'q 退出']
      : ['↑↓/jk 导航', 'Enter 详情', 'h 返回'];

  return (
    <Box flexDirection="column" paddingX={1}>
      {/* Top: Logo (compact on inner screens) */}
      {screen === 'home' && !detail ? (
        <Box marginBottom={1}>
          <Logo compact />
        </Box>
      ) : (
        <Box marginBottom={1}>
          <Text color="#8b5cf6" bold>{'◆ nova '}</Text>
          <Text dimColor>{`v${VERSION}`}</Text>
          <Text color="gray"> {'─'.repeat(30)}</Text>
        </Box>
      )}

      {/* Content */}
      {detail ? (
        <DetailScreen item={detail} onBack={goBack} />
      ) : screen === 'home' ? (
        <HomeScreen onSelect={navigate} />
      ) : screen === 'clients' ? (
        <ClientsScreen onBack={goBack} onDetail={goDetail} />
      ) : screen === 'projects' ? (
        <ProjectsScreen onBack={goBack} onDetail={goDetail} />
      ) : screen === 'tasks' ? (
        <TasksScreen onBack={goBack} onDetail={goDetail} />
      ) : screen === 'task-board' ? (
        <TaskBoardScreen onBack={goBack} />
      ) : screen === 'week' ? (
        <WeekScreen onBack={goBack} />
      ) : null}

      {/* Bottom: key hints */}
      <Box marginTop={1}>
        <KeyHints hints={currentHints} />
      </Box>
    </Box>
  );
}
