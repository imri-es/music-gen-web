import React, { useEffect, useState } from 'react';
import { Space, Input, Button, Radio, Slider, Typography, Layout } from 'antd';
import { SyncOutlined, TableOutlined, BarsOutlined } from '@ant-design/icons';

const { Header } = Layout;
const { Text } = Typography;

interface ControlPanelProps {
    seed: string;
    setSeed: (val: string) => void;
    generateRandomSeed: () => void;
    language: 'en' | 'ru';
    setLanguage: (val: 'en' | 'ru') => void;
    viewMode: 'table' | 'scroll';
    setViewMode: (val: 'table' | 'scroll') => void;
    likeFilter: number;
    setLikeFilter: (val: number) => void;
}

export const ControlPanel: React.FC<ControlPanelProps> = ({
    seed,
    setSeed,
    generateRandomSeed,
    language,
    setLanguage,
    viewMode,
    setViewMode,
    likeFilter,
    setLikeFilter
}) => {
    const [internalLike, setInternalLike] = useState(likeFilter);

    useEffect(() => {
        setInternalLike(likeFilter);
    }, [likeFilter]);

    useEffect(() => {
        if (internalLike === likeFilter) return;

        const timer = setTimeout(() => {
            setLikeFilter(internalLike);
        }, 500);

        return () => clearTimeout(timer);
    }, [internalLike, likeFilter, setLikeFilter]);

    return (
        <Header style={{
            background: '#fff',
            borderBottom: '1px solid #f0f0f0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 24px',
            height: 'auto',
            minHeight: '64px',
            flexWrap: 'wrap',
            gap: '16px'
        }}>
            <Space wrap size="middle">
                <Space>
                    <Text strong>{language === 'en' ? 'Seed:' : 'Сид:'}</Text>
                    <Input
                        value={seed}
                        onChange={(e) => setSeed(e.target.value)}
                        style={{ width: 220 }}
                        suffix={
                            <Button
                                type="text"
                                icon={<SyncOutlined />}
                                onClick={generateRandomSeed}
                                size="small"
                                style={{ color: '#1890ff' }}
                            />
                        }
                    />
                </Space>

                <Radio.Group value={language} onChange={(e) => setLanguage(e.target.value)} buttonStyle="solid">
                    <Radio.Button value="en">English</Radio.Button>
                    <Radio.Button value="ru">Русский</Radio.Button>
                </Radio.Group>

                <div style={{ width: 200, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Text>{language === 'en' ? 'Likes:' : 'Лайки:'}</Text>
                    <Slider
                        min={0}
                        max={10}
                        step={0.1}
                        value={internalLike === -1 ? 0 : internalLike}
                        onChange={(val) => setInternalLike(val)}
                        style={{ flex: 1 }}
                        tooltip={{ formatter: (val) => val === 0 ? (language === 'en' ? 'All' : 'Все') : val }}
                    />
                    <Text style={{ minWidth: 25 }}>{internalLike > 0 ? internalLike : (language === 'en' ? 'All' : 'Все')}</Text>
                </div>
                {likeFilter > 0 && <Button size="small" onClick={() => setLikeFilter(-1)}>{language === 'en' ? 'Clear' : 'Сброс'}</Button>}
            </Space>


            <Radio.Group value={viewMode} onChange={e => setViewMode(e.target.value)}>
                <Radio.Button value="table">
                    <TableOutlined />
                </Radio.Button>
                <Radio.Button value="scroll">
                    <BarsOutlined />
                </Radio.Button>
            </Radio.Group>
        </Header>
    );
};
