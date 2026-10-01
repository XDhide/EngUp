import React from 'react';
import { PanelScreen } from '../components/practice/PanelScreen';
import { WritingPanel } from '../components/practice/WritingPanel';

export default function WritingListScreen() {
  return <PanelScreen title="Luyện viết AI">{(p) => <WritingPanel {...p} />}</PanelScreen>;
}
