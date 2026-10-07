import React from 'react';
import { PanelScreen } from '../components/practice/PanelScreen';
import { ListeningPanel } from '../components/practice/ListeningPanel';

export default function ListeningListScreen() {
  return <PanelScreen title="Danh sách bài nghe">{(p) => <ListeningPanel {...p} />}</PanelScreen>;
}
