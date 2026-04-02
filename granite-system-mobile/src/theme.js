/**
 * ╔══════════════════════════════════════════════════════════╗
 * ║          Heritage Slabs — Dark Glassmorphism Theme       ║
 * ╚══════════════════════════════════════════════════════════╝
 *
 * A centralized design-system for the mobile app.
 * Deep charcoal/navy background with vibrant Indigo & Purple
 * accents, frosted-glass cards, and high-contrast typography.
 */

export const THEME = {
    // ── Core Backgrounds ──
    bg: '#0F0F1E',          // deep charcoal-navy
    bgCard: 'rgba(255,255,255,0.06)', // frosted glass
    bgElevated: 'rgba(255,255,255,0.10)', // slightly more opaque
    bgInput: 'rgba(255,255,255,0.08)',    // input fields

    // ── Accent Palette ──
    indigo: '#6366F1',      // primary accent
    purple: '#A855F7',      // secondary accent
    indigoLight: 'rgba(99,102,241,0.15)',
    purpleLight: 'rgba(168,85,247,0.15)',

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
    textPrimary: '#FFFFFF',        // pure white – titles
    textSecondary: '#94A3B8',      // muted slate-blue – body
    textMuted: '#64748B',          // dimmer slate – meta

    // ── Borders & Dividers ──
    border: 'rgba(255,255,255,0.06)',  // ultra-thin glass border
    borderLight: 'rgba(255,255,255,0.10)',
    divider: 'rgba(255,255,255,0.04)',

    // ── Blobs (decorative blurs) ──
    blobIndigo: 'rgba(99,102,241,0.18)',
    blobPurple: 'rgba(168,85,247,0.14)',

    // ── Shadows ──
    shadowColor: '#6366F1',
    shadowColorPurple: '#A855F7',

    // ── Nav ──
    navBg: 'rgba(15,15,30,0.95)',
    navActive: '#6366F1',
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
    backgroundColor: 'rgba(255,255,255,0.04)',
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
 * Primary gradient-esque button (solid indigo).
 */
export const primaryButton = {
    backgroundColor: THEME.indigo,
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: THEME.indigo,
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
    backgroundColor: THEME.indigo,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: THEME.indigo,
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
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'center',
    alignItems: 'center',
};

export const modalContent = {
    backgroundColor: 'rgba(20,20,40,0.95)',
    borderRadius: 20,
    padding: 24,
    width: '85%',
    borderWidth: 1,
    borderColor: THEME.border,
};
