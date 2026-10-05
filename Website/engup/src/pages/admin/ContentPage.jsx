import { useState } from 'react';
import { PageHeader } from '../../components/layout';
import { Tabs } from '../../components/ui';
import VocabularyTab from '../../components/content/VocabularyTab';
import ReadingTab from '../../components/content/ReadingTab';
import ListeningTab from '../../components/content/ListeningTab';
import { useFetch } from '../../hooks/useFetch';
import { listeningService, readingService, vocabularyService } from '../../services';

export default function ContentPage() {
  const [tab, setTab] = useState('vocabulary');

  // Số đếm trên tab; lỗi từng nguồn không làm hỏng cả trang.
  const { data: counts, reload } = useFetch(async () => {
    const [v, r, l] = await Promise.allSettled([
      vocabularyService.list({ limit: 1 }), readingService.list(), listeningService.list(),
    ]);
    return {
      vocabulary: v.status === 'fulfilled' ? v.value.total : undefined,
      reading: r.status === 'fulfilled' ? r.value.articles?.length : undefined,
      listening: l.status === 'fulfilled' ? l.value.lessons?.length : undefined,
    };
  }, []);

  const tabs = [
    { key: 'vocabulary', label: 'Từ vựng', count: counts?.vocabulary },
    { key: 'reading', label: 'Bài đọc', count: counts?.reading },
    { key: 'listening', label: 'Bài nghe', count: counts?.listening },
  ];

  return (
    <>
      <PageHeader eyebrow="Quản lý học vụ / Kho học liệu" title="Học liệu" description="Cơ sở dữ liệu từ vựng, bài đọc và bài nghe chuẩn hóa" />
      <Tabs items={tabs} value={tab} onChange={setTab} />
      {tab === 'vocabulary' && <VocabularyTab onChanged={reload} />}
      {tab === 'reading' && <ReadingTab onChanged={reload} />}
      {tab === 'listening' && <ListeningTab onChanged={reload} />}
    </>
  );
}
