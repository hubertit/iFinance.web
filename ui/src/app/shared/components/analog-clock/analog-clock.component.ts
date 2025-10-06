import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-analog-clock',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="analog-clock">
      <div class="clock-face">
        <div class="numbers">
          <span>12</span>
          <span>1</span>
          <span>2</span>
          <span>3</span>
          <span>4</span>
          <span>5</span>
          <span>6</span>
          <span>7</span>
          <span>8</span>
          <span>9</span>
          <span>10</span>
          <span>11</span>
        </div>
        <div class="hand hour-hand"></div>
        <div class="hand minute-hand"></div>
        <div class="hand second-hand"></div>
        <div class="center-dot"></div>
      </div>
      <div class="date">{{ currentTime | date:'EEEE, MMMM d, y' }}</div>
    </div>
  `,
  styleUrls: ['./analog-clock.component.scss']
})
export class AnalogClockComponent implements OnInit, OnDestroy {
  private clockInterval: any;
  currentTime = new Date();

  ngOnInit() {
    this.startClock();
  }

  ngOnDestroy() {
    if (this.clockInterval) {
      clearInterval(this.clockInterval);
    }
  }

  private startClock() {
    const updateClock = () => {
      const now = new Date();
      const seconds = now.getSeconds();
      const minutes = now.getMinutes();
      const hours = now.getHours() % 12;

      // Calculate rotation angles
      const secondDegrees = (seconds / 60) * 360;
      const minuteDegrees = ((minutes + seconds / 60) / 60) * 360;
      const hourDegrees = ((hours + minutes / 60) / 12) * 360;

      // Update hand rotations using CSS custom properties
      document.documentElement.style.setProperty('--second-rotation', `${secondDegrees}deg`);
      document.documentElement.style.setProperty('--minute-rotation', `${minuteDegrees}deg`);
      document.documentElement.style.setProperty('--hour-rotation', `${hourDegrees}deg`);

      // Update date
      this.currentTime = now;
    };

    // Update immediately
    updateClock();

    // Update every second
    this.clockInterval = setInterval(updateClock, 1000);
  }
}
