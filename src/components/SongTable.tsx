import React, { useEffect, useRef } from 'react';
import { Table } from 'antd';
import { MusicInfo } from './MusicInfo';
import type { ColumnsType } from 'antd/es/table';
import type { Song } from '../types';

interface SongTableProps {
    data: Song[];
    loading: boolean;
    page: number;
    pageSize: number;
    language: 'en' | 'ru';
    viewMode: 'table' | 'scroll';
    setPage: (page: React.SetStateAction<number>) => void;
    setPageSize: (size: number) => void;
}

export const SongTable: React.FC<SongTableProps> = ({
    data,
    loading,
    page,
    pageSize,
    language,
    viewMode,
    setPage,
    setPageSize
}) => {
    const tableRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (viewMode !== 'scroll') return;

        const tableBody = tableRef.current?.querySelector('.ant-table-body');
        if (!tableBody) return;

        const handleScroll = () => {
            const { scrollTop, scrollHeight, clientHeight } = tableBody;
            if (scrollHeight - scrollTop <= clientHeight + 50 && !loading) {
                setPage(prev => prev + 1);
            }
        };

        tableBody.addEventListener('scroll', handleScroll);
        return () => tableBody.removeEventListener('scroll', handleScroll);
    }, [viewMode, loading, setPage]);


    const columns: ColumnsType<Song> = [
        {
            title: '#',
            key: 'index',
            width: 60,
            render: (_text, _record, index) => {
                if (viewMode === 'scroll') return index + 1;
                return (page - 1) * pageSize + index + 1;
            },
        },
        {
            title: language === 'en' ? 'Song Name' : 'Название',
            dataIndex: 'musicName',
            key: 'musicName',
            ellipsis: true,
        },
        {
            title: language === 'en' ? 'Artist' : 'Артист',
            dataIndex: 'artistName',
            key: 'artistName',
            ellipsis: true,
        },
        {
            title: language === 'en' ? 'Album' : 'Альбом',
            dataIndex: 'albumTitle',
            key: 'albumTitle',
            ellipsis: true,
        },
        {
            title: language === 'en' ? 'Genre' : 'Жанр',
            dataIndex: 'genre',
            key: 'genre',
            ellipsis: true,
        },
        {
            title: language === 'en' ? 'Likes' : 'Лайки',
            dataIndex: 'likes',
            key: 'likes',
            render: (likes) => likes.toFixed(1),
            width: 100,
        }
    ];

    return (
        <div ref={tableRef} style={{ maxHeight: '75vh', height: '100%', display: 'flex', flexDirection: 'column' }}>
            <Table
                columns={columns}
                dataSource={data}
                size="middle"
                rowKey={(record) => record.artistName + record.musicName}
                pagination={viewMode === 'table' ? {
                    current: page,
                    pageSize: pageSize,
                    total: 10000,
                    onChange: (p, ps) => {
                        setPage(p);
                        if (ps !== pageSize) setPageSize(ps);
                    },
                    showSizeChanger: true
                } : false}
                loading={loading}
                expandable={{
                    expandedRowRender: (record) => <MusicInfo song={record} />,
                    expandRowByClick: true,
                }}
                scroll={{ y: 'calc(100vh - 200px)' }}
            />
            {loading && viewMode === 'scroll' && data.length > 0 && (
                <div style={{ textAlign: 'center', padding: 8, fontSize: 12, color: '#999' }}>
                    Loading more...
                </div>
            )}
        </div>
    );
};
