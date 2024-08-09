
const palettes = {
    palette1: {
        light: {
            '--primary-color': '#2c7be5',
            '--secondary-color': '#1a56a2',
            '--background-color': '#f4f7fb',
            '--text-color': '#1e3a5f',
            '--nav-background': '#1a56a2',
            '--nav-text': '#ffffff',
            '--card-background': '#ffffff',
            '--card-shadow': 'rgba(44, 123, 229, 0.1)',
            '--card-title-color': '#2c7be5'
        },
        dark: {
            '--primary-color': '#4d9bf1',
            '--secondary-color': '#1e3a5f',
            '--background-color': '#0f2744',
            '--text-color': '#e6edf7',
            '--nav-background': '#1a3a66',
            '--nav-text': '#ffffff',
            '--card-background': '#1e3a5f',
            '--card-shadow': 'rgba(77, 155, 241, 0.1)',
            '--card-title-color': '#4d9bf1'
        }
    },
    palette2: {
        light: {
            '--primary-color': '#3d5afe',
            '--secondary-color': '#424242',
            '--background-color': '#fafafa',
            '--text-color': '#212121',
            '--nav-background': '#424242',
            '--nav-text': '#ffffff',
            '--card-background': '#ffffff',
            '--card-shadow': 'rgba(0, 0, 0, 0.08)',
            '--card-title-color': '#3d5afe'
        },
        dark: {
            '--primary-color': '#738fff',
            '--secondary-color': '#616161',
            '--background-color': '#212121',
            '--text-color': '#f5f5f5',
            '--nav-background': '#424242',
            '--nav-text': '#ffffff',
            '--card-background': '#333333',
            '--card-shadow': 'rgba(255, 255, 255, 0.08)',
            '--card-title-color': '#738fff'
        }
    },
    palette3: {
      light: {
          '--primary-color': '#34a853',
          '--secondary-color': '#5f6368',
          '--background-color': '#f8f9fa',
          '--text-color': '#34a853',
          '--nav-background': '#5f6368',
          '--nav-text': '#ffffff',
          '--card-background': '#ffffff',
          '--card-shadow': 'rgba(0, 0, 0, 0.05)',
          '--card-title-color': '#34a853'
      },
      dark: {
          '--primary-color': '#66bb6a',
          '--secondary-color': '#78909c',
          '--background-color': '#263238',
          '--text-color': '#eceff1',
          '--nav-background': '#455a64',
          '--nav-text': '#ffffff',
          '--card-background': '#37474f',
          '--card-shadow': 'rgba(255, 255, 255, 0.05)',
          '--card-title-color': '#66bb6a'
      }
  },
    palette4: {
        light: {
            '--primary-color': '#ff4081',
            '--secondary-color': '#3f51b5',
            '--background-color': '#f5f5f5',
            '--text-color': '#212121',
            '--nav-background': '#3f51b5',
            '--nav-text': '#ffffff',
            '--card-background': '#ffffff',
            '--card-shadow': 'rgba(0, 0, 0, 0.1)',
            '--card-title-color': '#ff4081'
        },
        dark: {
            '--primary-color': '#ff80ab',
            '--secondary-color': '#5c6bc0',
            '--background-color': '#121212',
            '--text-color': '#ffffff',
            '--nav-background': '#283593',
            '--nav-text': '#ffffff',
            '--card-background': '#1e1e1e',
            '--card-shadow': 'rgba(255, 255, 255, 0.05)',
            '--card-title-color': '#ff80ab'
        }
    },
    palette5: {
        light: {
            '--primary-color': '#00ffbb',
            '--secondary-color': '#6200ea',
            '--background-color': '#ffffff',
            '--text-color': '#1a1a1a',
            '--nav-background': '#1a1a1a',
            '--nav-text': '#00ffbb',
            '--card-background': '#f0f0f0',
            '--card-shadow': 'rgba(0, 0, 0, 0.08)',
            '--card-title-color': '#6200ea'
        },
        dark: {
            '--primary-color': '#00ffbb',
            '--secondary-color': '#b388ff',
            '--background-color': '#1a1a1a',
            '--text-color': '#ffffff',
            '--nav-background': '#000000',
            '--nav-text': '#00ffbb',
            '--card-background': '#2a2a2a',
            '--card-shadow': 'rgba(0, 255, 187, 0.1)',
            '--card-title-color': '#b388ff'
        }
    },
    palette6: {
        light: {
            '--primary-color': '#ff6b6b',
            '--secondary-color': '#4ecdc4',
            '--background-color': '#f7fff7',
            '--text-color': '#2f2d2e',
            '--nav-background': '#2f2d2e',
            '--nav-text': '#ff6b6b',
            '--card-background': '#ffffff',
            '--card-shadow': 'rgba(78, 205, 196, 0.2)',
            '--card-title-color': '#ff6b6b'
        },
        dark: {
            '--primary-color': '#ff8787',
            '--secondary-color': '#66fcf1',
            '--background-color': '#1f2833',
            '--text-color': '#c5c6c7',
            '--nav-background': '#0b0c10',
            '--nav-text': '#ff8787',
            '--card-background': '#2b3541',
            '--card-shadow': 'rgba(102, 252, 241, 0.2)',
            '--card-title-color': '#ff8787'
        }
    }
  };
  
  let currentPalette = 'palette6';
  let isDarkMode = true;
  
  function applyPalette(palette, mode) {
      const colors = palettes[palette][mode];
      for (const [property, value] of Object.entries(colors)) {
          document.documentElement.style.setProperty(property, value);
      }
  }
  
  function switchPalette(palette) {
      console.log(palette);
      currentPalette = palette;
      localStorage.setItem('palette', palette);
      applyPalette(currentPalette, isDarkMode ? 'dark' : 'light');
  }
  
  function toggleDarkMode() {
      isDarkMode = !isDarkMode;
      localStorage.setItem('dark-mode', isDarkMode);
      applyPalette(currentPalette, isDarkMode ? 'dark' : 'light');
      document.getElementById('theme-toggle').textContent = isDarkMode ? '🌞' : '🌙';
  }
  
  
  function loadPage(){
      selector = document.getElementById('palette-selector')
  
      // Initialize with the first palette only if no palette is set
      if (!localStorage.getItem('palette')) {
          localStorage.setItem('palette', 'palette6');
          localStorage.setItem('dark-mode', 'true');
          console.log('Palette set to palette6');
          selector.value = 'option6';
          applyPalette(currentPalette, 'dark');
      } else {
          currentPalette = localStorage.getItem('palette');
          isDarkMode = localStorage.getItem('dark-mode');
          selector.value = currentPalette;
          console.log('Palette loaded to ' + currentPalette);
          applyPalette(currentPalette, isDarkMode ? 'dark' : 'light');
      }
  
      // Set up event listeners for palette buttons
      selector.addEventListener('change', (e) => switchPalette(e.target.value));
  
      // Set up event listener for the theme toggle button
      document.getElementById('theme-toggle').addEventListener('click', toggleDarkMode);
  
    }
    
  document.addEventListener('DOMContentLoaded', loadPage);