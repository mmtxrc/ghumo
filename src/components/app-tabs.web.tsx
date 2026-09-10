import { Tabs, TabList, TabTrigger, TabSlot } from 'expo-router/ui';

export default function AppTabs() {
  return (
    <Tabs>
      <TabSlot style={{ height: '100%' }} />
      <TabList style={{ display: 'none' }}>
        <TabTrigger name="index" href="/" />
        <TabTrigger name="explore" href="/explore" />
      </TabList>
    </Tabs>
  );
}
