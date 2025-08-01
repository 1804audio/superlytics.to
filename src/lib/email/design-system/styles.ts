import { emailTheme } from './theme';

export const globalEmailStyles = `
  /* Reset and base styles */
  body { 
    font-family: ${emailTheme.typography.fontFamily}; 
    line-height: ${emailTheme.typography.lineHeight.relaxed}; 
    color: ${emailTheme.colors.textPrimary};
    margin: 0;
    padding: ${emailTheme.spacing.xl};
    background-color: ${emailTheme.colors.background};
  }
  
  /* Container */
  .container { 
    max-width: 600px; 
    margin: 0 auto; 
    background: ${emailTheme.colors.surface}; 
    padding: ${emailTheme.spacing['4xl']};
    border-radius: ${emailTheme.borderRadius.lg};
    box-shadow: ${emailTheme.shadows.md};
  }
  
  /* Typography */
  .logo { 
    font-size: ${emailTheme.typography.sizes.logo}; 
    font-weight: ${emailTheme.typography.weights.bold}; 
    color: ${emailTheme.colors.textPrimary}; 
    margin-bottom: ${emailTheme.spacing['4xl']};
    text-align: center;
  }
  
  .greeting {
    font-size: ${emailTheme.typography.sizes.h4};
    color: ${emailTheme.colors.textPrimary};
    margin-bottom: ${emailTheme.spacing.xl};
    font-weight: ${emailTheme.typography.weights.medium};
  }
  
  .message { 
    font-size: ${emailTheme.typography.sizes.body}; 
    color: ${emailTheme.colors.textPrimary}; 
    margin-bottom: ${emailTheme.spacing['2xl']}; 
    line-height: ${emailTheme.typography.lineHeight.relaxed};
  }
  
  .section-title {
    font-size: ${emailTheme.typography.sizes.h3};
    font-weight: ${emailTheme.typography.weights.semibold};
    margin: ${emailTheme.spacing['2xl']} 0 ${emailTheme.spacing.lg} 0;
  }
  
  .small-text {
    font-size: ${emailTheme.typography.sizes.small};
    color: ${emailTheme.colors.textSecondary};
  }
  
  /* Buttons */
  .btn { 
    display: inline-block; 
    padding: ${emailTheme.spacing.lg} ${emailTheme.spacing['2xl']}; 
    color: ${emailTheme.colors.surface}; 
    text-decoration: none; 
    border-radius: ${emailTheme.borderRadius.md}; 
    font-weight: ${emailTheme.typography.weights.medium}; 
    font-size: ${emailTheme.typography.sizes.body};
    text-align: center;
    margin: ${emailTheme.spacing.sm};
    min-width: 160px;
    transition: all 0.2s ease;
  }
  
  .btn-primary { background-color: ${emailTheme.colors.primary}; }
  .btn-success { background-color: ${emailTheme.colors.success}; }
  .btn-warning { background-color: ${emailTheme.colors.warning}; color: ${emailTheme.colors.textPrimary}; }
  .btn-danger { background-color: ${emailTheme.colors.danger}; }
  .btn-info { background-color: ${emailTheme.colors.info}; }
  
  .btn-large {
    padding: ${emailTheme.spacing.xl} ${emailTheme.spacing['3xl']};
    font-size: ${emailTheme.typography.sizes.h4};
    font-weight: ${emailTheme.typography.weights.semibold};
  }
  
  .button-container {
    text-align: center;
    margin: ${emailTheme.spacing['3xl']} 0;
  }
  
  /* Cards and boxes */
  .card {
    background: ${emailTheme.colors.surface};
    border: 1px solid ${emailTheme.colors.border};
    border-radius: ${emailTheme.borderRadius.md};
    padding: ${emailTheme.spacing.xl};
    margin: ${emailTheme.spacing['2xl']} 0;
  }
  
  .highlight-box {
    background: ${emailTheme.colors.teamSuccess};
    border: 1px solid ${emailTheme.colors.teamSuccessBorder};
    padding: ${emailTheme.spacing.xl};
    border-radius: ${emailTheme.borderRadius.md};
    margin: ${emailTheme.spacing['3xl']} 0;
    text-align: center;
  }
  
  .info-box {
    background: ${emailTheme.colors.teamInfo};
    border: 1px solid ${emailTheme.colors.teamInfoBorder};
    padding: ${emailTheme.spacing.xl};
    border-radius: ${emailTheme.borderRadius.md};
    margin: ${emailTheme.spacing['3xl']} 0;
  }
  
  .warning-box {
    background: ${emailTheme.colors.warningBg};
    border: 1px solid ${emailTheme.colors.warningBorder};
    padding: ${emailTheme.spacing.xl};
    border-radius: ${emailTheme.borderRadius.sm};
    margin: ${emailTheme.spacing['3xl']} 0;
  }
  
  .error-box {
    background: ${emailTheme.colors.errorBg};
    border: 1px solid ${emailTheme.colors.errorBorder};
    padding: ${emailTheme.spacing.xl};
    border-radius: ${emailTheme.borderRadius.md};
    margin: ${emailTheme.spacing['3xl']} 0;
  }
  
  /* Access code styling */
  .access-code {
    background: ${emailTheme.colors.background};
    border: 2px dashed ${emailTheme.colors.borderDashed};
    border-radius: ${emailTheme.borderRadius.lg};
    padding: ${emailTheme.spacing.xl};
    text-align: center;
    margin: ${emailTheme.spacing['3xl']} 0;
    font-family: ${emailTheme.typography.fontFamilyMono};
  }
  
  .access-code .code {
    font-size: ${emailTheme.typography.sizes.code};
    font-weight: ${emailTheme.typography.weights.bold};
    color: ${emailTheme.colors.primary};
    letter-spacing: 2px;
    margin: ${emailTheme.spacing.sm} 0;
  }
  
  /* Instructions */
  .instructions {
    background: ${emailTheme.colors.teamInfo};
    border-left: 4px solid ${emailTheme.colors.primary};
    padding: ${emailTheme.spacing.xl};
    margin: ${emailTheme.spacing['3xl']} 0;
    border-radius: 0 ${emailTheme.borderRadius.md} ${emailTheme.borderRadius.md} 0;
  }
  
  .instructions h3 {
    margin-top: 0;
    color: ${emailTheme.colors.teamInfoText};
    font-size: ${emailTheme.typography.sizes.h4};
  }
  
  .instructions ol {
    margin: ${emailTheme.spacing.sm} 0;
    padding-left: ${emailTheme.spacing.xl};
  }
  
  .instructions li {
    margin: ${emailTheme.spacing.sm} 0;
    color: ${emailTheme.colors.textPrimary};
  }
  
  /* Tables */
  .table {
    width: 100%;
    border-collapse: collapse;
    margin: ${emailTheme.spacing['3xl']} 0;
    border: 1px solid ${emailTheme.colors.border};
    border-radius: ${emailTheme.borderRadius.md};
    overflow: hidden;
  }
  
  .table th {
    background: ${emailTheme.colors.background};
    padding: ${emailTheme.spacing.lg} ${emailTheme.spacing.md};
    font-weight: ${emailTheme.typography.weights.semibold};
    text-align: left;
    border-bottom: 2px solid ${emailTheme.colors.border};
  }
  
  .table td {
    padding: ${emailTheme.spacing.md};
    border-bottom: 1px solid ${emailTheme.colors.borderLight};
  }
  
  .table tr:last-child td {
    border-bottom: none;
  }
  
  /* Stats and metrics */
  .stats-container {
    display: inline-block;
    background: ${emailTheme.colors.teamInfo};
    border: 1px solid ${emailTheme.colors.teamInfoBorder};
    padding: ${emailTheme.spacing.lg};
    border-radius: ${emailTheme.borderRadius.md};
  }
  
  .stats-label {
    font-size: ${emailTheme.typography.sizes.small};
    color: ${emailTheme.colors.teamInfoText};
  }
  
  .stats-value {
    font-size: ${emailTheme.typography.sizes.h4};
    font-weight: ${emailTheme.typography.weights.semibold};
    color: ${emailTheme.colors.teamInfoText};
  }
  
  /* Member highlights */
  .member-name {
    font-size: ${emailTheme.typography.sizes.h3};
    font-weight: ${emailTheme.typography.weights.semibold};
    color: ${emailTheme.colors.teamSuccessText};
    margin-bottom: ${emailTheme.spacing.sm};
  }
  
  .member-email {
    font-size: ${emailTheme.typography.sizes.small};
    color: ${emailTheme.colors.teamSuccessText};
    margin-bottom: ${emailTheme.spacing.lg};
  }
  
  /* Footer */
  .footer { 
    font-size: ${emailTheme.typography.sizes.small};
    color: ${emailTheme.colors.textSecondary}; 
    margin-top: ${emailTheme.spacing['4xl']}; 
    padding-top: ${emailTheme.spacing.xl};
    border-top: 1px solid ${emailTheme.colors.borderLight};
    text-align: center;
    line-height: ${emailTheme.typography.lineHeight.normal};
  }
  
  /* Responsive */
  @media only screen and (max-width: ${emailTheme.breakpoints.mobile}) {
    .container {
      padding: ${emailTheme.spacing.xl};
    }
    
    .btn {
      display: block;
      margin: ${emailTheme.spacing.sm} 0;
      min-width: auto;
    }
    
    .button-container .btn {
      margin: ${emailTheme.spacing.sm} 0;
    }
  }
`;
