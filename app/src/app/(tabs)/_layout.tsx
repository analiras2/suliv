import { Tabs, TabList, TabSlot, TabTrigger } from 'expo-router/ui';

import { TabBarButton, TabBarContainer } from '@/components/organisms/tab-bar';

export default function TabsLayout() {
  return (
    <Tabs>
      <TabSlot />
      <TabList asChild>
        <TabBarContainer>
          <TabTrigger name="index" href="/" asChild>
            <TabBarButton icon="home" label="Início" />
          </TabTrigger>
          <TabTrigger name="search" href="/search" asChild>
            <TabBarButton icon="search" label="Buscar" />
          </TabTrigger>
          <TabTrigger name="plan" href="/plan" asChild>
            <TabBarButton icon="calendar" label="Semana" />
          </TabTrigger>
          <TabTrigger name="saved" href="/saved" asChild>
            <TabBarButton icon="bookmark" label="Salvos" />
          </TabTrigger>
          <TabTrigger name="profile" href="/profile" asChild>
            <TabBarButton icon="user" label="Você" />
          </TabTrigger>
        </TabBarContainer>
      </TabList>
    </Tabs>
  );
}
