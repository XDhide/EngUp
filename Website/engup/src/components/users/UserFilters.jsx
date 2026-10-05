import { FilterChips, SearchInput } from '../ui';
import { CEFR_LEVELS } from '../../constants';

const STATUS = [{ value: '', label: 'Tất cả' }, { value: 'active', label: 'Hoạt động' }, { value: 'inactive', label: 'Đã khóa' }];
const LEVELS = [{ value: '', label: 'Tất cả' }, ...CEFR_LEVELS.map((l) => ({ value: l, label: l }))];

export default function UserFilters({ search, status, level, onSearch, onStatus, onLevel }) {
  return (
    <div className="toolbar">
      <SearchInput placeholder="Tìm theo tên hoặc email..." value={search} onChange={(e) => onSearch(e.target.value)} />
      <FilterChips label="Trạng thái:" options={STATUS} value={status} onChange={onStatus} />
      <FilterChips label="Trình độ:" options={LEVELS} value={level} onChange={onLevel} />
    </div>
  );
}
