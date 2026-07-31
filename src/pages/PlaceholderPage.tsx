import { Empty } from 'antd';

interface PlaceholderPageProps {
  title: string;
}

export default function PlaceholderPage({ title }: PlaceholderPageProps) {
  return (
    <div
      style={{
        background: '#fff',
        borderRadius: 4,
        padding: 48,
        minHeight: 400,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Empty description={`${title} — 内容待后续补充`} />
    </div>
  );
}
