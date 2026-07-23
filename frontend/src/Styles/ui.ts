import styled, { css } from "styled-components";

/* ── Superfícies ───────────────────────────────────────────── */
export const Card = styled.div`
  background: ${(p) => p.theme.cores.surface};
  border: 1px solid ${(p) => p.theme.cores.border};
  border-radius: 16px;
  box-shadow: ${(p) => p.theme.cores.shadow};
  padding: 22px;
`;

/* ── Cabeçalho de página ───────────────────────────────────── */
export const PageHeader = styled.div`
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
  margin-bottom: 22px;
`;

export const PageTitle = styled.h1`
  font-size: 24px;
  font-weight: 700;
  letter-spacing: -0.3px;
  margin: 0;
  color: ${(p) => p.theme.cores.primaryDark};
`;

export const PageSubtitle = styled.p`
  margin: 6px 0 0;
  font-size: 13px;
  color: ${(p) => p.theme.cores.textMuted};
`;

export const SectionTitle = styled.h2`
  font-size: 15px;
  font-weight: 600;
  margin: 0 0 14px;
  color: ${(p) => p.theme.cores.text};
`;

export const Muted = styled.p`
  color: ${(p) => p.theme.cores.textMuted};
  font-size: 13px;
  line-height: 1.7;
  margin: 0;
`;

/* ── Botões ────────────────────────────────────────────────── */
export const Button = styled.button<{ $variant?: "primary" | "ghost" | "danger"; $block?: boolean }>`
  font-size: 14px;
  font-weight: 600;
  border-radius: 11px;
  padding: 10px 18px;
  cursor: pointer;
  border: 1px solid transparent;
  transition: background 0.15s ease, border-color 0.15s ease, filter 0.15s ease;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: ${(p) => (p.$block ? "100%" : "auto")};

  ${(p) => {
    const c = p.theme.cores;
    switch (p.$variant) {
      case "ghost":
        return css`
          background: transparent;
          color: ${c.text};
          border-color: ${c.border};
          &:hover { background: ${c.surfaceAlt}; }
        `;
      case "danger":
        return css`
          background: ${c.danger};
          color: #fff;
          &:hover { filter: brightness(0.95); }
        `;
      default:
        return css`
          background: ${c.primary};
          color: #fff;
          &:hover { background: ${c.primaryDark}; }
        `;
    }
  }}

  &:disabled { opacity: 0.55; cursor: not-allowed; }
`;

/* ── Formulário ────────────────────────────────────────────── */
export const Field = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 16px;
`;

export const Label = styled.label`
  font-size: 12px;
  font-weight: 600;
  color: ${(p) => p.theme.cores.textMuted};
`;

export const TextInput = styled.input`
  font-size: 14px;
  padding: 11px 13px;
  border-radius: 11px;
  border: 1.5px solid ${(p) => p.theme.cores.border};
  background: ${(p) => p.theme.cores.surface};
  color: ${(p) => p.theme.cores.text};
  outline: none;
  transition: border-color 0.15s ease, box-shadow 0.15s ease;

  &:focus {
    border-color: ${(p) => p.theme.cores.accent};
    box-shadow: 0 0 0 3px ${(p) => p.theme.cores.accentSoft};
  }
  &::placeholder { color: ${(p) => p.theme.cores.textMuted}; opacity: 0.7; }
`;

/* ── Tags / badges ─────────────────────────────────────────── */
export const Tag = styled.span<{ $tone?: "blue" | "green" | "orange" | "red" | "muted" }>`
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 11px;
  font-weight: 700;
  padding: 3px 10px;
  border-radius: 20px;
  ${(p) => {
    const c = p.theme.cores;
    switch (p.$tone) {
      case "green": return css`background: ${c.success}22; color: ${c.success};`;
      case "orange": return css`background: ${c.warn}22; color: ${c.warn};`;
      case "red": return css`background: ${c.danger}22; color: ${c.danger};`;
      case "muted": return css`background: ${c.border}; color: ${c.textMuted};`;
      default: return css`background: ${c.accentSoft}; color: ${c.primary};`;
    }
  }}
`;

/* ── KPIs ──────────────────────────────────────────────────── */
export const KpiRow = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 16px;
  margin-bottom: 22px;
`;

export const KpiCard = styled(Card)`
  padding: 18px 18px 16px;
  border-left: 4px solid ${(p) => p.theme.cores.accent};
  position: relative;
  overflow: hidden;
`;

export const KpiIcon = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 12px;
  background: ${(p) => p.theme.cores.accentSoft};
  color: ${(p) => p.theme.cores.primary};
  margin-bottom: 12px;
`;

export const KpiValue = styled.div`
  font-family: 'Space Grotesk', sans-serif;
  font-size: 28px;
  font-weight: 700;
  line-height: 1;
  color: ${(p) => p.theme.cores.primaryDark};
`;

export const KpiLabel = styled.div`
  font-size: 12px;
  color: ${(p) => p.theme.cores.textMuted};
  margin-top: 6px;
`;

/* ── Estado vazio ──────────────────────────────────────────── */
export const EmptyState = styled(Card)`
  text-align: center;
  padding: 56px 28px;
`;

export const EmptyIcon = styled.div`
  font-size: 40px;
  margin-bottom: 12px;
`;

/* ── Tabela ─────────────────────────────────────────────────── */
export const TableWrap = styled.div`
  overflow-x: auto;
  border-radius: 12px;
  border: 1px solid ${(p) => p.theme.cores.border};
`;

export const Tabela = styled.table`
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
`;

export const Th = styled.th`
  text-align: left;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.5px;
  text-transform: uppercase;
  color: ${(p) => p.theme.cores.textMuted};
  background: ${(p) => p.theme.cores.surfaceAlt};
  padding: 10px 14px;
  white-space: nowrap;
`;

export const Td = styled.td`
  padding: 10px 14px;
  border-top: 1px solid ${(p) => p.theme.cores.border};
  color: ${(p) => p.theme.cores.text};
`;

export const Banner = styled.div<{ $tone?: "info" | "warn" }>`
  display: flex;
  align-items: center;
  gap: 12px;
  border-radius: 12px;
  padding: 14px 16px;
  font-size: 13px;
  line-height: 1.5;
  ${(p) => {
    const c = p.theme.cores;
    return p.$tone === "warn"
      ? css`background: ${c.warn}18; color: ${c.warn}; border: 1px solid ${c.warn}44;`
      : css`background: ${c.accentSoft}; color: ${c.primary}; border: 1px solid ${c.accent}44;`;
  }}
`;
