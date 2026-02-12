import React, { useState, useEffect, useRef } from 'react';
import { Typography, Space, Spin, Alert, Slider, Button } from 'antd';
import { HeartFilled, PlayCircleFilled, PauseCircleFilled, WarningOutlined, DownloadOutlined } from '@ant-design/icons';
import axios from 'axios';
import type { Song, SongResult } from '../types';
import defaultCoverArt from '../assets/default-cover-art.png';

const { Title, Text } = Typography;

interface MusicInfoProps {
    song: Song;
    language: 'en' | 'ru';
}

export const MusicInfo: React.FC<MusicInfoProps> = ({ song, language }) => {
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<SongResult | null>(null);
    const [genError, setGenError] = useState<string | null>(null);

    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [audioError, setAudioError] = useState<string | null>(null);
    const [currentAudioSrc, setCurrentAudioSrc] = useState<string | null>(null);
    const [isDownloading, setIsDownloading] = useState(false);

    const audioRef = useRef<HTMLAudioElement>(null);
    const calledRef = useRef(false);
    const displayImage = result ? `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}${result.imagePath}` : defaultCoverArt;

    useEffect(() => {
        if (calledRef.current) return;
        calledRef.current = true;

        const generateMusic = async () => {
            setLoading(true);
            setGenError(null);
            try {
                const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
                const response = await axios.post<SongResult>(`${apiUrl}/api/song/generate?seed=${song.seed}&language=${language}`);
                setResult(response.data);
                if (response.data.finalMixPath) {
                    setCurrentAudioSrc(`${apiUrl}${response.data.finalMixPath}`);
                }
            } catch (err) {
                console.error(err);
                setGenError('Failed to generate song.');
            } finally {
                setLoading(false);
            }
        };

        generateMusic();
    }, [song.seed]);

    const togglePlay = () => {
        if (!audioRef.current) return;
        if (isPlaying) {
            audioRef.current.pause();
        } else {
            audioRef.current.play();
        }
        setIsPlaying(!isPlaying);
    };

    const handleTimeUpdate = () => {
        if (audioRef.current) {
            setCurrentTime(audioRef.current.currentTime);
        }
    };

    const handleLoadedMetadata = () => {
        if (audioRef.current) {
            setDuration(audioRef.current.duration);
            audioRef.current.play().then(() => setIsPlaying(true)).catch(e => console.warn("Auto-play prevented", e));
        }
    };

    const handleAudioError = () => {
        if (!result) return;
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
        const finalMixUrl = `${apiUrl}${result.finalMixPath}`;

        if (currentAudioSrc === finalMixUrl) {
            setAudioError("Gemini quota is exhausted, the song with no lyrics is playing");
            const instrumentalUrl = `${apiUrl}${result.instrumentalPath}`;
            setCurrentAudioSrc(instrumentalUrl);
            setIsPlaying(false);
            if (audioRef.current) {
                audioRef.current.load();
            }
        } else {
            setAudioError("Failed to load audio source.");
        }
    };

    const formatTime = (time?: number) => {
        if (time === undefined) return '0:00';
        const minutes = Math.floor(time / 60);
        const seconds = Math.floor(time % 60);
        return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
    };

    const handleDownload = async () => {
        if (!currentAudioSrc) return;
        setIsDownloading(true);
        try {
            const response = await axios.get(currentAudioSrc, { responseType: 'blob' });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `${song.artistName} - ${song.musicName}.wav`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Error downloading the file', error);
        } finally {
            setIsDownloading(false);
        }
    };

    return (
        <div className="music-info-container">
            <div className="music-info-image-wrapper">
                <img src={displayImage} alt={song.musicName} className="music-info-image" />
            </div>

            <div className="music-info-details">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                        <Title level={3} style={{ margin: 0 }}>{song.musicName}</Title>
                        <Text type="secondary" style={{ fontSize: '1.2em' }}>{language === 'en' ? 'by' : 'исполнитель'} {song.artistName}</Text>
                        <br />
                        <Text type="secondary">{language === 'en' ? 'from' : 'альбом'} {song.albumTitle} • {song.genre}</Text>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                        <Space>
                            <HeartFilled style={{ color: '#ff4d4f', fontSize: '1.2em' }} />
                            <Text strong style={{ fontSize: '1.2em' }}>{song.likes}</Text>
                        </Space>
                    </div>
                </div>

                <div style={{ marginTop: 24 }}>
                    {loading && (
                        <div style={{ textAlign: 'center', padding: '20px' }}>
                            <Spin tip={language === 'en' ? "Generating Music & Image..." : "Генерация музыки и изображения..."} size="large" />
                        </div>
                    )}

                    {genError && <Alert message={genError} type="error" showIcon style={{ marginBottom: 16 }} />}

                    {audioError && <Alert message={audioError} type="warning" showIcon icon={<WarningOutlined />} style={{ marginBottom: 16 }} />}

                    {!loading && result && currentAudioSrc && (
                        <div className="music-player-wrapper fade-in" style={{ background: '#f0f2f5', padding: '16px', borderRadius: '12px' }}>
                            <audio
                                ref={audioRef}
                                src={currentAudioSrc}
                                onTimeUpdate={handleTimeUpdate}
                                onLoadedMetadata={handleLoadedMetadata}
                                onError={handleAudioError}
                                onEnded={() => setIsPlaying(false)}
                            />

                            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                <Button
                                    type="primary"
                                    shape="circle"
                                    icon={isPlaying ? <PauseCircleFilled /> : <PlayCircleFilled />}
                                    size="large"
                                    onClick={togglePlay}
                                    style={{ flexShrink: 0, width: 50, height: 50, fontSize: 23, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                />

                                <div style={{ flex: 1 }}>
                                    <Slider
                                        value={currentTime}
                                        max={duration}
                                        onChange={(val) => {
                                            if (audioRef.current) audioRef.current.currentTime = val;
                                            setCurrentTime(val);
                                        }}
                                        tooltip={{ formatter: formatTime }}
                                    />
                                </div>

                                <Text type="secondary" style={{ width: 80, textAlign: 'right' }}>
                                    {formatTime(currentTime)} / {formatTime(duration)}
                                </Text>

                                <Button
                                    type="text"
                                    icon={<DownloadOutlined />}
                                    loading={isDownloading}
                                    onClick={handleDownload}
                                    title={language === 'en' ? "Download" : "Скачать"}
                                />
                            </div>
                        </div>
                    )}
                </div>

                <div style={{ marginTop: 24, padding: 16, background: '#f5f5f5', borderRadius: 8, height: 200, overflow: 'hidden', position: 'relative' }} className="lyrics-section">
                    {!result?.lyrics || result.lyrics.length === 0 ? (
                        <Text type="secondary">{language === 'en' ? 'Lyrics will appear here...' : 'Здесь появится текст песни...'}</Text>
                    ) : (
                        <div
                            style={{
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                transition: 'transform 0.5s ease-out'
                            }}
                            ref={(el) => {
                                if (el && result.lyrics) {
                                    let activeIndex = 0;
                                    for (let i = 0; i < result.lyrics.length; i++) {
                                        if (currentTime >= result.lyrics[i].time) {
                                            activeIndex = i;
                                        }
                                    }
                                    const lineHeight = 32;
                                    const containerHeight = 200;
                                    const centerOffset = containerHeight / 2 - lineHeight / 2;

                                    const translateY = centerOffset - (activeIndex * lineHeight);
                                    el.style.transform = `translateY(${translateY}px)`;
                                }
                            }}
                        >
                            {result.lyrics.map((line, index) => {
                                const isActive =
                                    currentTime >= line.time &&
                                    (!result.lyrics![index + 1] || currentTime < result.lyrics![index + 1].time);

                                return (
                                    <div
                                        key={index}
                                        style={{
                                            height: 32,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            transition: 'all 0.3s ease',
                                            transform: isActive ? 'scale(1.1)' : 'scale(1)',
                                            fontWeight: isActive ? 'bold' : 'normal',
                                            opacity: isActive ? 1 : 0.6,
                                            color: isActive ? '#000' : '#666'
                                        }}
                                    >
                                        {line.text}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
