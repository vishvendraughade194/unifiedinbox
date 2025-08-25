// Flying Kabootar Animation Controller
class KabootarAnimation {
  constructor() {
    this.container = null;
    this.kabootars = [];
    this.isActive = false;
    this.currentTheme = 'default';
    this.messageQueue = [];
    this.init();
  }

  init() {
    this.createContainer();
    this.createKabootars();
    this.setTimeBasedTheme();
    this.bindEvents();
    this.startAnimation();
    
    // Set up periodic theme changes
    setInterval(() => this.setTimeBasedTheme(), 60000); // Check every minute
  }

  createContainer() {
    this.container = document.createElement('div');
    this.container.className = 'kabootar-container';
    this.container.id = 'kabootar-container';
    document.body.appendChild(this.container);
  }

  createKabootars() {
    // Create 3 kabootars with different flight patterns
    for (let i = 0; i < 3; i++) {
      const kabootar = document.createElement('div');
      kabootar.className = 'kabootar';
      kabootar.dataset.id = i;
      
      // Add special effects based on position
      if (i === 0) {
        kabootar.classList.add('leader');
      } else if (i === 1) {
        kabootar.classList.add('follower');
      } else {
        kabootar.classList.add('explorer');
      }
      
      this.container.appendChild(kabootar);
      this.kabootars.push(kabootar);
    }
  }

  setTimeBasedTheme() {
    const hour = new Date().getHours();
    let theme = 'default';
    
    if (hour >= 5 && hour < 12) {
      theme = 'morning';
    } else if (hour >= 12 && hour < 17) {
      theme = 'afternoon';
    } else if (hour >= 17 && hour < 20) {
      theme = 'evening';
    } else {
      theme = 'night';
    }
    
    if (theme !== this.currentTheme) {
      this.container.className = `kabootar-container ${theme}`;
      this.currentTheme = theme;
      console.log(`🕊️ Kabootar theme changed to: ${theme}`);
    }
  }

  bindEvents() {
    // Pause animation on hover
    this.container.addEventListener('mouseenter', () => {
      this.pauseAnimation();
    });
    
    this.container.addEventListener('mouseleave', () => {
      this.resumeAnimation();
    });

    // Special effects on click
    this.container.addEventListener('click', (e) => {
      this.triggerSpecialEffect(e);
    });

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      if (e.ctrlKey && e.key === 'k') {
        e.preventDefault();
        this.toggleAnimation();
      }
    });
  }

  startAnimation() {
    this.isActive = true;
    this.container.style.display = 'block';
    console.log('🕊️ Kabootar animation started!');
  }

  stopAnimation() {
    this.isActive = false;
    this.container.style.display = 'none';
    console.log('🕊️ Kabootar animation stopped!');
  }

  toggleAnimation() {
    if (this.isActive) {
      this.stopAnimation();
    } else {
      this.startAnimation();
    }
  }

  pauseAnimation() {
    this.kabootars.forEach(kabootar => {
      kabootar.style.animationPlayState = 'paused';
    });
  }

  resumeAnimation() {
    this.kabootars.forEach(kabootar => {
      kabootar.style.animationPlayState = 'running';
    });
  }

  triggerSpecialEffect(event) {
    const rect = this.container.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    // Create a special kabootar at click position
    this.createSpecialKabootar(x, y);
  }

  createSpecialKabootar(x, y) {
    const specialKabootar = document.createElement('div');
    specialKabootar.className = 'kabootar special';
    specialKabootar.style.left = x + 'px';
    specialKabootar.style.top = y + 'px';
    specialKabootar.style.animation = 'none';
    specialKabootar.style.transform = 'scale(0)';
    
    this.container.appendChild(specialKabootar);
    
    // Animate in
    setTimeout(() => {
      specialKabootar.style.transition = 'all 0.5s ease-out';
      specialKabootar.style.transform = 'scale(1.5) rotate(360deg)';
    }, 10);
    
    // Animate out and remove
    setTimeout(() => {
      specialKabootar.style.transform = 'scale(0) rotate(-360deg)';
      setTimeout(() => {
        if (specialKabootar.parentNode) {
          specialKabootar.parentNode.removeChild(specialKabootar);
        }
      }, 500);
    }, 1000);
  }

  // Message delivery animation
  deliverMessage(message, platform) {
    const kabootar = this.kabootars[0]; // Use the leader kabootar
    kabootar.classList.add('delivering');
    
    // Create message bubble
    const messageBubble = document.createElement('div');
    messageBubble.className = 'message-bubble';
    messageBubble.textContent = message;
    messageBubble.style.cssText = `
      position: absolute;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 8px 12px;
      border-radius: 15px;
      font-size: 12px;
      max-width: 200px;
      word-wrap: break-word;
      box-shadow: 0 4px 15px rgba(0,0,0,0.2);
      z-index: 10000;
      pointer-events: none;
      opacity: 0;
      transform: scale(0.5);
      transition: all 0.3s ease-out;
    `;
    
    // Position near the kabootar
    const rect = kabootar.getBoundingClientRect();
    messageBubble.style.left = (rect.left + 30) + 'px';
    messageBubble.style.top = (rect.top - 20) + 'px';
    
    document.body.appendChild(messageBubble);
    
    // Animate in
    setTimeout(() => {
      messageBubble.style.opacity = '1';
      messageBubble.style.transform = 'scale(1)';
    }, 100);
    
    // Animate out and remove
    setTimeout(() => {
      messageBubble.style.opacity = '0';
      messageBubble.style.transform = 'scale(0.5)';
      setTimeout(() => {
        if (messageBubble.parentNode) {
          messageBubble.parentNode.removeChild(messageBubble);
        }
      }, 300);
    }, 3000);
    
    // Remove delivering class
    setTimeout(() => {
      kabootar.classList.remove('delivering');
    }, 8000);
  }

  // Celebration mode
  startCelebration() {
    this.container.classList.add('celebration');
    console.log('🎉 Kabootar celebration started!');
    
    setTimeout(() => {
      this.container.classList.remove('celebration');
    }, 10000);
  }

  // Loading mode
  setLoading(isLoading) {
    if (isLoading) {
      this.container.classList.add('loading');
    } else {
      this.container.classList.remove('loading');
    }
  }

  // Platform-specific animations
  animateForPlatform(platform) {
    const kabootar = this.kabootars[1]; // Use the follower kabootar
    
    switch (platform) {
      case 'telegram':
        kabootar.style.filter = 'hue-rotate(180deg) drop-shadow(0 4px 8px rgba(0, 0, 0, 0.3))';
        break;
      case 'gmail':
        kabootar.style.filter = 'hue-rotate(0deg) drop-shadow(0 4px 8px rgba(0, 0, 0, 0.3))';
        break;
      case 'whatsapp':
        kabootar.style.filter = 'hue-rotate(120deg) drop-shadow(0 4px 8px rgba(0, 0, 0, 0.3))';
        break;
      case 'instagram':
        kabootar.style.filter = 'hue-rotate(300deg) drop-shadow(0 4px 8px rgba(0, 0, 0, 0.3))';
        break;
      case 'twitter':
        kabootar.style.filter = 'hue-rotate(240deg) drop-shadow(0 4px 8px rgba(0, 0, 0, 0.3))';
        break;
    }
    
    // Reset after 3 seconds
    setTimeout(() => {
      kabootar.style.filter = 'drop-shadow(0 4px 8px rgba(0, 0, 0, 0.3))';
    }, 3000);
  }

  // Weather effects
  setWeatherEffect(weather) {
    this.container.className = `kabootar-container ${this.currentTheme} weather-${weather}`;
    
    // Add weather-specific animations
    switch (weather) {
      case 'rain':
        this.createRainEffect();
        break;
      case 'snow':
        this.createSnowEffect();
        break;
      case 'wind':
        this.createWindEffect();
        break;
    }
  }

  createRainEffect() {
    // Create raindrops
    for (let i = 0; i < 20; i++) {
      const raindrop = document.createElement('div');
      raindrop.className = 'raindrop';
      raindrop.style.cssText = `
        position: absolute;
        width: 2px;
        height: 20px;
        background: linear-gradient(to bottom, transparent, #87CEEB);
        left: ${Math.random() * 100}%;
        top: -20px;
        animation: rain ${1 + Math.random() * 2}s linear infinite;
        animation-delay: ${Math.random() * 2}s;
      `;
      
      this.container.appendChild(raindrop);
      
      // Remove after animation
      setTimeout(() => {
        if (raindrop.parentNode) {
          raindrop.parentNode.removeChild(raindrop);
        }
      }, 3000);
    }
  }

  createSnowEffect() {
    // Create snowflakes
    for (let i = 0; i < 15; i++) {
      const snowflake = document.createElement('div');
      snowflake.className = 'snowflake';
      snowflake.textContent = '❄️';
      snowflake.style.cssText = `
        position: absolute;
        font-size: 12px;
        left: ${Math.random() * 100}%;
        top: -20px;
        animation: snow ${3 + Math.random() * 4}s linear infinite;
        animation-delay: ${Math.random() * 3}s;
      `;
      
      this.container.appendChild(snowflake);
      
      // Remove after animation
      setTimeout(() => {
        if (snowflake.parentNode) {
          snowflake.parentNode.removeChild(snowflake);
        }
      }, 7000);
    }
  }

  createWindEffect() {
    this.kabootars.forEach(kabootar => {
      kabootar.style.animation = 'windyFlight 8s ease-in-out infinite';
    });
  }
}

// Add CSS for weather effects
const weatherCSS = `
  @keyframes rain {
    0% { transform: translateY(0); opacity: 1; }
    100% { transform: translateY(100vh); opacity: 0; }
  }
  
  @keyframes snow {
    0% { transform: translateY(0) rotate(0deg); opacity: 1; }
    100% { transform: translateY(100vh) rotate(360deg); opacity: 0; }
  }
  
  @keyframes windyFlight {
    0%, 100% { transform: translateX(0) rotate(0deg); }
    25% { transform: translateX(20px) rotate(5deg); }
    50% { transform: translateX(0) rotate(0deg); }
    75% { transform: translateX(-20px) rotate(-5deg); }
  }
  
  .weather-rain .kabootar {
    filter: brightness(0.8) contrast(1.2);
  }
  
  .weather-snow .kabootar {
    filter: brightness(1.1) contrast(0.9);
  }
  
  .weather-wind .kabootar {
    filter: blur(0.5px);
  }
`;

// Inject weather CSS
const style = document.createElement('style');
style.textContent = weatherCSS;
document.head.appendChild(style);

// Initialize kabootar animation when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  window.kabootarAnimation = new KabootarAnimation();
  
  // Add some fun interactions
  console.log('🕊️ Kabootar animation loaded! Press Ctrl+K to toggle, hover to pause!');
  
  // Auto-celebration on page load
  setTimeout(() => {
    if (window.kabootarAnimation) {
      window.kabootarAnimation.startCelebration();
    }
  }, 2000);
});

// Export for use in other scripts
window.KabootarAnimation = KabootarAnimation;

