
import { Component, ChangeDetectionStrategy, signal, effect, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from './services/api.service';
import { Course, Subject, Lesson, ViewState } from './types';
import { SkeletonLoaderComponent } from './components/skeleton-loader.component';
import { VideoPlayerComponent } from './components/video-player.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, SkeletonLoaderComponent, VideoPlayerComponent],
  templateUrl: './app.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppComponent {
  private apiService = inject(ApiService);
  
  // State Signals
  courses = signal<Course[]>([]);
  subjects = signal<Subject[]>([]);
  lessons = signal<Lesson[]>([]);
  savedCourseIds = signal<Set<number>>(new Set());
  currentLesson = signal<Lesson | null>(null);
  
  navigationStack = signal<ViewState[]>([{ type: 'courses' }]);
  currentView = computed<ViewState>(() => this.navigationStack().slice(-1)[0]);
  
  isLoading = signal<boolean>(true);
  searchTerm = signal<string>('');
  toastMessage = signal<string | null>(null);
  hasError = signal<boolean>(false);

  // Computed Signals
  pageTitle = computed(() => {
    const view = this.currentView();
    if (view.type === 'saved') return 'Saved Courses';
    return view.title || 'All Courses';
  });

  showBackButton = computed(() => this.navigationStack().length > 1);

  filteredCourses = computed(() => {
    const term = this.searchTerm().toLowerCase();
    if (!term) return this.courses();
    return this.courses().filter(c => c.title.toLowerCase().includes(term));
  });

  savedCourses = computed(() => {
    const savedIds = this.savedCourseIds();
    return this.courses().filter(c => savedIds.has(c.id));
  });

  constructor() {
    this.loadInitialData();
    // Effect to clear search when view changes from 'courses'
    effect((onCleanup) => {
        const viewType = this.currentView().type;
        if (viewType !== 'courses') {
            this.searchTerm.set('');
        }
    });
  }

  private loadInitialData() {
    this.isLoading.set(true);
    this.hasError.set(false);
    this.savedCourseIds.set(new Set(JSON.parse(localStorage.getItem('savedCourses') || '[]')));
    this.apiService.getCourses().subscribe(data => {
      if (data) {
        this.courses.set(data.courses || []);
      } else {
        this.courses.set([]);
        this.hasError.set(true);
      }
      this.isLoading.set(false);
    });
  }

  // --- Navigation Methods ---

  selectCourse(course: Course) {
    this.isLoading.set(true);
    this.hasError.set(false);
    this.apiService.getSubjects(course.id).subscribe(data => {
      if (data) {
        this.subjects.set(data || []);
      } else {
        this.subjects.set([]);
        this.hasError.set(true);
      }
      this.navigationStack.update(stack => [...stack, { type: 'subjects', id: course.id, title: course.title }]);
      this.isLoading.set(false);
    });
  }

  selectSubject(subject: Subject) {
    this.isLoading.set(true);
    this.hasError.set(false);
    this.apiService.getLessons(subject.id).subscribe(data => {
      if (data) {
        this.lessons.set(data || []);
        this.currentLesson.set(data?.[0] || null);
      } else {
        this.lessons.set([]);
        this.currentLesson.set(null);
        this.hasError.set(true);
      }
      this.navigationStack.update(stack => [...stack, { type: 'lessons', id: subject.id, title: subject.name }]);
      this.isLoading.set(false);
    });
  }
  
  selectLesson(lesson: Lesson) {
    this.currentLesson.set(lesson);
  }

  goBack() {
    if (this.navigationStack().length > 1) {
      this.hasError.set(false);
      this.navigationStack.update(stack => stack.slice(0, -1));
    }
  }

  goHome() {
    this.hasError.set(false);
    this.navigationStack.set([{ type: 'courses' }]);
  }

  showSaved() {
    this.hasError.set(false);
    this.navigationStack.set([{ type: 'courses' }, { type: 'saved' }]);
  }

  // --- UI Methods ---

  handleSearch(event: Event) {
    const input = event.target as HTMLInputElement;
    this.searchTerm.set(input.value);
  }

  toggleSave(courseId: number, event: MouseEvent) {
    event.stopPropagation();
    this.savedCourseIds.update(savedIds => {
      const newIds = new Set(savedIds);
      if (newIds.has(courseId)) {
        newIds.delete(courseId);
        this.showToast('Removed from Saved');
      } else {
        newIds.add(courseId);
        this.showToast('Added to Saved');
      }
      localStorage.setItem('savedCourses', JSON.stringify(Array.from(newIds)));
      return newIds;
    });
  }

  showToast(message: string) {
    this.toastMessage.set(message);
    setTimeout(() => this.toastMessage.set(null), 3000);
  }
}
