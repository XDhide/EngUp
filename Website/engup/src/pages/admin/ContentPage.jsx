import { useState } from 'react';
import { PageHeader } from '../../components/layout';
import { Tabs } from '../../components/ui';
import VocabularyTab from '../../components/content/VocabularyTab';
import TopicsTab from '../../components/content/TopicsTab';
import ReadingTab from '../../components/content/ReadingTab';
import ListeningTab from '../../components/content/ListeningTab';
import WritingTab from '../../components/content/WritingTab';
import ResultsTab from '../../components/content/ResultsTab';
import { useFetch } from '../../hooks/useFetch';
import { listeningService, readingService, vocabularyService, writingService } from '../../services';

export default function ContentPage() {
  const [tab, setTab] = useState('vocabulary');

  // Số đếm trên tab; lỗi từng nguồn không làm hỏng cả trang.
  const { data: counts, reload } = useFetch(async () => {
    const [v, r, l, w] = await Promise.allSettled([
      vocabularyService.list({ limit: 1 }), readingService.list(), listeningService.list(), writingService.list(),
    ]);
    return {
      vocabulary: v.status === 'fulfilled' ? v.value.total : undefined,
      reading: r.status === 'fulfilled' ? r.value.articles?.length : undefined,
      listening: l.status === 'fulfilled' ? l.value.lessons?.length : undefined,
      writing: w.status === 'fulfilled' ? w.value.prompts?.length : undefined,
    };
  }, []);

  const tabs = [
    { key: 'vocabulary', label: 'Từ vựng', count: counts?.vocabulary },
    { key: 'topics', label: 'Chủ đề' },
    { key: 'reading', label: 'Bài đọc', count: counts?.reading },
    { key: 'listening', label: 'Bài nghe', count: counts?.listening },
    { key: 'writing', label: 'Bài viết', count: counts?.writing },
    { key: 'results', label: 'Kết quả học viên' },
  ];

  return (
    <>
      <PageHeader eyebrow="Quản lý học vụ / Kho học liệu" title="Học liệu" description="Từ vựng, bài đọc, bài nghe, đề bài viết và kết quả làm bài của học viên" />
      <Tabs items={tabs} value={tab} onChange={setTab} />
      {tab === 'vocabulary' && <VocabularyTab onChanged={reload} />}
      {tab === 'topics' && <TopicsTab onChanged={reload} />}
      {tab === 'reading' && <ReadingTab onChanged={reload} />}
      {tab === 'listening' && <ListeningTab onChanged={reload} />}
      {tab === 'writing' && <WritingTab onChanged={reload} />}
      {tab === 'results' && <ResultsTab />}
    </>
  );
}
