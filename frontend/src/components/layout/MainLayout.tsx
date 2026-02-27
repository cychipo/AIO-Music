import { Outlet } from 'react-router-dom';
import { Layout } from 'antd';
import Sidebar from './Sidebar';
import PlayerBar from '../player/PlayerBar';

const { Sider, Content } = Layout;

export default function MainLayout() {
  return (
    <Layout className="min-h-screen" style={{ background: '#faf2e8' }}>
      <Sider
        width={240}
        style={{ background: '#fde3c8', borderRight: '1px solid #f0d4be' }}
        breakpoint="lg"
        collapsedWidth="0"
      >
        <Sidebar />
      </Sider>
      <Layout style={{ background: '#faf2e8' }}>
        <Content className="pb-28 overflow-y-auto" style={{ padding: '24px' }}>
          <Outlet />
        </Content>
      </Layout>
      {/* Sticky Player at bottom */}
      <PlayerBar />
    </Layout>
  );
}
