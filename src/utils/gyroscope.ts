/**
 * Shared Mobile Gyroscope / DeviceOrientation tracker.
 * Provides smoothed, normalized tilt values:
 * - tiltX: [-1, 1] left (<0) to right (>0) tilt
 * - tiltY: [-1, 1] top (<0) to bottom (>0) tilt (relative to standard ~48° reading posture)
 */
class GyroscopeManager {
  private targetX = 0;
  private targetY = 0;
  public currentX = 0;
  public currentY = 0;
  private isListening = false;
  private hasPermission = false;

  constructor() {
    this.init();
  }

  private handleOrientation = (e: DeviceOrientationEvent) => {
    if (e.gamma === null || e.beta === null) return;

    // gamma: left-to-right tilt in degrees [-90, 90]
    // beta: front-to-back tilt in degrees [-180, 180]
    // Normal mobile reading angle is held at roughly 45°-50° elevation
    const gamma = e.gamma;
    const beta = e.beta;

    // Map -30° to +30° deviation to -1.0 to +1.0
    const normX = gamma / 30;
    const normY = (beta - 48) / 30;

    this.targetX = Math.max(-1, Math.min(1, normX));
    this.targetY = Math.max(-1, Math.min(1, normY));
  };

  private requestPermissionOnGesture = () => {
    if (
      typeof DeviceOrientationEvent !== 'undefined' &&
      typeof (DeviceOrientationEvent as unknown as { requestPermission?: () => Promise<string> }).requestPermission === 'function'
    ) {
      (DeviceOrientationEvent as unknown as { requestPermission: () => Promise<string> })
        .requestPermission()
        .then((state: string) => {
          if (state === 'granted') {
            this.hasPermission = true;
            this.startListening();
          }
        })
        .catch(() => {});
    }
  };

  public init() {
    if (typeof window === 'undefined') return;

    // Check if permission API exists (iOS 13+)
    if (
      typeof DeviceOrientationEvent !== 'undefined' &&
      typeof (DeviceOrientationEvent as unknown as { requestPermission?: () => Promise<string> }).requestPermission === 'function'
    ) {
      window.addEventListener('touchstart', this.requestPermissionOnGesture, { once: true, passive: true });
      window.addEventListener('click', this.requestPermissionOnGesture, { once: true, passive: true });
    } else {
      // Standard Android / Chrome / non-permission browsers
      this.startListening();
    }
  }

  private startListening() {
    if (this.isListening || typeof window === 'undefined') return;
    window.addEventListener('deviceorientation', this.handleOrientation, { passive: true });
    this.isListening = true;
  }

  /**
   * Update and return smoothed tilt values. Call once per frame inside requestAnimationFrame.
   */
  public update(lerpFactor = 0.08): { x: number; y: number } {
    this.currentX += (this.targetX - this.currentX) * lerpFactor;
    this.currentY += (this.targetY - this.currentY) * lerpFactor;
    return { x: this.currentX, y: this.currentY };
  }
}

export const gyro = new GyroscopeManager();
