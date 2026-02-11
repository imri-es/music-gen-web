import React, { useState, useEffect, useRef } from 'react';
import { Layout } from 'antd';
import axios from 'axios';
import type { Song } from '../types';
import { ControlPanel } from '../components/ControlPanel';
import { SongTable } from '../components/SongTable';

const { Content } = Layout;

export const MainPage: React.FC = () => {
    const [data, setData] = useState<Song[]>([]);
    const [loading, setLoading] = useState(false);

    const getRandomSeedString = () => {
        if (window.crypto && window.crypto.getRandomValues) {
            const array = new BigUint64Array(1);
            window.crypto.getRandomValues(array);
            const maxInt64 = 9223372036854775807n;
            return (array[0] & maxInt64).toString();
        }

        const high = BigInt(Math.floor(Math.random() * 0x100000000));
        const low = BigInt(Math.floor(Math.random() * 0x100000000));
        const combined = (high << 32n) | low;
        const maxInt64 = 9223372036854775807n;
        return (combined & maxInt64).toString();
    };

    const [seed, setSeed] = useState<string>(() => getRandomSeedString());
    const [language, setLanguage] = useState<'en' | 'ru'>('en');
    const [likeFilter, setLikeFilter] = useState<number>(-1);
    const [viewMode, setViewMode] = useState<'table' | 'scroll'>(() => {
        return (localStorage.getItem('minTable.viewMode') as 'table' | 'scroll') || 'table';
    });

    useEffect(() => {
        localStorage.setItem('minTable.viewMode', viewMode);
        if (viewMode === 'scroll') {
            setPageSize(15);
        } else {
            setPageSize(10);
        }
    }, [viewMode]);

    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);

    const generateRandomSeed = () => {
        const newSeed = getRandomSeedString();
        setSeed(newSeed);
        setData([]);
    };


    const fetchData = async (reset: boolean = false, currentPage: number, currentSize: number) => {
        setLoading(true);
        try {
            const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
            const skip = (currentPage - 1) * currentSize;
            const likesParam = likeFilter > 0 ? likeFilter : -1;

            const response = await axios.get<Song[]>(`${apiUrl}/api/music/data`, {
                params: {
                    seed: seed,
                    skip: skip,
                    take: currentSize,
                    language: language,
                    likeFilter: likesParam
                }
            });

            const newSongs = response.data;

            if (viewMode === 'table') {
                setData(newSongs);
            } else {
                if (reset) {
                    setData(newSongs);
                } else {
                    setData(prev => {
                        const existingSeeds = new Set(prev.map(s => s.seed));
                        const uniqueNewSongs = newSongs.filter(s => !existingSeeds.has(s.seed));
                        return [...prev, ...uniqueNewSongs];
                    });
                }
            }

        } catch (error) {
            console.error('Failed to fetch data', error);
        } finally {
            setLoading(false);
        }
    };
    const didMountRef = useRef(false);

    useEffect(() => {
        if (page !== 1) {
            setPage(1);
        } else {
            setData([]);
            fetchData(true, 1, pageSize);
        }
    }, [seed, language, likeFilter, viewMode, pageSize]);


    useEffect(() => {
        if (!didMountRef.current) {
            didMountRef.current = true;
            return;
        }

        fetchData(false, page, pageSize);
    }, [page, pageSize]);


    return (
        <Layout style={{ background: '#ffffff' }}>
            <ControlPanel
                seed={seed}
                setSeed={setSeed}
                generateRandomSeed={generateRandomSeed}
                language={language}
                setLanguage={setLanguage}
                viewMode={viewMode}
                setViewMode={setViewMode}
                likeFilter={likeFilter}
                setLikeFilter={setLikeFilter}
            />

            <Content style={{ padding: '24px', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                <SongTable
                    data={data}
                    loading={loading}
                    page={page}
                    pageSize={pageSize}
                    language={language}
                    viewMode={viewMode}
                    setPage={setPage}
                    setPageSize={setPageSize}
                />
            </Content>
        </Layout>
    );
};
