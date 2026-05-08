# 新对话接手入口

当你在 `02-project` 中新开 Codex 对话时，先按下面顺序读取上下文，再继续开发。

## 1. 先读取 skill

先读这个 skill：

- `C:\02-project\.codex\skills\palace-game-frontend\SKILL.md`

如有需要，再读：

- `C:\02-project\.codex\skills\palace-game-frontend\references\current-frontend-state.md`
- `C:\02-project\.codex\skills\palace-game-frontend\references\ai-boundaries.md`

这部分负责说明：
- 当前前端主流程
- 关键文件入口
- UI 常量
- 双 AI 接口边界
- 无 AI 也必须能跑通的规则

如涉及剧情文本、系统提示词、角色对白或场景生成，还必须读取：

- `C:\02-project\docs\character-dialogue-system-patch.md`

## 2. 再读取游戏硬规则

优先读取这些 Word 文档：

- `C:\02-project\game word\系统硬规则总稿.docx`
- `C:\02-project\game word\宫斗事务硬规则.docx`
- `C:\02-project\game word\侍寝与怀孕硬规则.docx`
- `C:\02-project\game word\皇帝行为与心情硬规则.docx`
- `C:\02-project\game word\晋升降位冷宫与协理六宫硬规则.docx`
- `C:\02-project\game word\经济与案件银两干预硬规则.docx`
- `C:\02-project\game word\皇嗣管理与生育后续硬规则.docx`
- `C:\02-project\game word\角色剧情节点与关系AI接口.docx`
- `C:\02-project\game word\自定义剧情妃与AI接口规则.docx`

如需纯文本版本，再读：

- `C:\02-project\docs\system-hard-rules-integrated.md`
- `C:\02-project\docs\palace-strife-architecture.md`
- `C:\02-project\docs\nightly-pregnancy-architecture.md`
- `C:\02-project\docs\emperor-behavior-architecture.md`
- `C:\02-project\docs\rank-governance-architecture.md`
- `C:\02-project\docs\economy-governance-architecture.md`
- `C:\02-project\docs\imperial-heir-architecture.md`
- `C:\02-project\docs\character-story-nodes-and-relationship-ai.md`
- `C:\02-project\docs\character-dialogue-system-patch.md`

## 3. 当前前端开发必须遵守

- 游戏必须在不依赖 AI 的情况下完整跑通。
- AI 只负责：
  - 文本补全
  - 对话意图分类
- 数值、判定、流程推进全部走本地硬规则。
- 现有前端流程不得打断：
  - `StartScene`
  - `RouteSelectionView`
  - `AttributeAssignmentView`
  - `OpeningDialogueView`
  - `MapMainView`
  - `ChamberMainView`

## 4. 当前核心代码入口

- `C:\02-project\src\App.tsx`
- `C:\02-project\src\game\store\gameFlowStore.ts`
- `C:\02-project\src\game\data\routeProfiles.ts`
- `C:\02-project\src\config\palaceUi.ts`
- `C:\02-project\src\views\StartScene.tsx`
- `C:\02-project\src\views\RouteSelectionView.tsx`
- `C:\02-project\src\views\AttributeAssignmentView.tsx`
- `C:\02-project\src\views\OpeningDialogueView.tsx`
- `C:\02-project\src\views\MapMainView.tsx`
- `C:\02-project\src\views\ChamberMainView.tsx`
- `C:\02-project\src\index.css`

## 5. 每次前端改动后的最小验证

```powershell
npm run build:web
npx vitest run src/__tests__/app-flow.test.tsx
```

## 6. 建议新对话的第一句

```text
先读取 C:\02-project\docs\new-chat-start.md、C:\02-project\.codex\skills\palace-game-frontend\SKILL.md、以及 game word 中的系统硬规则总稿与相关硬规则文档，然后继续当前 02-project 的前端与双 AI 接口开发。
```
