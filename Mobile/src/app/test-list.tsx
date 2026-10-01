import React from 'react';
import { PanelScreen } from '../components/practice/PanelScreen';
import { TestPanel } from '../components/practice/TestPanel';

export default function TestListScreen() {
  return <PanelScreen title="Luyện đề">{(p) => <TestPanel {...p} />}</PanelScreen>;
}
