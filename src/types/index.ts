export interface Song {
    seed: string;
    artistName: string;
    musicName: string;
    albumTitle: string;
    genre: string;
    likes: number;
}

export interface SongResult {
    seed: string;
    genre: string;
    midiPath: string;
    instrumentalPath: string;
    vocalPath: string;
    finalMixPath: string;
    imagePath: string;
    imageUrl: string;
}
