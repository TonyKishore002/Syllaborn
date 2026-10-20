import confetti from 'canvas-confetti';

export function triggerQuestCelebration(): void {
  try {
    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.8 },
      colors: ['#a855f7', '#06b6d4', '#ec4899', '#fef08a'],
    });
  } catch (err) {
    // Graceful fallback if canvas is not supported
  }
}

export function triggerLevelUpCelebration(): void {
  try {
    // Grand celebration with multiple bursts
    const end = Date.now() + 1200;
    const colors = ['#8b5cf6', '#06b6d4', '#fbbf24', '#f43f5e'];

    (function frame() {
      confetti({
        particleCount: 4,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors,
      });
      confetti({
        particleCount: 4,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors,
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    })();
  } catch (err) {
    // Fallback
  }
}
