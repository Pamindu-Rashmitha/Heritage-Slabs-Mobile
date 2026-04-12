/**
 * ╔══════════════════════════════════════════════════════════╗
 * ║          Heritage Slabs — Premium Stone Theme            ║
 * ╚══════════════════════════════════════════════════════════╝
 *
 * A centralized design-system for the mobile app.
 * Deep Granite charcoal background with Polished Gold & Slate
 * accents, frosted-glass cards, and premium typography.
 */

export const THEME = {
    // ── Core Backgrounds ──
    bg: '#0F0F0F',          // deep granite-black
    bgCard: 'rgba(40, 40, 40, 0.4)', // dark frosted glass
    bgElevated: 'rgba(60, 60, 60, 0.45)', // slightly more opaque
    bgInput: 'rgba(255,255,255,0.05)',    // input fields

    // ── Accent Palette ──
    gold: '#C5A059',        // primary accent (gold veins)
    slate: '#607D8B',       // secondary accent (cool stone)
    goldLight: 'rgba(197,160,89,0.15)',
    slateLight: 'rgba(96,125,139,0.15)',

    // ── Status Colors ──
    success: '#34D399',     // emerald-green
    successBg: 'rgba(52,211,153,0.12)',
    warning: '#FBBF24',     // amber
    warningBg: 'rgba(251,191,36,0.12)',
    danger: '#F87171',      // soft-red
    dangerBg: 'rgba(248,113,113,0.12)',
    info: '#60A5FA',        // sky-blue
    infoBg: 'rgba(96,165,250,0.12)',

    // ── Typography ──
    textPrimary: '#F5F5F5',        // marble-white – titles
    textSecondary: '#A0A0A0',      // muted stone-grey – body
    textMuted: '#64748B',          // dimmer slate – meta

    // ── Borders & Dividers ──
    border: 'rgba(197,160,89,0.15)',  // subtle gold glass border
    borderLight: 'rgba(255,255,255,0.08)',
    divider: 'rgba(255,255,255,0.04)',

    // ── Blobs (decorative highlights) ──
    blobGold: 'rgba(197,160,89,0.12)',
    blobSlate: 'rgba(96,125,139,0.10)',

    // ── Shadows ──
    shadowColor: '#C5A059',
    shadowColorSlate: '#607D8B',

    // ── Nav ──
    navBg: 'rgba(15,15,15,0.95)',
    navActive: '#C5A059',
    navInactive: '#64748B',
};

/**
 * Reusable glass-card style — apply to any container that
 * needs the "frosted" card effect.
 */
export const glassCard = {
    backgroundColor: THEME.bgCard,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: THEME.border,
};

/**
 * Standard header bar style used across admin / customer screens.
 */
export const headerBar = {
    backgroundColor: 'rgba(255,255,255,0.02)',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 24,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    borderBottomWidth: 1,
    borderBottomColor: THEME.border,
};

/**
 * Standard glass input field style.
 */
export const glassInput = {
    backgroundColor: THEME.bgInput,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: THEME.border,
    fontSize: 15,
    color: THEME.textPrimary,
};

/**
 * Primary gradient-esque button (solid gold).
 */
export const primaryButton = {
    backgroundColor: THEME.gold,
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: THEME.gold,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45,
    shadowRadius: 12,
    elevation: 10,
};

/**
 * FAB (Floating Action Button) style.
 */
export const fab = {
    position: 'absolute',
    bottom: 28,
    right: 24,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: THEME.gold,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: THEME.gold,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5,
    shadowRadius: 14,
    elevation: 12,
};

/**
 * Glass-modal overlay + content.
 */
export const modalOverlay = {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'center',
    alignItems: 'center',
};

export const modalContent = {
    backgroundColor: 'rgba(25,25,25,0.95)',
    borderRadius: 20,
    padding: 24,
    width: '85%',
    borderWidth: 1,
    borderColor: THEME.border,
};

