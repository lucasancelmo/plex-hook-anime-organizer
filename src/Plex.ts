export interface Plex{
    event: Media | Library;
    metadata: Metadata;
}

export interface Metadata{
    title: string;
    grandparentTitle: string;
    index: number;
}

export enum Media{
    START = 'media.start', //"media.play"
    STOP = 'media.stop',
}

export enum Library{
    NEW = 'library.new',
}