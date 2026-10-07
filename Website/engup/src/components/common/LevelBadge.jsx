import { Badge } from '../ui';

export default function LevelBadge({ level }) {
  return level ? <Badge tone="ok">{level}</Badge> : <span className="cell-sub">Chưa có</span>;
}
