
export interface Course {
  id: number;
  title: string;
  image: string;
}

export interface Subject {
  id: number;
  name: string;
  videos?: number;
}

export interface Lesson {
  id: number;
  name: string;
  video_url: string;
  hd_video_url: string;
  pdfs: { url: string };
}

export interface ViewState {
  type: 'courses' | 'subjects' | 'lessons' | 'saved';
  id?: number;
  title?: string;
  data?: any;
}
