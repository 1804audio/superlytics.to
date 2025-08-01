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
  
  /* Container - Ultra Clean Design */
  .container { 
    max-width: 580px; 
    margin: 0 auto; 
    background: ${emailTheme.colors.surface}; 
    padding: 32px;
    border-radius: 0;
  }
  
  /* Typography - Minimal Logo */
  .logo { 
    font-size: 18px; 
    font-weight: 600; 
    color: ${emailTheme.colors.textPrimary}; 
    margin-bottom: 32px;
    text-align: left;
    letter-spacing: -0.3px;
  }
  
  .greeting {
    font-size: ${emailTheme.typography.sizes.h4};
    color: ${emailTheme.colors.textPrimary};
    margin-bottom: ${emailTheme.spacing.lg};
    font-weight: ${emailTheme.typography.weights.medium};
  }
  
  .message { 
    font-size: ${emailTheme.typography.sizes.body}; 
    color: ${emailTheme.colors.textPrimary}; 
    margin-bottom: ${emailTheme.spacing.xl}; 
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
  
  /* Buttons - Ultra Minimal & Professional */
  .btn { 
    display: inline-block; 
    padding: 12px 24px; 
    color: white; 
    text-decoration: none; 
    border-radius: 6px; 
    font-weight: 500; 
    font-size: 14px;
    text-align: center;
    margin: 4px;
    min-width: 100px;
    transition: all 0.2s ease;
    line-height: 1.4;
    border: none;
  }
  
  .btn-primary { 
    background-color: ${emailTheme.colors.primary};
    border: 1px solid ${emailTheme.colors.primary};
  }
  .btn-success { 
    background-color: ${emailTheme.colors.success};
    border: 1px solid ${emailTheme.colors.success};
  }
  .btn-warning { 
    background-color: ${emailTheme.colors.warning}; 
    color: ${emailTheme.colors.textPrimary};
    border: 1px solid ${emailTheme.colors.warning};
  }
  .btn-danger { 
    background-color: ${emailTheme.colors.danger};
    border: 1px solid ${emailTheme.colors.danger};
  }
  .btn-info { 
    background-color: ${emailTheme.colors.info};
    border: 1px solid ${emailTheme.colors.info};
  }
  
  .btn-large {
    padding: 14px 28px;
    font-size: 14px;
    font-weight: 500;
    min-width: 120px;
  }
  
  .button-container {
    text-align: center;
    margin: 24px 0;
  }
  
  /* Cards and boxes - Cleaner Design */
  .card {
    background: ${emailTheme.colors.surface};
    border: 1px solid ${emailTheme.colors.borderLight};
    border-radius: ${emailTheme.borderRadius.sm};
    padding: ${emailTheme.spacing.lg};
    margin: ${emailTheme.spacing.xl} 0;
  }
  
  .highlight-box {
    background: ${emailTheme.colors.teamSuccess};
    border-left: 3px solid ${emailTheme.colors.teamSuccessBorder};
    padding: ${emailTheme.spacing.lg};
    border-radius: ${emailTheme.borderRadius.sm};
    margin: ${emailTheme.spacing['2xl']} 0;
    text-align: center;
  }
  
  .info-box {
    background: ${emailTheme.colors.teamInfo};
    border-left: 3px solid ${emailTheme.colors.teamInfoBorder};
    padding: ${emailTheme.spacing.lg};
    border-radius: ${emailTheme.borderRadius.sm};
    margin: ${emailTheme.spacing['2xl']} 0;
  }
  
  .warning-box {
    background: ${emailTheme.colors.warningBg};
    border-left: 3px solid ${emailTheme.colors.warningBorder};
    padding: ${emailTheme.spacing.lg};
    border-radius: ${emailTheme.borderRadius.sm};
    margin: ${emailTheme.spacing['2xl']} 0;
  }
  
  .error-box {
    background: ${emailTheme.colors.errorBg};
    border-left: 3px solid ${emailTheme.colors.errorBorder};
    padding: ${emailTheme.spacing.lg};
    border-radius: ${emailTheme.borderRadius.sm};
    margin: ${emailTheme.spacing['2xl']} 0;
  }
  
  /* Access code styling - Minimal */
  .access-code {
    background: ${emailTheme.colors.background};
    border: 1px solid ${emailTheme.colors.borderLight};
    border-radius: ${emailTheme.borderRadius.sm};
    padding: ${emailTheme.spacing.lg};
    text-align: center;
    margin: ${emailTheme.spacing['2xl']} 0;
    font-family: ${emailTheme.typography.fontFamilyMono};
  }
  
  .access-code .code {
    font-size: ${emailTheme.typography.sizes.code};
    font-weight: ${emailTheme.typography.weights.bold};
    color: ${emailTheme.colors.primary};
    letter-spacing: 2px;
    margin: ${emailTheme.spacing.sm} 0;
  }
  
  /* Instructions - Cleaner */
  .instructions {
    background: ${emailTheme.colors.teamInfo};
    border-left: 3px solid ${emailTheme.colors.primary};
    padding: ${emailTheme.spacing.lg};
    margin: ${emailTheme.spacing['2xl']} 0;
    border-radius: 0 ${emailTheme.borderRadius.sm} ${emailTheme.borderRadius.sm} 0;
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
  
  /* Footer - Clean & Minimal */
  .footer { 
    font-size: ${emailTheme.typography.sizes.small};
    color: ${emailTheme.colors.textSecondary}; 
    margin-top: ${emailTheme.spacing['4xl']}; 
    padding-top: ${emailTheme.spacing.lg};
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
