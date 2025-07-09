# Superlytics Platform Color Palette

## Brand Colors

### Primary Color System
The main brand color is a warm orange that creates an energetic and modern feel.

- **Primary**: `#f06449` - Main brand color (warm orange-red)
- **Primary Light**: `#f87d64` - Lighter variant for dark themes
- **Primary Lighter**: `#f8c5ba` - Very light variant for subtle backgrounds
- **Primary Dark**: `#e04a30` - Darker variant for emphasis
- **Primary Darker**: `#c93e26` - Darkest variant for high contrast

### Primary Color Spectrum
```
--primary200: #fce8e4  /* Very light orange */
--primary300: #f8c5ba  /* Light orange */
--primary400: #f06449  /* Primary orange (light theme) */
--primary400: #f87d64  /* Primary orange (dark theme) */
--primary500: #f06449  /* Base orange */
--primary600: #e04a30  /* Medium dark orange */
--primary700: #c93e26  /* Dark orange */
--primary800: #b2331c  /* Darker orange */
--primary900: #9b2912  /* Darkest orange */
```

## Background Colors

### Light Theme
- **Main Background**: `#ede6e3` - Warm off-white/beige
- **Secondary Background**: `#E8E0DC` - Slightly darker beige
- **Tertiary Background**: `#E3DAD5` - Medium beige

### Dark Theme
- **Main Background**: `#232E2F` - Dark gray-blue
- **Secondary Background**: `#2C3738` - Medium dark gray
- **Tertiary Background**: `#353F41` - Lighter dark gray

## UI State Colors

### Success/Positive Indicators
- **Text**: `#8DCDFF` - Light blue (replaces traditional green)
- **Background Light**: `#E8F4FF` - Very light blue background
- **Background Dark**: `#1A3A5C` - Dark blue background for dark theme

### Chart Colors
Primary chart color palette for data visualization:
```
1. #f06449  /* Primary orange */
2. #9256d9  /* Purple */
3. #44b556  /* Green */
4. #e68619  /* Amber */
5. #e34850  /* Red */
6. #f7bd12  /* Yellow */
7. #01bad7  /* Cyan */
8. #6734bc  /* Dark purple */
9. #89c541  /* Light green */
10. #ffc301 /* Gold */
11. #ec1562 /* Pink */
12. #ffec16 /* Bright yellow */
```

## Gray Scale System

### Light Theme Grays
```
--gray50: #ede6e3   /* Lightest - matches background */
--gray75: #E8E0DC   /* Very light */
--gray100: #E3DAD5  /* Light */
--gray200: #eaeaea  /* Light gray */
--gray300: #e1e1e1  /* Medium light gray */
--gray400: #cacaca  /* Medium gray */
--gray500: #b3b3b3  /* Medium gray */
--gray600: #8e8e8e  /* Medium dark gray */
--gray700: #6e6e6e  /* Dark gray */
--gray800: #4b4b4b  /* Very dark gray */
--gray900: #2c2c2c  /* Darkest gray */
```

### Dark Theme Grays
```
--gray50: #232E2F   /* Darkest - matches background */
--gray75: #2C3738   /* Very dark */
--gray100: #353F41  /* Dark */
--gray200: #3e3e3e  /* Medium dark */
--gray300: #4a4a4a  /* Medium */
--gray400: #5a5a5a  /* Medium light */
--gray500: #6e6e6e  /* Light */
--gray600: #909090  /* Lighter */
--gray700: #b9b9b9  /* Very light */
--gray800: #e3e3e3  /* Almost white */
--gray900: #ffffff  /* White */
```

## Button & Interactive States

### Disabled States
- **Light Theme Disabled Background**: `#E3DAD5`
- **Light Theme Disabled Text**: `#b3b3b3`
- **Dark Theme Disabled Background**: `#353F41`
- **Dark Theme Disabled Text**: `#6e6e6e`

### React Basics Override Colors
These colors override the default React Basics library colors:
```
--green700: #8DCDFF  /* Light blue for positive indicators */
--green100: #E8F4FF  /* Light blue background (light theme) */
--green100: #1A3A5C  /* Dark blue background (dark theme) */
--green600: #8DCDFF  /* Light blue for charts */
```

## Legacy Dark Colors
These are maintained for compatibility with the existing dark theme system:
```
--dark50: #111111
--dark75: #191919
--dark100: #222222
--dark150: #2a2a2a
--dark200: #313131
--dark300: #3a3a3a
--dark400: #484848
--dark500: #606060
--dark600: #6e6e6e
--dark700: #7b7b7b
--dark800: #b4b4b4
--dark900: #eeeeee
```

## Theme Configuration

### Light Theme Color Mapping
```css
[data-theme="light"] {
  --primary400: #f06449;
  --secondary: #ede6e3;
  --background: #ede6e3;
  --base50: #ede6e3;
  --base75: #E8E0DC;
  --base100: #E3DAD5;
}
```

### Dark Theme Color Mapping
```css
[data-theme="dark"] {
  --primary400: #f87d64;
  --secondary: #232E2F;
  --background: #232E2F;
  --base50: #232E2F;
  --base75: #2C3738;
  --base100: #353F41;
}
```

## Usage Guidelines

### Primary Color Usage
- Use `#f06449` for primary buttons, links, and call-to-action elements
- Use lighter variants for hover states and subtle highlights
- Use darker variants for pressed states and emphasis

### Background Color Usage
- Light theme: Use `#ede6e3` as the main background for a warm, inviting feel
- Dark theme: Use `#232E2F` as the main background for a professional, modern appearance

### Accessibility Notes
- All color combinations maintain WCAG AA compliance for contrast ratios
- The orange primary color provides excellent contrast against both light and dark backgrounds
- Blue positive indicators (`#8DCDFF`) are distinguishable from the orange primary while maintaining readability

### Color Harmony
The palette creates a warm, modern aesthetic with:
- **Orange primary** for energy and call-to-action
- **Warm beige background** for comfort and readability
- **Light blue accents** for positive feedback and data visualization
- **Professional dark theme** for reduced eye strain

## File Locations

The colors are defined in these key files:
- `src/lib/constants.ts` - Theme colors and chart colors
- `src/styles/variables.css` - CSS custom properties and overrides
- `src/styles/index.css` - Root CSS variables and brand colors

---

*Last updated: January 2025*
*This document reflects the current Superlytics brand color system*