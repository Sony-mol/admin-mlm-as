// Responsive utilities for the admin panel
export const breakpoints = {
  xs: '0px',
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
};

// Responsive grid classes
export const gridClasses = {
  // Card grids
  cardGrid: {
    default: 'grid grid-cols-1',
    sm: 'sm:grid-cols-2',
    lg: 'lg:grid-cols-3',
    xl: 'xl:grid-cols-4',
  },
  
  // Stats grids
  statsGrid: {
    default: 'grid grid-cols-1',
    sm: 'sm:grid-cols-2',
    lg: 'lg:grid-cols-3',
    xl: 'xl:grid-cols-4',
  },
  
  // Form grids
  formGrid: {
    default: 'grid grid-cols-1',
    md: 'md:grid-cols-2',
    lg: 'lg:grid-cols-3',
  },
  
  // Filter grids
  filterGrid: {
    default: 'grid grid-cols-1',
    md: 'md:grid-cols-2',
    lg: 'lg:grid-cols-3',
  },
};

// Responsive spacing
export const spacing = {
  // Container padding
  container: {
    default: 'px-4',
    sm: 'sm:px-6',
    lg: 'lg:px-8',
  },
  
  // Section spacing
  section: {
    default: 'space-y-4',
    md: 'md:space-y-6',
    lg: 'lg:space-y-8',
  },
  
  // Card padding
  card: {
    default: 'p-4',
    sm: 'sm:p-6',
  },
};

// Responsive text sizes
export const textSizes = {
  // Headings
  h1: {
    default: 'text-2xl',
    sm: 'sm:text-3xl',
    lg: 'lg:text-4xl',
  },
  
  h2: {
    default: 'text-xl',
    sm: 'sm:text-2xl',
    lg: 'lg:text-3xl',
  },
  
  h3: {
    default: 'text-lg',
    sm: 'sm:text-xl',
    lg: 'lg:text-2xl',
  },
  
  // Body text
  body: {
    default: 'text-sm',
    sm: 'sm:text-base',
  },
  
  small: {
    default: 'text-xs',
    sm: 'sm:text-sm',
  },
};

// Responsive visibility
export const visibility = {
  // Show/hide on different screen sizes
  mobileOnly: 'block md:hidden',
  desktopOnly: 'hidden md:block',
  tabletUp: 'hidden sm:block',
  mobileDown: 'block sm:hidden',
};

// Responsive button sizes
export const buttonSizes = {
  small: {
    default: 'px-3 py-1.5 text-xs',
    sm: 'sm:px-4 sm:py-2 sm:text-sm',
  },
  
  medium: {
    default: 'px-4 py-2 text-sm',
    sm: 'sm:px-6 sm:py-3 sm:text-base',
  },
  
  large: {
    default: 'px-6 py-3 text-base',
    sm: 'sm:px-8 sm:py-4 sm:text-lg',
  },
};

// Responsive table classes
export const tableClasses = {
  container: {
    default: 'overflow-x-auto',
    lg: 'lg:overflow-visible',
  },
  
  table: {
    default: 'min-w-full divide-y divide-gray-200',
  },
  
  cell: {
    default: 'px-3 py-2',
    sm: 'sm:px-6 sm:py-4',
  },
  
  header: {
    default: 'px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider',
    sm: 'sm:px-6 sm:py-4',
  },
};

// Responsive modal classes
export const modalClasses = {
  overlay: {
    default: 'fixed inset-0 z-50 overflow-y-auto',
  },
  
  container: {
    default: 'flex min-h-full items-center justify-center p-4',
  },
  
  dialog: {
    default: 'relative w-full max-w-md',
    sm: 'sm:max-w-lg',
    lg: 'lg:max-w-2xl',
    xl: 'xl:max-w-4xl',
  },
  
  content: {
    default: 'bg-white rounded-lg shadow-xl',
  },
};

// Utility function to combine responsive classes
export const combineClasses = (baseClasses, responsiveClasses) => {
  const allClasses = [baseClasses];
  
  Object.entries(responsiveClasses).forEach(([breakpoint, classes]) => {
    if (classes) {
      allClasses.push(`${breakpoint}:${classes}`);
    }
  });
  
  return allClasses.join(' ');
};

// Hook for responsive breakpoint detection
export const useBreakpoint = () => {
  const [breakpoint, setBreakpoint] = React.useState('lg');
  
  React.useEffect(() => {
    const updateBreakpoint = () => {
      const width = window.innerWidth;
      if (width < 640) setBreakpoint('xs');
      else if (width < 768) setBreakpoint('sm');
      else if (width < 1024) setBreakpoint('md');
      else if (width < 1280) setBreakpoint('lg');
      else if (width < 1536) setBreakpoint('xl');
      else setBreakpoint('2xl');
    };
    
    updateBreakpoint();
    window.addEventListener('resize', updateBreakpoint);
    return () => window.removeEventListener('resize', updateBreakpoint);
  }, []);
  
  return breakpoint;
};
