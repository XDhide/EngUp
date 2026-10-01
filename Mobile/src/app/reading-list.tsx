import React from 'react';
import { PanelScreen } from '../components/practice/PanelScreen';
import { ReadingPanel } from '../components/practice/ReadingPanel';

export default function ReadingListScreen() {
  return <PanelScreen title="Bài đọc hiểu">{(p) => <ReadingPanel {...p} />}</PanelScreen>;
}
