import { Injectable, NgZone } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from './auth.service';
import { fromEvent, merge, Subject, Subscription, timer } from 'rxjs';
import { takeUntil, debounceTime } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class InactivityService {
  private readonly TIMEOUT = 3600000; // 1 hour
  private timeoutId: any;
  private unsubscribe$ = new Subject<void>();
  private userActivity: Subscription | null = null;
  private previousUrl: string = '';

  constructor(
    private router: Router,
    private ngZone: NgZone,
    private authService: AuthService
  ) {}

  init() {
    this.setupActivityMonitoring();
    this.resetTimer();
  }

  private setupActivityMonitoring() {
    if (this.userActivity) {
      this.userActivity.unsubscribe();
    }

    // Combine all relevant events
    const activity$ = merge(
      fromEvent(document, 'mousemove'),
      fromEvent(document, 'click'),
      fromEvent(document, 'keydown'),
      fromEvent(document, 'scroll'),
      fromEvent(document, 'touchstart')
    ).pipe(
      debounceTime(300), // Prevent excessive updates
      takeUntil(this.unsubscribe$)
    );

    this.userActivity = activity$.subscribe(() => {
      this.resetTimer();
    });
  }

  private resetTimer() {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
    }

    this.ngZone.runOutsideAngular(() => {
      this.timeoutId = setTimeout(() => {
        this.ngZone.run(() => {
          this.lock();
        });
      }, this.TIMEOUT);
    });
  }

  private lock() {
    if (this.router.url !== '/login' && this.router.url !== '/lock') {
      this.previousUrl = this.router.url;
      this.router.navigate(['/lock']);
    }
  }

  unlock() {
    if (this.previousUrl) {
      this.router.navigate([this.previousUrl]);
      this.resetTimer();
    } else {
      this.router.navigate(['/dashboard']);
    }
  }

  getPreviousUrl(): string {
    return this.previousUrl || '/dashboard';
  }

  stop() {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
    }
    if (this.userActivity) {
      this.userActivity.unsubscribe();
    }
  }
}
